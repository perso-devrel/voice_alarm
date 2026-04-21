import {
  MOCK_DEFAULT_ALARM_URI,
  MOCK_VOICE_SAMPLE_URI,
  buildAlarmPreviewAction,
  getAlarmModeBadge,
  resolveAlarmPlayback,
  type PlaybackPlan,
} from '../src/lib/alarmPlayback';
import type { Alarm, Message, VoiceProfile } from '../src/types';

const MSG: Message = {
  id: '10000000-0000-4000-8000-000000000001',
  user_id: 'u1',
  voice_profile_id: '40000000-0000-4000-8000-000000000001',
  text: '좋은 아침이야',
  audio_url: null,
  category: 'morning',
  is_preset: false,
  created_at: '2026-04-21T00:00:00Z',
  voice_name: '엄마',
};

const READY_VOICE: VoiceProfile = {
  id: '40000000-0000-4000-8000-000000000001',
  user_id: 'u1',
  name: '엄마',
  perso_voice_id: null,
  elevenlabs_voice_id: null,
  avatar_url: null,
  status: 'ready',
  created_at: '2026-04-21T00:00:00Z',
  updated_at: '2026-04-21T00:00:00Z',
};

const PROCESSING_VOICE: VoiceProfile = { ...READY_VOICE, id: '40000000-0000-4000-8000-000000000002', status: 'processing' };

const BASE_ALARM: Alarm = {
  id: 'a1',
  user_id: 'u1',
  target_user_id: null,
  message_id: MSG.id,
  time: '07:00',
  repeat_days: [],
  is_active: true,
  snooze_minutes: 5,
  created_at: '2026-04-21T00:00:00Z',
  updated_at: '2026-04-21T00:00:00Z',
  mode: 'tts',
  voice_profile_id: null,
  speaker_id: null,
};

describe('resolveAlarmPlayback', () => {
  it('tts 모드 — 메시지 매칭 시 kind=tts 반환', () => {
    const plan = resolveAlarmPlayback(BASE_ALARM, [MSG], [READY_VOICE]);
    expect(plan.kind).toBe('tts');
    if (plan.kind === 'tts') {
      expect(plan.text).toBe('좋은 아침이야');
      expect(plan.voiceName).toBe('엄마');
      expect(plan.category).toBe('morning');
    }
  });

  it('tts 모드 — 메시지 누락 시 alarm.message_text fallback', () => {
    const plan = resolveAlarmPlayback(
      { ...BASE_ALARM, message_text: '캐시된 텍스트', voice_name: '아빠', category: 'night' },
      [],
      [],
    );
    expect(plan.kind).toBe('tts');
    if (plan.kind === 'tts') {
      expect(plan.text).toBe('캐시된 텍스트');
      expect(plan.voiceName).toBe('아빠');
    }
  });

  it('tts 모드 — 메시지도 message_text 도 없으면 error', () => {
    const plan = resolveAlarmPlayback(
      { ...BASE_ALARM, message_id: '' as string, message_text: undefined },
      [],
      [],
    );
    expect(plan.kind).toBe('error');
  });

  it('sound-only + ready voice_profile → uri=MOCK_VOICE_SAMPLE_URI', () => {
    const plan = resolveAlarmPlayback(
      { ...BASE_ALARM, mode: 'sound-only', voice_profile_id: READY_VOICE.id },
      [MSG],
      [READY_VOICE],
    );
    expect(plan.kind).toBe('sound-only');
    if (plan.kind === 'sound-only') {
      expect(plan.uri).toBe(MOCK_VOICE_SAMPLE_URI);
      expect(plan.voiceName).toBe('엄마');
    }
  });

  it('sound-only + voice_profile_id 누락 → fallback', () => {
    const plan = resolveAlarmPlayback(
      { ...BASE_ALARM, mode: 'sound-only', voice_profile_id: null },
      [MSG],
      [READY_VOICE],
    );
    expect(plan.kind).toBe('fallback');
    if (plan.kind === 'fallback') {
      expect(plan.uri).toBe(MOCK_DEFAULT_ALARM_URI);
      expect(plan.reason).toContain('지정되지');
    }
  });

  it('sound-only + 매칭 안 되는 profile id → fallback', () => {
    const plan = resolveAlarmPlayback(
      { ...BASE_ALARM, mode: 'sound-only', voice_profile_id: 'unknown' },
      [MSG],
      [READY_VOICE],
    );
    expect(plan.kind).toBe('fallback');
    if (plan.kind === 'fallback') expect(plan.reason).toContain('찾을 수 없어');
  });

  it('sound-only + processing 상태 voice → fallback (준비되지 않음)', () => {
    const plan = resolveAlarmPlayback(
      { ...BASE_ALARM, mode: 'sound-only', voice_profile_id: PROCESSING_VOICE.id },
      [MSG],
      [PROCESSING_VOICE],
    );
    expect(plan.kind).toBe('fallback');
    if (plan.kind === 'fallback') expect(plan.reason).toContain('준비');
  });

  it('mode 미지정(undefined) 이면 tts 로 기본 해석', () => {
    const plan = resolveAlarmPlayback(
      { ...BASE_ALARM, mode: undefined },
      [MSG],
      [READY_VOICE],
    );
    expect(plan.kind).toBe('tts');
  });
});

