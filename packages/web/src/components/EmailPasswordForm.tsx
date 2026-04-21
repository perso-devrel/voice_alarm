import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';

type Mode = 'login' | 'register';

export interface EmailPasswordFormProps {
  defaultMode?: Mode;
  onSuccess?: () => void;
}

export default function EmailPasswordForm({
  defaultMode = 'login',
  onSuccess,
}: EmailPasswordFormProps) {
  const { login, register, isLoading } = useAuth();

  const [mode, setMode] = useState<Mode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isRegister = mode === 'register';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!email || !password || (isRegister && !name)) {
      setSubmitError('모든 필드를 입력해주세요.');
      return;
    }
    if (isRegister && password.length < 8) {
      setSubmitError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    try {
      if (isRegister) await register(email, password, name);
      else await login(email, password);
      onSuccess?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '요청 처리 중 오류가 발생했습니다.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full" aria-label="이메일 로그인">
      <div className="flex gap-2 text-sm" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'login'}
          onClick={() => setMode('login')}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            mode === 'login'
              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
              : 'text-[var(--color-text-secondary)]'
          }`}
        >
          로그인
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'register'}
          onClick={() => setMode('register')}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            mode === 'register'
              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
              : 'text-[var(--color-text-secondary)]'
          }`}
        >
          가입하기
        </button>
      </div>

      {isRegister && (
        <label className="flex flex-col gap-1 text-left">
          <span className="text-xs text-[var(--color-text-secondary)]">이름</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
            autoComplete="name"
            required
          />
        </label>
      )}

      <label className="flex flex-col gap-1 text-left">
        <span className="text-xs text-[var(--color-text-secondary)]">이메일</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
          autoComplete="email"
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-left">
        <span className="text-xs text-[var(--color-text-secondary)]">비밀번호</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isRegister ? '8자 이상' : '비밀번호'}
          className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          required
        />
      </label>

      {submitError && (
        <p role="alert" className="text-sm text-red-500">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="mt-1 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold disabled:opacity-60"
      >
        {isLoading ? '처리 중…' : isRegister ? '가입하기' : '로그인'}
      </button>
    </form>
  );
}
