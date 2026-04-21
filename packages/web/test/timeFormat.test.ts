import { describe, it, expect } from 'vitest';
import { formatRelativeTime } from '../src/lib/timeFormat';

const NOW = new Date('2026-04-21T18:00:00Z').getTime();

describe('formatRelativeTime', () => {
  it('30초 전 → 방금 전', () => {
    const date = new Date(NOW - 30_000).toISOString();
    expect(formatRelativeTime(date, NOW)).toBe('방금 전');
  });

  it('5분 전', () => {
    const date = new Date(NOW - 5 * 60_000).toISOString();
    expect(formatRelativeTime(date, NOW)).toBe('5분 전');
  });

  it('2시간 전', () => {
    const date = new Date(NOW - 2 * 3600_000).toISOString();
    expect(formatRelativeTime(date, NOW)).toBe('2시간 전');
  });

  it('3일 전', () => {
    const date = new Date(NOW - 3 * 86400_000).toISOString();
    expect(formatRelativeTime(date, NOW)).toBe('3일 전');
  });

  it('미래 시간 → 방금 전', () => {
    const date = new Date(NOW + 60_000).toISOString();
    expect(formatRelativeTime(date, NOW)).toBe('방금 전');
  });
});
