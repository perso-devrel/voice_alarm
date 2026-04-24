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
import { Spacing, BorderRadius, FontSize, FontFamily } from '../../src/constants/theme';
import { useTheme, type ThemeColors } from '../../src/hooks/useTheme';
import { diarizeAudio, createVoiceClone } from '../../src/services/api';
import { getApiErrorMessage } from '../../src/types';
import type { Speaker } from '../../src/types';
import { useToast } from '../../src/hooks/useToast';
import { Toast } from '../../src/components/Toast';

export default function DiarizeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const toast = useToast();
  const { colors } = useTheme();
  const styles = createStyles(colors);
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
      toast.show(getApiErrorMessage(err, t('voiceDiarize.analyzeError')));
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
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
      Alert.alert(t('voiceDiarize.successTitle'), t('voiceDiarize.successDesc'), [
        { text: t('common.confirm'), onPress: () => router.back() },
      ]);
    },
    onError: (err: unknown) => {
      toast.show(getApiErrorMessage(err, t('voiceDiarize.cloneError')));
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
      toast.show(t('voiceDiarize.nameRequired'));
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

          <TouchableOpacity
            style={styles.pickButton}
            onPress={handlePickFile}
            accessibilityRole="button"
            accessibilityLabel={selectedFile ? t('voiceDiarize.a11yPickFile') + ': ' + selectedFile.name : t('voiceDiarize.a11yPickFile')}
          >
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
              accessibilityRole="button"
              accessibilityLabel={t('voiceDiarize.a11yAnalyze')}
              accessibilityState={{ disabled: diarizeMutation.isPending }}
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
              accessibilityRole="button"
              accessibilityLabel={t('voiceDiarize.a11ySpeaker', {
                index: index + 1,
                duration: formatDuration(speaker.total_duration),
                segments: speaker.segments.length,
              })}
              accessibilityState={{ selected: selectedSpeaker === speaker.speaker_id }}
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

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('upload')}
            accessibilityRole="button"
            accessibilityLabel={t('voiceDiarize.a11yBack')}
          >
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
            placeholderTextColor={colors.textTertiary}
            autoFocus
            accessibilityLabel={t('voiceDiarize.a11yNameInput')}
          />

          <TouchableOpacity
            style={[styles.submitButton, cloneMutation.isPending && styles.disabled]}
            onPress={handleSubmit}
            disabled={cloneMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel={t('voiceDiarize.a11ySubmit')}
            accessibilityState={{ disabled: cloneMutation.isPending }}
          >
            {cloneMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>{t('voiceDiarize.submit')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('select')}
            accessibilityRole="button"
            accessibilityLabel={t('voiceDiarize.a11yBack')}
          >
            <Text style={styles.backText}>{t('voiceDiarize.backToSelect')}</Text>
          </TouchableOpacity>
        </>
      )}
      <Toast message={toast.message} opacity={toast.opacity} />
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontFamily: FontFamily.bold,
    color: colors.primary,
    backgroundColor: colors.primaryLight + '40',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  stepTitle: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: colors.text,
    marginBottom: Spacing.sm,
  },
  stepDesc: {
    fontSize: FontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  pickButton: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginBottom: Spacing.lg,
  },
  pickEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  pickText: {
    fontSize: FontSize.md,
    color: colors.primary,
    fontFamily: FontFamily.semibold,
  },
  analyzeButton: {
    backgroundColor: colors.primary,
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
    fontFamily: FontFamily.bold,
  },
  speakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  speakerCardSelected: {
    borderColor: colors.primary,
  },
  speakerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  speakerAvatarText: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: colors.primaryDark,
  },
  speakerInfo: {
    flex: 1,
  },
  speakerLabel: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: colors.text,
  },
  speakerDuration: {
    fontSize: FontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  speakerSegments: {
    fontSize: FontSize.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  speakerPlay: {
    fontSize: FontSize.sm,
    color: colors.primary,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.lg,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: Spacing.lg,
  },
  submitButton: {
    backgroundColor: colors.primary,
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
    fontFamily: FontFamily.bold,
  },
  backButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  backText: {
    fontSize: FontSize.md,
    color: colors.textSecondary,
  },
});
