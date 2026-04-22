export type AlarmMode = 'tts' | 'sound-only';

export interface AlarmFormInput {
  messageId: string | null;
  time: string;
  repeatDays: number[];
  mode: AlarmMode;
  voiceProfileId?: string | null;
  speakerId?: string | null;
  snoozeMinutes?: number;
  targetUserId?: string | null;
}

export interface AlarmCreatePayload {
  message_id: string;
  time: string;
  repeat_days: number[];
  mode: AlarmMode;
  voice_profile_id?: string;
  speaker_id?: string;
  snooze_minutes?: number;
  target_user_id?: string;
}

export type ValidationResult =
  | { ok: true; payload: AlarmCreatePayload }
  | { ok: false; error: string };

export function validateAlarmForm(input: AlarmFormInput): ValidationResult {
  if (!input.messageId) {
    return { ok: false, error: '메시지를 선택해주세요.' };
  }
  if (!/^\d{2}:\d{2}$/.test(input.time)) {
    return { ok: false, error: '시간 형식이 올바르지 않습니다.' };
  }
  if (input.mode !== 'tts' && input.mode !== 'sound-only') {
    return { ok: false, error: '재생 모드가 올바르지 않습니다.' };
  }
  if (input.mode === 'sound-only' && !input.voiceProfileId) {
    return {
      ok: false,
      error: '원본 재생 모드에서는 음성 프로필을 지정해야 합니다.',
    };
  }
  return { ok: true, payload: buildCreatePayload(input) };
}

export function buildCreatePayload(input: AlarmFormInput): AlarmCreatePayload {
  const payload: AlarmCreatePayload = {
    message_id: input.messageId ?? '',
    time: input.time,
    repeat_days: Array.isArray(input.repeatDays) ? input.repeatDays : [],
    mode: input.mode,
  };
  if (input.voiceProfileId) payload.voice_profile_id = input.voiceProfileId;
  if (input.speakerId) payload.speaker_id = input.speakerId;
  if (typeof input.snoozeMinutes === 'number') payload.snooze_minutes = input.snoozeMinutes;
  if (input.targetUserId) payload.target_user_id = input.targetUserId;
  return payload;
}

export function parseRepeatDays(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw.filter((n): n is number => Number.isInteger(n));
  }
  if (typeof raw === 'string' && raw.length > 0) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((n): n is number => Number.isInteger(n));
      }
    } catch {
      return [];
    }
  }
  return [];
}
