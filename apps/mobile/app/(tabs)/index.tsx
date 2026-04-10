import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';
import { getAlarms, getMessages } from '../../src/services/api';
import { playAudio, getLocalAudioPath, isAudioCached } from '../../src/services/audio';
import LoginButtons from '../../src/components/LoginButtons';
import { useAppStore } from '../../src/stores/useAppStore';
import { Audio } from 'expo-av';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, hasCompletedOnboarding, setPlaying, currentPlayingId } = useAppStore();
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (mounted && !hasCompletedOnboarding) {
      router.replace('/onboarding');
    }
  }, [mounted, hasCompletedOnboarding]);

  const {
    data: alarms,
    isLoading: alarmsLoading,
    refetch: refetchAlarms,
  } = useQuery({
    queryKey: ['alarms'],
    queryFn: getAlarms,
    enabled: isAuthenticated,
  });

  const {
    data: messages,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['messages'],
    queryFn: () => getMessages(),
    enabled: isAuthenticated,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAlarms(), refetchMessages()]);
    setRefreshing(false);
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return { emoji: '🌙', text: '좋은 밤이에요' };
    if (hour < 12) return { emoji: '🌅', text: '좋은 아침이에요' };
    if (hour < 17) return { emoji: '☀️', text: '좋은 오후에요' };
    if (hour < 21) return { emoji: '🌆', text: '좋은 저녁이에요' };
    return { emoji: '🌙', text: '좋은 밤이에요' };
  };

  const greeting = getTimeGreeting();
  const nextAlarm = alarms?.find((a: any) => a.is_active);
  const latestMessage = messages?.[0];

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
          <Text style={styles.subtitle}>소중한 사람의 목소리가 기다리고 있어요</Text>
        </View>

        {/* 다음 알람 카드 */}
        <TouchableOpacity
          style={styles.nextAlarmCard}
          onPress={() => router.push('/(tabs)/alarms')}
          activeOpacity={0.8}
        >
          <View style={styles.nextAlarmGradient}>
            <Text style={styles.nextAlarmLabel}>다음 알람</Text>
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
                <Text style={styles.nextAlarmMessage}>아직 설정된 알람이 없어요</Text>
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
              <Text style={styles.cheerTitle}>오늘의 메시지</Text>
            </View>
            <Text style={styles.cheerText}>"{latestMessage.text}"</Text>
            <View style={styles.cheerFooter}>
              <Text style={styles.cheerVoice}>— {latestMessage.voice_name}</Text>
              <Text style={styles.playButton}>
                {currentPlayingId === latestMessage.id ? '⏸️ 일시정지' : '▶️ 재생'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* 빠른 액션 */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>빠른 시작</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/voice/record')}
            >
              <Text style={styles.actionEmoji}>🎙️</Text>
              <Text style={styles.actionLabel}>음성 녹음</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/voice/upload')}
            >
              <Text style={styles.actionEmoji}>📁</Text>
              <Text style={styles.actionLabel}>파일 업로드</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/message/create')}
            >
              <Text style={styles.actionEmoji}>✏️</Text>
              <Text style={styles.actionLabel}>메시지 작성</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/alarm/create')}
            >
              <Text style={styles.actionEmoji}>⏰</Text>
              <Text style={styles.actionLabel}>알람 추가</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 비로그인 상태 안내 */}
        {!isAuthenticated && (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginEmoji}>🔐</Text>
            <Text style={styles.loginTitle}>로그인하고 시작하세요</Text>
            <Text style={styles.loginDesc}>
              소중한 사람의 목소리를 등록하고{'\n'}매일 따뜻한 메시지를 받아보세요
            </Text>
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
  greeting: {
    fontSize: FontSize.hero,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
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
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  nextAlarmTime: {
    fontSize: 48,
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '600',
  },
  quickActions: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
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
    fontWeight: '600',
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
    fontWeight: '700',
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
  loginButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
