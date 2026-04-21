import { useState, useCallback } from 'react';
import {
  ONBOARDING_STEPS,
  ONBOARDING_STORAGE_KEY,
  isLastStep,
  clampStepIndex,
} from '@voice-alarm/ui';

export default function OnboardingOverlay() {
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleNext = useCallback(() => {
    if (isLastStep(step)) {
      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      } catch { /* noop */ }
      setDismissed(true);
    } else {
      setStep((s) => clampStepIndex(s + 1));
    }
  }, [step]);

  const handleSkip = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch { /* noop */ }
    setDismissed(true);
  }, []);

  if (dismissed) return null;

  const current = ONBOARDING_STEPS[clampStepIndex(step)];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
        <span className="text-5xl block mb-4">{current.emoji}</span>
        <h2 className="text-xl font-bold text-[var(--color-text)] mb-3 whitespace-pre-line">
          {current.title}
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line mb-6 leading-relaxed">
          {current.description}
        </p>

        <div className="flex items-center justify-center gap-2 mb-6">
          {ONBOARDING_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step
                  ? 'bg-[var(--color-primary)] w-6'
                  : 'bg-[var(--color-border)]'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          {!isLastStep(step) && (
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
            >
              건너뛰기
            </button>
          )}
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all"
          >
            {isLastStep(step) ? '시작하기' : '다음'}
          </button>
        </div>
      </div>
    </div>
  );
}
