import { Component, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontFamily } from '../constants/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} accessibilityRole="alert">
          <Text style={styles.emoji}>😵</Text>
          <Text style={styles.title}>문제가 발생했습니다</Text>
          <Text style={styles.subtitle}>앱을 다시 시도해 주세요</Text>
          {this.state.errorMessage && (
            <Text style={styles.detail} numberOfLines={3}>
              {this.state.errorMessage}
            </Text>
          )}
          <Pressable
            onPress={this.handleRetry}
            style={styles.retryButton}
            accessibilityRole="button"
            accessibilityLabel="다시 시도"
          >
            <Text style={styles.retryText}>다시 시도</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.light.background,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  detail: {
    fontSize: FontSize.xs,
    color: Colors.light.textTertiary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
  },
});
