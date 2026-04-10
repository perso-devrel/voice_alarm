import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <p className="text-4xl mb-4">😵</p>
            <h2 className="text-lg font-bold text-[var(--color-text)] mb-2">
              문제가 발생했습니다
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              페이지를 새로고침해 주세요
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all"
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
