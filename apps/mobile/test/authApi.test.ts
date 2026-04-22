import {
  AuthUnauthorizedError,
  fetchAuthLogin,
  fetchAuthMe,
  fetchAuthRegister,
} from '../src/services/authApi';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const USER = { id: 'u1', email: 'a@b.com', name: '한글', plan: 'free' as const };

describe('authApi.fetchAuthRegister', () => {
  it('POST /auth/register 성공 시 토큰과 사용자 반환', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(201, { token: 'jwt', user: USER }));
    const result = await fetchAuthRegister(
      { apiBase: '/api', fetchImpl: fetchImpl as unknown as typeof fetch },
      'a@b.com',
      'superSecret1',
      '한글',
    );
    expect(result.token).toBe('jwt');
    expect(result.user.email).toBe('a@b.com');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('/api/auth/register');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      email: 'a@b.com',
      password: 'superSecret1',
      name: '한글',
    });
  });

  it('실패 응답은 Error 로 throw (서버 error 메시지 포함)', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(
        jsonResponse(409, { error: 'Email is already registered', code: 'AUTH_EMAIL_TAKEN' }),
      );
    await expect(
      fetchAuthRegister(
        { apiBase: '/api', fetchImpl: fetchImpl as unknown as typeof fetch },
        'a@b.com',
        'superSecret1',
        '한글',
      ),
    ).rejects.toThrow(/already registered/);
  });
});

describe('authApi.fetchAuthLogin', () => {
  it('POST /auth/login 성공', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(200, { token: 'jwt', user: USER }));
    const res = await fetchAuthLogin(
      { apiBase: '/api', fetchImpl: fetchImpl as unknown as typeof fetch },
      'a@b.com',
      'superSecret1',
    );
    expect(res.token).toBe('jwt');
  });

  it('401 Unauthorized → Error throw', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse(401, { error: 'Invalid email or password' }));
    await expect(
      fetchAuthLogin(
        { apiBase: '/api', fetchImpl: fetchImpl as unknown as typeof fetch },
        'a@b.com',
        'wrong',
      ),
    ).rejects.toThrow(/Invalid/);
  });
});

describe('authApi.fetchAuthMe', () => {
  it('토큰으로 user 복원', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(200, { user: USER }));
    const u = await fetchAuthMe(
      { apiBase: '/api', fetchImpl: fetchImpl as unknown as typeof fetch },
      'jwt',
    );
    expect(u.id).toBe('u1');
    const [, init] = fetchImpl.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt');
  });

  it('401 → AuthUnauthorizedError 전용 타입 throw', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(401, { error: 'expired' }));
    await expect(
      fetchAuthMe({ apiBase: '/api', fetchImpl: fetchImpl as unknown as typeof fetch }, 'expired'),
    ).rejects.toBeInstanceOf(AuthUnauthorizedError);
  });

  it('응답이 JSON 이 아니면 HTTP 상태 메시지', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(new Response('plain text', { status: 500 }));
    await expect(
      fetchAuthMe({ apiBase: '/api', fetchImpl: fetchImpl as unknown as typeof fetch }, 'tok'),
    ).rejects.toThrow(/HTTP 500/);
  });
});
