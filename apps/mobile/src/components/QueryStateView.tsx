import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Spacing, FontSize, BorderRadius, FontFamily } from '../constants/theme';
import { useTheme, type ThemeColors } from '../hooks/useTheme';

export function LoadingView() {
  const { colors } = useTheme();
  return (
    <View style={staticStyles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const dynStyles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={staticStyles.center}>
      <Text style={staticStyles.emoji}>⚠️</Text>
      <Text style={dynStyles.title}>{t('common.loadError')}</Text>
      {message && <Text style={dynStyles.subtitle}>{message}</Text>}
      {onRetry && (
        <TouchableOpacity style={dynStyles.retryBtn} onPress={onRetry}>
          <Text style={dynStyles.retryText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function EmptyView({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
}) {
  const { colors } = useTheme();
  const dynStyles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={staticStyles.center}>
      <Text style={staticStyles.emoji}>{emoji}</Text>
      <Text style={dynStyles.title}>{title}</Text>
      {subtitle && <Text style={dynStyles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const staticStyles = StyleSheet.create({
  center: {
    alignItems: 'center',
    paddingTop: Spacing.xxl * 2,
    paddingHorizontal: Spacing.lg,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
});

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    title: {
      fontSize: FontSize.lg,
      color: colors.text,
      fontFamily: FontFamily.semibold,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
      textAlign: 'center',
    },
    retryBtn: {
      marginTop: Spacing.md,
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
    },
    retryText: {
      color: '#FFF',
      fontFamily: FontFamily.semibold,
      fontSize: FontSize.md,
    },
  });
}
