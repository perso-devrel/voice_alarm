import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { getVoiceProfiles, getMessages, getAlarms } from '../../src/services/api';
import { useAppStore } from '../../src/stores/useAppStore';
import type { Message, Alarm, VoiceProfile } from '../../src/types';

export default function VoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const { t } = useTranslation();

  const { data: profiles } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: getVoiceProfiles,
    enabled: isAuthenticated,
  });

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
          <Text style={styles.profileName}>{profile.name}</Text>
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
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  profileName: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.light.text,
  },
  profileDate: {
    fontSize: FontSize.sm,
    color: Colors.light.textTertiary,
    marginTop: Spacing.xs,
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '300',
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
    fontWeight: '600',
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
