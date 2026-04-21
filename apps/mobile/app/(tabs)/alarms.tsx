import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated as RNAnimated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { getAlarms, updateAlarm, deleteAlarm } from '../../src/services/api';
import { useAppStore } from '../../src/stores/useAppStore';
import { DAYS_OF_WEEK } from '../../src/constants/presets';
import { ErrorView } from '../../src/components/QueryStateView';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { cacheAlarms, getCachedAlarms } from '../../src/services/offlineCache';
import { syncAlarmNotifications } from '../../src/services/notifications';
import type { Alarm } from '../../src/types';
import { getApiErrorMessage } from '../../src/types';
import { parseRepeatDays } from '../../src/lib/alarmForm';
import { getAlarmModeBadge } from '../../src/lib/alarmPlayback';
import { useToast } from '../../src/hooks/useToast';
import { Toast } from '../../src/components/Toast';

function getNextFireMs(alarm: Alarm): number | null {
  if (!alarm.is_active) return null;
  const [h, m] = alarm.time.split(':').map(Number);
  const days = parseRepeatDays(alarm.repeat_days);
  const now = new Date();
  const todayMinutes = now.getHours() * 60 + now.getMinutes();
  const alarmMinutes = h * 60 + m;
  const todayDow = now.getDay();

  if (days.length === 0) {
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    return target.getTime() - now.getTime();
  }

  for (let offset = 0; offset <= 7; offset++) {
    const dow = (todayDow + offset) % 7;
    if (!days.includes(dow)) continue;
    if (offset === 0 && alarmMinutes <= todayMinutes) continue;
    const target = new Date(now);
    target.setDate(target.getDate() + offset);
    target.setHours(h, m, 0, 0);
    return target.getTime() - now.getTime();
  }
  return null;
}

