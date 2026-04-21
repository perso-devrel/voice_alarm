import {
  normalizeStage,
  stageToEmoji,
  stageToLabel,
  listDialogues,
  pickRandomDialogue,
  formatProgress,
  progressBarWidthPct,
} from '../src/lib/character';

describe('normalizeStage', () => {
  it('returns seed for unknown values', () => {
    expect(normalizeStage(undefined)).toBe('seed');
    expect(normalizeStage(null)).toBe('seed');
    expect(normalizeStage('')).toBe('seed');
    expect(normalizeStage('invalid')).toBe('seed');
    expect(normalizeStage(42)).toBe('seed');
  });

  it('passes through valid stages', () => {
    expect(normalizeStage('seed')).toBe('seed');
    expect(normalizeStage('sprout')).toBe('sprout');
    expect(normalizeStage('tree')).toBe('tree');
    expect(normalizeStage('bloom')).toBe('bloom');
  });
});

describe('stageToEmoji / stageToLabel', () => {
  it('maps seed', () => {
    expect(stageToEmoji('seed')).toBe('🌱');
    expect(stageToLabel('seed')).toBe('씨앗');
  });
  it('maps bloom', () => {
    expect(stageToEmoji('bloom')).toBe('🌸');
    expect(stageToLabel('bloom')).toBe('꽃');
  });
  it('falls back to seed for unknown', () => {
    expect(stageToEmoji('xyz')).toBe('🌱');
    expect(stageToLabel(null)).toBe('씨앗');
  });
});

describe('listDialogues', () => {
  it('returns 4 dialogues per stage', () => {
    for (const s of ['seed', 'sprout', 'tree', 'bloom'] as const) {
      expect(listDialogues(s)).toHaveLength(4);
    }
  });
});

describe('pickRandomDialogue', () => {
  it('uses deterministic rng', () => {
    const a = pickRandomDialogue('seed', () => 0);
    const b = pickRandomDialogue('seed', () => 0);
    expect(a).toBe(b);
  });
  it('different rng values give different dialogues', () => {
    const a = pickRandomDialogue('seed', () => 0);
    const b = pickRandomDialogue('seed', () => 0.75);
    expect(a).not.toBe(b);
  });
  it('clamps NaN rng to 0', () => {
    const result = pickRandomDialogue('tree', () => NaN);
    expect(result).toBe(listDialogues('tree')[0]);
  });
  it('clamps negative rng', () => {
    const result = pickRandomDialogue('bloom', () => -1);
    expect(result).toBe(listDialogues('bloom')[0]);
  });
});

describe('formatProgress', () => {
  it('formats normal progress', () => {
    expect(formatProgress({ xp_into_level: 50, level_span: 100, progress_ratio: 0.5 })).toBe('XP 50 / 100 (50%)');
  });
  it('handles null', () => {
    expect(formatProgress(null)).toBe('XP 0 / 0 (0%)');
  });
  it('handles undefined', () => {
    expect(formatProgress(undefined)).toBe('XP 0 / 0 (0%)');
  });
  it('clamps negative xp_into_level', () => {
    expect(formatProgress({ xp_into_level: -10, level_span: 100, progress_ratio: 0 })).toBe('XP 0 / 100 (0%)');
  });
});

describe('progressBarWidthPct', () => {
  it('returns percentage', () => {
    expect(progressBarWidthPct({ progress_ratio: 0.75 })).toBe(75);
  });
  it('clamps to 0-100', () => {
    expect(progressBarWidthPct({ progress_ratio: 1.5 })).toBe(100);
    expect(progressBarWidthPct({ progress_ratio: -0.5 })).toBe(0);
  });
  it('returns 0 for NaN', () => {
    expect(progressBarWidthPct({ progress_ratio: NaN } as never)).toBe(0);
  });
  it('returns 0 for null', () => {
    expect(progressBarWidthPct(null)).toBe(0);
  });
});
