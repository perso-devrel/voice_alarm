import { describe, it, expect } from 'vitest';

describe('web test runner', () => {
  it('vitest 환경이 정상 동작한다', () => {
    expect(1 + 1).toBe(2);
  });

  it('DOM 환경이 설정되어 있다', () => {
    const el = document.createElement('div');
    el.textContent = 'hello';
    expect(el.textContent).toBe('hello');
  });
});
