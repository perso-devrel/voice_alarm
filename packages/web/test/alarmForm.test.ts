import { describe, it, expect } from 'vitest';
import {
  buildCreatePayload,
  parseRepeatDays,
  validateAlarmForm,
  type AlarmFormInput,
} from '../src/lib/alarmForm';

const baseInput: AlarmFormInput = {
  messageId: '10000000-0000-4000-8000-000000000001',
  time: '07:00',
  repeatDays: [],
  mode: 'tts',
};

describe('parseRepeatDays', () => {
  it('배열은 정수만 필터', () => {
    expect(parseRepeatDays([0, 1, 6])).toEqual([0, 1, 6]);
  });
  it('문자열 JSON 파싱', () => {
    expect(parseRepeatDays('[1,3,5]')).toEqual([1, 3, 5]);
  });
  it('빈 문자열 → 빈 배열', () => {
    expect(parseRepeatDays('')).toEqual([]);
  });
  it('잘못된 JSON → 빈 배열', () => {
    expect(parseRepeatDays('{bad')).toEqual([]);
  });
  it('null/undefined → 빈 배열', () => {
    expect(parseRepeatDays(null)).toEqual([]);
    expect(parseRepeatDays(undefined)).toEqual([]);
  });
  it('비정수 필터링', () => {
    expect(parseRepeatDays([1, '2', 3.5, null, 4])).toEqual([1, 4]);
  });
});

describe('buildCreatePayload', () => {
  it('기본 TTS 모드 — voice_profile_id/speaker_id 제외', () => {
    const payload = buildCreatePayload(baseInput);
    expect(payload).toEqual({
      message_id: baseInput.messageId,
      time: '07:00',
      repeat_days: [],
      mode: 'tts',
    });
  });

  it('sound-only + voice_profile_id/speaker_id 포함', () => {
    const payload = buildCreatePayload({
      ...baseInput,
      mode: 'sound-only',
      voiceProfileId: '40000000-0000-4000-8000-000000000001',
      speakerId: '50000000-0000-4000-8000-000000000001',
    });
    expect(payload.mode).toBe('sound-only');
    expect(payload.voice_profile_id).toBe('40000000-0000-4000-8000-000000000001');
    expect(payload.speaker_id).toBe('50000000-0000-4000-8000-000000000001');
  });

  it('snoozeMinutes 가 숫자면 포함', () => {
    const payload = buildCreatePayload({ ...baseInput, snoozeMinutes: 10 });
    expect(payload.snooze_minutes).toBe(10);
  });

  it('repeat_days 가 배열이 아닐 때도 빈 배열로 안전하게 처리', () => {
    // @ts-expect-error — intentional 잘못된 입력
    const payload = buildCreatePayload({ ...baseInput, repeatDays: null });
    expect(payload.repeat_days).toEqual([]);
  });
});

describe('validateAlarmForm', () => {
  it('메시지 미선택이면 에러', () => {
    const res = validateAlarmForm({ ...baseInput, messageId: null });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain('메시지');
  });

  it('잘못된 시간 형식이면 에러', () => {
    const res = validateAlarmForm({ ...baseInput, time: '7am' });
    expect(res.ok).toBe(false);
  });

  it('mode 가 허용값 밖이면 에러', () => {
    // @ts-expect-error — intentional 잘못된 모드
    const res = validateAlarmForm({ ...baseInput, mode: 'video' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain('재생 모드');
  });

  it('sound-only + voice_profile_id 누락이면 에러', () => {
    const res = validateAlarmForm({ ...baseInput, mode: 'sound-only' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain('음성 프로필');
  });

  it('정상 TTS → ok + payload', () => {
    const res = validateAlarmForm(baseInput);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.payload.mode).toBe('tts');
  });

  it('정상 sound-only + voice_profile_id → ok', () => {
    const res = validateAlarmForm({
      ...baseInput,
      mode: 'sound-only',
      voiceProfileId: '40000000-0000-4000-8000-000000000001',
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.payload.mode).toBe('sound-only');
      expect(res.payload.voice_profile_id).toBe('40000000-0000-4000-8000-000000000001');
    }
  });
});
