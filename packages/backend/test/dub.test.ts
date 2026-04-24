import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv, Env } from '../src/types';
import { createMockDB, fakeAuthMiddleware, jsonReq } from './helpers';

const mockDB = createMockDB();

const mockListLanguages = vi.fn().mockResolvedValue({
  result: { languages: [{ code: 'ko', name: 'Korean' }, { code: 'en', name: 'English' }] },
});
const mockListSpaces = vi.fn().mockResolvedValue({ result: [{ spaceSeq: 1 }] });
const mockGetSasToken = vi.fn().mockResolvedValue({
  blobSasUrl: 'https://blob.azure.test/audio.wav?sig=test',
  expirationDatetime: '2099-01-01T00:00:00Z',
});
const mockUploadToBlob = vi.fn().mockResolvedValue(undefined);
const mockRegisterAudio = vi.fn().mockResolvedValue({
  seq: 42,
  originalName: 'audio.wav',
  audioFilePath: '/audio/42.wav',
  size: 1024,
  durationMs: 5000,
});
const mockRequestTranslation = vi.fn().mockResolvedValue({
  result: { startGenerateProjectIdList: [101] },
});
const mockGetProgress = vi.fn();
const mockGetDownloadInfo = vi.fn();
const mockDownload = vi.fn();

vi.mock('../src/lib/db', () => ({
  getDB: () => mockDB.client,
}));

vi.mock('../src/lib/perso', () => ({
  PersoClient: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.listLanguages = mockListLanguages;
    this.listSpaces = mockListSpaces;
    this.getSasToken = mockGetSasToken;
    this.uploadToBlob = mockUploadToBlob;
    this.registerAudio = mockRegisterAudio;
    this.requestTranslation = mockRequestTranslation;
    this.getProgress = mockGetProgress;
    this.getDownloadInfo = mockGetDownloadInfo;
    this.download = mockDownload;
  }),
}));

import dubRoutes from '../src/routes/dub';

const ENV: Env = {
  PERSO_API_KEY: 'test-key',
  ELEVENLABS_API_KEY: 'x',
  TURSO_DATABASE_URL: 'x',
  TURSO_AUTH_TOKEN: 'x',
  GOOGLE_CLIENT_ID: 'x',
  JWT_SECRET: 'test-secret-32-chars-or-longer-pls!',
  PASSWORD_PEPPER: 'pepper-test',
  ENVIRONMENT: 'test',
};

function buildApp(userId = 'user-1') {
  const app = new Hono<AppEnv>();
  app.use('*', fakeAuthMiddleware(userId));
  app.route('/dub', dubRoutes);
  return {
    req: (r: Request) => app.request(r, undefined, ENV),
  };
}

function multipartReq(
  path: string,
  fields: Record<string, string | Blob>,
): Request {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    form.append(k, v);
  }
  return new Request(`http://localhost${path}`, { method: 'POST', body: form });
}

const VALID_UUID = '12345678-1234-1234-1234-123456789012';

beforeEach(() => {
  mockDB.reset();
  vi.clearAllMocks();
  mockListLanguages.mockResolvedValue({
    result: { languages: [{ code: 'ko', name: 'Korean' }, { code: 'en', name: 'English' }] },
  });
  mockListSpaces.mockResolvedValue({ result: [{ spaceSeq: 1 }] });
  mockGetSasToken.mockResolvedValue({
    blobSasUrl: 'https://blob.azure.test/audio.wav?sig=test',
    expirationDatetime: '2099-01-01T00:00:00Z',
  });
  mockUploadToBlob.mockResolvedValue(undefined);
  mockRegisterAudio.mockResolvedValue({
    seq: 42, originalName: 'audio.wav', audioFilePath: '/audio/42.wav', size: 1024, durationMs: 5000,
  });
  mockRequestTranslation.mockResolvedValue({
    result: { startGenerateProjectIdList: [101] },
  });
});

