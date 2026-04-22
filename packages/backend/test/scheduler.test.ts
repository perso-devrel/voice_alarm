import { describe, it, expect } from 'vitest';
import {
  formatHHmm,
  shouldAlarmFire,
  selectFiringAlarms,
  type ScheduledAlarm,
} from '../src/lib/scheduler';

function makeAlarm(partial: Partial<ScheduledAlarm> = {}): ScheduledAlarm {
  return {
    id: partial.id ?? 'a1',
    user_id: partial.user_id ?? 'u1',
    time: partial.time ?? '07:00',
    repeat_days: partial.repeat_days ?? [],
    is_active: partial.is_active ?? true,
    mode: partial.mode ?? 'tts',
    voice_profile_id: partial.voice_profile_id ?? null,
    speaker_id: partial.speaker_id ?? null,
    target_user_id: partial.target_user_id ?? null,
  };
}

// 2026-04-21 (화요일, UTC). Date.getUTCDay() 화요일 = 2
const tuesday0700 = new Date(Date.UTC(2026, 3, 21, 7, 0, 0));

describe('formatHHmm', () => {
  it('UTC 시/분을 2자리로 포맷한다', () => {
    expect(formatHHmm(new Date(Date.UTC(2026, 3, 21, 9, 5, 30)))).toBe('09:05');
    expect(formatHHmm(new Date(Date.UTC(2026, 3, 21, 23, 59, 0)))).toBe('23:59');
  });
});

describe('shouldAlarmFire', () => {
  it('시각 일치 + repeat_days 빈 배열이면 매일 발화', () => {
    const alarm = makeAlarm({ time: '07:00', repeat_days: [] });
    expect(shouldAlarmFire(alarm, tuesday0700)).toBe(true);
  });

  it('시각 불일치면 발화 안 함', () => {
    const alarm = makeAlarm({ time: '08:00' });
    expect(shouldAlarmFire(alarm, tuesday0700)).toBe(false);
  });

  it('repeat_days 에 오늘 요일 포함이면 발화', () => {
    const alarm = makeAlarm({ time: '07:00', repeat_days: [1, 2, 3] });
    expect(shouldAlarmFire(alarm, tuesday0700)).toBe(true);
  });

  it('repeat_days 에 오늘 요일 미포함이면 발화 안 함', () => {
    const alarm = makeAlarm({ time: '07:00', repeat_days: [0, 6] }); // 일·토만
    expect(shouldAlarmFire(alarm, tuesday0700)).toBe(false);
  });

  it('is_active=false 면 발화 안 함', () => {
    const alarm = makeAlarm({ time: '07:00', is_active: false });
    expect(shouldAlarmFire(alarm, tuesday0700)).toBe(false);
  });

  it('분 단위 부분 일치는 거절 (HH:mm 전체 매칭)', () => {
    const alarm = makeAlarm({ time: '07:30' });
    expect(shouldAlarmFire(alarm, tuesday0700)).toBe(false);
  });
});

describe('selectFiringAlarms', () => {
  it('여러 알람 중 해당 시각·요일에 맞는 것만 추린다', () => {
    const alarms: ScheduledAlarm[] = [
      makeAlarm({ id: 'a', time: '07:00', repeat_days: [2] }), // 화요일 매칭
      makeAlarm({ id: 'b', time: '07:00', is_active: false }), // 비활성
      makeAlarm({ id: 'c', time: '08:00' }), // 시각 미일치
      makeAlarm({ id: 'd', time: '07:00', repeat_days: [] }), // 매일
      makeAlarm({ id: 'e', time: '07:00', repeat_days: [0, 6] }), // 주말만
    ];
    const fired = selectFiringAlarms(alarms, tuesday0700);
    expect(fired.map((x) => x.id).sort()).toEqual(['a', 'd']);
  });

  it('빈 배열이면 빈 결과', () => {
    expect(selectFiringAlarms([], tuesday0700)).toEqual([]);
  });
});
