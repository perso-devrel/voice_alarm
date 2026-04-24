import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCharacterMe,
  grantCharacterXp,
} from '../../src/services/api';
import type { XpEvent, StreakAchievement, CharacterStats } from '../../src/services/api';
import {
  formatProgress,
  pickRandomDialogue,
  progressBarWidthPct,
  shouldShowStageTransition,
  stageToEmoji,
  stageToLabel,
} from '../../src/lib/character';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, BorderRadius, FontSize, FontFamily } from '../../src/constants/theme';

const DEV_EVENTS: { event: XpEvent; label: string }[] = [
  { event: 'alarm_completed', label: '알람 정상 종료 +30 XP' },
  { event: 'alarm_snoozed', label: '스누즈 +5 XP' },
  { event: 'family_alarm_received', label: '가족 알람 수신 +10 XP' },
];

const MILESTONES = [7, 30, 90] as const;

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
  return (
    <View style={styles.statBarRow}>
      <Text style={styles.statBarLabel}>{label}</Text>
      <View style={styles.statBarTrack}>
        <View style={[styles.statBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.statBarValue}>{value}</Text>
    </View>
  );
}

function MilestoneBadge({ milestone, achieved }: { milestone: number; achieved: boolean }) {
  const emoji = milestone === 7 ? '🌱' : milestone === 30 ? '🌳' : '🌸';
  return (
    <View style={[styles.milestoneBadge, achieved && styles.milestoneBadgeAchieved]}>
      <Text style={styles.milestoneEmoji}>{emoji}</Text>
      <Text style={[styles.milestoneDay, achieved && styles.milestoneDayAchieved]}>
        {milestone}
      </Text>
    </View>
  );
}

