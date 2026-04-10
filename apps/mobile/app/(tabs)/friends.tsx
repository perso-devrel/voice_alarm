import { useState } from 'react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getFriendList,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  deleteFriend,
} from '../../src/services/api';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { useAppStore } from '../../src/stores/useAppStore';
import { getApiErrorMessage } from '../../src/types';

type Tab = 'friends' | 'pending';

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [email, setEmail] = useState('');
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  const friends = useQuery({
    queryKey: ['friends'],
    queryFn: getFriendList,
    enabled: isAuthenticated,
  });

  const pending = useQuery({
    queryKey: ['friends-pending'],
    queryFn: getPendingRequests,
    enabled: isAuthenticated,
  });

  const sendRequest = useMutation({
    mutationFn: (email: string) => sendFriendRequest(email),
    onSuccess: () => {
      setEmail('');
      Alert.alert('전송 완료', '친구 요청을 보냈습니다.');
      queryClient.invalidateQueries({ queryKey: ['friends-pending'] });
    },
    onError: (err: unknown) => {
      Alert.alert('오류', getApiErrorMessage(err, '친구 요청에 실패했습니다.'));
    },
  });

  const accept = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friends-pending'] });
    },
  });

  const remove = useMutation({
    mutationFn: deleteFriend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friends-pending'] });
    },
  });

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyText}>로그인 후 친구를 추가할 수 있습니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSend = () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    sendRequest.mutate(trimmed);
  };

  const isRefreshing = friends.isRefetching || pending.isRefetching;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>친구</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="이메일로 친구 추가"
          placeholderTextColor={Colors.light.textTertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!sendRequest.isPending}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!email.trim() || sendRequest.isPending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!email.trim() || sendRequest.isPending}
        >
          {sendRequest.isPending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.sendBtnText}>추가</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            내 친구 {friends.data?.length ? `(${friends.data.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            받은 요청 {pending.data?.length ? `(${pending.data.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'friends' ? (
        friends.isLoading ? (
          <ActivityIndicator style={styles.loader} color={Colors.light.primary} />
        ) : (
          <FlatList
            data={friends.data ?? []}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={() => { friends.refetch(); pending.refetch(); }} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🤝</Text>
                <Text style={styles.emptyText}>아직 친구가 없습니다</Text>
                <Text style={styles.emptySubtext}>이메일로 친구를 추가해 보세요</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.friend_name || item.friend_email || '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.friend_name || '이름 없음'}</Text>
                  <Text style={styles.cardEmail}>{item.friend_email}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() =>
                    Alert.alert('친구 삭제', `${item.friend_name || item.friend_email}님을 삭제하시겠습니까?`, [
                      { text: '취소', style: 'cancel' },
                      { text: '삭제', style: 'destructive', onPress: () => remove.mutate(item.id) },
                    ])
                  }
                >
                  <Text style={styles.removeBtnText}>삭제</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )
      ) : (
        pending.isLoading ? (
          <ActivityIndicator style={styles.loader} color={Colors.light.primary} />
        ) : (
          <FlatList
            data={pending.data ?? []}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={() => { friends.refetch(); pending.refetch(); }} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyText}>대기 중인 요청이 없습니다</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.requester_name || item.requester_email || '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.requester_name || '이름 없음'}</Text>
                  <Text style={styles.cardEmail}>{item.requester_email}</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => accept.mutate(item.id)}
                  >
                    <Text style={styles.acceptBtnText}>수락</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => remove.mutate(item.id)}
                  >
                    <Text style={styles.rejectBtnText}>거절</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.light.text,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: FontSize.md,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sendBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: FontSize.md,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tabActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: '#FFF',
  },
  loader: {
    marginTop: Spacing.xxl,
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.lg,
    color: Colors.light.text,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
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
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.primaryDark,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.light.text,
  },
  cardEmail: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  acceptBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  acceptBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  rejectBtn: {
    backgroundColor: Colors.light.surfaceVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  rejectBtnText: {
    color: Colors.light.textSecondary,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  removeBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  removeBtnText: {
    color: Colors.light.error,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
});
