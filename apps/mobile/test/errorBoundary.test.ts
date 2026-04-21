import { ErrorBoundary } from '../src/components/ErrorBoundary';

describe('ErrorBoundary', () => {
  it('getDerivedStateFromError sets hasError and message', () => {
    const err = new Error('test crash');
    const state = ErrorBoundary.getDerivedStateFromError(err);
    expect(state.hasError).toBe(true);
    expect(state.errorMessage).toBe('test crash');
  });

  it('initial state has no error', () => {
    const instance = new ErrorBoundary({ children: null });
    expect(instance.state.hasError).toBe(false);
    expect(instance.state.errorMessage).toBeNull();
  });
});
