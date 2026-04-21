import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserProfile, deleteAccount, getVouchers, type VoucherItem } from '../services/api';
import {
  buildVoucherShareText,
  formatVoucherStatus,
  isVoucherRedeemable,
} from '../lib/voucherShare';

type Theme = 'light' | 'dark' | 'system';

interface Props {
  darkMode: {
    theme: Theme;
    setTheme: (t: Theme) => void;
    isDark: boolean;
  };
}

const THEME_OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: 'system', label: '시스템 설정', icon: '💻' },
  { value: 'light', label: '라이트', icon: '☀️' },
  { value: 'dark', label: '다크', icon: '🌙' },
];

export default function SettingsPage({ darkMode }: Props) {
  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
  });

  const { data: vouchers = [] } = useQuery({
    queryKey: ['vouchers'],
    queryFn: getVouchers,
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const handleCopyVoucher = useCallback(
    async (v: VoucherItem) => {
      try {
        await navigator.clipboard.writeText(v.code);
        showToast('코드를 복사했어요', 'success');
      } catch {
        showToast('복사에 실패했어요');
      }
    },
    [showToast],
  );

  const handleShareVoucher = useCallback(
    async (v: VoucherItem) => {
      const text = buildVoucherShareText({
        code: v.code,
        planName: v.plan_name,
        expiresAt: v.expires_at,
      });
      const nav = navigator as Navigator & {
        share?: (data: { title?: string; text?: string }) => Promise<void>;
      };
      if (nav.share) {
        try {
          await nav.share({ title: 'VoiceAlarm 이용권', text });
          return;
        } catch {
          // fallthrough to clipboard
        }
      }
      try {
        await navigator.clipboard.writeText(text);
        showToast('공유 문구를 복사했어요', 'success');
      } catch {
        showToast('공유에 실패했어요');
      }
    },
    [showToast],
  );

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    } catch (err) {
      setDeleting(false);
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        showToast('인증이 만료되었습니다. 다시 로그인해주세요.');
      } else if (status === 429) {
        showToast('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else {
        showToast('계정 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const planLabels: Record<string, string> = {
    free: 'Free',
    plus: 'Plus ($3.99/월)',
    family: 'Family ($7.99/월)',
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--color-text)]">설정</h2>
        <p className="text-[var(--color-text-secondary)] mt-1">계정 및 구독 관리</p>
      </div>

      {/* 테마 설정 */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] mb-6 transition-colors">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">테마</h3>
        <div className="flex gap-3">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => darkMode.setTheme(opt.value)}
              aria-pressed={darkMode.theme === opt.value}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                darkMode.theme === opt.value
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
              }`}
            >
              <span aria-hidden="true">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 계정 정보 */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] mb-6 transition-colors">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">계정</h3>
        <div className="space-y-3">
          {profile?.user?.name && (
            <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-text-secondary)]">이름</span>
              <span className="text-[var(--color-text)] font-medium">{profile.user.name}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
            <span className="text-[var(--color-text-secondary)]">이메일</span>
            <span className="text-[var(--color-text)]">{profile?.user?.email || '-'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
            <span className="text-[var(--color-text-secondary)]">구독 플랜</span>
            <span className="text-[var(--color-primary)] font-medium">
              {planLabels[profile?.user?.plan] || 'Free'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
            <span className="text-[var(--color-text-secondary)]">음성 프로필</span>
            <span className="text-[var(--color-text)]">{profile?.stats?.voice_profiles ?? 0}개</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[var(--color-text-secondary)]">알람</span>
            <span className="text-[var(--color-text)]">{profile?.stats?.alarms ?? 0}개</span>
          </div>
        </div>
      </div>

      {/* 구독 */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] mb-6 transition-colors">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">구독 플랜</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              plan: 'free',
              name: 'Free',
              price: '$0',
              features: ['음성 1개', '알람 2개', '일 3회 TTS'],
            },
            {
              plan: 'plus',
              name: 'Plus',
              price: '$3.99/월',
              features: ['음성 3개', '알람 무제한', 'TTS 무제한', '위젯'],
            },
            {
              plan: 'family',
              name: 'Family',
              price: '$7.99/월',
              features: ['음성 10개', '가족 공유 5명', '모든 기능'],
            },
          ].map((tier) => (
            <div
              key={tier.plan}
              aria-current={profile?.user?.plan === tier.plan ? 'true' : undefined}
              className={`rounded-xl p-4 border-2 transition-colors ${
                profile?.user?.plan === tier.plan
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'border-[var(--color-border)]'
              }`}
            >
              <h4 className="font-semibold text-[var(--color-text)]">{tier.name}</h4>
              <p className="text-[var(--color-primary)] font-bold text-lg mb-2">{tier.price}</p>
              <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                {tier.features.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 내 이용권 코드 */}
      <div
        className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] mb-6 transition-colors"
        data-testid="voucher-section"
      >
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">내 이용권 코드</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          결제 시 자동 발급되는 1회용 코드예요. 본인에게만 보이며, 복사해서 지인에게 공유할 수 있어요.
        </p>
        {vouchers.length === 0 ? (
          <p className="text-sm text-[var(--color-text-tertiary)]">아직 발급된 코드가 없어요.</p>
        ) : (
          <ul className="space-y-3">
            {vouchers.map((v) => {
              const redeemable = isVoucherRedeemable(v);
              return (
                <li
                  key={v.id}
                  data-testid="voucher-item"
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-[var(--color-primary)]">
                        {v.plan_name}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          redeemable
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : v.status === 'used'
                              ? 'bg-slate-500/15 text-slate-500'
                              : 'bg-red-500/15 text-red-500'
                        }`}
                      >
                        {formatVoucherStatus(v.status)}
                      </span>
                    </div>
                    <code className="block text-sm font-mono text-[var(--color-text)] truncate">
                      {v.code}
                    </code>
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                      만료 {new Date(v.expires_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      aria-label={`${v.code} 복사`}
                      disabled={!redeemable}
                      onClick={() => handleCopyVoucher(v)}
                      className="px-3 py-2 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      복사
                    </button>
                    <button
                      aria-label={`${v.code} 공유`}
                      disabled={!redeemable}
                      onClick={() => handleShareVoucher(v)}
                      className="px-3 py-2 rounded-lg bg-[var(--color-primary)] text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                    >
                      공유
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 정보 */}
      <div className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] transition-colors">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">정보</h3>
        <div className="space-y-2">
          <button
            aria-label="이용약관 보기"
            className="w-full text-left py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            이용약관
          </button>
          <button
            aria-label="개인정보처리방침 보기"
            className="w-full text-left py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            개인정보처리방침
          </button>
          <button
            aria-label="오픈소스 라이선스 보기"
            className="w-full text-left py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            오픈소스 라이선스
          </button>
          <div className="pt-2 border-t border-[var(--color-border)]">
            <p className="text-sm text-[var(--color-text-tertiary)]">VoiceAlarm v1.0.0</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-6">
        <button
          aria-label="로그아웃"
          className="w-full py-3 text-red-400 font-medium hover:text-red-500 transition-colors"
          onClick={() => {
            localStorage.removeItem('auth_token');
            window.location.reload();
          }}
        >
          로그아웃
        </button>
        <button
          aria-label="계정 삭제"
          className="w-full py-3 text-red-300 text-sm hover:text-red-400 transition-colors"
          onClick={() => setShowDeleteDialog(true)}
        >
          계정 삭제
        </button>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium animate-[fadeIn_0.2s_ease-out] ${
            toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteDialog(false)}>
          <div
            className="bg-[var(--color-surface)] rounded-2xl p-6 max-w-md w-full mx-4 border border-[var(--color-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-red-500 mb-2">계정 삭제</h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4">
              계정을 삭제하면 모든 음성 프로필, 메시지, 알람, 친구, 선물 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <p className="text-[var(--color-text)] text-sm mb-2">
              확인하려면 아래에 <strong>"삭제"</strong>를 입력하세요.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="삭제"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-text)] text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-3">
              <button
                className="flex-1 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm hover:bg-[var(--color-surface-alt)] transition-colors"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
              >
                취소
              </button>
              <button
                className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
                disabled={deleteConfirmText !== '삭제' || deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? '삭제 중...' : '계정 영구 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
