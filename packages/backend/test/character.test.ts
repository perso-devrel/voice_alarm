import { describe, it, expect } from 'vitest';
import {
  CHARACTER_STAGES,
  computeLevelFromXp,
  computeStageFromLevel,
  computeStageFromXp,
  xpThresholdForLevel,
} from '../src/lib/character';

describe('xpThresholdForLevel', () => {
  it('레벨 1 은 누적 XP 0 부터 시작', () => {
    expect(xpThresholdForLevel(1)).toBe(0);
  });

  it('레벨 2 는 100, 레벨 3 은 400, 레벨 5 는 1600', () => {
    expect(xpThresholdForLevel(2)).toBe(100);
    expect(xpThresholdForLevel(3)).toBe(400);
    expect(xpThresholdForLevel(5)).toBe(1600);
  });

  it('1 미만·비유한 값은 0 반환', () => {
    expect(xpThresholdForLevel(0)).toBe(0);
    expect(xpThresholdForLevel(-3)).toBe(0);
    expect(xpThresholdForLevel(Number.NaN)).toBe(0);
  });

  it('정수가 아니면 floor 처리', () => {
    expect(xpThresholdForLevel(2.9)).toBe(100);
  });
});

describe('computeLevelFromXp', () => {
  it('XP 0 은 레벨 1', () => {
    expect(computeLevelFromXp(0)).toBe(1);
    expect(computeLevelFromXp(-50)).toBe(1);
  });

  it('임계 직전은 이전 레벨, 임계값은 다음 레벨', () => {
    expect(computeLevelFromXp(99)).toBe(1);
    expect(computeLevelFromXp(100)).toBe(2);
    expect(computeLevelFromXp(399)).toBe(2);
    expect(computeLevelFromXp(400)).toBe(3);
    expect(computeLevelFromXp(1599)).toBe(4);
    expect(computeLevelFromXp(1600)).toBe(5);
  });

  it('큰 XP 도 연속 단조 증가', () => {
    expect(computeLevelFromXp(10000)).toBe(11);
    expect(computeLevelFromXp(100000)).toBe(32);
  });
});

describe('computeStageFromLevel', () => {
  it('1~2 → seed, 3~5 → sprout, 6~9 → tree, 10+ → bloom', () => {
    expect(computeStageFromLevel(1)).toBe('seed');
    expect(computeStageFromLevel(2)).toBe('seed');
    expect(computeStageFromLevel(3)).toBe('sprout');
    expect(computeStageFromLevel(5)).toBe('sprout');
    expect(computeStageFromLevel(6)).toBe('tree');
    expect(computeStageFromLevel(9)).toBe('tree');
    expect(computeStageFromLevel(10)).toBe('bloom');
    expect(computeStageFromLevel(100)).toBe('bloom');
  });

  it('1 미만은 seed 로 방어', () => {
    expect(computeStageFromLevel(0)).toBe('seed');
    expect(computeStageFromLevel(-3)).toBe('seed');
  });
});

describe('computeStageFromXp', () => {
  it('XP 를 그대로 stage 로 변환 (복합 경로)', () => {
    expect(computeStageFromXp(0)).toBe('seed');
    expect(computeStageFromXp(100)).toBe('seed'); // level 2
    expect(computeStageFromXp(400)).toBe('sprout'); // level 3
    expect(computeStageFromXp(2500)).toBe('tree'); // level 6
    expect(computeStageFromXp(8100)).toBe('bloom'); // level 10
  });
});

describe('CHARACTER_STAGES', () => {
  it('4 단계가 순서대로 선언되어 있다', () => {
    expect(CHARACTER_STAGES).toEqual(['seed', 'sprout', 'tree', 'bloom']);
  });
});
