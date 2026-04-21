import { useCallback, useReducer } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { BorderRadius, Colors, FontSize, Spacing } from '../../src/constants/theme';
import {
  listSpeakers,
  renameSpeaker,
  separateUpload,
  uploadVoiceAudio,
  type SpeakerSegment,
} from '../../src/services/api';
import {
  INITIAL_STATE,
  sanitizeLabel,
  speakerPickerReducer,
} from '../../src/lib/speakerPickerState';

export default function SpeakerPickerScreen() {
  const router = useRouter();
  const [state, dispatch] = useReducer(speakerPickerReducer, INITIAL_STATE);

  const pickFile = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      dispatch({
        type: 'PICK_FILE',
        file: { uri: asset.uri, name: asset.name, type: asset.mimeType || 'audio/wav' },
      });
    }
  }, []);

  const runFlow = useCallback(async () => {
    if (!state.file) return;
    dispatch({ type: 'UPLOAD_START' });
    try {
      const upload = await uploadVoiceAudio(state.file);
      dispatch({ type: 'UPLOAD_SUCCESS', upload });

      const existing = await listSpeakers(upload.id).catch(() => [] as SpeakerSegment[]);
      if (existing.length > 0) {
        dispatch({ type: 'READY', speakers: existing });
        return;
      }

      dispatch({ type: 'SEPARATE_START' });
      const detected = await separateUpload(upload.id);
      dispatch({ type: 'READY', speakers: detected });
    } catch (err) {
      dispatch({ type: 'FAIL', message: err instanceof Error ? err.message : '업로드 실패' });
    }
  }, [state.file]);

  const commitEdit = useCallback(
    async (speaker: SpeakerSegment) => {
      if (!state.upload) return;
      const sanitized = sanitizeLabel(state.draftLabel);
      if (!sanitized.ok) {
        dispatch({ type: 'FAIL', message: sanitized.error ?? '라벨 오류' });
        return;
      }
      if (sanitized.value === speaker.label) {
        dispatch({ type: 'EDIT_CANCEL' });
        return;
      }
      try {
        await renameSpeaker(state.upload.id, speaker.id, sanitized.value);
        dispatch({ type: 'EDIT_COMMIT', speakerId: speaker.id, label: sanitized.value });
      } catch (err) {
        dispatch({
          type: 'FAIL',
          message: err instanceof Error ? err.message : '라벨 수정 실패',
        });
      }
    },
    [state.upload, state.draftLabel],
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>화자 감지 (mock)</Text>
        <Text style={styles.desc}>
          오디오를 업로드하면 모의 분리 알고리즘이 화자를 나눕니다. 감지된 화자 중에서 선택하고
          라벨을 편집할 수 있어요.
        </Text>
      </View>

      {state.phase === 'idle' && (
        <>
          <TouchableOpacity style={styles.pickButton} onPress={pickFile}>
            <Text style={styles.pickEmoji}>📁</Text>
            <Text style={styles.pickText}>
              {state.file ? state.file.name : '오디오 파일 선택'}
            </Text>
          </TouchableOpacity>

          {state.file && (
            <TouchableOpacity style={styles.primaryButton} onPress={runFlow}>
              <Text style={styles.primaryText}>업로드 후 화자 감지</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {(state.phase === 'uploading' || state.phase === 'separating') && (
        <View style={styles.statusRow}>
          <ActivityIndicator color={Colors.light.primary} />
          <Text style={styles.statusText}>
            {state.phase === 'uploading' ? '업로드 중…' : '화자 분리 중…'}
          </Text>
        </View>
      )}

      {state.phase === 'error' && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{state.error ?? '알 수 없는 오류'}</Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => dispatch({ type: 'RESET' })}
          >
            <Text style={styles.secondaryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      )}

      {state.phase === 'ready' && (
        <>
          {state.speakers.length === 0 ? (
            <Text style={styles.emptyText}>감지된 화자가 없습니다.</Text>
          ) : (
            state.speakers.map((sp) => {
              const isSelected = state.selectedSpeakerId === sp.id;
              const isEditing = state.editingSpeakerId === sp.id;
              const durationSec = Math.max(0, (sp.end_ms - sp.start_ms) / 1000);
              return (
                <TouchableOpacity
                  key={sp.id}
                  style={[styles.speakerCard, isSelected && styles.speakerCardSelected]}
                  onPress={() => dispatch({ type: 'SELECT', speakerId: sp.id })}
                >
                  <View style={styles.speakerRow}>
                    {isEditing ? (
                      <TextInput
                        autoFocus
                        value={state.draftLabel}
                        onChangeText={(txt) => dispatch({ type: 'EDIT_CHANGE', label: txt })}
                        onBlur={() => void commitEdit(sp)}
                        onSubmitEditing={() => void commitEdit(sp)}
                        style={styles.labelInput}
                      />
                    ) : (
                      <Text style={styles.labelText}>{sp.label}</Text>
                    )}
                    <TouchableOpacity
                      onPress={() =>
                        dispatch({ type: 'EDIT_BEGIN', speakerId: sp.id, label: sp.label })
                      }
                    >
                      <Text style={styles.renameText}>이름 변경</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.metaText}>
                    {durationSec.toFixed(1)}초 · 신뢰도 {(sp.confidence * 100).toFixed(0)}%
                  </Text>
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryText}>닫기</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: Spacing.lg, paddingBottom: 120 },
  header: { marginBottom: Spacing.lg },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  desc: { fontSize: FontSize.md, color: Colors.light.textSecondary, lineHeight: 22 },
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
  pickEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  pickText: { fontSize: FontSize.md, color: Colors.light.primary, fontWeight: '600' },
  primaryButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryText: { color: '#FFF', fontSize: FontSize.lg, fontWeight: '700' },
  secondaryButton: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  secondaryText: { color: Colors.light.textSecondary, fontSize: FontSize.md },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  statusText: { marginLeft: Spacing.sm, color: Colors.light.textSecondary },
  errorCard: {
    backgroundColor: Colors.light.surface,
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: { color: '#B91C1C', fontSize: FontSize.md },
  emptyText: {
    textAlign: 'center',
    color: Colors.light.textSecondary,
    padding: Spacing.xl,
  },
  speakerCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  speakerCardSelected: { borderColor: Colors.light.primary },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelText: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.light.text },
  labelInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    marginRight: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.light.text,
  },
  renameText: { color: Colors.light.primary, fontSize: FontSize.sm, fontWeight: '600' },
  metaText: {
    marginTop: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.light.textTertiary,
  },
});
