import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { resolveStateView, type StateViewVariant } from '../lib/stateView';
import { Colors, Spacing, BorderRadius, FontSize, FontFamily } from '../constants/theme';

interface StateViewProps {
  variant: StateViewVariant;
  emoji?: string;
  title?: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export function StateView({ variant, emoji, title, subtitle, action }: StateViewProps) {
  const cfg = resolveStateView(variant, { emoji, title, subtitle });

  return (
    <View
      style={styles.container}
      accessibilityRole={variant === 'error' ? 'alert' : 'none'}
    >
      {variant === 'loading' ? (
        <ActivityIndicator size="large" color={Colors.light.primary} style={styles.spinner} />
      ) : (
        <Text style={styles.emoji}>{cfg.emoji}</Text>
      )}
      <Text style={styles.title}>{cfg.title}</Text>
      {cfg.subtitle ? (
        <Text style={styles.subtitle}>{cfg.subtitle}</Text>
      ) : null}
      {action && (
        <Pressable
          onPress={action.onPress}
          style={styles.actionButton}
          accessibilityRole="button"
        >
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    padding: Spacing.lg,
  },
  spinner: {
    marginBottom: Spacing.md,
  },
  emoji: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
  },
});
