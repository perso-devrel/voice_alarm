import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

function usePulse() {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return opacity;
}

function SkeletonRow() {
  const opacity = usePulse();
  return (
    <View style={styles.card}>
      <Animated.View style={[styles.avatar, { opacity }]} />
      <View style={styles.info}>
        <Animated.View style={[styles.namePlaceholder, { opacity }]} />
        <Animated.View style={[styles.emailPlaceholder, { opacity }]} />
      </View>
      <Animated.View style={[styles.actionPlaceholder, { opacity }]} />
    </View>
  );
}

interface Props {
  count?: number;
}

export function PeopleSkeletonCard({ count = 3 }: Props) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.surfaceVariant,
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
    gap: Spacing.xs + 2,
  },
  namePlaceholder: {
    width: 100,
    height: 14,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.surfaceVariant,
  },
  emailPlaceholder: {
    width: 150,
    height: 12,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.surfaceVariant,
  },
  actionPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceVariant,
  },
});
