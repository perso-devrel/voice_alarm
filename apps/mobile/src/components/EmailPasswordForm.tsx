import { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useAppStore } from '../stores/useAppStore';
import { BorderRadius, FontSize, Spacing, FontFamily } from '../constants/theme';
import { useTheme, type ThemeColors } from '../hooks/useTheme';
import { validateEmailPasswordForm, type AuthMode } from '../lib/authFormValidation';

export type Mode = AuthMode;

export interface EmailPasswordFormProps {
  defaultMode?: Mode;
  onSuccess?: () => void;
}

export default function EmailPasswordForm({
  defaultMode = 'login',
  onSuccess,
}: EmailPasswordFormProps) {
  const { login, register, isLoading, token, user: authUser } = useAuth();
  const setAppAuth = useAppStore((s) => s.setAuth);
  const { colors } = useTheme();
  const dynStyles = useMemo(() => createStyles(colors), [colors]);

  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  useEffect(() => {
    if (token && authUser) {
      setAppAuth(token, authUser.id);
    }
  }, [token, authUser, setAppAuth]);

  async function handleSubmit() {
    setSubmitError(null);
    const err = validateEmailPasswordForm({ mode, email, password, name });
    if (err) {
      setSubmitError(err);
      return;
    }
    try {
      if (isRegister) await register(email, password, name);
      else await login(email, password);
      onSuccess?.();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : '요청 처리 중 오류가 발생했습니다.');
    }
  }

  return (
    <View style={dynStyles.container} accessibilityLabel="이메일 로그인">
      <View style={dynStyles.tabRow}>
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === 'login' }}
          onPress={() => setMode('login')}
          style={[dynStyles.tab, mode === 'login' && dynStyles.tabActive]}
        >
          <Text style={[dynStyles.tabText, mode === 'login' && dynStyles.tabTextActive]}>로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === 'register' }}
          onPress={() => setMode('register')}
          style={[dynStyles.tab, mode === 'register' && dynStyles.tabActive]}
        >
          <Text style={[dynStyles.tabText, mode === 'register' && dynStyles.tabTextActive]}>
            가입하기
          </Text>
        </TouchableOpacity>
      </View>

      {isRegister && (
        <View style={dynStyles.field}>
          <Text style={dynStyles.label}>이름</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="홍길동"
            placeholderTextColor={colors.textTertiary}
            autoComplete="name"
            style={dynStyles.input}
            accessibilityLabel="이름"
          />
        </View>
      )}

      <View style={dynStyles.field}>
        <Text style={dynStyles.label}>이메일</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={colors.textTertiary}
          autoComplete="email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={dynStyles.input}
          accessibilityLabel="이메일"
        />
      </View>

      <View style={dynStyles.field}>
        <Text style={dynStyles.label}>비밀번호</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={isRegister ? '8자 이상' : '비밀번호'}
          placeholderTextColor={colors.textTertiary}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          secureTextEntry
          style={dynStyles.input}
          accessibilityLabel="비밀번호"
        />
      </View>

      {submitError && (
        <Text style={dynStyles.errorText} accessibilityRole="alert">
          {submitError}
        </Text>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isLoading}
        style={[dynStyles.submitButton, isLoading && dynStyles.submitButtonDisabled]}
        accessibilityRole="button"
        accessibilityLabel={isRegister ? '가입하기' : '로그인'}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={dynStyles.submitText}>{isRegister ? '가입하기' : '로그인'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      width: '100%',
      gap: Spacing.sm,
    },
    tabRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: colors.surfaceVariant,
    },
    tabText: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.primary,
      fontFamily: FontFamily.semibold,
    },
    field: {
      gap: 4,
    },
    label: {
      fontSize: FontSize.xs,
      color: colors.textSecondary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      color: colors.text,
      backgroundColor: colors.surface,
      fontSize: FontSize.md,
    },
    errorText: {
      color: colors.error,
      fontSize: FontSize.sm,
    },
    submitButton: {
      marginTop: Spacing.xs,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitText: {
      color: '#FFFFFF',
      fontSize: FontSize.md,
      fontFamily: FontFamily.semibold,
    },
  });
}
