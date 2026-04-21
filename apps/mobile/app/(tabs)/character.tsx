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
import type { XpEvent } from '../../src/services/api';
import {
  formatProgress,
  pickRandomDialogue,
  progressBarWidthPct,
  shouldShowStageTransition,
  stageToEmoji,
  stageToLabel,
} from '../../src/lib/character';
import { Colors, Spacing, BorderRadius, FontSize } from '../../src/constants/theme';

const DEV_EVENTS: { event: XpEvent; label: string }[] = [
  { event: 'alarm_completed', label: '알람 정상 종료 +30 XP' },
  { event: 'alarm_snoozed', label: '스누즈 +5 XP' },
  { event: 'family_alarm_received', label: '가족 알람 수신 +10 XP' },
];

export default function CharacterScreen() {
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
      const suffix = res.grant.capped ? ' (일일 캡 도달)' : '';
      setLastGrantNotice(`+${res.grant.granted_xp} XP · +${res.grant.affection} 애정도${suffix}`);
      queryClient.invalidateQueries({ queryKey: ['character-me'] });
    },
    onError: () => {
      setLastGrantNotice('XP 지급 실패');
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>캐릭터를 불러오지 못했어요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { character, progress } = data;
  const barWidth = progressBarWidthPct(progress);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>내 캐릭터</Text>
        <Text style={styles.headerSubtitle}>알람을 잘 들을수록 캐릭터가 자라요.</Text>

        <Pressable
          onPress={handleTap}
          style={styles.characterCard}
          accessibilityRole="button"
          accessibilityLabel="캐릭터를 탭하면 새 대사가 나와요"
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

        <View style={styles.section}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>성장 진행도</Text>
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
            accessibilityLabel="경험치 진행도"
          >
            <View style={[styles.progressBarFill, { width: `${barWidth}%` }]} />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>총 XP</Text>
              <Text style={styles.statValue}>{character.xp}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>애정도</Text>
              <Text style={styles.statValue}>💗 {character.affection}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>오늘 획득</Text>
              <Text style={styles.statValue}>{character.daily_xp} / 200</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>테스트용 XP 지급</Text>
          <Text style={styles.devHint}>
            실제 앱에서는 알람 종료/가족 알람 수신 시 자동으로 호출돼요.
          </Text>
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
    paddingBottom: Spacing.xxl,
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
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.light.textTertiary,
    marginBottom: Spacing.lg,
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
    fontWeight: '700',
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
    fontWeight: '600',
  },
  dialogue: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
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
    fontWeight: '600',
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
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.light.text,
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
    fontWeight: '600',
  },
  grantNotice: {
    marginTop: Spacing.md,
    fontSize: FontSize.xs,
    color: Colors.light.textSecondary,
  },
});
