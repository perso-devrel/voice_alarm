import { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  getFriendList,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  deleteFriend,
  searchUsers,
} from '../../src/services/api';
import type { UserSearchResult } from '../../src/services/api';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { useAppStore } from '../../src/stores/useAppStore';
import { getApiErrorMessage } from '../../src/types';
import { ErrorView } from '../../src/components/QueryStateView';
import { useToast } from '../../src/hooks/useToast';
import { Toast } from '../../src/components/Toast';

type Tab = 'friends' | 'pending';

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.skeletonAvatar, { opacity }]} />
      <View style={styles.cardInfo}>
        <Animated.View style={[styles.skeletonLine, styles.skeletonName, { opacity }]} />
        <Animated.View style={[styles.skeletonLine, styles.skeletonEmail, { opacity }]} />
      </View>
    </View>
  );
}

function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [email, setEmail] = useState('');
  const [suggestions, setSuggestions] = useState<UserSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useTranslation();
  const toast = useToast();

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.trim().length >= 2) {
      searchTimeout.current = setTimeout(async () => {
        try {
          const results = await searchUsers(text.trim());
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } catch {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (user: UserSearchResult) => {
    setEmail(user.email);
    setShowSuggestions(false);
    setSuggestions([]);
  };

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
      toast.show(t('friends.sendSuccess'));
      queryClient.invalidateQueries({ queryKey: ['friends-pending'] });
    },
    onError: (err: unknown) => {
      toast.show(getApiErrorMessage(err, t('friends.sendError')));
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
          <Text style={styles.emptyText}>{t('friends.loginRequired')}</Text>
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
      <Text style={styles.title}>{t('friends.title')}</Text>

      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder={t('friends.addPlaceholder')}
            placeholderTextColor={Colors.light.textTertiary}
            value={email}
            onChangeText={handleEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!sendRequest.isPending}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {showSuggestions && (
            <View style={styles.suggestionsDropdown}>
              {suggestions.map((user) => (
                <TouchableOpacity
                  key={user.id}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(user)}
                >
                  <View style={styles.suggestionAvatar}>
                    <Text style={styles.suggestionAvatarText}>
                      {(user.name || user.email)[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.suggestionInfo}>
                    <Text style={styles.suggestionName} numberOfLines={1}>
                      {user.name || t('common.noName')}
                    </Text>
                    <Text style={styles.suggestionEmail} numberOfLines={1}>
                      {user.email}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!email.trim() || sendRequest.isPending) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!email.trim() || sendRequest.isPending}
        >
          {sendRequest.isPending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.sendBtnText}>{t('common.add')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            {t('friends.myFriends')} {friends.data?.length ? `(${friends.data.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            {t('friends.pendingRequests')} {pending.data?.length ? `(${pending.data.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'friends' ? (
        friends.isLoading ? (
          <SkeletonList count={4} />
        ) : friends.isError ? (
          <ErrorView onRetry={() => friends.refetch()} />
        ) : (
          <View style={[styles.listWrap, friends.isRefetching && styles.listDimmed]}>
            <FlatList
              data={friends.data ?? []}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => {
                    friends.refetch();
                    pending.refetch();
                  }}
                />
              }
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyEmoji}>🤝</Text>
                  <Text style={styles.emptyText}>{t('friends.emptyFriends')}</Text>
                  <Text style={styles.emptySubtext}>{t('friends.emptyFriendsHint')}</Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => router.push({ pathname: '/friend/[id]', params: { id: item.id } })}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.friend_name || item.friend_email || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.friend_name || t('common.noName')}</Text>
                    <Text style={styles.cardEmail}>{item.friend_email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert(
                        t('friends.deleteTitle'),
                        t('friends.deleteConfirm', { name: item.friend_name || item.friend_email }),
                        [
                          { text: t('common.cancel'), style: 'cancel' },
                          {
                            text: t('common.delete'),
                            style: 'destructive',
                            onPress: () => remove.mutate(item.id),
                          },
                        ],
                      );
                    }}
                  >
                    <Text style={styles.removeBtnText}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          </View>
        )
      ) : pending.isLoading ? (
        <SkeletonList count={3} />
      ) : pending.isError ? (
        <ErrorView onRetry={() => pending.refetch()} />
      ) : (
        <View style={[styles.listWrap, pending.isRefetching && styles.listDimmed]}>
          <FlatList
            data={pending.data ?? []}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  friends.refetch();
                  pending.refetch();
                }}
              />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyText}>{t('friends.emptyPending')}</Text>
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
                  <Text style={styles.cardName}>{item.requester_name || t('common.noName')}</Text>
                  <Text style={styles.cardEmail}>{item.requester_email}</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => accept.mutate(item.id)}>
                    <Text style={styles.acceptBtnText}>{t('common.accept')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => remove.mutate(item.id)}>
                    <Text style={styles.rejectBtnText}>{t('common.reject')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      <Toast message={toast.message} opacity={toast.opacity} />
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
    zIndex: 10,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative' as const,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: FontSize.md,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  suggestionsDropdown: {
    position: 'absolute' as const,
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: 4,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
  },
  suggestionItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  suggestionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: Spacing.sm,
  },
  suggestionAvatarText: {
    fontSize: FontSize.sm,
    fontWeight: '600' as const,
    color: Colors.light.primaryDark,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: FontSize.sm,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  suggestionEmail: {
    fontSize: FontSize.xs,
    color: Colors.light.textSecondary,
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
  listWrap: {
    flex: 1,
  },
  listDimmed: {
    opacity: 0.5,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.border,
    marginRight: Spacing.md,
  },
  skeletonLine: {
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.border,
  },
  skeletonName: {
    width: 120,
    height: 14,
    marginBottom: 6,
  },
  skeletonEmail: {
    width: 180,
    height: 12,
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
