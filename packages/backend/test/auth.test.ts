import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../src/types';
import { createMockDB, jsonReq } from './helpers';

const mockDB = createMockDB();

vi.mock('../src/lib/db', () => ({
  getDB: () => mockDB.client,
}));

import authRoutes from '../src/routes/auth';
import { hashPassword } from '../src/lib/password';

const ENV: Env = {
  PERSO_API_KEY: 'x',
  ELEVENLABS_API_KEY: 'x',
  TURSO_DATABASE_URL: 'x',
  TURSO_AUTH_TOKEN: 'x',
  GOOGLE_CLIENT_ID: 'x',
  JWT_SECRET: 'test-secret-32-chars-or-longer-pls!',
  PASSWORD_PEPPER: 'pepper-test',
  ENVIRONMENT: 'test',
};

function buildApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/auth', authRoutes);
  return app;
}

beforeEach(() => {
  mockDB.calls.length = 0;
});

describe('POST /auth/register', () => {
  it('신규 가입 성공 → 201 + 토큰 반환', async () => {
    mockDB.pushResult([]);
    mockDB.pushResult([], 1);

    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/auth/register', {
        email: 'kim@test.com',
        password: 'superSecret1',
        name: '김규원',
      }),
      undefined,
      ENV,
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.token).toMatch(/^[^.]+\.[^.]+\.[^.]+$/);
    expect(body.user.email).toBe('kim@test.com');
    expect(body.user.plan).toBe('free');
  });

  it('중복 이메일 → 409', async () => {
    mockDB.pushResult([{ id: 'u-1' }]);

    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/auth/register', {
        email: 'kim@test.com',
        password: 'superSecret1',
        name: '김규원',
      }),
      undefined,
      ENV,
    );
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe('AUTH_EMAIL_TAKEN');
  });

  it('약한 비밀번호 → 400', async () => {
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/auth/register', {
        email: 'kim@test.com',
        password: 'short',
        name: '김규원',
      }),
      undefined,
      ENV,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('AUTH_VALIDATION_FAILED');
  });

  it('잘못된 이메일 → 400', async () => {
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/auth/register', {
        email: 'not-email',
        password: 'superSecret1',
        name: '김규원',
      }),
      undefined,
      ENV,
    );
    expect(res.status).toBe(400);
  });

  it('잘못된 JSON → 400', async () => {
    const app = buildApp();
    const res = await app.request(
      new Request('http://localhost/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not json',
      }),
      undefined,
      ENV,
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  it('올바른 자격증명으로 로그인 성공', async () => {
    const hash = await hashPassword('superSecret1', ENV.PASSWORD_PEPPER);
    mockDB.pushResult([
      {
        id: 'u-1',
        email: 'kim@test.com',
        password_hash: hash,
        name: '김규원',
        plan: 'plus',
      },
    ]);

    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/auth/login', {
        email: 'kim@test.com',
        password: 'superSecret1',
      }),
      undefined,
      ENV,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.user.plan).toBe('plus');
  });

  it('존재하지 않는 이메일 → 401', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/auth/login', {
        email: 'nouser@test.com',
        password: 'superSecret1',
      }),
      undefined,
      ENV,
    );
    expect(res.status).toBe(401);
  });

  it('비밀번호 불일치 → 401', async () => {
    const hash = await hashPassword('superSecret1', ENV.PASSWORD_PEPPER);
    mockDB.pushResult([
      {
        id: 'u-1',
        email: 'kim@test.com',
        password_hash: hash,
        name: '김규원',
        plan: 'free',
      },
    ]);
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/auth/login', {
        email: 'kim@test.com',
        password: 'wrongPass1',
      }),
      undefined,
      ENV,
    );
    expect(res.status).toBe(401);
  });

  it('OAuth 전용 계정(비밀번호 없음) → 401 OAUTH_ONLY', async () => {
    mockDB.pushResult([
      {
        id: 'u-1',
        email: 'kim@test.com',
        password_hash: null,
        name: '김규원',
        plan: 'free',
      },
    ]);
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/auth/login', {
        email: 'kim@test.com',
        password: 'superSecret1',
      }),
      undefined,
      ENV,
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('AUTH_OAUTH_ONLY');
  });
});

describe('GET /auth/me', () => {
  it('Authorization 헤더 없음 → 401', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/auth/me'), undefined, ENV);
    expect(res.status).toBe(401);
  });

  it('가입 후 받은 토큰으로 /auth/me 호출 성공', async () => {
    mockDB.pushResult([]);
    mockDB.pushResult([], 1);

    const app = buildApp();
    const regRes = await app.request(
      jsonReq('POST', '/auth/register', {
        email: 'kim@test.com',
        password: 'superSecret1',
        name: '김규원',
      }),
      undefined,
      ENV,
    );
    const reg = await regRes.json();
    const token = reg.token as string;

    mockDB.pushResult([{ id: reg.user.id, email: 'kim@test.com', name: '김규원', plan: 'free' }]);

    const meRes = await app.request(
      new Request('http://localhost/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      }),
      undefined,
      ENV,
    );
    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.user.email).toBe('kim@test.com');
  });

  it('잘못된 토큰 → 401', async () => {
    const app = buildApp();
    const res = await app.request(
      new Request('http://localhost/auth/me', {
        headers: { Authorization: 'Bearer garbage' },
      }),
      undefined,
      ENV,
    );
    expect(res.status).toBe(401);
  });
});
