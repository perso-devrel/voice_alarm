import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { createVoiceClone } from '../../src/services/api';
import { getApiErrorMessage } from '../../src/types';

export default function UploadScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<'perso' | 'elevenlabs'>('perso');

  const cloneMutation = useMutation({
    mutationFn: (params: { file: DocumentPicker.DocumentPickerAsset; name: string }) =>
      createVoiceClone(
        {
          uri: params.file.uri,
          name: params.file.name,
          type: params.file.mimeType || 'audio/wav',
        },
        params.name,
        provider
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
      Alert.alert(
        '음성 등록 완료!',
        '음성 클론이 생성되고 있어요.',
        [{ text: '확인', onPress: () => router.back() }]
      );
    },
    onError: (err: unknown) => {
      Alert.alert('오류', getApiErrorMessage(err, '업로드에 실패했습니다.'));
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

  const handleSubmit = () => {
    if (!selectedFile || !name.trim()) {
      Alert.alert('입력 필요', '파일을 선택하고 이름을 입력해주세요.');
      return;
    }
    cloneMutation.mutate({ file: selectedFile, name: name.trim() });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.description}>
          MP3, WAV, M4A, AAC 형식의 오디오 파일을 선택해주세요.{'\n'}
          최소 10초 이상의 음성이 포함되어야 해요.
        </Text>

        {/* 파일 선택 */}
        <TouchableOpacity style={styles.pickButton} onPress={handlePickFile}>
          <Text style={styles.pickEmoji}>📁</Text>
          <Text style={styles.pickText}>
            {selectedFile ? selectedFile.name : '오디오 파일 선택'}
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <View style={styles.fileInfo}>
            <Text style={styles.fileInfoText}>
              📎 {selectedFile.name}
              {selectedFile.size && ` (${(selectedFile.size / 1024).toFixed(0)} KB)`}
            </Text>
          </View>
        )}

        {/* 이름 입력 */}
        <TextInput
          style={styles.nameInput}
          placeholder="이름을 입력해주세요 (예: 엄마, 아빠, 여자친구)"
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

        {/* 제출 */}
        <TouchableOpacity
          style={[styles.submitButton, (!selectedFile || !name.trim() || cloneMutation.isPending) && styles.disabled]}
          onPress={handleSubmit}
          disabled={!selectedFile || !name.trim() || cloneMutation.isPending}
        >
          {cloneMutation.isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitText}>음성 등록하기</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.lg,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  pickButton: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    marginBottom: Spacing.md,
  },
  pickEmoji: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  pickText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  fileInfo: {
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  fileInfoText: {
    fontSize: FontSize.sm,
    color: Colors.light.text,
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
  disabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#FFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
