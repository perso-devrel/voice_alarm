import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '../src/types';
import { createMockDB, fakeAuthMiddleware } from './helpers';

const mockDB = createMockDB();

vi.mock('../src/lib/db', () => ({
  getDB: () => mockDB.client,
}));

import characterRoutes from '../src/routes/character';

function buildApp(userId = 'google-1') {
  const app = new Hono<AppEnv>();
  app.use('*', fakeAuthMiddleware(userId));
  app.route('/characters', characterRoutes);
  return app;
}

beforeEach(() => {
  mockDB.reset();
});

describe('GET /characters/me', () => {
  it('사용자가 없으면 404', async () => {
    mockDB.pushResult([]); // resolveUserPk → 없음

    const app = buildApp();
    const res = await app.request('/characters/me');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('사용자');
  });

  it('캐릭터가 없으면 기본값으로 생성 후 반환', async () => {
    mockDB.pushResult([{ id: 'user-pk-1' }]); // resolveUserPk
    mockDB.pushResult([]); // SELECT characters WHERE user_id — none
    mockDB.pushResult([], 1); // INSERT
    mockDB.pushResult([
      {
        id: 'char-1',
        user_id: 'user-pk-1',
        name: '내 캐릭터',
        level: 1,
        xp: 0,
        affection: 0,
        stage: 'seed',
        created_at: '2026-04-21 00:00:00',
        updated_at: '2026-04-21 00:00:00',
      },
    ]); // SELECT after insert

    const app = buildApp();
    const res = await app.request('/characters/me');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.character.id).toBe('char-1');
    expect(body.character.user_id).toBe('user-pk-1');
    expect(body.character.level).toBe(1);
    expect(body.character.xp).toBe(0);
    expect(body.character.stage).toBe('seed');
    expect(body.character.name).toBe('내 캐릭터');
    expect(body.progress.xp_into_level).toBe(0);
    expect(body.progress.xp_to_next_level).toBe(100);
    expect(body.progress.progress_ratio).toBe(0);
  });

  it('캐릭터가 있으면 그대로 반환 + 서버가 XP 로 level/stage 재계산', async () => {
    mockDB.pushResult([{ id: 'user-pk-2' }]); // resolveUserPk
    mockDB.pushResult([
      {
        id: 'char-2',
        user_id: 'user-pk-2',
        name: '햇살이',
        level: 999, // 클라이언트가 오염시켰다고 가정
        xp: 500,
        affection: 12,
        stage: 'seed', // 클라이언트가 오염시켰다고 가정
        created_at: '2026-04-20 10:00:00',
        updated_at: '2026-04-21 09:00:00',
      },
    ]);

    const app = buildApp();
    const res = await app.request('/characters/me');
    expect(res.status).toBe(200);
    const body = await res.json();
    // 500 xp → level 3 (100/400 임계 → 3), stage sprout
    expect(body.character.level).toBe(3);
    expect(body.character.stage).toBe('sprout');
    expect(body.character.xp).toBe(500);
    expect(body.character.name).toBe('햇살이');
    expect(body.progress.xp_into_level).toBe(100); // 500 - threshold(3)=400
    expect(body.progress.xp_to_next_level).toBe(400); // threshold(4)=900 - 500
  });

  it('생성 SQL 에 user_id·stage·xp 기본값 바인딩', async () => {
    mockDB.pushResult([{ id: 'user-pk-3' }]);
    mockDB.pushResult([]);
    mockDB.pushResult([], 1);
    mockDB.pushResult([
      {
        id: 'char-3',
        user_id: 'user-pk-3',
        name: '내 캐릭터',
        level: 1,
        xp: 0,
        affection: 0,
        stage: 'seed',
        created_at: '2026-04-21',
        updated_at: '2026-04-21',
      },
    ]);

    const app = buildApp();
    const res = await app.request('/characters/me');
    expect(res.status).toBe(200);

    const insertCall = mockDB.calls.find((c) => c.sql.includes('INSERT INTO characters'));
    expect(insertCall).toBeDefined();
    expect(insertCall!.sql).toContain('level, xp, affection, stage');
    expect(insertCall!.sql).toContain("'seed'");
    // args: [id, userPk, name]
    expect(insertCall!.args[1]).toBe('user-pk-3');
    expect(insertCall!.args[2]).toBe('내 캐릭터');
  });

  it('bloom 단계까지 진입 가능 (level >= 10)', async () => {
    mockDB.pushResult([{ id: 'user-pk-4' }]);
    mockDB.pushResult([
      {
        id: 'char-4',
        user_id: 'user-pk-4',
        name: '오래된나무',
        level: 1,
        xp: 9000, // level 10, stage bloom
        affection: 50,
        stage: 'seed',
        created_at: '',
        updated_at: '',
      },
    ]);

    const app = buildApp();
    const res = await app.request('/characters/me');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.character.level).toBe(10);
    expect(body.character.stage).toBe('bloom');
  });
});
