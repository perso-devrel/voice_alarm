import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '../src/types';
import { createMockDB, fakeAuthMiddleware, jsonReq, ID } from './helpers';

const mockDB = createMockDB();

vi.mock('../src/lib/db', () => ({
  getDB: () => mockDB.client,
}));

import alarmRoutes from '../src/routes/alarm';

function buildApp(userId = 'user-1') {
  const app = new Hono<AppEnv>();
  app.use('*', fakeAuthMiddleware(userId));
  app.route('/alarm', alarmRoutes);
  return app;
}

beforeEach(() => {
  mockDB.calls.length = 0;
});

describe('GET /alarm — 알람 목록', () => {
  it('빈 목록 반환', async () => {
    mockDB.pushResult([{ total: 0 }]); // count
    mockDB.pushResult([]); // data
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/alarm'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alarms).toEqual([]);
  });

  it('알람 목록 반환', async () => {
    mockDB.pushResult([{ total: 1 }]); // count
    mockDB.pushResult([
      {
        id: ID.alarm,
        time: '07:00',
        is_active: 1,
        message_text: '좋은 아침!',
        category: 'morning',
        voice_name: 'Mom',
      },
    ]);
    const app = buildApp();
    const res = await app.request(jsonReq('GET', '/alarm'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alarms).toHaveLength(1);
    expect(body.alarms[0].time).toBe('07:00');
  });
});

describe('POST /alarm — 알람 생성', () => {
  it('message_id 누락이면 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { time: '07:00' }));
    expect(res.status).toBe(400);
  });

  it('time 누락이면 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { message_id: ID.message }));
    expect(res.status).toBe(400);
  });

  it('잘못된 time 형식이면 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { message_id: ID.message, time: '7pm' }));
    expect(res.status).toBe(400);
  });

  it('시간 범위 초과 (25:00) 면 400', async () => {
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { message_id: ID.message, time: '25:00' }));
    expect(res.status).toBe(400);
  });

  it('잘못된 repeat_days 면 400', async () => {
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/alarm', { message_id: ID.message, time: '07:00', repeat_days: [7] }),
    );
    expect(res.status).toBe(400);
  });

  it('snooze_minutes 범위 초과면 400', async () => {
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/alarm', { message_id: ID.message, time: '07:00', snooze_minutes: 60 }),
    );
    expect(res.status).toBe(400);
  });

  it('target_user_id 에 친구가 아닌 사용자면 403', async () => {
    mockDB.pushResult([]); // friendship check
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/alarm', { message_id: ID.message, time: '07:00', target_user_id: 'user-2' }),
    );
    expect(res.status).toBe(403);
  });

  it('무료 플랜 알람 2개 초과면 403', async () => {
    mockDB.pushResult([{ plan: 'free' }]); // user plan
    mockDB.pushResult([{ count: 2 }]); // alarm count
    const app = buildApp();
    const res = await app.request(jsonReq('POST', '/alarm', { message_id: ID.message, time: '07:00' }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('무료 플랜');
  });

  it('메시지가 존재하지 않으면 404', async () => {
    mockDB.pushResult([{ plan: 'plus' }]); // user plan (not free, skip count)
    mockDB.pushResult([]); // message lookup
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/alarm', { message_id: ID.messageBad, time: '07:00' }),
    );
    expect(res.status).toBe(404);
  });

  it('정상 생성이면 201', async () => {
    mockDB.pushResult([{ plan: 'plus' }]); // user plan
    mockDB.pushResult([{ id: ID.message }]); // message exists
    mockDB.pushResult([], 1); // insert alarm
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/alarm', { message_id: ID.message, time: '07:00', repeat_days: [1, 3, 5] }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.alarm.time).toBe('07:00');
    expect(body.alarm.repeat_days).toEqual([1, 3, 5]);
  });

  it('target_user_id 있고 친구이면 201', async () => {
    mockDB.pushResult([{ id: ID.friendship }]); // friendship exists
    mockDB.pushResult([{ plan: 'plus' }]); // target user plan
    mockDB.pushResult([{ id: ID.message }]); // message exists
    mockDB.pushResult([], 1); // insert
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/alarm', { message_id: ID.message, time: '08:00', target_user_id: 'user-2' }),
    );
    expect(res.status).toBe(201);
  });

  it('mode 가 허용 목록 밖이면 400', async () => {
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/alarm', { message_id: ID.message, time: '07:00', mode: 'video' }),
    );
    expect(res.status).toBe(400);
  });

  it('voice_profile_id UUID 형식이 아니면 400', async () => {
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/alarm', {
        message_id: ID.message,
        time: '07:00',
        voice_profile_id: 'not-a-uuid',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('speaker_id UUID 형식이 아니면 400', async () => {
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/alarm', {
        message_id: ID.message,
        time: '07:00',
        speaker_id: 'bad',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('mode + voice_profile_id + speaker_id 포함해 정상 생성', async () => {
    const voiceProfileId = '40000000-0000-4000-8000-000000000001';
    const speakerId = '50000000-0000-4000-8000-000000000001';
    mockDB.pushResult([{ plan: 'plus' }]);
    mockDB.pushResult([{ id: ID.message }]);
    mockDB.pushResult([], 1);
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/alarm', {
        message_id: ID.message,
        time: '07:00',
        mode: 'sound-only',
        voice_profile_id: voiceProfileId,
        speaker_id: speakerId,
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.alarm.mode).toBe('sound-only');

    const insert = mockDB.calls.find((c) => c.sql.includes('INSERT INTO alarms'));
    expect(insert).toBeDefined();
    expect(insert!.sql).toContain('mode');
    expect(insert!.sql).toContain('voice_profile_id');
    expect(insert!.sql).toContain('speaker_id');
    expect(insert!.args).toContain('sound-only');
    expect(insert!.args).toContain(voiceProfileId);
    expect(insert!.args).toContain(speakerId);
  });

  it('mode 미지정 시 기본값은 tts', async () => {
    mockDB.pushResult([{ plan: 'plus' }]);
    mockDB.pushResult([{ id: ID.message }]);
    mockDB.pushResult([], 1);
    const app = buildApp();
    const res = await app.request(
      jsonReq('POST', '/alarm', { message_id: ID.message, time: '07:00' }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.alarm.mode).toBe('tts');
    const insert = mockDB.calls.find((c) => c.sql.includes('INSERT INTO alarms'));
    expect(insert!.args).toContain('tts');
  });
});

describe('PATCH /alarm/:id — 알람 수정', () => {
  it('소유하지 않은 알람이면 404', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.request(jsonReq('PATCH', `/alarm/${ID.alarm404}`, { time: '08:00' }));
    expect(res.status).toBe(404);
  });

  it('업데이트 필드가 없으면 400', async () => {
    mockDB.pushResult([{ id: ID.alarm }]);
    const app = buildApp();
    const res = await app.request(jsonReq('PATCH', `/alarm/${ID.alarm}`, {}));
    expect(res.status).toBe(400);
  });

  it('잘못된 time 형식이면 400', async () => {
    mockDB.pushResult([{ id: ID.alarm }]);
    const app = buildApp();
    const res = await app.request(jsonReq('PATCH', `/alarm/${ID.alarm}`, { time: 'bad' }));
    expect(res.status).toBe(400);
  });

  it('정상 수정', async () => {
    mockDB.pushResult([{ id: ID.alarm }]); // existing
    mockDB.pushResult([], 1); // update
    mockDB.pushResult([{ id: ID.alarm, time: '09:30', is_active: 0, snooze_minutes: 5, repeat_days: '[]' }]); // select updated
    const app = buildApp();
    const res = await app.request(
      jsonReq('PATCH', `/alarm/${ID.alarm}`, { time: '09:30', is_active: false }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('mode/voice_profile_id/speaker_id 변경 반영', async () => {
    const voiceProfileId = '40000000-0000-4000-8000-0000000000aa';
    const speakerId = '50000000-0000-4000-8000-0000000000bb';
    mockDB.pushResult([{ id: ID.alarm }]); // existing
    mockDB.pushResult([], 1); // update
    mockDB.pushResult([
      {
        id: ID.alarm,
        time: '07:00',
        is_active: 1,
        snooze_minutes: 5,
        repeat_days: '[]',
        mode: 'sound-only',
        voice_profile_id: voiceProfileId,
        speaker_id: speakerId,
      },
    ]);
    const app = buildApp();
    const res = await app.request(
      jsonReq('PATCH', `/alarm/${ID.alarm}`, {
        mode: 'sound-only',
        voice_profile_id: voiceProfileId,
        speaker_id: speakerId,
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alarm.mode).toBe('sound-only');
    expect(body.alarm.voice_profile_id).toBe(voiceProfileId);
    expect(body.alarm.speaker_id).toBe(speakerId);

    const update = mockDB.calls.find((c) => c.sql.startsWith('UPDATE alarms SET'));
    expect(update).toBeDefined();
    expect(update!.sql).toContain('mode = ?');
    expect(update!.sql).toContain('voice_profile_id = ?');
    expect(update!.sql).toContain('speaker_id = ?');
    expect(update!.args).toContain('sound-only');
    expect(update!.args).toContain(voiceProfileId);
    expect(update!.args).toContain(speakerId);
  });
});

describe('DELETE /alarm/:id — 알람 삭제', () => {
  it('존재하지 않으면 404', async () => {
    mockDB.pushResult([], 0);
    const app = buildApp();
    const res = await app.request(jsonReq('DELETE', `/alarm/${ID.alarm404}`));
    expect(res.status).toBe(404);
  });

  it('정상 삭제', async () => {
    mockDB.pushResult([], 1);
    const app = buildApp();
    const res = await app.request(jsonReq('DELETE', `/alarm/${ID.alarm}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