describe('getAlarmModeBadge', () => {
  it('sound-only → 🔊 원본', () => {
    expect(getAlarmModeBadge('sound-only')).toEqual({ emoji: '🔊', label: '원본' });
  });

  it('tts → 🗣️ TTS', () => {
    expect(getAlarmModeBadge('tts')).toEqual({ emoji: '🗣️', label: 'TTS' });
  });

  it('undefined → TTS 기본', () => {
    expect(getAlarmModeBadge(undefined)).toEqual({ emoji: '🗣️', label: 'TTS' });
  });
});

describe('buildAlarmPreviewAction', () => {
  it('tts plan → navigate /player 액션, 파라미터 포함', () => {
    const plan: PlaybackPlan = {
      kind: 'tts',
      messageId: 'm1',
      text: '일어나자',
      voiceName: '엄마',
      category: 'morning',
    };
    const action = buildAlarmPreviewAction(plan);
    expect(action.type).toBe('navigate');
    if (action.type === 'navigate') {
      expect(action.path).toBe('/player');
      expect(action.params).toEqual({
        messageId: 'm1',
        text: '일어나자',
        voiceName: '엄마',
        category: 'morning',
      });
    }
  });

  it('sound-only plan → preview-audio, uri=MOCK_VOICE_SAMPLE_URI + voiceName 캡션', () => {
    const plan: PlaybackPlan = {
      kind: 'sound-only',
      voiceProfileId: 'v1',
      voiceName: '아빠',
      uri: MOCK_VOICE_SAMPLE_URI,
    };
    const action = buildAlarmPreviewAction(plan);
    expect(action.type).toBe('preview-audio');
    if (action.type === 'preview-audio') {
      expect(action.uri).toBe(MOCK_VOICE_SAMPLE_URI);
      expect(action.caption).toContain('아빠');
      expect(action.voiceName).toBe('아빠');
    }
  });

  it('fallback plan → preview-audio, uri=MOCK_DEFAULT_ALARM_URI + 안내 캡션', () => {
    const plan: PlaybackPlan = {
      kind: 'fallback',
      uri: MOCK_DEFAULT_ALARM_URI,
      reason: '음성 프로필이 지정되지 않아 기본 알람 톤으로 재생합니다.',
    };
    const action = buildAlarmPreviewAction(plan);
    expect(action.type).toBe('preview-audio');
    if (action.type === 'preview-audio') {
      expect(action.uri).toBe(MOCK_DEFAULT_ALARM_URI);
      expect(action.caption).toContain('지정되지');
      expect(action.voiceName).toBe('');
    }
  });

  it('error plan → toast 메시지로 전달', () => {
    const plan: PlaybackPlan = { kind: 'error', reason: '재생할 메시지를 찾을 수 없습니다.' };
    const action = buildAlarmPreviewAction(plan);
    expect(action.type).toBe('toast');
    if (action.type === 'toast') expect(action.message).toContain('찾을 수 없');
  });

  it('resolve → action 엔드투엔드: tts 정상 경로', () => {
    const plan = resolveAlarmPlayback(
      {
        mode: 'tts',
        voice_profile_id: null,
        message_id: 'm1',
        message_text: '굿모닝',
        voice_name: '엄마',
        category: 'morning',
      },
      [],
      [],
    );
    const action = buildAlarmPreviewAction(plan);
    expect(action.type).toBe('navigate');
  });

  it('resolve → action 엔드투엔드: sound-only voice 미지정 → fallback preview', () => {
    const plan = resolveAlarmPlayback(
      {
        mode: 'sound-only',
        voice_profile_id: null,
        message_id: 'm1',
        message_text: '텍스트',
        voice_name: '엄마',
        category: 'morning',
      },
      [],
      [],
    );
    const action = buildAlarmPreviewAction(plan);
    expect(action.type).toBe('preview-audio');
    if (action.type === 'preview-audio') expect(action.uri).toBe(MOCK_DEFAULT_ALARM_URI);
  });
});