describe('GET /dub/languages', () => {
  it('언어 목록 반환', async () => {
    const app = buildApp();
    const res = await app.req(jsonReq('GET', '/dub/languages'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.languages).toHaveLength(2);
    expect(data.languages[0].code).toBe('ko');
    expect(data.languages[1].code).toBe('en');
  });

  it('Perso API 에러 시 500', async () => {
    mockListLanguages.mockRejectedValueOnce(new Error('API down'));
    const app = buildApp();
    const res = await app.req(jsonReq('GET', '/dub/languages'));
    expect(res.status).toBe(500);
  });
});

describe('POST /dub', () => {
  const audioBlob = new Blob(['fake-audio-data'], { type: 'audio/wav' });

  it('audio 누락 → 400', async () => {
    const app = buildApp();
    const res = await app.req(
      multipartReq('/dub', { source_language: 'ko', target_language: 'en' }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('required');
  });

  it('source_language 누락 → 400', async () => {
    const app = buildApp();
    const res = await app.req(
      multipartReq('/dub', { audio: new File([audioBlob], 'test.wav'), target_language: 'en' }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('required');
  });

  it('target_language 누락 → 400', async () => {
    const app = buildApp();
    const res = await app.req(
      multipartReq('/dub', { audio: new File([audioBlob], 'test.wav'), source_language: 'ko' }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('required');
  });

  it('source == target → 400', async () => {
    const app = buildApp();
    const res = await app.req(
      multipartReq('/dub', {
        audio: new File([audioBlob], 'test.wav'),
        source_language: 'ko',
        target_language: 'ko',
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('different');
  });

  it('잘못된 source_message_id 포맷 → 400', async () => {
    const app = buildApp();
    const res = await app.req(
      multipartReq('/dub', {
        audio: new File([audioBlob], 'test.wav'),
        source_language: 'ko',
        target_language: 'en',
        source_message_id: 'not-a-uuid',
      }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid source_message_id');
  });

  it('성공 → 201 + dub_id 반환', async () => {
    mockDB.pushResult([]); // INSERT dub_jobs
    mockDB.pushResult([]); // UPDATE dub_jobs (processing)
    const app = buildApp();
    const res = await app.req(
      multipartReq('/dub', {
        audio: new File([audioBlob], 'test.wav'),
        source_language: 'ko',
        target_language: 'en',
      }),
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.dub_id).toBeDefined();
    expect(data.status).toBe('processing');
    expect(mockGetSasToken).toHaveBeenCalled();
    expect(mockUploadToBlob).toHaveBeenCalled();
    expect(mockRegisterAudio).toHaveBeenCalledWith(1, 'https://blob.azure.test/audio.wav', 'test.wav');
    expect(mockRequestTranslation).toHaveBeenCalled();
  });

  it('성공 + source_message_id 포함', async () => {
    mockDB.pushResult([]); // INSERT dub_jobs
    mockDB.pushResult([]); // UPDATE dub_jobs (processing)
    const app = buildApp();
    const res = await app.req(
      multipartReq('/dub', {
        audio: new File([audioBlob], 'test.wav'),
        source_language: 'ko',
        target_language: 'en',
        source_message_id: VALID_UUID,
      }),
    );
    expect(res.status).toBe(201);
    const insertCall = mockDB.calls[0];
    expect(insertCall.args).toContain(VALID_UUID);
  });

  it('Perso 에러 → 500 + DB에 failed 기록', async () => {
    mockDB.pushResult([]); // UPDATE dub_jobs (failed)
    mockListSpaces.mockRejectedValueOnce(new Error('Perso unavailable'));
    const app = buildApp();
    const res = await app.req(
      multipartReq('/dub', {
        audio: new File([audioBlob], 'test.wav'),
        source_language: 'ko',
        target_language: 'en',
      }),
    );
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to start dubbing');
    const failedUpdate = mockDB.calls[0];
    expect(failedUpdate.sql).toContain('failed');
  });

  it('space 없음 → 500', async () => {
    mockDB.pushResult([]); // INSERT
    mockDB.pushResult([]); // UPDATE failed
    mockListSpaces.mockResolvedValueOnce({ result: [] });
    const app = buildApp();
    const res = await app.req(
      multipartReq('/dub', {
        audio: new File([audioBlob], 'test.wav'),
        source_language: 'ko',
        target_language: 'en',
      }),
    );
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.detail).toContain('No Perso spaces');
  });
});

describe('GET /dub/jobs', () => {
  it('빈 목록 반환', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.req(jsonReq('GET', '/dub/jobs'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.jobs).toEqual([]);
  });

  it('작업 목록 반환', async () => {
    mockDB.pushResult([
      { id: 'job-1', source_language: 'ko', target_language: 'en', status: 'ready', progress: 100 },
    ]);
    const app = buildApp();
    const res = await app.req(jsonReq('GET', '/dub/jobs'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.jobs).toHaveLength(1);
  });
});

describe('GET /dub/:id', () => {
  it('잘못된 UUID 포맷 → 400', async () => {
    const app = buildApp();
    const res = await app.req(jsonReq('GET', '/dub/not-a-uuid'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid');
  });

  it('존재하지 않는 작업 → 404', async () => {
    mockDB.pushResult([]);
    const app = buildApp();
    const res = await app.req(jsonReq('GET', `/dub/${VALID_UUID}`));
    expect(res.status).toBe(404);
  });

  it('완료된 작업(ready) 반환', async () => {
    mockDB.pushResult([{
      id: VALID_UUID,
      user_id: 'user-1',
      status: 'ready',
      progress: 100,
      result_message_id: 'msg-1',
      error_message: null,
    }]);
    const app = buildApp();
    const res = await app.req(jsonReq('GET', `/dub/${VALID_UUID}`));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ready');
    expect(data.progress).toBe(100);
  });

  it('실패한 작업(failed) 반환', async () => {
    mockDB.pushResult([{
      id: VALID_UUID,
      user_id: 'user-1',
      status: 'failed',
      progress: 30,
      error_message: 'Dubbing failed',
      result_message_id: null,
    }]);
    const app = buildApp();
    const res = await app.req(jsonReq('GET', `/dub/${VALID_UUID}`));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('failed');
    expect(data.error_message).toBe('Dubbing failed');
  });

  it('업로딩 중(uploading) → progress 0', async () => {
    mockDB.pushResult([{
      id: VALID_UUID,
      user_id: 'user-1',
      status: 'uploading',
      progress: 0,
      error_message: null,
      result_message_id: null,
    }]);
    const app = buildApp();
    const res = await app.req(jsonReq('GET', `/dub/${VALID_UUID}`));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('uploading');
    expect(data.progress).toBe(0);
  });

  it('진행중(processing) — Perso 진행률 폴링', async () => {
    mockDB.pushResult([{
      id: VALID_UUID,
      user_id: 'user-1',
      status: 'processing',
      progress: 0,
      perso_project_seq: 101,
      perso_space_seq: 1,
      error_message: null,
      result_message_id: null,
    }]);
    mockDB.pushResult([]); // UPDATE progress
    mockGetProgress.mockResolvedValueOnce({
      result: { projectSeq: 101, progress: 45, progressReason: '', hasFailed: false, expectedRemainingTimeMinutes: 3 },
    });
    const app = buildApp();
    const res = await app.req(jsonReq('GET', `/dub/${VALID_UUID}`));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('processing');
    expect(data.progress).toBe(45);
    expect(data.expected_remaining_minutes).toBe(3);
  });

  it('진행중 → Perso에서 실패 보고', async () => {
    mockDB.pushResult([{
      id: VALID_UUID,
      user_id: 'user-1',
      status: 'processing',
      progress: 0,
      perso_project_seq: 101,
      perso_space_seq: 1,
      error_message: null,
      result_message_id: null,
    }]);
    mockDB.pushResult([]); // UPDATE failed
    mockGetProgress.mockResolvedValueOnce({
      result: { projectSeq: 101, progress: 20, progressReason: 'Audio too short', hasFailed: true },
    });
    const app = buildApp();
    const res = await app.req(jsonReq('GET', `/dub/${VALID_UUID}`));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('failed');
    expect(data.error_message).toBe('Audio too short');
  });

  it('진행중 → Perso 진행률 폴링 에러 → 500', async () => {
    mockDB.pushResult([{
      id: VALID_UUID,
      user_id: 'user-1',
      status: 'processing',
      progress: 0,
      perso_project_seq: 101,
      perso_space_seq: 1,
      error_message: null,
      result_message_id: null,
    }]);
    mockGetProgress.mockRejectedValueOnce(new Error('Network timeout'));
    const app = buildApp();
    const res = await app.req(jsonReq('GET', `/dub/${VALID_UUID}`));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain('Failed to check');
  });

  it('진행 100% → 다운로드 불가(no translated voice)', async () => {
    mockDB.pushResult([{
      id: VALID_UUID,
      user_id: 'user-1',
      status: 'processing',
      progress: 0,
      perso_project_seq: 101,
      perso_space_seq: 1,
      source_message_id: null,
      error_message: null,
      result_message_id: null,
    }]);
    mockDB.pushResult([]); // UPDATE failed
    mockGetProgress.mockResolvedValueOnce({
      result: { projectSeq: 101, progress: 100, progressReason: '', hasFailed: false },
    });
    mockGetDownloadInfo.mockResolvedValueOnce({ hasTranslatedVoice: false, hasOriginalVoiceOnly: true, hasTranslatedVideo: false });
    const app = buildApp();
    const res = await app.req(jsonReq('GET', `/dub/${VALID_UUID}`));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('failed');
    expect(data.error_message).toContain('No translated audio');
  });
});
