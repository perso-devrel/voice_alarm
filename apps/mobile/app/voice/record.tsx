import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import {
  requestMicPermission,
  startRecording,
  stopRecording,
} from '../../src/services/audio';
import { createVoiceClone } from '../../src/services/api';
import { getApiErrorMessage } from '../../src/types';

export default function RecordScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const guideSentences = t('voiceRecord.sentences', { returnObjects: true }) as string[];
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<'perso' | 'elevenlabs'>('perso');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    requestMicPermission().then(setHasPermission);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const cloneMutation = useMutation({
    mutationFn: (params: { uri: string; name: string }) =>
      createVoiceClone(
        { uri: params.uri, name: 'recording.wav', type: 'audio/wav' },
        params.name,
        provider
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
      Alert.alert(
        t('voiceRecord.successTitle'),
        t('voiceRecord.successDesc'),
        [{ text: t('common.confirm'), onPress: () => router.back() }]
      );
    },
    onError: (err: unknown) => {
      Alert.alert(t('common.error'), getApiErrorMessage(err, t('voiceRecord.cloneError')));
    },
  });

  const handleStartRecording = async () => {
    try {
      const rec = await startRecording();
      setRecording(rec);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } catch (err) {
      Alert.alert(t('common.error'), t('voiceRecord.recordError'));
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;
    if (timerRef.current) clearInterval(timerRef.current);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);

    const result = await stopRecording(recording);
    setRecording(null);
    setIsRecording(false);
    setRecordedUri(result.uri);
  };

  const handleSubmit = () => {
    if (!recordedUri || !name.trim()) {
      Alert.alert(t('voiceRecord.inputRequiredTitle'), t('voiceRecord.inputRequired'));
      return;
    }
    if (duration < 10) {
      Alert.alert(t('voiceRecord.tooShortTitle'), t('voiceRecord.tooShort'));
      return;
    }
    cloneMutation.mutate({ uri: recordedUri, name: name.trim() });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          {t('voiceRecord.permissionRequired')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 가이드 문장 */}
      <View style={styles.guideSection}>
        <Text style={styles.guideTitle}>{t('voiceRecord.guideTitle')}</Text>
        {guideSentences.map((sentence, i) => (
          <View key={i} style={styles.guideSentence}>
            <Text style={styles.guideNumber}>{i + 1}</Text>
            <Text style={styles.guideText}>{sentence}</Text>
          </View>
        ))}
        <Text style={styles.guideTip}>
          {t('voiceRecord.guideTip')}
        </Text>
      </View>

      {/* 녹음 컨트롤 */}
      <View style={styles.recordSection}>
        <Text style={styles.timer}>{formatTime(duration)}</Text>

        <Animated.View style={[styles.recordButtonOuter, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={isRecording ? handleStopRecording : handleStartRecording}
          >
            {isRecording ? (
              <View style={styles.stopIcon} />
            ) : (
              <View style={styles.micIcon}>
                <Text style={{ fontSize: 32 }}>🎙️</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.recordHint}>
          {isRecording ? t('voiceRecord.recording') : t('voiceRecord.tapToRecord')}
        </Text>
      </View>

      {/* 녹음 완료 후 */}
      {recordedUri && !isRecording && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>{t('voiceRecord.resultTitle', { time: formatTime(duration) })}</Text>

          <TextInput
            style={styles.nameInput}
            placeholder={t('voiceRecord.namePlaceholder')}
            value={name}
            onChangeText={setName}
            placeholderTextColor={Colors.light.textTertiary}
          />

          {/* Provider 선택 */}
          <View style={styles.providerRow}>
            <TouchableOpacity
              style={[styles.providerChip, provider === 'perso' && styles.providerActive]}
              onPress={() => setProvider('perso')}
            >
              <Text style={[styles.providerText, provider === 'perso' && styles.providerTextActive]}>
                Perso.ai
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.providerChip, provider === 'elevenlabs' && styles.providerActive]}
              onPress={() => setProvider('elevenlabs')}
            >
              <Text style={[styles.providerText, provider === 'elevenlabs' && styles.providerTextActive]}>
                ElevenLabs
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, cloneMutation.isPending && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={cloneMutation.isPending}
          >
            {cloneMutation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>{t('voiceRecord.submit')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  permissionText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  guideSection: {
    padding: Spacing.lg,
  },
  guideTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  guideSentence: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  guideNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.primaryLight,
    color: Colors.light.primaryDark,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginRight: Spacing.sm,
  },
  guideText: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.light.text,
    lineHeight: 22,
  },
  guideTip: {
    fontSize: FontSize.sm,
    color: Colors.light.primary,
    marginTop: Spacing.md,
  },
  recordSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  timer: {
    fontSize: 48,
    fontWeight: '200',
    color: Colors.light.text,
    marginBottom: Spacing.lg,
  },
  recordButtonOuter: {
    marginBottom: Spacing.md,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: Colors.light.error,
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  micIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordHint: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  resultSection: {
    padding: Spacing.lg,
  },
  resultTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.light.success,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
  },
  providerRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  providerChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  providerActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  providerText: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  providerTextActive: {
    color: '#FFF',
  },
  submitButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
