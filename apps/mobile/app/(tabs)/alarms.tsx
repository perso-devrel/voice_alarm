import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
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

function getNextFireMs(alarm: Alarm): number | null {
  if (!alarm.is_active) return null;
  const [h, m] = alarm.time.split(':').map(Number);
  const days: number[] = JSON.parse(alarm.repeat_days || '[]');
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
  const isConnected = useNetworkStatus();
  const [cachedAlarms, setCachedAlarms] = useState<Alarm[] | null>(null);
  const [countdownText, setCountdownText] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    getCachedAlarms().then(setCachedAlarms);
  }, []);

  const {
    data: alarms,
    isLoading,
    isError,
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
      Alert.alert(t('common.error'), getApiErrorMessage(err, t('alarms.toggleError')));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlarm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
      resyncNotifications();
    },
    onError: (err: unknown) => {
      Alert.alert(t('common.error'), getApiErrorMessage(err, t('alarms.deleteError')));
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
    if (JSON.stringify(days.sort()) === JSON.stringify([1, 2, 3, 4, 5])) return t('alarms.weekday');
    if (JSON.stringify(days.sort()) === JSON.stringify([0, 6])) return t('alarms.weekend');
    return days.map((d) => DAYS_OF_WEEK[d]).join(', ');
  };

  const renderAlarm = ({ item }: { item: Alarm }) => {
    const repeatDays = JSON.parse(item.repeat_days || '[]');
    void tick;
    const nextFireMs = getNextFireMs(item);
    const perAlarmCountdown = nextFireMs !== null ? formatCountdown(nextFireMs) : null;
    return (
      <TouchableOpacity
        style={[styles.alarmCard, !item.is_active && styles.alarmCardInactive]}
        onLongPress={() => handleDelete(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.alarmLeft}>
          <Text style={[styles.alarmTime, !item.is_active && styles.textInactive]}>
            {item.time}
          </Text>
          <View style={styles.alarmSubRow}>
            <Text style={[styles.alarmRepeat, !item.is_active && styles.textInactive]}>
              {formatRepeatDays(repeatDays)}
            </Text>
            {perAlarmCountdown && (
              <Text style={styles.alarmCountdown}>{perAlarmCountdown}</Text>
            )}
          </View>
          <View style={styles.alarmMeta}>
            <Text style={styles.alarmVoice}>🗣️ {item.voice_name}</Text>
            <Text style={styles.alarmMessage} numberOfLines={1}>
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
      ) : displayAlarms?.length === 0 ? (
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
          data={displayAlarms}
          keyExtractor={(item) => item.id}
          renderItem={renderAlarm}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
});