export default function CharacterScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogueSeed, setDialogueSeed] = useState(0);
  const [lastGrantNotice, setLastGrantNotice] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['character-me'],
    queryFn: getCharacterMe,
  });

  const grantMutation = useMutation({
    mutationFn: grantCharacterXp,
    onSuccess: (res) => {
      const suffix = res.grant.capped ? ` (${t('character.capReached')})` : '';
      setLastGrantNotice(`+${res.grant.granted_xp} XP · +${res.grant.affection} ${t('character.affection')}${suffix}`);
      queryClient.invalidateQueries({ queryKey: ['character-me'] });
    },
    onError: () => {
      setLastGrantNotice(t('character.xpFailed'));
    },
  });

  const stage = data?.character.stage ?? 'seed';
  const prevStageRef = useRef(stage);
  const emojiScale = useRef(new Animated.Value(1)).current;
  const emojiOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (shouldShowStageTransition(prevStageRef.current, stage)) {
      emojiScale.setValue(0.3);
      emojiOpacity.setValue(0);
      Animated.sequence([
        Animated.parallel([
          Animated.spring(emojiScale, { toValue: 1.2, useNativeDriver: true, speed: 12 }),
          Animated.timing(emojiOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
        Animated.spring(emojiScale, { toValue: 1, useNativeDriver: true, speed: 14 }),
      ]).start();
    }
    prevStageRef.current = stage;
  }, [stage, emojiScale, emojiOpacity]);

  const dialogue = useMemo(
    () => pickRandomDialogue(stage, () => ((dialogueSeed * 9301 + 49297) % 233280) / 233280),
    [stage, dialogueSeed],
  );

  const handleTap = useCallback(() => {
    setDialogueSeed((n) => n + 1);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('character.loadError')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { character, progress, streak, stats, achievements } = data;
  const barWidth = progressBarWidthPct(progress);
  const achievedMilestones = new Set(achievements.map((a: StreakAchievement) => a.milestone));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable
          onPress={handleTap}
          style={styles.characterCard}
          accessibilityRole="button"
          accessibilityLabel={t('character.tapHint')}
        >
          <Animated.Text
            style={[styles.emoji, { transform: [{ scale: emojiScale }], opacity: emojiOpacity }]}
          >
            {stageToEmoji(character.stage)}
          </Animated.Text>
          <View style={styles.nameRow}>
            <Text style={styles.characterName}>{character.name}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                Lv.{character.level} · {stageToLabel(character.stage)}
              </Text>
            </View>
          </View>
          <Text style={styles.dialogue}>{dialogue}</Text>
        </Pressable>

        {/* Streak badge */}
        <View style={styles.streakCard}>
          <View style={styles.streakMain}>
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={styles.streakCount}>{streak.current}</Text>
            <Text style={styles.streakLabel}>{t('character.streakDays')}</Text>
          </View>
          <View style={styles.streakMeta}>
            <Text style={styles.streakBest}>
              {t('character.longestStreak')}: {streak.longest}{t('character.dayUnit')}
            </Text>
          </View>
          {/* Milestone badges */}
          <View style={styles.milestoneRow}>
            {MILESTONES.map((m) => (
              <MilestoneBadge key={m} milestone={m} achieved={achievedMilestones.has(m)} />
            ))}
          </View>
        </View>

        {/* Growth progress */}
        <View style={styles.section}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>{t('character.growthProgress')}</Text>
            <Text style={styles.progressText}>{formatProgress(progress)}</Text>
          </View>
          <View
            style={styles.progressBarBg}
            accessibilityRole="progressbar"
            accessibilityValue={{
              min: 0,
              max: 100,
              now: Math.round(barWidth),
            }}
            accessibilityLabel={t('character.xpProgress')}
          >
            <View style={[styles.progressBarFill, { width: `${barWidth}%` }]} />
          </View>
          <View style={styles.xpStatsRow}>
            <View style={styles.xpStatItem}>
              <Text style={styles.xpStatLabel}>{t('character.totalXp')}</Text>
              <Text style={styles.xpStatValue}>{character.xp}</Text>
            </View>
            <View style={styles.xpStatItem}>
              <Text style={styles.xpStatLabel}>{t('character.affection')}</Text>
              <Text style={styles.xpStatValue}>💗 {character.affection}</Text>
            </View>
            <View style={styles.xpStatItem}>
              <Text style={styles.xpStatLabel}>{t('character.todayXp')}</Text>
              <Text style={styles.xpStatValue}>{character.daily_xp} / 200</Text>
            </View>
          </View>
        </View>

        {/* Character stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('character.statsTitle')}</Text>
          <View style={styles.statBarsContainer}>
            <StatBar
              label={t('character.statDiligence')}
              value={stats.diligence}
              max={Math.max(stats.diligence, stats.health, stats.consistency, 10)}
              color="#8B5E3C"
            />
            <StatBar
              label={t('character.statHealth')}
              value={stats.health}
              max={Math.max(stats.diligence, stats.health, stats.consistency, 10)}
              color={Colors.light.success}
            />
            <StatBar
              label={t('character.statConsistency')}
              value={stats.consistency}
              max={Math.max(stats.diligence, stats.health, stats.consistency, 10)}
              color={Colors.light.primary}
            />
          </View>
        </View>

        {__DEV__ && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('character.devXpTitle')}</Text>
          <Text style={styles.devHint}>{t('character.devXpHint')}</Text>
          <View style={styles.devButtonsRow}>
            {DEV_EVENTS.map((e) => (
              <Pressable
                key={e.event}
                onPress={() => grantMutation.mutate({ event: e.event })}
                disabled={grantMutation.isPending}
                style={[styles.devButton, grantMutation.isPending && styles.devButtonDisabled]}
              >
                <Text style={styles.devButtonText}>{e.label}</Text>
              </Pressable>
            ))}
          </View>
          {lastGrantNotice && (
            <Text style={styles.grantNotice} accessibilityRole="text">
              {lastGrantNotice}
            </Text>
          )}
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  characterCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emoji: {
    fontSize: 72,
    marginBottom: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  characterName: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },
  badge: {
    backgroundColor: `${Colors.light.primary}20`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: FontSize.xs,
    color: Colors.light.primary,
    fontFamily: FontFamily.semibold,
  },
  dialogue: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  streakCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  streakMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  streakFire: {
    fontSize: 28,
  },
  streakCount: {
    fontSize: 36,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },
  streakLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: Colors.light.textSecondary,
  },
  streakMeta: {
    marginTop: Spacing.xs,
  },
  streakBest: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  milestoneBadge: {
    alignItems: 'center',
    opacity: 0.35,
  },
  milestoneBadgeAchieved: {
    opacity: 1,
  },
  milestoneEmoji: {
    fontSize: 28,
  },
  milestoneDay: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  milestoneDayAchieved: {
    color: Colors.light.primary,
  },
  section: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: Colors.light.text,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  progressText: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.full,
  },
  xpStatsRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  xpStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  xpStatLabel: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
    marginBottom: 2,
  },
  xpStatValue: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },
  statBarsContainer: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  statBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statBarLabel: {
    fontSize: FontSize.xs,
    color: Colors.light.textSecondary,
    width: 80,
  },
  statBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  statBarValue: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: Colors.light.text,
    width: 30,
    textAlign: 'right',
  },
  devHint: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  devButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  devButton: {
    backgroundColor: `${Colors.light.primary}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  devButtonDisabled: {
    opacity: 0.5,
  },
  devButtonText: {
    fontSize: FontSize.xs,
    color: Colors.light.primary,
    fontFamily: FontFamily.semibold,
  },
  grantNotice: {
    marginTop: Spacing.md,
    fontSize: FontSize.xs,
    color: Colors.light.textSecondary,
  },
});
