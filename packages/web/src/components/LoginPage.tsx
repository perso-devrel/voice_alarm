import { useEffect, useRef } from 'react';

declare const google: {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
} | undefined;

// Google Cloud Console에서 생성한 Web Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

interface LoginPageProps {
  onLogin: (idToken: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Google Identity Services 스크립트 로드
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
        google?.accounts.id.renderButton(
          googleButtonRef.current,
          {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 320,
          }
        );
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF5F3]">
      <div className="bg-white rounded-3xl p-12 shadow-lg max-w-md w-full text-center">
        <p className="text-6xl mb-6">🎙️</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">VoiceAlarm</h1>
        <p className="text-gray-500 mb-8">
          소중한 사람의 목소리로<br />
          매일 따뜻한 메시지를 받아보세요
        </p>

        <div className="flex flex-col items-center gap-4">
          {/* Google 로그인 버튼 (GIS가 렌더링) */}
          <div ref={googleButtonRef} />

          {/* Client ID 미설정 시 안내 */}
          {!GOOGLE_CLIENT_ID && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
              <p className="font-semibold mb-1">Google Client ID 필요</p>
              <p>
                <code>packages/web/src/components/LoginPage.tsx</code>에서<br />
                <code>GOOGLE_CLIENT_ID</code>를 설정해주세요.
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-8">
          로그인 시 이용약관 및 개인정보처리방침에 동의합니다.
        </p>
      </div>
    </div>
  );
}
