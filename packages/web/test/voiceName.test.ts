import { describe, it, expect } from 'vitest';
import { sanitizeVoiceName } from '../src/lib/voiceName';

describe('sanitizeVoiceName (web)', () => {
  it('앞뒤 공백을 제거한다', () => {
    expect(sanitizeVoiceName('  엄마  ')).toEqual({ ok: true, value: '엄마' });
  });

  it('빈 문자열은 거절한다', () => {
    const r = sanitizeVoiceName('   ');
    expect(r.ok).toBe(false);
    expect(r.error).toContain('입력');
  });

  it('51자 이상이면 거절한다', () => {
    const r = sanitizeVoiceName('가'.repeat(51));
    expect(r.ok).toBe(false);
    expect(r.error).toContain('50자');
  });

  it('50자 정확히는 허용', () => {
    const r = sanitizeVoiceName('가'.repeat(50));
    expect(r.ok).toBe(true);
  });

  it('일반 한글 이름 허용', () => {
    expect(sanitizeVoiceName('아빠 목소리').ok).toBe(true);
  });
});
