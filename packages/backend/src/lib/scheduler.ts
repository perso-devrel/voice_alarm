export type AlarmMode = 'sound-only' | 'tts';

export interface ScheduledAlarm {
  id: string;
  user_id: string;
  target_user_id?: string | null;
  time: string;
  repeat_days: number[];
  is_active: boolean;
  mode: AlarmMode;
  voice_profile_id?: string | null;
  speaker_id?: string | null;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatHHmm(now: Date): string {
  return `${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}`;
}

export function shouldAlarmFire(alarm: ScheduledAlarm, now: Date): boolean {
  if (!alarm.is_active) return false;
  if (alarm.time !== formatHHmm(now)) return false;

  const repeat = Array.isArray(alarm.repeat_days) ? alarm.repeat_days : [];
  if (repeat.length === 0) return true;

  const today = now.getUTCDay();
  return repeat.includes(today);
}

export function selectFiringAlarms(alarms: ScheduledAlarm[], now: Date): ScheduledAlarm[] {
  return alarms.filter((a) => shouldAlarmFire(a, now));
}
