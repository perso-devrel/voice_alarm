import { describe, it, expect } from 'vitest';
import { resolveStateView } from '../src/index';

describe('resolveStateView', () => {
  it('loading defaults', () => {
    const cfg = resolveStateView('loading');
    expect(cfg.variant).toBe('loading');
    expect(cfg.emoji).toBe('⏳');
    expect(cfg.title).toContain('불러오는');
  });

  it('empty defaults', () => {
    const cfg = resolveStateView('empty');
    expect(cfg.variant).toBe('empty');
    expect(cfg.emoji).toBe('📭');
  });

  it('error defaults', () => {
    const cfg = resolveStateView('error');
    expect(cfg.variant).toBe('error');
    expect(cfg.title).toContain('문제');
    expect(cfg.subtitle).toBeDefined();
  });

  it('overrides title', () => {
    const cfg = resolveStateView('empty', { title: '알람이 없어요' });
    expect(cfg.title).toBe('알람이 없어요');
    expect(cfg.emoji).toBe('📭');
  });

  it('overrides emoji', () => {
    const cfg = resolveStateView('loading', { emoji: '🔄' });
    expect(cfg.emoji).toBe('🔄');
  });

  it('overrides subtitle', () => {
    const cfg = resolveStateView('error', { subtitle: '네트워크 확인' });
    expect(cfg.subtitle).toBe('네트워크 확인');
  });
});
