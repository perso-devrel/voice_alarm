import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { diarizeAudio, createVoiceClone } from '../../src/services/api';
import { getApiErrorMessage } from '../../src/types';
import type { Speaker } from '../../src/types';

export default function DiarizeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [step, setStep] = useState<'upload' | 'select' | 'name'>('upload');

  const diarizeMutation = useMutation({
    mutationFn: (file: DocumentPicker.DocumentPickerAsset) =>
      diarizeAudio({
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'audio/wav',
      }),
    onSuccess: (data) => {
      setSpeakers(data);
      setStep('select');
    },
    onError: (err: unknown) => {
      Alert.alert(
        t('voiceDiarize.analyzeErrorTitle'),
        getApiErrorMessage(err, t('voiceDiarize.analyzeError')),
      );
    },
  });

  const cloneMutation = useMutation({
    mutationFn: (params: { name: string }) => {
      if (!selectedFile) throw new Error('No file');
      return createVoiceClone(
        {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || 'audio/wav',
        },
        params.name,
        'elevenlabs',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
      Alert.alert(t('voiceDiarize.successTitle'), t('voiceDiarize.successDesc'), [
        { text: t('common.confirm'), onPress: () => router.back() },
      ]);
    },
    onError: (err: unknown) => {
      Alert.alert(t('common.error'), getApiErrorMessage(err, t('voiceDiarize.cloneError')));
    },
  });

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedFile(result.assets[0]);
    }
  };

  const handleAnalyze = () => {
    if (!selectedFile) return;
    diarizeMutation.mutate(selectedFile);
  };

  const handleSelectSpeaker = (speakerId: string) => {
    setSelectedSpeaker(speakerId);
    setStep('name');
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert(t('voiceDiarize.nameRequiredTitle'), t('voiceDiarize.nameRequired'));
      return;
    }
    cloneMutation.mutate({ name: name.trim() });
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return t('voiceDiarize.minSec', { min: m, sec: s });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Step 1: 파일 업로드 */}
      {step === 'upload' && (
        <>
          <View style={styles.stepHeader}>
            <Text style={styles.stepBadge}>STEP 1</Text>
            <Text style={styles.stepTitle}>{t('voiceDiarize.step1Title')}</Text>
            <Text style={styles.stepDesc}>{t('voiceDiarize.step1Desc')}</Text>
          </View>

          <TouchableOpacity style={styles.pickButton} onPress={handlePickFile}>
            <Text style={styles.pickEmoji}>📞</Text>
            <Text style={styles.pickText}>
              {selectedFile ? selectedFile.name : t('voiceDiarize.pickFile')}
            </Text>
          </TouchableOpacity>

          {selectedFile && (
            <TouchableOpacity
              style={[styles.analyzeButton, diarizeMutation.isPending && styles.disabled]}
              onPress={handleAnalyze}
              disabled={diarizeMutation.isPending}
            >
              {diarizeMutation.isPending ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#FFF" />
                  <Text style={styles.analyzeText}>{t('voiceDiarize.analyzing')}</Text>
                </View>
              ) : (
                <Text style={styles.analyzeText}>{t('voiceDiarize.analyze')}</Text>
              )}
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Step 2: 화자 선택 */}
      {step === 'select' && (
        <>
          <View style={styles.stepHeader}>
            <Text style={styles.stepBadge}>STEP 2</Text>
            <Text style={styles.stepTitle}>{t('voiceDiarize.step2Title')}</Text>
            <Text style={styles.stepDesc}>
              {t('voiceDiarize.step2Desc', { count: speakers.length })}
            </Text>
          </View>

          {speakers.map((speaker, index) => (
            <TouchableOpacity
              key={speaker.speaker_id}
              style={[
                styles.speakerCard,
                selectedSpeaker === speaker.speaker_id && styles.speakerCardSelected,
              ]}
              onPress={() => handleSelectSpeaker(speaker.speaker_id)}
            >
              <View style={styles.speakerAvatar}>
                <Text style={styles.speakerAvatarText}>{String.fromCharCode(65 + index)}</Text>
              </View>
              <View style={styles.speakerInfo}>
                <Text style={styles.speakerLabel}>
                  {t('voiceDiarize.speaker', { index: index + 1 })}
                </Text>
                <Text style={styles.speakerDuration}>
                  {t('voiceDiarize.totalDuration', {
                    duration: formatDuration(speaker.total_duration),
                  })}
                </Text>
                <Text style={styles.speakerSegments}>
                  {t('voiceDiarize.segments', { count: speaker.segments.length })}
                </Text>
              </View>
              <Text style={styles.speakerPlay}>{t('voiceDiarize.preview')}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.backButton} onPress={() => setStep('upload')}>
            <Text style={styles.backText}>{t('voiceDiarize.back')}</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Step 3: 이름 지정 */}
      {step === 'name' && (
        <>
          <View style={styles.stepHeader}>
            <Text style={styles.stepBadge}>STEP 3</Text>
            <Text style={styles.stepTitle}>{t('voiceDiarize.step3Title')}</Text>
            <Text style={styles.stepDesc}>{t('voiceDiarize.step3Desc')}</Text>
          </View>

          <TextInput
            style={styles.nameInput}
            placeholder={t('voiceDiarize.namePlaceholder')}
            value={name}
            onChangeText={setName}
            placeholderTextColor={Colors.light.textTertiary}
            autoFocus
          />

          <TouchableOpacity
            style={[styles.submitButton, cloneMutation.isPending && styles.disabled]}
            onPress={handleSubmit}
            disabled={cloneMutation.isPending}
          >
            {cloneMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>{t('voiceDiarize.submit')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => setStep('select')}>
            <Text style={styles.backText}>{t('voiceDiarize.backToSelect')}</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  stepHeader: {
    marginBottom: Spacing.lg,
  },
  stepBadge: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight + '40',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  stepTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  stepDesc: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  pickButton: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.primary,
    borderStyle: 'dashed',
    marginBottom: Spacing.lg,
  },
  pickEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  pickText: {
    fontSize: FontSize.md,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  analyzeButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzeText: {
    color: '#FFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  speakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  speakerCardSelected: {
    borderColor: Colors.light.primary,
  },
  speakerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  speakerAvatarText: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  speakerInfo: {
    flex: 1,
  },
  speakerLabel: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.light.text,
  },
  speakerDuration: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  speakerSegments: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  speakerPlay: {
    fontSize: FontSize.sm,
    color: Colors.light.primary,
  },
  nameInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.lg,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.lg,
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  disabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#FFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  backButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  backText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
  },
});
