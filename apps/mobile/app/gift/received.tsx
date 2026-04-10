import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getReceivedGifts, acceptGift, rejectGift } from '../../src/services/api';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { getApiErrorMessage } from '../../src/types';
import type { Gift } from '../../src/types';

function SkeletonGiftCard() {
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
      <View style={styles.header}>
        <View style={styles.senderInfo}>
          <Animated.View style={[styles.skeletonLine, { width: 100, height: 14, opacity }]} />
          <Animated.View style={[styles.skeletonLine, { width: 160, height: 11, marginTop: 4, opacity }]} />
        </View>
        <Animated.View style={[styles.skeletonLine, { width: 50, height: 18, opacity }]} />
      </View>
      <Animated.View style={[styles.skeletonBlock, { opacity }]} />
    </View>
  );
}

function SkeletonGiftList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonGiftCard key={i} />
      ))}
    </View>
  );
}

export default function ReceivedGiftsScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t } = useTranslation();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setToastMessage(null);
      });
    }, 3000);
  }, [toastOpacity]);

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['gifts-received'],
    queryFn: getReceivedGifts,
  });

  const accept = useMutation({
    mutationFn: acceptGift,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['gifts-received'] });
      const previous = queryClient.getQueryData<Gift[]>(['gifts-received']);
      queryClient.setQueryData<Gift[]>(['gifts-received'], (old) =>
        old?.map((g) => (g.id === id ? { ...g, status: 'accepted' as const } : g)),
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts-received'] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
      showToast(t('giftReceived.acceptSuccess'));
    },
    onError: (err: unknown, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['gifts-received'], context.previous);
      }
      showToast(getApiErrorMessage(err, t('giftReceived.acceptError')));
    },
  });

  const reject = useMutation({
    mutationFn: rejectGift,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['gifts-received'] });
      const previous = queryClient.getQueryData<Gift[]>(['gifts-received']);
      queryClient.setQueryData<Gift[]>(['gifts-received'], (old) =>
        old?.map((g) => (g.id === id ? { ...g, status: 'rejected' as const } : g)),
      );
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts-received'] });
      showToast(t('giftReceived.rejectSuccess', '선물을 거절했습니다'));
    },
    onError: (err: unknown, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['gifts-received'], context.previous);
      }
      showToast(getApiErrorMessage(err, t('giftReceived.rejectError')));
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <SkeletonGiftList count={3} />
      </SafeAreaView>
    );
  }

  const statusLabel = (status: string) => {
    if (status === 'accepted') return t('giftReceived.statusAccepted');
    if (status === 'rejected') return t('giftReceived.statusRejected');
    return t('giftReceived.statusPending');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={[styles.listWrap, isRefetching && styles.listDimmed]}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎁</Text>
            <Text style={styles.emptyText}>{t('giftReceived.emptyText')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.senderInfo}>
                <Text style={styles.senderName}>
                  {item.sender_name || t('giftReceived.unknown')}
                </Text>
                <Text style={styles.senderEmail}>{item.sender_email}</Text>
              </View>
              <Text
                style={[
                  styles.status,
                  item.status === 'accepted' && styles.statusAccepted,
                  item.status === 'rejected' && styles.statusRejected,
                ]}
              >
                {statusLabel(item.status)}
              </Text>
            </View>

            <View style={styles.messageBox}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.messageText} numberOfLines={2}>
                {item.message_text}
              </Text>
            </View>

            {item.note && <Text style={styles.note}>"{item.note}"</Text>}

            {item.status === 'pending' && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => accept.mutate(item.id)}
                  disabled={accept.isPending}
                >
                  <Text style={styles.acceptBtnText}>{t('common.accept')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() =>
                    Alert.alert(t('giftReceived.rejectTitle'), t('giftReceived.rejectConfirm'), [
                      { text: t('common.cancel'), style: 'cancel' },
                      {
                        text: t('common.reject'),
                        style: 'destructive',
                        onPress: () => reject.mutate(item.id),
                      },
                    ])
                  }
                  disabled={reject.isPending}
                >
                  <Text style={styles.rejectBtnText}>{t('common.reject')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {item.status === 'accepted' && (
              <TouchableOpacity
                style={styles.setAlarmBtn}
                onPress={() =>
                  router.push({ pathname: '/alarm/create', params: { message_id: item.message_id } })
                }
              >
                <Text style={styles.setAlarmBtnText}>{t('giftReceived.setAsAlarm')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
      </View>
      {toastMessage && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listWrap: {
    flex: 1,
  },
  listDimmed: {
    opacity: 0.5,
  },
  skeletonLine: {
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.border,
  },
  skeletonBlock: {
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.border,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
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
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.light.text,
  },
  senderEmail: {
    fontSize: FontSize.xs,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  status: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.light.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.surfaceVariant,
    overflow: 'hidden',
  },
  statusAccepted: {
    color: Colors.light.success,
  },
  statusRejected: {
    color: Colors.light.error,
  },
  messageBox: {
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  category: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    lineHeight: 22,
  },
  note: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: FontSize.md,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: Colors.light.surfaceVariant,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  rejectBtnText: {
    color: Colors.light.textSecondary,
    fontWeight: '600',
    fontSize: FontSize.md,
  },
  setAlarmBtn: {
    backgroundColor: Colors.light.surfaceVariant,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  setAlarmBtnText: {
    color: Colors.light.primary,
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  toast: {
    position: 'absolute',
    bottom: 40,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.light.primaryDark,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  toastText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
