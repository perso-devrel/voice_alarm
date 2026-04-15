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
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { createVoiceClone } from '../../src/services/api';
import { getApiErrorMessage } from '../../src/types';
import { useToast } from '../../src/hooks/useToast';
import { Toast } from '../../src/components/Toast';

export default function UploadScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const toast = useToast();
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [name, setName] = useState('');

  const cloneMutation = useMutation({
    mutationFn: (params: { file: DocumentPicker.DocumentPickerAsset; name: string }) =>
      createVoiceClone(
        {
          uri: params.file.uri,
          name: params.file.name,
          type: params.file.mimeType || 'audio/wav',
        },
        params.name,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
      Alert.alert(t('voiceUpload.successTitle'), t('voiceUpload.successDesc'), [
        { text: t('common.confirm'), onPress: () => router.back() },
      ]);
    },
    onError: (err: unknown) => {
      toast.show(getApiErrorMessage(err, t('voiceUpload.uploadError')));
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
      toast.show(t('voiceUpload.inputRequired'));
      return;
    }
    cloneMutation.mutate({ file: selectedFile, name: name.trim() });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.description}>{t('voiceUpload.description')}</Text>

        {/* 파일 선택 */}
        <TouchableOpacity style={styles.pickButton} onPress={handlePickFile}>
          <Text style={styles.pickEmoji}>📁</Text>
          <Text style={styles.pickText}>
            {selectedFile ? selectedFile.name : t('voiceUpload.pickFile')}
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
          placeholder={t('voiceUpload.namePlaceholder')}
          value={name}
          onChangeText={setName}
          placeholderTextColor={Colors.light.textTertiary}
        />

        {/* 제출 */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedFile || !name.trim() || cloneMutation.isPending) && styles.disabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedFile || !name.trim() || cloneMutation.isPending}
        >
          {cloneMutation.isPending ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitText}>{t('voiceUpload.submit')}</Text>
          )}
        </TouchableOpacity>
      </View>
      <Toast message={toast.message} opacity={toast.opacity} />
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
