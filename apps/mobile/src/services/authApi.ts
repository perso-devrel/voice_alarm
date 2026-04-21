export interface AuthUser {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'plus' | 'family';
}

export interface AuthTokenResponse {
  token: string;
  user: AuthUser;
}

export interface AuthClientConfig {
  apiBase: string;
  fetchImpl?: typeof fetch;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; code?: string };
    return body.error ?? body.code ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function fetchAuthRegister(
  { apiBase, fetchImpl = fetch }: AuthClientConfig,
  email: string,
  password: string,
  name: string,
): Promise<AuthTokenResponse> {
  const res = await fetchImpl(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as AuthTokenResponse;
}

export async function fetchAuthLogin(
  { apiBase, fetchImpl = fetch }: AuthClientConfig,
  email: string,
  password: string,
): Promise<AuthTokenResponse> {
  const res = await fetchImpl(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as AuthTokenResponse;
}

export class AuthUnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'AuthUnauthorizedError';
  }
}

export async function fetchAuthMe(
  { apiBase, fetchImpl = fetch }: AuthClientConfig,
  token: string,
): Promise<AuthUser> {
  const res = await fetchImpl(`${apiBase}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new AuthUnauthorizedError();
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { user: AuthUser };
  return body.user;
}
