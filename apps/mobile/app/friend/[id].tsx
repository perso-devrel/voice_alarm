import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { getFriendList, getSentGifts, getReceivedGifts, getAlarms } from '../../src/services/api';
import type { Friend, Gift, Alarm } from '../../src/types';

export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const colors = Colors.light;

  const { data: friends } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriendList,
  });

  const { data: sentGifts } = useQuery({
    queryKey: ['sentGifts'],
    queryFn: getSentGifts,
  });

  const { data: receivedGifts } = useQuery({
    queryKey: ['receivedGifts'],
    queryFn: getReceivedGifts,
  });

  const { data: alarms } = useQuery({
    queryKey: ['alarms'],
    queryFn: getAlarms,
  });

  const friend = friends?.find((f: Friend) => f.id === id);

  if (!friend) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const friendEmail = friend.friend_email ?? '';
  const friendName = friend.friend_name || friendEmail;
  const initial = (friendName || '?')[0].toUpperCase();

  const giftsToFriend = sentGifts?.filter((g: Gift) => g.recipient_id === friend.user_b || g.recipient_id === friend.user_a) ?? [];
  const giftsFromFriend = receivedGifts?.filter((g: Gift) => g.sender_email === friendEmail) ?? [];
  const alarmsForFriend = alarms?.filter((a: Alarm) => a.target_user_id && a.target_user_id !== a.user_id) ?? [];

  const since = new Date(friend.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>{t('common.back', '< 돌아가기')}</Text>
        </TouchableOpacity>

        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.avatarText, { color: colors.primaryDark }]}>{initial}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{friendName}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{friendEmail}</Text>
          <Text style={[styles.since, { color: colors.textTertiary }]}>
            {t('friendProfile.since', '{{date}}부터 친구', { date: since })}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label={t('friendProfile.giftsSent', '보낸 선물')}
            count={giftsToFriend.length}
            emoji="🎁"
            colors={colors}
          />
          <StatCard
            label={t('friendProfile.giftsReceived', '받은 선물')}
            count={giftsFromFriend.length}
            emoji="📬"
            colors={colors}
          />
          <StatCard
            label={t('friendProfile.alarms', '알람')}
            count={alarmsForFriend.length}
            emoji="⏰"
            colors={colors}
          />
        </View>

        {giftsFromFriend.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('friendProfile.recentGiftsFrom', '{{name}}님이 보낸 선물', { name: friend.friend_name || '친구' })}
            </Text>
            {giftsFromFriend.slice(0, 5).map((g: Gift) => (
              <View key={g.id} style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.listItemText, { color: colors.text }]}>"{g.message_text}"</Text>
                <Text style={[styles.listItemMeta, { color: colors.textTertiary }]}>
                  {g.status === 'pending' ? t('friendProfile.pending', '대기중') :
                   g.status === 'accepted' ? t('friendProfile.accepted', '수락됨') :
                   t('friendProfile.rejected', '거절됨')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {giftsToFriend.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('friendProfile.recentGiftsTo', '내가 보낸 선물')}
            </Text>
            {giftsToFriend.slice(0, 5).map((g: Gift) => (
              <View key={g.id} style={[styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.listItemText, { color: colors.text }]}>"{g.message_text}"</Text>
                <Text style={[styles.listItemMeta, { color: colors.textTertiary }]}>
                  {g.status === 'pending' ? t('friendProfile.pending', '대기중') :
                   g.status === 'accepted' ? t('friendProfile.accepted', '수락됨') :
                   t('friendProfile.rejected', '거절됨')}
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push({ pathname: '/alarm/create', params: { friendId: friend.user_b === friend.friend_email ? friend.user_b : friend.user_a } })}
        >
          <Text style={styles.actionButtonText}>{t('friendProfile.setAlarm', '이 친구에게 알람 보내기')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  count,
  emoji,
  colors,
}: {
  label: string;
  count: number;
  emoji: string;
  colors: typeof Colors.light;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statCount, { color: colors.text }]}>{count}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.lg },
  backButton: { marginBottom: Spacing.md },
  backText: { fontSize: FontSize.md, fontWeight: '600' },
  profileCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { fontSize: 32, fontWeight: '700' },
  name: { fontSize: FontSize.xl, fontWeight: '700', marginBottom: 4 },
  email: { fontSize: FontSize.sm, marginBottom: 8 },
  since: { fontSize: FontSize.xs },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statCount: { fontSize: FontSize.xl, fontWeight: '700' },
  statLabel: { fontSize: FontSize.xs, marginTop: 2 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '600', marginBottom: Spacing.sm },
  listItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  listItemText: { fontSize: FontSize.sm },
  listItemMeta: { fontSize: FontSize.xs, marginTop: 4 },
  actionButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  actionButtonText: { color: '#FFFFFF', fontSize: FontSize.md, fontWeight: '700' },
});
