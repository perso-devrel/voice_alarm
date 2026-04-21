import { describe, expect, it } from 'vitest';
import {
  EnrollResultSchema,
  MockVoiceProvider,
  SeparateResultSchema,
  SynthesizeResultSchema,
} from '../src/index.js';

describe('MockVoiceProvider.enroll', () => {
  it('유효 입력을 받으면 ready 상태의 voiceId 를 반환한다', async () => {
    const provider = new MockVoiceProvider();
    const result = await provider.enroll({
      userId: 'u_1',
      displayName: '엄마 목소리',
      samples: [{ uri: 'file://a.wav', durationMs: 5000 }],
    });
    expect(() => EnrollResultSchema.parse(result)).not.toThrow();
    expect(result.status).toBe('ready');
    expect(result.provider).toBe('mock');
    expect(result.voiceId).toContain('u_1');
  });

  it('같은 userId/displayName 은 결정론적으로 같은 voiceId 를 반환한다', async () => {
    const provider = new MockVoiceProvider();
    const a = await provider.enroll({
      userId: 'u_2',
      displayName: '아빠',
      samples: [{ uri: 'file://x.wav', durationMs: 1000 }],
    });
    const b = await provider.enroll({
      userId: 'u_2',
      displayName: '아빠',
      samples: [{ uri: 'file://y.wav', durationMs: 2000 }],
    });
    expect(a.voiceId).toBe(b.voiceId);
  });

  it('samples 배열이 비어있으면 검증 실패한다', async () => {
    const provider = new MockVoiceProvider();
    await expect(
      provider.enroll({
        userId: 'u_1',
        displayName: '엄마',
        samples: [],
      }),
    ).rejects.toThrow();
  });
});

describe('MockVoiceProvider.synthesize', () => {
  it('텍스트 길이에 비례한 durationMs 를 돌려준다', async () => {
    const provider = new MockVoiceProvider();
    const result = await provider.synthesize({
      voiceId: 'mock_vp_u_1_x',
      text: '안녕하세요, 좋은 아침입니다!',
      languageCode: 'ko-KR',
    });
    expect(() => SynthesizeResultSchema.parse(result)).not.toThrow();
    expect(result.durationMs).toBeGreaterThanOrEqual(500);
    expect(result.audioUri.startsWith('mock://tts/')).toBe(true);
  });

  it('빈 텍스트는 검증 실패한다', async () => {
    const provider = new MockVoiceProvider();
    await expect(
      provider.synthesize({
        voiceId: 'mock_vp_u_1_x',
        text: '',
        languageCode: 'ko-KR',
      }),
    ).rejects.toThrow();
  });
});

describe('MockVoiceProvider.separate', () => {
  it('최소 1명, maxSpeakers 이하의 화자를 반환한다', async () => {
    const provider = new MockVoiceProvider();
    const result = await provider.separate({
      audioUri: 'file://call_001.wav',
      maxSpeakers: 3,
    });
    expect(() => SeparateResultSchema.parse(result)).not.toThrow();
    expect(result.speakers.length).toBeGreaterThanOrEqual(1);
    expect(result.speakers.length).toBeLessThanOrEqual(3);
  });

  it('같은 audioUri 에 대해 결정론적으로 같은 화자 수를 돌려준다', async () => {
    const provider = new MockVoiceProvider();
    const a = await provider.separate({ audioUri: 'file://same.wav', maxSpeakers: 3 });
    const b = await provider.separate({ audioUri: 'file://same.wav', maxSpeakers: 3 });
    expect(a.speakers.length).toBe(b.speakers.length);
  });
});
