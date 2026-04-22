import { useEffect, useState } from 'react';
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
import { BorderRadius, Colors, FontSize, Spacing } from '../constants/theme';
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
    <View style={styles.container} accessibilityLabel="이메일 로그인">
      <View style={styles.tabRow}>
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === 'login' }}
          onPress={() => setMode('login')}
          style={[styles.tab, mode === 'login' && styles.tabActive]}
        >
          <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>로그인</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === 'register' }}
          onPress={() => setMode('register')}
          style={[styles.tab, mode === 'register' && styles.tabActive]}
        >
          <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
            가입하기
          </Text>
        </TouchableOpacity>
      </View>

      {isRegister && (
        <View style={styles.field}>
          <Text style={styles.label}>이름</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="홍길동"
            placeholderTextColor={Colors.light.textTertiary}
            autoComplete="name"
            style={styles.input}
            accessibilityLabel="이름"
          />
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>이메일</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={Colors.light.textTertiary}
          autoComplete="email"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
          accessibilityLabel="이메일"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder={isRegister ? '8자 이상' : '비밀번호'}
          placeholderTextColor={Colors.light.textTertiary}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          secureTextEntry
          style={styles.input}
          accessibilityLabel="비밀번호"
        />
      </View>

      {submitError && (
        <Text style={styles.errorText} accessibilityRole="alert">
          {submitError}
        </Text>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isLoading}
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        accessibilityRole="button"
        accessibilityLabel={isRegister ? '가입하기' : '로그인'}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitText}>{isRegister ? '가입하기' : '로그인'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: Colors.light.surfaceVariant,
  },
  tabText: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  field: {
    gap: 4,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.light.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
    fontSize: FontSize.md,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: FontSize.sm,
  },
  submitButton: {
    marginTop: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
