import { describe, it, expect } from 'vitest';
import { ONBOARDING_STEPS, isLastStep, clampStepIndex, ONBOARDING_STORAGE_KEY } from '../src/index';

describe('ONBOARDING_STEPS', () => {
  it('has 3 steps', () => {
    expect(ONBOARDING_STEPS).toHaveLength(3);
  });

  it('each step has emoji, title, description', () => {
    for (const step of ONBOARDING_STEPS) {
      expect(step.emoji).toBeTruthy();
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
    }
  });
});

describe('isLastStep', () => {
  it('returns false for 0', () => {
    expect(isLastStep(0)).toBe(false);
  });
  it('returns true for 2 (last index)', () => {
    expect(isLastStep(2)).toBe(true);
  });
  it('returns true for out of range', () => {
    expect(isLastStep(10)).toBe(true);
  });
});

describe('clampStepIndex', () => {
  it('clamps negative to 0', () => {
    expect(clampStepIndex(-1)).toBe(0);
  });
  it('clamps over to max', () => {
    expect(clampStepIndex(100)).toBe(2);
  });
  it('passes valid index', () => {
    expect(clampStepIndex(1)).toBe(1);
  });
});

describe('ONBOARDING_STORAGE_KEY', () => {
  it('is a non-empty string', () => {
    expect(ONBOARDING_STORAGE_KEY.length).toBeGreaterThan(0);
  });
});
