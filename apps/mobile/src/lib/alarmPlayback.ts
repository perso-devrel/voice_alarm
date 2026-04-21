import type { Alarm, AlarmMode, Message, VoiceProfile } from '../types';

// TODO: real perso.ai voice sample URL — 현재는 번들된 mock 파일 경로
export const MOCK_VOICE_SAMPLE_URI = 'asset:///audio/mock-voice-sample.mp3';
export const MOCK_DEFAULT_ALARM_URI = 'asset:///audio/mock-default-alarm.mp3';

export interface TtsPlaybackPlan {
  kind: 'tts';
  messageId: string;
  text: string;
  voiceName: string;
  category: string;
}

export interface SoundOnlyPlaybackPlan {
  kind: 'sound-only';
  voiceProfileId: string;
  voiceName: string;
  uri: string;
}

export interface FallbackPlaybackPlan {
  kind: 'fallback';
  uri: string;
  reason: string;
}

export interface ErrorPlaybackPlan {
  kind: 'error';
  reason: string;
}

export type PlaybackPlan =
  | TtsPlaybackPlan
  | SoundOnlyPlaybackPlan
  | FallbackPlaybackPlan
  | ErrorPlaybackPlan;

export function resolveAlarmPlayback(
  alarm: Pick<Alarm, 'mode' | 'voice_profile_id' | 'message_id' | 'message_text' | 'voice_name' | 'category'>,
  messages: Pick<Message, 'id' | 'text' | 'voice_name' | 'category'>[],
  voices: Pick<VoiceProfile, 'id' | 'name' | 'status'>[],
): PlaybackPlan {
  const mode: AlarmMode = alarm.mode === 'sound-only' ? 'sound-only' : 'tts';

  if (mode === 'sound-only') {
    const profileId = alarm.voice_profile_id ?? null;
    if (!profileId) {
      return {
        kind: 'fallback',
        uri: MOCK_DEFAULT_ALARM_URI,
        reason: '음성 프로필이 지정되지 않아 기본 알람 톤으로 재생합니다.',
      };
    }
    const profile = voices.find((v) => v.id === profileId);
    if (!profile) {
      return {
        kind: 'fallback',
        uri: MOCK_DEFAULT_ALARM_URI,
        reason: '연결된 음성 프로필을 찾을 수 없어 기본 알람 톤으로 재생합니다.',
      };
    }
    if (profile.status !== 'ready') {
      return {
        kind: 'fallback',
        uri: MOCK_DEFAULT_ALARM_URI,
        reason: '음성 프로필이 아직 준비되지 않아 기본 알람 톤으로 재생합니다.',
      };
    }
    return {
      kind: 'sound-only',
      voiceProfileId: profile.id,
      voiceName: profile.name,
      uri: MOCK_VOICE_SAMPLE_URI,
    };
  }

  const message = messages.find((m) => m.id === alarm.message_id);
  const text = message?.text ?? alarm.message_text ?? '';
  const voiceName = message?.voice_name ?? alarm.voice_name ?? '';
  const category = message?.category ?? alarm.category ?? '';
  if (!alarm.message_id || !text) {
    return { kind: 'error', reason: '재생할 메시지를 찾을 수 없습니다.' };
  }
  return {
    kind: 'tts',
    messageId: alarm.message_id,
    text,
    voiceName,
    category,
  };
}

export function getAlarmModeBadge(mode: Alarm['mode']): { emoji: string; label: string } {
  if (mode === 'sound-only') return { emoji: '🔊', label: '원본' };
  return { emoji: '🗣️', label: 'TTS' };
}
