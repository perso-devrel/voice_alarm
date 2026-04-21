import { useEffect, useRef, useState } from 'react';
import EmailPasswordForm from './EmailPasswordForm';
import { useAuth } from '../hooks/useAuth';

declare const google:
  | {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    }
  | undefined;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export default function LoginPage() {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const { loginWithToken } = useAuth();
  const [googleError, setGoogleError] = useState<string | null>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => {
          loginWithToken(response.credential).catch((err: unknown) => {
            setGoogleError(err instanceof Error ? err.message : 'Google 로그인 실패');
          });
        },
      });
      if (googleButtonRef.current) {
        google?.accounts.id.renderButton(googleButtonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 320,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) document.body.removeChild(script);
    };
  }, [loginWithToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
      <div className="bg-[var(--color-surface)] rounded-3xl p-8 md:p-10 shadow-lg max-w-md w-full text-center transition-colors">
        <p className="text-6xl mb-4">🎙️</p>
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">VoiceAlarm</h1>
        <p className="text-[var(--color-text-secondary)] mb-6">
          소중한 사람의 목소리로
          <br />
          매일 따뜻한 메시지를 받아보세요
        </p>

        <EmailPasswordForm />

        <div className="flex items-center gap-3 my-6" aria-hidden="true">
          <div className="flex-1 h-px bg-[var(--color-border)]" />
          <span className="text-xs text-[var(--color-text-tertiary)]">또는</span>
          <div className="flex-1 h-px bg-[var(--color-border)]" />
        </div>

        <div className="flex flex-col items-center gap-3">
          {GOOGLE_CLIENT_ID ? (
            <div ref={googleButtonRef} />
          ) : (
            <div
              role="alert"
              className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-xs text-yellow-700 dark:text-yellow-400 text-left"
            >
              <p className="font-semibold mb-1">Google 로그인 비활성</p>
              <p>
                <code>VITE_GOOGLE_CLIENT_ID</code>가 설정되지 않았습니다. 이메일 로그인은 정상
                동작합니다.
              </p>
            </div>
          )}
          {googleError && (
            <p role="alert" className="text-sm text-red-500">
              {googleError}
            </p>
          )}
        </div>

        <p className="text-xs text-[var(--color-text-tertiary)] mt-6">
          로그인 시 이용약관 및 개인정보처리방침에 동의합니다.
        </p>
      </div>
    </div>
  );
}
