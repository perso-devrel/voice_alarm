import { describe, it, expect } from 'vitest';
import {
  generateVoucherCode,
  generateVoucherCodePlain,
  hashVoucherCode,
  isValidVoucherCodeFormat,
} from '../src/lib/vouchers';

describe('generateVoucherCodePlain', () => {
  it('VA-XXXX-XXXX-XXXX 포맷을 따른다', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateVoucherCodePlain();
      expect(code).toMatch(/^VA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    }
  });

  it('시각적 혼동 문자 (0/O/1/I/L) 를 포함하지 않는다', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateVoucherCodePlain();
      expect(code).not.toMatch(/[01OIL]/);
    }
  });

  it('충분히 고유하다 (100회 생성 시 중복 없음)', () => {
    const set = new Set<string>();
    for (let i = 0; i < 100; i++) set.add(generateVoucherCodePlain());
    expect(set.size).toBe(100);
  });
});

describe('hashVoucherCode', () => {
  it('동일 입력 → 동일 hash (결정성)', async () => {
    const h1 = await hashVoucherCode('VA-ABCD-EFGH-JKLM');
    const h2 = await hashVoucherCode('VA-ABCD-EFGH-JKLM');
    expect(h1).toBe(h2);
  });

  it('다른 입력 → 다른 hash', async () => {
    const h1 = await hashVoucherCode('VA-ABCD-EFGH-JKLM');
    const h2 = await hashVoucherCode('VA-ABCD-EFGH-JKLN');
    expect(h1).not.toBe(h2);
  });

  it('SHA-256 hex 문자열 (64자)', async () => {
    const h = await hashVoucherCode('VA-ABCD-EFGH-JKLM');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('generateVoucherCode', () => {
  it('code + hash 페어 반환, hash 는 hashVoucherCode(code) 와 동일', async () => {
    const { code, hash } = await generateVoucherCode();
    expect(code).toMatch(/^VA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    const expectedHash = await hashVoucherCode(code);
    expect(hash).toBe(expectedHash);
  });
});

describe('isValidVoucherCodeFormat', () => {
  it('정상 포맷 → true', () => {
    expect(isValidVoucherCodeFormat('VA-ABCD-EFGH-JKLM')).toBe(true);
    expect(isValidVoucherCodeFormat('VA-2345-6789-ABCD')).toBe(true);
  });

  it('잘못된 포맷 → false', () => {
    expect(isValidVoucherCodeFormat('')).toBe(false);
    expect(isValidVoucherCodeFormat('ABCD-EFGH-JKLM')).toBe(false);
    expect(isValidVoucherCodeFormat('VA-ABC-EFGH-JKLM')).toBe(false);
    expect(isValidVoucherCodeFormat('VA-abcd-efgh-jklm')).toBe(false);
    expect(isValidVoucherCodeFormat('VA-ABCD-EFGH')).toBe(false);
  });
});
