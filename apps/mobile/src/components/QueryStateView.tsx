import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={Colors.light.primary} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>⚠️</Text>
      <Text style={styles.title}>데이터를 불러올 수 없습니다</Text>
      {message && <Text style={styles.subtitle}>{message}</Text>}
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function EmptyView({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    paddingTop: Spacing.xxl * 2,
    paddingHorizontal: Spacing.lg,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    color: Colors.light.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: FontSize.md,
  },
});
