import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'plus' | 'family';
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, name: string) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const STORAGE_KEY = 'auth_token';

function resolveApiBase(): string {
  const explicit = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL;
  if (explicit) return `${explicit}/api`;
  return '/api';
}

interface FetchImpl {
  (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface AuthProviderProps {
  children: ReactNode;
  apiBase?: string;
  storage?: Storage;
  fetchImpl?: FetchImpl;
}

const AuthContext = createContext<AuthState | null>(null);

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; code?: string };
    return body.error ?? body.code ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export function AuthProvider({ children, apiBase, storage, fetchImpl }: AuthProviderProps) {
  const base = apiBase ?? resolveApiBase();
  const store = storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  const doFetch: FetchImpl = useMemo(
    () => fetchImpl ?? ((input, init) => fetch(input, init)),
    [fetchImpl],
  );

  const initialToken = store?.getItem(STORAGE_KEY) ?? null;
  const [token, setToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!initialToken);
  const [error, setError] = useState<string | null>(null);
  const refreshingRef = useRef(false);

  const persistToken = useCallback(
    (next: string | null) => {
      if (!store) return;
      if (next) store.setItem(STORAGE_KEY, next);
      else store.removeItem(STORAGE_KEY);
    },
    [store],
  );

  const logout = useCallback(() => {
    persistToken(null);
    setToken(null);
    setUser(null);
    setError(null);
  }, [persistToken]);

  const refresh = useCallback(async () => {
    if (!token || refreshingRef.current) return;
    refreshingRef.current = true;
    setIsLoading(true);
    try {
      const res = await doFetch(`${base}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) {
        throw new Error(await readError(res));
      }
      const body = (await res.json()) as { user: AuthUser };
      setUser(body.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'refresh failed');
    } finally {
      refreshingRef.current = false;
      setIsLoading(false);
    }
  }, [base, doFetch, logout, token]);

  useEffect(() => {
    if (token && !user) void refresh();
    else if (!token) setIsLoading(false);
  }, [token, user, refresh]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      setError(null);
      setIsLoading(true);
      try {
        const res = await doFetch(`${base}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw new Error(await readError(res));
        const body = (await res.json()) as { token: string; user: AuthUser };
        persistToken(body.token);
        setToken(body.token);
        setUser(body.user);
        return body.user;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'login failed';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [base, doFetch, persistToken],
  );

  const register = useCallback(
    async (email: string, password: string, name: string): Promise<AuthUser> => {
      setError(null);
      setIsLoading(true);
      try {
        const res = await doFetch(`${base}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        });
        if (!res.ok) throw new Error(await readError(res));
        const body = (await res.json()) as { token: string; user: AuthUser };
        persistToken(body.token);
        setToken(body.token);
        setUser(body.user);
        return body.user;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'register failed';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [base, doFetch, persistToken],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      error,
      login,
      register,
      logout,
      refresh,
    }),
    [user, token, isLoading, error, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
