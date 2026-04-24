import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getFriendList,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  deleteFriend,
  getFamilyGroupCurrent,
} from '../../src/services/api';
import type { FamilyGroupMember } from '../../src/services/api';
import type { Friend, PendingFriendRequest } from '../../src/types';
import { getApiErrorMessage } from '../../src/types';
import { buildMemberDisplayName } from '../../src/lib/familyAlarmForm';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { useAppStore } from '../../src/stores/useAppStore';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { useToast } from '../../src/hooks/useToast';
import { Toast } from '../../src/components/Toast';

type Segment = 'members' | 'friends' | 'requests';

export default function PeopleScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const toast = useToast();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const plan = useAppStore((s) => s.plan);
  const isConnected = useNetworkStatus();
  const isFamilyPlan = plan === 'family';
  const [activeSegment, setActiveSegment] = useState<Segment>(isFamilyPlan ? 'members' : 'friends');
  const [email, setEmail] = useState('');

  const {
    data: friends,
    isLoading: friendsLoading,
    refetch: refetchFriends,
    isRefetching: friendsRefetching,
  } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriendList,
    enabled: isAuthenticated && isConnected,
  });

  const {
    data: pending,
    isLoading: pendingLoading,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: getPendingRequests,
    enabled: isAuthenticated && isConnected,
  });

  const {
    data: familyData,
    isLoading: familyLoading,
    refetch: refetchFamily,
    isRefetching: familyRefetching,
  } = useQuery({
    queryKey: ['family-group'],
    queryFn: getFamilyGroupCurrent,
    enabled: isAuthenticated && isConnected && isFamilyPlan,
  });

  const sendMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      setEmail('');
      toast.show(t('friends.sendSuccess'));
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
    },
    onError: (err: unknown) => {
      toast.show(getApiErrorMessage(err, t('friends.sendError')));
    },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: deleteFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });

  const handleSend = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  };

  const handleRemove = (friend: Friend) => {
    Alert.alert(
      t('friends.deleteTitle'),
      t('friends.deleteConfirm', { name: friend.friend_name || friend.friend_email }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => removeMutation.mutate(friend.id) },
      ],
    );
  };

  const onRefresh = async () => {
    const tasks: Promise<unknown>[] = [refetchFriends(), refetchPending()];
    if (isFamilyPlan) tasks.push(refetchFamily());
    await Promise.all(tasks);
  };

  const segments = useMemo<{ key: Segment; label: string; badge?: number }[]>(() => {
    const items: { key: Segment; label: string; badge?: number }[] = [];
    if (isFamilyPlan) {
      items.push({ key: 'members', label: t('people.members') });
    }
    items.push({ key: 'friends', label: t('people.friends') });
    items.push({
      key: 'requests',
      label: t('people.requests'),
      badge: pending?.length,
    });
    return items;
  }, [isFamilyPlan, pending?.length, t]);

  const members = familyData?.members ?? [];
  const isCouple = isFamilyPlan && members.length === 2;

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👤</Text>
          <Text style={styles.emptyText}>{t('friends.loginRequired')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={styles.personCard}
      onPress={() => router.push(`/friend/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.friend_name || item.friend_email || '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.personInfo}>
        <Text style={styles.personName}>{item.friend_name || t('common.noName')}</Text>
        <Text style={styles.personEmail}>{item.friend_email}</Text>
      </View>
      <TouchableOpacity
        onPress={() => handleRemove(item)}
        hitSlop={8}
        style={styles.removeBtn}
        accessibilityLabel={t('common.delete')}
      >
        <Text style={styles.removeBtnText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderRequest = ({ item }: { item: PendingFriendRequest }) => (
    <View style={styles.personCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.requester_name || item.requester_email || '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.personInfo}>
        <Text style={styles.personName}>{item.requester_name || t('common.noName')}</Text>
        <Text style={styles.personEmail}>{item.requester_email}</Text>
      </View>
      <TouchableOpacity
        style={styles.acceptBtn}
        onPress={() => acceptMutation.mutate(item.id)}
        accessibilityLabel={t('common.accept')}
      >
        <Text style={styles.acceptBtnText}>{t('common.accept')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMember = ({ item }: { item: FamilyGroupMember }) => (
    <View style={[styles.personCard, isCouple && styles.coupleCard]}>
      <View style={[styles.avatar, item.role === 'owner' && styles.ownerAvatar]}>
        <Text style={styles.avatarText}>
          {buildMemberDisplayName(item).charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.personInfo}>
        <View style={styles.memberNameRow}>
          <Text style={styles.personName}>{buildMemberDisplayName(item)}</Text>
          <View style={[styles.roleBadge, item.role === 'owner' ? styles.ownerBadge : styles.memberBadge]}>
            <Text style={styles.roleBadgeText}>
              {item.role === 'owner' ? t('people.owner') : t('people.member')}
            </Text>
          </View>
        </View>
        {item.email && <Text style={styles.personEmail}>{item.email}</Text>}
        {item.allow_family_alarms && (
          <Text style={styles.alarmAllowed}>⏰ {t('people.alarmAllowed')}</Text>
        )}
      </View>
    </View>
  );

  const renderMembersContent = () => {
    if (familyLoading) {
      return <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 40 }} />;
    }
    if (!familyData?.group) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👨‍👩‍👧</Text>
          <Text style={styles.emptyText}>{t('people.noGroup')}</Text>
          <Text style={styles.emptyHint}>{t('people.noGroupHint')}</Text>
        </View>
      );
    }

    const sortedMembers = [...members].sort((a, b) =>
      a.role === 'owner' ? -1 : b.role === 'owner' ? 1 : 0,
    );

    return (
      <FlatList
        data={sortedMembers}
        keyExtractor={(item) => item.id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={familyRefetching} onRefresh={onRefresh} />
        }
        ListFooterComponent={
          <TouchableOpacity
            style={styles.familyAlarmBtn}
            onPress={() => router.push('/family-alarm/create')}
            activeOpacity={0.7}
          >
            <Text style={styles.familyAlarmBtnText}>⏰ {t('people.sendFamilyAlarm')}</Text>
          </TouchableOpacity>
        }
      />
    );
  };

  const renderFriendsContent = () => {
    if (friendsLoading) {
      return <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 40 }} />;
    }
    if (!friends?.length) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👤</Text>
          <Text style={styles.emptyText}>{t('friends.emptyFriends')}</Text>
          <Text style={styles.emptyHint}>{t('friends.emptyFriendsHint')}</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={renderFriend}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={friendsRefetching} onRefresh={onRefresh} />
        }
      />
    );
  };

  const renderRequestsContent = () => {
    if (pendingLoading) {
      return <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 40 }} />;
    }
    if (!pending?.length) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📬</Text>
          <Text style={styles.emptyText}>{t('friends.emptyPending')}</Text>
        </View>
      );
    }
    return (
      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tab.people')}</Text>
      </View>

      {activeSegment === 'friends' && (
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder={t('friends.addPlaceholder')}
            placeholderTextColor={Colors.light.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.addBtn, !email.trim() && styles.addBtnDisabled]}
            onPress={handleSend}
            disabled={!email.trim() || sendMutation.isPending}
          >
            <Text style={styles.addBtnText}>{t('common.add')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.segmentRow}>
        {segments.map((seg) => (
          <TouchableOpacity
            key={seg.key}
            style={[styles.segment, activeSegment === seg.key && styles.segmentActive]}
            onPress={() => setActiveSegment(seg.key)}
          >
            <Text style={[styles.segmentText, activeSegment === seg.key && styles.segmentTextActive]}>
              {seg.label}
              {seg.badge != null && seg.badge > 0 ? ` (${seg.badge})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeSegment === 'members' && renderMembersContent()}
      {activeSegment === 'friends' && renderFriendsContent()}
      {activeSegment === 'requests' && renderRequestsContent()}

      <Toast message={toast.message} opacity={toast.opacity} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.light.text,
  },
  addRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  addInput: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.light.text,
    minHeight: 44,
  },
  addBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    minHeight: 44,
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: FontSize.md,
  },
  segmentRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  segmentActive: {
    borderBottomColor: Colors.light.primary,
  },
  segmentText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  coupleCard: {
    borderWidth: 1,
    borderColor: Colors.light.primaryLight,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  ownerAvatar: {
    backgroundColor: Colors.light.primary,
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  personInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  personName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.light.text,
  },
  personEmail: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: Spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  ownerBadge: {
    backgroundColor: `${Colors.light.primary}20`,
  },
  memberBadge: {
    backgroundColor: Colors.light.surfaceVariant,
  },
  roleBadgeText: {
    fontSize: FontSize.xs - 1,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  alarmAllowed: {
    fontSize: FontSize.xs,
    color: Colors.light.success,
    marginTop: 2,
  },
  familyAlarmBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  familyAlarmBtnText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: FontSize.sm,
    color: Colors.light.textTertiary,
  },
  acceptBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  acceptBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: FontSize.sm,
    color: Colors.light.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