function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}일 ${remHours}시간`;
  }
  if (hours > 0) return `${hours}시간 ${mins}분`;
  return `${mins}분`;
}

export default function AlarmsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const { t } = useTranslation();
  const toast = useToast();
  const isConnected = useNetworkStatus();
  const [cachedAlarms, setCachedAlarms] = useState<Alarm[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [countdownText, setCountdownText] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    getCachedAlarms().then(setCachedAlarms);
  }, []);

  const {
    data: alarms,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['alarms'],
    queryFn: getAlarms,
    enabled: isAuthenticated && isConnected,
  });

  const computeCountdown = useCallback(() => {
    const all = alarms ?? cachedAlarms;
    if (!all || all.length === 0) { setCountdownText(null); return; }
    let nearest = Infinity;
    for (const a of all) {
      const ms = getNextFireMs(a);
      if (ms !== null && ms < nearest) nearest = ms;
    }
    setCountdownText(nearest < Infinity ? formatCountdown(nearest) : null);
  }, [alarms, cachedAlarms]);

  useEffect(() => {
    computeCountdown();
    const id = setInterval(() => {
      computeCountdown();
      setTick((t) => t + 1);
    }, 60_000);
    return () => clearInterval(id);
  }, [computeCountdown]);

  useEffect(() => {
    if (alarms && alarms.length > 0) {
      cacheAlarms(alarms);
      setCachedAlarms(alarms);
      syncAlarmNotifications(alarms);
    }
  }, [alarms]);

  const displayAlarms = alarms ?? cachedAlarms;
  const showingCached = !alarms && !!cachedAlarms && !isConnected;

  const filteredAlarms = useMemo(() => {
    if (!displayAlarms) return displayAlarms;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return displayAlarms;
    return displayAlarms.filter((a) =>
      a.time.includes(q) ||
      (a.voice_name && a.voice_name.toLowerCase().includes(q)) ||
      (a.message_text && a.message_text.toLowerCase().includes(q))
    );
  }, [displayAlarms, searchQuery]);

  const resyncNotifications = async () => {
    const fresh = await queryClient.fetchQuery({ queryKey: ['alarms'], queryFn: getAlarms });
    if (fresh) syncAlarmNotifications(fresh);
  };

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateAlarm(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
      resyncNotifications();
    },
    onError: (err: unknown) => {
      toast.show(getApiErrorMessage(err, t('alarms.toggleError')));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlarm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
      resyncNotifications();
    },
    onError: (err: unknown) => {
      toast.show(getApiErrorMessage(err, t('alarms.deleteError')));
    },
  });

  const handleDelete = (id: string) => {
    Alert.alert(t('alarms.deleteTitle'), t('alarms.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const formatRepeatDays = (days: number[]) => {
    if (days.length === 0) return t('alarms.once');
    if (days.length === 7) return t('alarms.daily');
    const sorted = [...days].sort();
    if (JSON.stringify(sorted) === JSON.stringify([1, 2, 3, 4, 5])) return t('alarms.weekday');
    if (JSON.stringify(sorted) === JSON.stringify([0, 6])) return t('alarms.weekend');
    return days.map((d) => DAYS_OF_WEEK[d]).join(', ');
  };

  const renderDeleteAction = (
    _progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.swipeDeleteContainer}>
        <RNAnimated.Text style={[styles.swipeDeleteText, { transform: [{ scale }] }]}>
          {t('common.delete')}
        </RNAnimated.Text>
      </View>
    );
  };

  const renderAlarm = ({ item }: { item: Alarm }) => {
    const repeatDays = parseRepeatDays(item.repeat_days);
    void tick;
    const nextFireMs = getNextFireMs(item);
    const perAlarmCountdown = nextFireMs !== null ? formatCountdown(nextFireMs) : null;
    return (
      <Swipeable
        renderRightActions={renderDeleteAction}
        onSwipeableOpen={() => handleDelete(item.id)}
        overshootRight={false}
      >
        <TouchableOpacity
          style={[styles.alarmCard, !item.is_active && styles.alarmCardInactive]}
          onPress={() => router.push({ pathname: '/alarm/edit', params: { id: item.id } })}
          onLongPress={() => handleDelete(item.id)}
          activeOpacity={0.8}
        >
          <View style={styles.alarmLeft}>
            <Text style={[styles.alarmTime, !item.is_active && styles.timeInactive]}>
              {item.time}
            </Text>
            <View style={styles.alarmSubRow}>
              <Text style={[styles.alarmRepeat, !item.is_active && styles.textInactive]}>
                {formatRepeatDays(repeatDays)}
              </Text>
              {item.is_active && perAlarmCountdown && (
                <Text style={styles.alarmCountdown}>{perAlarmCountdown}</Text>
              )}
            </View>
            <View style={styles.alarmMeta}>
              <Text style={[styles.alarmVoice, !item.is_active && styles.textInactive]}>🗣️ {item.voice_name}</Text>
              <View style={styles.modeBadge}>
                <Text style={styles.modeBadgeText}>
                  {getAlarmModeBadge(item.mode).emoji} {getAlarmModeBadge(item.mode).label}
                </Text>
              </View>
              <Text style={[styles.alarmMessage, !item.is_active && styles.textInactive]} numberOfLines={1}>
                "{item.message_text}"
              </Text>
            </View>
          </View>
          <Switch
            value={!!item.is_active}
            onValueChange={(value) => toggleMutation.mutate({ id: item.id, is_active: value })}
            trackColor={{
              false: Colors.light.border,
              true: Colors.light.primaryLight,
            }}
            thumbColor={item.is_active ? Colors.light.primary : '#f4f3f4'}
          />
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('alarms.title')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/alarm/create')}>
          <Text style={styles.addButtonText}>{t('alarms.add')}</Text>
        </TouchableOpacity>
      </View>

      {displayAlarms && displayAlarms.length > 0 && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('alarms.searchPlaceholder')}
            placeholderTextColor={Colors.light.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
      )}

      {countdownText && (
        <View style={styles.countdownBanner}>
          <Text style={styles.countdownLabel}>{t('alarms.nextIn')}</Text>
          <Text style={styles.countdownValue}>{countdownText}</Text>
        </View>
      )}

      {showingCached && (
        <View style={styles.cachedBanner}>
          <Text style={styles.cachedText}>{t('offline.cachedData')}</Text>
        </View>
      )}

      {isLoading && !cachedAlarms ? (
        <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 80 }} />
      ) : isError && !cachedAlarms ? (
        <ErrorView onRetry={refetch} />
      ) : filteredAlarms?.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>⏰</Text>
          <Text style={styles.emptyTitle}>{t('alarms.emptyTitle')}</Text>
          <Text style={styles.emptyDesc}>{t('alarms.emptyDesc')}</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.push('/alarm/create')}>
            <Text style={styles.emptyButtonText}>{t('alarms.emptyButton')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredAlarms}
          keyExtractor={(item) => item.id}
          renderItem={renderAlarm}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.light.text,
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.light.text,
  },
  countdownBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primaryLight + '33',
  },
  countdownLabel: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  countdownValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  cachedBanner: {
    backgroundColor: Colors.light.surfaceVariant,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  cachedText: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  list: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  alarmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  alarmCardInactive: {
    opacity: 0.6,
  },
  alarmLeft: {
    flex: 1,
  },
  alarmTime: {
    fontSize: 36,
    fontWeight: '300',
    color: Colors.light.text,
  },
  timeInactive: {
    color: Colors.light.textTertiary,
    textDecorationLine: 'line-through' as const,
  },
  textInactive: {
    color: Colors.light.textTertiary,
  },
  alarmSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  alarmRepeat: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  alarmCountdown: {
    fontSize: FontSize.xs,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  alarmMeta: {
    marginTop: Spacing.sm,
  },
  alarmVoice: {
    fontSize: FontSize.sm,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  alarmMessage: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  modeBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surfaceVariant,
  },
  modeBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  emptyDesc: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  swipeDeleteContainer: {
    backgroundColor: Colors.light.error,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  swipeDeleteText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: FontSize.md,
  },
});
