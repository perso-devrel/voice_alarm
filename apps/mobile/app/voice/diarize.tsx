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
import { Audio } from 'expo-av';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { diarizeAudio, createVoiceClone } from '../../src/services/api';
import type { AxiosApiError } from '../../src/types';

interface Speaker {
  speaker_id: string;
  label: string;
  segments: Array<{ start: number; end: number }>;
  total_duration: number;
}

export default function DiarizeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
    onError: (err: AxiosApiError) => {
      Alert.alert('화자 분리 실패', err.response?.data?.error || '다시 시도해주세요.');
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
        'elevenlabs'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
      Alert.alert(
        '음성 등록 완료!',
        '선택한 화자의 음성 클론이 생성되고 있어요.',
        [{ text: '확인', onPress: () => router.back() }]
      );
    },
    onError: (err: AxiosApiError) => {
      Alert.alert('오류', err.response?.data?.error || '음성 클론 생성에 실패했습니다.');
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
      Alert.alert('이름 입력', '음성 프로필 이름을 입력해주세요.');
      return;
    }
    cloneMutation.mutate({ name: name.trim() });
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}분 ${s}초`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Step 1: 파일 업로드 */}
      {step === 'upload' && (
        <>
          <View style={styles.stepHeader}>
            <Text style={styles.stepBadge}>STEP 1</Text>
            <Text style={styles.stepTitle}>통화 녹음 업로드</Text>
            <Text style={styles.stepDesc}>
              통화 녹음 파일을 올려주세요.{'\n'}
              2명 이상의 화자가 포함된 녹음을 분석하여{'\n'}
              원하는 사람의 목소리만 추출할 수 있어요.
            </Text>
          </View>

          <TouchableOpacity style={styles.pickButton} onPress={handlePickFile}>
            <Text style={styles.pickEmoji}>📞</Text>
            <Text style={styles.pickText}>
              {selectedFile ? selectedFile.name : '통화 녹음 파일 선택'}
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
                  <Text style={styles.analyzeText}> 화자 분리 중...</Text>
                </View>
              ) : (
                <Text style={styles.analyzeText}>화자 분리 시작</Text>
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
            <Text style={styles.stepTitle}>화자 선택</Text>
            <Text style={styles.stepDesc}>
              {speakers.length}명의 화자가 감지되었어요.{'\n'}
              저장할 목소리를 선택해주세요.
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
                <Text style={styles.speakerAvatarText}>
                  {String.fromCharCode(65 + index)}
                </Text>
              </View>
              <View style={styles.speakerInfo}>
                <Text style={styles.speakerLabel}>화자 {index + 1}</Text>
                <Text style={styles.speakerDuration}>
                  총 발화 시간: {formatDuration(speaker.total_duration)}
                </Text>
                <Text style={styles.speakerSegments}>
                  {speaker.segments.length}개 구간
                </Text>
              </View>
              <Text style={styles.speakerPlay}>▶️ 미리듣기</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('upload')}
          >
            <Text style={styles.backText}>← 다시 선택</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Step 3: 이름 지정 */}
      {step === 'name' && (
        <>
          <View style={styles.stepHeader}>
            <Text style={styles.stepBadge}>STEP 3</Text>
            <Text style={styles.stepTitle}>이름 지정</Text>
            <Text style={styles.stepDesc}>
              이 목소리에 이름을 붙여주세요
            </Text>
          </View>

          <TextInput
            style={styles.nameInput}
            placeholder="예: 엄마, 아빠, 여자친구"
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
              <Text style={styles.submitText}>이 목소리 등록하기</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('select')}
          >
            <Text style={styles.backText}>← 다른 화자 선택</Text>
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
