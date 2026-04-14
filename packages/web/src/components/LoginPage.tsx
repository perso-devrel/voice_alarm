import { useEffect, useRef } from 'react';

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

interface LoginPageProps {
  onLogin: (idToken: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => {
          onLogin(response.credential);
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
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="bg-[var(--color-surface)] rounded-3xl p-12 shadow-lg max-w-md w-full text-center transition-colors">
        <p className="text-6xl mb-6">🎙️</p>
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">VoiceAlarm</h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          소중한 사람의 목소리로
          <br />
          매일 따뜻한 메시지를 받아보세요
        </p>

        <div className="flex flex-col items-center gap-4">
          <div ref={googleButtonRef} />

          {!GOOGLE_CLIENT_ID && (
            <div
              role="alert"
              className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-sm text-yellow-700 dark:text-yellow-400"
            >
              <p className="font-semibold mb-1">Google Client ID 필요</p>
              <p>
                <code>packages/web/src/components/LoginPage.tsx</code>에서
                <br />
                <code>GOOGLE_CLIENT_ID</code>를 설정해주세요.
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-[var(--color-text-tertiary)] mt-8">
          로그인 시 이용약관 및 개인정보처리방침에 동의합니다.
        </p>
      </div>
    </div>
  );
}
