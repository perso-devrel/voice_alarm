export type AuthMode = 'login' | 'register';

export interface EmailPasswordFormValues {
  mode: AuthMode;
  email: string;
  password: string;
  name: string;
}

export function validateEmailPasswordForm(values: EmailPasswordFormValues): string | null {
  const { mode, email, password, name } = values;
  if (!email.trim() || !password) return '모든 필드를 입력해주세요.';
  if (mode === 'register' && !name.trim()) return '모든 필드를 입력해주세요.';
  if (mode === 'register' && password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다.';
  return null;
}
