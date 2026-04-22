import {
  maskVoucherCode,
  formatVoucherStatus,
  isVoucherRedeemable,
  buildVoucherShareText,
} from '../src/lib/voucherShare';

describe('maskVoucherCode (mobile)', () => {
  it('첫 그룹만 공개하고 나머지는 ****', () => {
    expect(maskVoucherCode('VA-ABCD-EFGH-JKLM')).toBe('VA-ABCD-****-****');
  });

  it('잘못된 포맷은 원본 반환', () => {
    expect(maskVoucherCode('not-a-code')).toBe('not-a-code');
    expect(maskVoucherCode('')).toBe('');
  });
});

describe('formatVoucherStatus (mobile)', () => {
  it('issued → 미사용, used → 사용됨, expired → 만료', () => {
    expect(formatVoucherStatus('issued')).toBe('미사용');
    expect(formatVoucherStatus('used')).toBe('사용됨');
    expect(formatVoucherStatus('expired')).toBe('만료');
  });
});

describe('isVoucherRedeemable (mobile)', () => {
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

  it('used / expired → false', () => {
    expect(
      isVoucherRedeemable(
        { code: 'VA-A-B-C', status: 'used', expires_at: '2026-05-21T00:00:00Z' },
        NOW,
      ),
    ).toBe(false);
    expect(
      isVoucherRedeemable(
        { code: 'VA-A-B-C', status: 'expired', expires_at: '2026-05-21T00:00:00Z' },
        NOW,
      ),
    ).toBe(false);
  });
});

describe('buildVoucherShareText (mobile)', () => {
  it('코드/플랜/만료일이 포함된 공유 문구', () => {
    const text = buildVoucherShareText({
      code: 'VA-ABCD-EFGH-JKLM',
      planName: '가족',
      expiresAt: '2026-05-21T00:00:00Z',
    });
    expect(text).toContain('VA-ABCD-EFGH-JKLM');
    expect(text).toContain('가족');
    expect(text).toContain('2026-05-21');
    expect(text).toContain('이용권 등록');
  });
});
