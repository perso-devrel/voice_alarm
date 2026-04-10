import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '../services/api';

export default function SettingsPage() {
  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
  });

  const planLabels: Record<string, string> = {
    free: 'Free',
    plus: 'Plus ($3.99/월)',
    family: 'Family ($7.99/월)',
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">설정</h2>
        <p className="text-gray-500 mt-1">계정 및 구독 관리</p>
      </div>

      {/* 계정 정보 */}
      <div className="bg-white rounded-2xl p-6 border border-[#F2E8E5] mb-6">
        <h3 className="text-lg font-semibold mb-4">계정</h3>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">이메일</span>
            <span className="text-gray-900">{profile?.user?.email || '-'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">구독 플랜</span>
            <span className="text-[#FF7F6B] font-medium">
              {planLabels[profile?.user?.plan] || 'Free'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">음성 프로필</span>
            <span className="text-gray-900">{profile?.stats?.voice_profiles ?? 0}개</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">알람</span>
            <span className="text-gray-900">{profile?.stats?.alarms ?? 0}개</span>
          </div>
        </div>
      </div>

      {/* 구독 */}
      <div className="bg-white rounded-2xl p-6 border border-[#F2E8E5] mb-6">
        <h3 className="text-lg font-semibold mb-4">구독 플랜</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { plan: 'free', name: 'Free', price: '$0', features: ['음성 1개', '알람 2개', '일 3회 TTS'] },
            { plan: 'plus', name: 'Plus', price: '$3.99/월', features: ['음성 3개', '알람 무제한', 'TTS 무제한', '위젯'] },
            { plan: 'family', name: 'Family', price: '$7.99/월', features: ['음성 10개', '가족 공유 5명', '모든 기능'] },
          ].map((tier) => (
            <div
              key={tier.plan}
              className={`rounded-xl p-4 border-2 transition-colors ${
                profile?.user?.plan === tier.plan
                  ? 'border-[#FF7F6B] bg-[#FFF5F3]'
                  : 'border-gray-200'
              }`}
            >
              <h4 className="font-semibold text-gray-900">{tier.name}</h4>
              <p className="text-[#FF7F6B] font-bold text-lg mb-2">{tier.price}</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {tier.features.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 정보 */}
      <div className="bg-white rounded-2xl p-6 border border-[#F2E8E5]">
        <h3 className="text-lg font-semibold mb-4">정보</h3>
        <div className="space-y-2">
          <button className="w-full text-left py-2 text-gray-600 hover:text-gray-900 transition-colors">
            이용약관
          </button>
          <button className="w-full text-left py-2 text-gray-600 hover:text-gray-900 transition-colors">
            개인정보처리방침
          </button>
          <button className="w-full text-left py-2 text-gray-600 hover:text-gray-900 transition-colors">
            오픈소스 라이선스
          </button>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-400">VoiceAlarm v1.0.0</p>
          </div>
        </div>
      </div>

      <button
        className="w-full mt-6 py-3 text-red-400 font-medium hover:text-red-500 transition-colors"
        onClick={() => {
          localStorage.removeItem('firebase_token');
          window.location.reload();
        }}
      >
        로그아웃
      </button>
    </div>
  );
}
