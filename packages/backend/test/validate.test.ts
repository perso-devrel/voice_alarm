import { describe, it, expect } from 'vitest';
import { UUID_RE, isValidUUID } from '../src/lib/validate';

describe('UUID_RE', () => {
  it('matches valid UUIDs', () => {
    expect(UUID_RE.test('12345678-1234-1234-1234-123456789012')).toBe(true);
    expect(UUID_RE.test('ABCDEF12-3456-7890-ABCD-EF1234567890')).toBe(true);
  });
  it('rejects invalid formats', () => {
    expect(UUID_RE.test('not-a-uuid')).toBe(false);
    expect(UUID_RE.test('')).toBe(false);
    expect(UUID_RE.test('12345678123412341234123456789012')).toBe(false);
  });
});

describe('isValidUUID', () => {
  it('returns true for valid', () => {
    expect(isValidUUID('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
  });
  it('returns false for invalid', () => {
    expect(isValidUUID('jobs')).toBe(false);
    expect(isValidUUID('123')).toBe(false);
  });
});
