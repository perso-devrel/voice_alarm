import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize, FontFamily } from '../../src/constants/theme';
import { getAlarms, getMessages, getStats } from '../../src/services/api';
import type { Stats, WeekTrend } from '../../src/services/api';
import { playAudio, getLocalAudioPath, isAudioCached } from '../../src/services/audio';
import LoginButtons from '../../src/components/LoginButtons';
import EmailPasswordForm from '../../src/components/EmailPasswordForm';
import { useAppStore } from '../../src/stores/useAppStore';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import {
  cacheAlarms,
  getCachedAlarms,
  cacheMessages,
  getCachedMessages,
} from '../../src/services/offlineCache';
import { Audio } from 'expo-av';
import type { Alarm, Message } from '../../src/types';

function TrendBadge({ trend }: { trend: WeekTrend }) {
  const diff = trend.thisWeek - trend.lastWeek;
  if (trend.thisWeek === 0 && trend.lastWeek === 0) return null;
  const color = diff > 0 ? '#22c55e' : diff < 0 ? '#f87171' : Colors.light.textSecondary;
  const label = diff > 0 ? `+${diff} ↑` : diff < 0 ? `${diff} ↓` : '0';
  return <Text style={{ fontSize: FontSize.xs, color, marginTop: 2 }}>{label}</Text>;
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, setPlaying, currentPlayingId } = useAppStore();
  const isConnected = useNetworkStatus();
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [cachedAlarmsList, setCachedAlarmsList] = useState<Alarm[] | null>(null);
  const [cachedMessagesList, setCachedMessagesList] = useState<Message[] | null>(null);

  useEffect(() => {
    getCachedAlarms().then(setCachedAlarmsList);
    getCachedMessages().then(setCachedMessagesList);
  }, []);

  const {
    data: alarms,
    isLoading: alarmsLoading,
    refetch: refetchAlarms,
  } = useQuery({
    queryKey: ['alarms'],
    queryFn: getAlarms,
    enabled: isAuthenticated && isConnected,
  });

  const {
    data: messages,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['messages'],
    queryFn: () => getMessages(),
    enabled: isAuthenticated && isConnected,
  });

  const {
    data: stats,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: getStats,
    enabled: isAuthenticated && isConnected,
  });

  useEffect(() => {
    if (alarms && alarms.length > 0) {
      cacheAlarms(alarms);
      setCachedAlarmsList(alarms);
    }
  }, [alarms]);

  useEffect(() => {
    if (messages && messages.length > 0) {
      cacheMessages(messages);
      setCachedMessagesList(messages);
    }
  }, [messages]);

  const displayAlarms = alarms ?? cachedAlarmsList;
  const displayMessages = messages ?? cachedMessagesList;

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAlarms(), refetchMessages()]);
    setRefreshing(false);
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return { emoji: '🌙', text: t('greeting.night') };
    if (hour < 12) return { emoji: '🌅', text: t('greeting.morning') };
    if (hour < 17) return { emoji: '☀️', text: t('greeting.afternoon') };
    if (hour < 21) return { emoji: '🌆', text: t('greeting.evening') };
    return { emoji: '🌙', text: t('greeting.night') };
  };

  const greeting = getTimeGreeting();
  const nextAlarm = displayAlarms?.find((a: Alarm) => a.is_active);
  const latestMessage = displayMessages?.[0];

  const handlePlayMessage = async (messageId: string) => {
    if (currentSound) {
      await currentSound.unloadAsync();
      setCurrentSound(null);
    }

    if (currentPlayingId === messageId) {
      setPlaying(null);
      return;
    }

    const cached = await isAudioCached(messageId);
    if (cached) {
      const localPath = getLocalAudioPath(messageId);
      const sound = await playAudio(localPath);
      setCurrentSound(sound);
      setPlaying(messageId);

      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setPlaying(null);
          setCurrentSound(null);
        }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 인사말 */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {greeting.emoji} {greeting.text}
          </Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        </View>

        {isAuthenticated && (alarmsLoading || messagesLoading) && !refreshing && (
          <ActivityIndicator color={Colors.light.primary} style={{ marginVertical: Spacing.lg }} />
        )}

        {/* 요약 통계 */}
        {isAuthenticated && statsError && (
          <TouchableOpacity
            style={styles.statsErrorCard}
            onPress={() => refetchStats()}
            activeOpacity={0.7}
          >
            <Text style={styles.statsErrorText}>{t('common.loadError', '불러오기 실패')}</Text>
            <Text style={styles.statsErrorRetry}>{t('common.retry', '다시 시도')}</Text>
          </TouchableOpacity>
        )}
        {isAuthenticated && stats && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{stats.alarms.active}</Text>
              <Text style={styles.statLabel}>{t('home.activeAlarms', '활성 알람')}</Text>
              {stats.trends && <TrendBadge trend={stats.trends.alarms} />}
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{stats.messages.total}</Text>
              <Text style={styles.statLabel}>{t('home.messages', '메시지')}</Text>
              {stats.trends && <TrendBadge trend={stats.trends.messages} />}
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{stats.friends.total}</Text>
              <Text style={styles.statLabel}>{t('home.friends', '친구')}</Text>
              {stats.trends && <TrendBadge trend={stats.trends.friends} />}
            </View>
            {stats.gifts.receivedPending > 0 && (
              <TouchableOpacity
                style={styles.statItem}
                onPress={() => router.push('/gift/received')}
              >
                <Text style={[styles.statCount, { color: Colors.light.accent }]}>
                  {stats.gifts.receivedPending}
                </Text>
                <Text style={[styles.statLabel, { color: Colors.light.accent }]}>
                  {t('home.pendingGifts', '대기 선물')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 다음 알람 카드 */}
        <TouchableOpacity
          style={styles.nextAlarmCard}
          onPress={() =>
            nextAlarm
              ? router.push({ pathname: '/alarm/edit', params: { id: nextAlarm.id } })
              : router.push('/alarm/create')
          }
          activeOpacity={0.8}
        >
          <View style={styles.nextAlarmGradient}>
            <Text style={styles.nextAlarmLabel}>{t('home.nextAlarm')}</Text>
            {nextAlarm ? (
              <>
                <Text style={styles.nextAlarmTime}>{nextAlarm.time}</Text>
                <Text style={styles.nextAlarmMessage}>
                  🗣️ {nextAlarm.voice_name}: "{nextAlarm.message_text}"
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.nextAlarmTime}>--:--</Text>
                <Text style={styles.nextAlarmMessage}>{t('home.noAlarm')}</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* 오늘의 응원 메시지 */}
        {latestMessage && (
          <TouchableOpacity
            style={styles.cheerCard}
            onPress={() => handlePlayMessage(latestMessage.id)}
            activeOpacity={0.8}
          >
            <View style={styles.cheerHeader}>
              <Text style={styles.cheerEmoji}>💌</Text>
              <Text style={styles.cheerTitle}>{t('home.todayMessage')}</Text>
            </View>
            <Text style={styles.cheerText}>"{latestMessage.text}"</Text>
            <View style={styles.cheerFooter}>
              <Text style={styles.cheerVoice}>— {latestMessage.voice_name}</Text>
              <Text style={styles.playButton}>
                {currentPlayingId === latestMessage.id
                  ? `⏸️ ${t('home.pause')}`
                  : `▶️ ${t('home.play')}`}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 빠른 액션 */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>{t('home.quickStart')}</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/voice/record')}
            >
              <Text style={styles.actionEmoji}>🎙️</Text>
              <Text style={styles.actionLabel}>{t('home.recordVoice')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/voice/upload')}
            >
              <Text style={styles.actionEmoji}>📁</Text>
              <Text style={styles.actionLabel}>{t('home.uploadFile')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/message/create')}
            >
              <Text style={styles.actionEmoji}>✏️</Text>
              <Text style={styles.actionLabel}>{t('home.writeMessage')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/alarm/create')}
            >
              <Text style={styles.actionEmoji}>⏰</Text>
              <Text style={styles.actionLabel}>{t('home.addAlarm')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/gift/received')}
            >
              <Text style={styles.actionEmoji}>🎁</Text>
              <Text style={styles.actionLabel}>{t('home.receivedGifts')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/friends')}
            >
              <Text style={styles.actionEmoji}>👥</Text>
              <Text style={styles.actionLabel}>{t('home.manageFriends')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 비로그인 상태 안내 */}
        {!isAuthenticated && (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginEmoji}>🔐</Text>
            <Text style={styles.loginTitle}>{t('home.loginTitle')}</Text>
            <Text style={styles.loginDesc}>{t('home.loginDesc')}</Text>
            <EmailPasswordForm />
            <View style={styles.loginDivider}>
              <View style={styles.loginDividerLine} />
              <Text style={styles.loginDividerText}>또는</Text>
              <View style={styles.loginDividerLine} />
            </View>
            <LoginButtons />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  statCount: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.light.primary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  greeting: {
    fontSize: FontSize.hero,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: Colors.light.textSecondary,
  },
  nextAlarmCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  nextAlarmGradient: {
    backgroundColor: Colors.light.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  nextAlarmLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FontFamily.semibold,
    marginBottom: Spacing.xs,
  },
  nextAlarmTime: {
    fontSize: 48,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  nextAlarmMessage: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.9)',
  },
  cheerCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cheerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cheerEmoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  cheerTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },
  cheerText: {
    fontSize: FontSize.lg,
    color: Colors.light.text,
    lineHeight: 26,
    marginBottom: Spacing.md,
  },
  cheerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cheerVoice: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  playButton: {
    fontSize: FontSize.sm,
    color: Colors.light.primary,
    fontFamily: FontFamily.semibold,
  },
  quickActions: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    width: '47%',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: Colors.light.text,
  },
  loginPrompt: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loginEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  loginTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  loginDesc: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  loginDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
    width: '100%',
  },
  loginDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  loginDividerText: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
  },
  statsErrorCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f8717133',
  },
  statsErrorText: {
    fontSize: FontSize.sm,
    color: '#f87171',
    fontFamily: FontFamily.semibold,
  },
  statsErrorRetry: {
    fontSize: FontSize.xs,
    color: Colors.light.primary,
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
  },
});
