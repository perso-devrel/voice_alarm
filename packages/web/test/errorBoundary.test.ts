import { describe, it, expect } from 'vitest';
import ErrorBoundary from '../src/components/ErrorBoundary';

describe('ErrorBoundary', () => {
  it('getDerivedStateFromError returns hasError true', () => {
    const state = ErrorBoundary.getDerivedStateFromError();
    expect(state.hasError).toBe(true);
  });

  it('initial state has no error', () => {
    const instance = new ErrorBoundary({ children: null });
    expect(instance.state.hasError).toBe(false);
  });
});
