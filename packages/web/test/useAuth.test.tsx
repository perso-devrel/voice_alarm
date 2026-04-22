import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../src/hooks/useAuth';

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

function wrap(children: ReactNode, props: Partial<React.ComponentProps<typeof AuthProvider>> = {}) {
  return (
    <AuthProvider apiBase="/api" storage={memoryStorage()} {...props}>
      {children}
    </AuthProvider>
  );
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('초기 상태: 토큰 없으면 비인증 + 로딩 해제', async () => {
    const fetchImpl = vi.fn();
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => wrap(children, { fetchImpl }),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('register 성공 시 토큰 저장 + user 세팅', async () => {
    const user = { id: 'u1', email: 'a@b.com', name: '한글', plan: 'free' as const };
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(201, { token: 'jwt-token', user }));
    const storage = memoryStorage();

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => wrap(children, { fetchImpl, storage }),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.register('a@b.com', 'superSecret1', '한글');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('jwt-token');
    expect(result.current.user?.email).toBe('a@b.com');
    expect(storage.getItem('auth_token')).toBe('jwt-token');

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/auth/register');
    expect(init.method).toBe('POST');
  });

  it('login 실패 시 에러 메시지 + 비인증 유지', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(401, { error: 'Invalid email or password', code: 'AUTH_INVALID_CREDENTIALS' }),
      );

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => wrap(children, { fetchImpl }),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.login('a@b.com', 'wrong')).rejects.toThrow();
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toContain('Invalid');
  });

  it('logout 시 토큰 제거', async () => {
    const user = { id: 'u1', email: 'a@b.com', name: 'A', plan: 'free' as const };
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { token: 'tok', user }));
    const storage = memoryStorage();

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => wrap(children, { fetchImpl, storage }),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.login('a@b.com', 'superSecret1');
    });
    expect(storage.getItem('auth_token')).toBe('tok');

    act(() => result.current.logout());
    expect(storage.getItem('auth_token')).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('초기 마운트 시 저장된 토큰으로 /auth/me 호출해 user 복원', async () => {
    const user = { id: 'u1', email: 'a@b.com', name: 'A', plan: 'plus' as const };
    const storage = memoryStorage();
    storage.setItem('auth_token', 'pre-existing');
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { user }));

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => wrap(children, { fetchImpl, storage }),
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user?.plan).toBe('plus');
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/auth/me');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer pre-existing');
  });

  it('저장된 토큰이 /auth/me 에서 401 이면 자동 로그아웃', async () => {
    const storage = memoryStorage();
    storage.setItem('auth_token', 'expired');
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(401, { error: 'expired' }));

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => wrap(children, { fetchImpl, storage }),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(storage.getItem('auth_token')).toBeNull();
  });

  it('Provider 밖에서 useAuth 호출 시 예외', () => {
    expect(() => renderHook(() => useAuth())).toThrow(/AuthProvider/);
  });
});
