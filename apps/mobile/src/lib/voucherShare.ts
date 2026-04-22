export type VoucherStatus = 'issued' | 'used' | 'expired';

export interface VoucherLite {
  code: string;
  status: string;
  expires_at: string;
}

const VOUCHER_CODE_RE = /^VA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function maskVoucherCode(code: string): string {
  if (!VOUCHER_CODE_RE.test(code)) return code;
  const groups = code.split('-');
  return `${groups[0]}-${groups[1]}-****-****`;
}

export function formatVoucherStatus(status: string): string {
  if (status === 'used') return '사용됨';
  if (status === 'expired') return '만료';
  return '미사용';
}

export function isVoucherRedeemable(voucher: VoucherLite, now: Date = new Date()): boolean {
  if (voucher.status !== 'issued') return false;
  const exp = new Date(voucher.expires_at);
  if (!Number.isFinite(exp.getTime())) return false;
  return exp.getTime() > now.getTime();
}

export interface ShareTextInput {
  code: string;
  planName: string;
  expiresAt: string;
}

export function buildVoucherShareText(input: ShareTextInput): string {
  const exp = new Date(input.expiresAt);
  const expLabel = Number.isFinite(exp.getTime())
    ? `${exp.getFullYear()}-${String(exp.getMonth() + 1).padStart(2, '0')}-${String(exp.getDate()).padStart(2, '0')}`
    : input.expiresAt;
  return [
    'VoiceAlarm 이용권 선물이 도착했어요 🎁',
    `플랜: ${input.planName}`,
    `코드: ${input.code}`,
    `만료: ${expLabel}`,
    '앱/웹에서 [이용권 등록] 에 입력해 사용하세요.',
  ].join('\n');
}
