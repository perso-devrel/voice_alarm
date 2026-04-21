import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import EmailPasswordForm from '../src/components/EmailPasswordForm';
import { AuthProvider } from '../src/hooks/useAuth';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => Array.from(map.keys())[i] ?? null,
    removeItem: (k) => {
      map.delete(k);
    },
    setItem: (k, v) => {
      map.set(k, v);
    },
  } as Storage;
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function wrap(children: ReactNode, fetchImpl: typeof fetch) {
  return (
    <AuthProvider apiBase="/api" storage={memoryStorage()} fetchImpl={fetchImpl}>
      {children}
    </AuthProvider>
  );
}

function type(el: HTMLElement, value: string) {
  fireEvent.change(el, { target: { value } });
}

describe('EmailPasswordForm', () => {
  it('기본은 로그인 탭이며 이름 필드가 보이지 않는다', () => {
    const fetchImpl = vi.fn();
    render(wrap(<EmailPasswordForm />, fetchImpl as unknown as typeof fetch));
    expect(screen.getByRole('tab', { name: '로그인' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.queryByPlaceholderText('홍길동')).toBeNull();
  });

  it('가입 탭으로 전환하면 이름 필드가 나타난다', () => {
    const fetchImpl = vi.fn();
    render(wrap(<EmailPasswordForm />, fetchImpl as unknown as typeof fetch));
    fireEvent.click(screen.getByRole('tab', { name: '가입하기' }));
    expect(screen.getByRole('tab', { name: '가입하기' }).getAttribute('aria-selected')).toBe(
      'true',
    );
    expect(screen.getByPlaceholderText('홍길동')).not.toBeNull();
  });

  it('가입 시 비밀번호가 8자 미만이면 에러 메시지 표시', async () => {
    const fetchImpl = vi.fn();
    render(wrap(<EmailPasswordForm />, fetchImpl as unknown as typeof fetch));
    fireEvent.click(screen.getByRole('tab', { name: '가입하기' }));

    type(screen.getByPlaceholderText('홍길동'), '홍길동');
    type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    type(screen.getByPlaceholderText('8자 이상'), 'short');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '가입하기' }));
    });

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('8자');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('로그인 성공 시 onSuccess 콜백이 호출된다', async () => {
    const apiUser = { id: 'u1', email: 'a@b.com', name: 'A', plan: 'free' as const };
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { token: 'jwt-x', user: apiUser }));
    const onSuccess = vi.fn();

    render(wrap(<EmailPasswordForm onSuccess={onSuccess} />, fetchImpl as unknown as typeof fetch));

    type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    type(screen.getByPlaceholderText('비밀번호'), 'superSecret1');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    });

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/auth/login');
    expect(init.method).toBe('POST');
  });

  it('서버 401 응답 시 에러 메시지 표시 + onSuccess 미호출', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(401, { error: 'Invalid email or password', code: 'AUTH_INVALID_CREDENTIALS' }),
      );
    const onSuccess = vi.fn();

    render(wrap(<EmailPasswordForm onSuccess={onSuccess} />, fetchImpl as unknown as typeof fetch));

    type(screen.getByPlaceholderText('you@example.com'), 'a@b.com');
    type(screen.getByPlaceholderText('비밀번호'), 'wrongPass1');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    });

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeNull());
    expect(screen.getByRole('alert').textContent).toMatch(/Invalid/);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
