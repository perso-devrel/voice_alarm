import { describe, it, expect } from 'vitest';
import {
  maskVoucherCode,
  formatVoucherStatus,
  isVoucherRedeemable,
  buildVoucherShareText,
} from '../src/lib/voucherShare';

describe('maskVoucherCode (web)', () => {
  it('첫 그룹만 공개하고 나머지는 ****', () => {
    expect(maskVoucherCode('VA-ABCD-EFGH-JKLM')).toBe('VA-ABCD-****-****');
  });

  it('잘못된 포맷은 원본 반환', () => {
    expect(maskVoucherCode('not-a-code')).toBe('not-a-code');
    expect(maskVoucherCode('VA-abcd-efgh-jklm')).toBe('VA-abcd-efgh-jklm');
    expect(maskVoucherCode('')).toBe('');
  });
});

describe('formatVoucherStatus (web)', () => {
  it('issued → 미사용, used → 사용됨, expired → 만료', () => {
    expect(formatVoucherStatus('issued')).toBe('미사용');
    expect(formatVoucherStatus('used')).toBe('사용됨');
    expect(formatVoucherStatus('expired')).toBe('만료');
  });

  it('알 수 없는 값은 미사용 기본', () => {
    expect(formatVoucherStatus('unknown')).toBe('미사용');
  });
});

describe('isVoucherRedeemable (web)', () => {
  const NOW = new Date('2026-04-21T00:00:00Z');

  it('issued + 만료 전 → true', () => {
    expect(
      isVoucherRedeemable(
        { code: 'VA-A-B-C', status: 'issued', expires_at: '2026-05-21T00:00:00Z' },
        NOW,
      ),
    ).toBe(true);
  });

  it('issued 이지만 만료일 지남 → false', () => {
    expect(
      isVoucherRedeemable(
        { code: 'VA-A-B-C', status: 'issued', expires_at: '2026-04-01T00:00:00Z' },
        NOW,
      ),
    ).toBe(false);
  });

  it('used → false', () => {
    expect(
      isVoucherRedeemable(
        { code: 'VA-A-B-C', status: 'used', expires_at: '2026-05-21T00:00:00Z' },
        NOW,
      ),
    ).toBe(false);
  });

  it('expired → false', () => {
    expect(
      isVoucherRedeemable(
        { code: 'VA-A-B-C', status: 'expired', expires_at: '2026-05-21T00:00:00Z' },
        NOW,
      ),
    ).toBe(false);
  });

  it('expires_at 파싱 실패 → false', () => {
    expect(
      isVoucherRedeemable(
        { code: 'VA-A-B-C', status: 'issued', expires_at: 'not-a-date' },
        NOW,
      ),
    ).toBe(false);
  });
});

describe('buildVoucherShareText (web)', () => {
  it('코드/플랜명/만료일이 포함된 공유 문구', () => {
    const text = buildVoucherShareText({
      code: 'VA-ABCD-EFGH-JKLM',
      planName: '플러스 개인',
      expiresAt: '2026-05-21T00:00:00Z',
    });
    expect(text).toContain('VA-ABCD-EFGH-JKLM');
    expect(text).toContain('플러스 개인');
    expect(text).toContain('2026-05-21');
    expect(text).toContain('이용권 등록');
  });

  it('만료일 파싱 실패 시 원본 문자열 사용', () => {
    const text = buildVoucherShareText({
      code: 'VA-A-B-C',
      planName: '가족',
      expiresAt: 'not-a-date',
    });
    expect(text).toContain('not-a-date');
  });
});
