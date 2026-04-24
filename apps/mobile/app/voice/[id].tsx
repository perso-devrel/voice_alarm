import { useState } from 'react';
import {
  Alert,
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize, FontFamily } from '../../src/constants/theme';
import { getVoiceProfiles, getMessages, getAlarms, updateVoiceProfile } from '../../src/services/api';
import { useAppStore } from '../../src/stores/useAppStore';
import { sanitizeVoiceName } from '../../src/lib/voiceName';
import type { Message, Alarm, VoiceProfile } from '../../src/types';

export default function VoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const { t } = useTranslation();

  const { data: profiles } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: getVoiceProfiles,
    enabled: isAuthenticated,
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');

  const renameMutation = useMutation({
    mutationFn: (name: string) => updateVoiceProfile(id!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
      setIsEditingName(false);
      setDraftName('');
    },
    onError: (err) => {
      Alert.alert('이름 변경 실패', err instanceof Error ? err.message : '네트워크 오류');
    },
  });

  const beginEdit = (currentName: string) => {
    setDraftName(currentName);
    setIsEditingName(true);
  };

  const commitEdit = (currentName: string) => {
    const sanitized = sanitizeVoiceName(draftName);
    if (!sanitized.ok) {
      Alert.alert('입력 오류', sanitized.error ?? '이름이 올바르지 않습니다.');
      return;
    }
    if (sanitized.value === currentName) {
      setIsEditingName(false);
      setDraftName('');
      return;
    }
    renameMutation.mutate(sanitized.value);
  };

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['messages'],
    queryFn: () => getMessages(),
    enabled: isAuthenticated,
  });

  const { data: alarms, isLoading: loadingAlarms } = useQuery({
    queryKey: ['alarms'],
    queryFn: getAlarms,
    enabled: isAuthenticated,
  });

  const profile = profiles?.find((p: VoiceProfile) => p.id === id);
  const voiceMessages = messages?.filter((m: Message) => m.voice_profile_id === id) ?? [];
  const voiceAlarms = alarms?.filter((a: Alarm) => a.voice_name === profile?.name) ?? [];

  const isLoading = loadingMessages || loadingAlarms;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {profile && (
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
          </View>
          {isEditingName ? (
            <View style={styles.renameRow}>
              <TextInput
                autoFocus
                value={draftName}
                onChangeText={setDraftName}
                onSubmitEditing={() => commitEdit(profile.name)}
                maxLength={60}
                style={styles.renameInput}
                accessibilityLabel="음성 이름 입력"
              />
              <TouchableOpacity
                accessibilityLabel="이름 변경 저장"
                onPress={() => commitEdit(profile.name)}
                disabled={renameMutation.isPending}
                style={styles.renameSaveBtn}
              >
                <Text style={styles.renameSaveText}>
                  {renameMutation.isPending ? '저장…' : '저장'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="이름 변경 취소"
                onPress={() => {
                  setIsEditingName(false);
                  setDraftName('');
                }}
                style={styles.renameCancelBtn}
              >
                <Text style={styles.renameCancelText}>취소</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.profileName}>{profile.name}</Text>
              <TouchableOpacity
                accessibilityLabel="음성 이름 변경"
                onPress={() => beginEdit(profile.name)}
                style={styles.renameBtn}
              >
                <Text style={styles.renameText}>이름 변경</Text>
              </TouchableOpacity>
            </>
          )}
          <Text style={styles.profileDate}>
            {new Date(profile.created_at).toLocaleDateString('ko-KR')}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{voiceMessages.length}</Text>
              <Text style={styles.statLabel}>{t('voiceDetail.messages')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{voiceAlarms.length}</Text>
              <Text style={styles.statLabel}>{t('voiceDetail.alarms')}</Text>
            </View>
          </View>
          {profile.status === 'ready' && (
            <TouchableOpacity
              style={styles.createMessageBtn}
              onPress={() => router.push(`/message/create?voice_id=${id}`)}
            >
              <Text style={styles.createMessageText}>{t('voiceDetail.createMessage')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={[
            ...(voiceMessages.length > 0
              ? [{ type: 'section', title: t('voiceDetail.messageList') } as const]
              : []),
            ...voiceMessages.map((m) => ({ type: 'message' as const, data: m })),
            ...(voiceAlarms.length > 0
              ? [{ type: 'section', title: t('voiceDetail.alarmList') } as const]
              : []),
            ...voiceAlarms.map((a) => ({ type: 'alarm' as const, data: a })),
          ]}
          keyExtractor={(item, index) =>
            item.type === 'section' ? `section-${index}` : item.data.id
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            if (item.type === 'section') {
              return <Text style={styles.sectionTitle}>{item.title}</Text>;
            }
            if (item.type === 'message') {
              const m = item.data as Message;
              return (
                <View style={styles.itemCard}>
                  <Text style={styles.itemCategory}>{m.category}</Text>
                  <Text style={styles.itemText} numberOfLines={2}>
                    {m.text}
                  </Text>
                  <Text style={styles.itemDate}>
                    {new Date(m.created_at).toLocaleDateString('ko-KR')}
                  </Text>
                </View>
              );
            }
            const a = item.data as Alarm;
            return (
              <View style={styles.itemCard}>
                <Text style={styles.alarmTime}>{a.time}</Text>
                <Text style={styles.itemText} numberOfLines={1}>
                  {a.message_text}
                </Text>
                <Text style={[styles.itemDate, !a.is_active && styles.inactive]}>
                  {a.is_active ? t('voiceDetail.active') : t('voiceDetail.inactive')}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('voiceDetail.empty')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: FontFamily.bold,
    color: Colors.light.primaryDark,
  },
  profileName: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },
  profileDate: {
    fontSize: FontSize.sm,
    color: Colors.light.textTertiary,
    marginTop: Spacing.xs,
  },
  renameBtn: {
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  renameText: {
    fontSize: FontSize.sm,
    color: Colors.light.primary,
    fontFamily: FontFamily.semibold,
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
  },
  renameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    fontSize: FontSize.md,
    color: Colors.light.text,
  },
  renameSaveBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.sm,
  },
  renameSaveText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
  },
  renameCancelBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  renameCancelText: {
    color: Colors.light.textSecondary,
    fontSize: FontSize.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  itemCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  itemCategory: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  itemText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    lineHeight: 22,
  },
  itemDate: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
    marginTop: 4,
  },
  alarmTime: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.regular,
    color: Colors.light.text,
    marginBottom: 4,
  },
  inactive: {
    color: Colors.light.error,
  },
  createMessageBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  createMessageText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
  },
});
