import { describe, it, expect } from 'vitest';
import {
  formatProgress,
  listDialogues,
  normalizeStage,
  pickRandomDialogue,
  progressBarWidthPct,
  shouldShowStageTransition,
  stageIndex,
  stageToEmoji,
  stageToLabel,
} from '../src/lib/character';

describe('normalizeStage', () => {
  it('유효한 스테이지는 그대로', () => {
    expect(normalizeStage('seed')).toBe('seed');
    expect(normalizeStage('sprout')).toBe('sprout');
    expect(normalizeStage('tree')).toBe('tree');
    expect(normalizeStage('bloom')).toBe('bloom');
  });

  it('알 수 없는 값은 seed 로 폴백', () => {
    expect(normalizeStage('unknown')).toBe('seed');
    expect(normalizeStage(null)).toBe('seed');
    expect(normalizeStage(undefined)).toBe('seed');
    expect(normalizeStage(42)).toBe('seed');
  });
});

describe('stageToEmoji / stageToLabel', () => {
  it('이모지 매핑', () => {
    expect(stageToEmoji('seed')).toBe('🌱');
    expect(stageToEmoji('sprout')).toBe('🌿');
    expect(stageToEmoji('tree')).toBe('🌳');
    expect(stageToEmoji('bloom')).toBe('🌸');
  });

  it('라벨 한국어 매핑', () => {
    expect(stageToLabel('seed')).toBe('씨앗');
    expect(stageToLabel('bloom')).toBe('꽃');
  });
});

describe('stageIndex', () => {
  it('올바른 순서 반환', () => {
    expect(stageIndex('seed')).toBe(0);
    expect(stageIndex('sprout')).toBe(1);
    expect(stageIndex('tree')).toBe(2);
    expect(stageIndex('bloom')).toBe(3);
  });
  it('알 수 없는 값은 0 (seed)', () => {
    expect(stageIndex('nope')).toBe(0);
  });
});

describe('shouldShowStageTransition', () => {
  it('다른 스테이지면 true', () => {
    expect(shouldShowStageTransition('seed', 'sprout')).toBe(true);
    expect(shouldShowStageTransition('tree', 'bloom')).toBe(true);
  });
  it('같은 스테이지면 false', () => {
    expect(shouldShowStageTransition('tree', 'tree')).toBe(false);
  });
  it('null 이면 false', () => {
    expect(shouldShowStageTransition(null, 'seed')).toBe(false);
    expect(shouldShowStageTransition('seed', null)).toBe(false);
  });
});

describe('listDialogues', () => {
  it('스테이지별로 1개 이상의 대사 보유', () => {
    for (const stage of ['seed', 'sprout', 'tree', 'bloom'] as const) {
      expect(listDialogues(stage).length).toBeGreaterThan(0);
    }
  });
});

describe('pickRandomDialogue', () => {
  it('결정성 — rng=0 은 첫 번째 대사', () => {
    const list = listDialogues('seed');
    expect(pickRandomDialogue('seed', () => 0)).toBe(list[0]);
  });

  it('결정성 — rng≈0.999 은 마지막 대사', () => {
    const list = listDialogues('bloom');
    expect(pickRandomDialogue('bloom', () => 0.9999)).toBe(list[list.length - 1]);
  });

  it('NaN rng 방어 → 첫 번째 대사', () => {
    const list = listDialogues('tree');
    expect(pickRandomDialogue('tree', () => Number.NaN)).toBe(list[0]);
  });

  it('알 수 없는 스테이지 → seed 의 대사 중 하나', () => {
    const seedList = listDialogues('seed');
    const picked = pickRandomDialogue('weird-stage', () => 0.5);
    expect(seedList).toContain(picked);
  });
});

describe('formatProgress', () => {
  it('정상 — XP 120 / 400 (30%)', () => {
    expect(
      formatProgress({
        xp_into_level: 120,
        xp_to_next_level: 280,
        level_span: 400,
        progress_ratio: 0.3,
      }),
    ).toBe('XP 120 / 400 (30%)');
  });

  it('100% 도달', () => {
    expect(
      formatProgress({ xp_into_level: 100, level_span: 100, progress_ratio: 1 }),
    ).toBe('XP 100 / 100 (100%)');
  });

  it('null/undefined → 0 / 0 (0%)', () => {
    expect(formatProgress(null)).toBe('XP 0 / 0 (0%)');
    expect(formatProgress(undefined)).toBe('XP 0 / 0 (0%)');
  });

  it('음수·NaN 방어', () => {
    expect(
      formatProgress({
        xp_into_level: -10,
        level_span: -5,
        progress_ratio: Number.NaN,
      }),
    ).toBe('XP 0 / 0 (0%)');
  });
});

describe('progressBarWidthPct', () => {
  it('0..1 비율을 0..100 % 로', () => {
    expect(progressBarWidthPct({ progress_ratio: 0 })).toBe(0);
    expect(progressBarWidthPct({ progress_ratio: 0.5 })).toBe(50);
    expect(progressBarWidthPct({ progress_ratio: 1 })).toBe(100);
  });

  it('범위 밖은 클램프', () => {
    expect(progressBarWidthPct({ progress_ratio: -1 })).toBe(0);
    expect(progressBarWidthPct({ progress_ratio: 5 })).toBe(100);
  });
});
