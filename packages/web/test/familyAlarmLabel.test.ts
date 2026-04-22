import { describe, it, expect } from 'vitest';
import {
  buildFamilyAlarmLabel,
  isReceivedFamilyAlarm,
} from '../src/lib/familyAlarmLabel';

describe('isReceivedFamilyAlarm', () => {
  it('가족 카테고리 아니면 false', () => {
    expect(
      isReceivedFamilyAlarm(
        { is_family_alarm: false, sender_user_id: 'a' },
        'self',
      ),
    ).toBe(false);
  });

  it('sender_user_id 가 self 면 false (본인이 본인에게 만든 알람)', () => {
    expect(
      isReceivedFamilyAlarm(
        { is_family_alarm: true, sender_user_id: 'self' },
        'self',
      ),
    ).toBe(false);
  });

  it('sender_user_id 없으면 false', () => {
    expect(
      isReceivedFamilyAlarm({ is_family_alarm: true, sender_user_id: null }, 'self'),
    ).toBe(false);
  });

  it('selfUserId 없으면 false (로그인 전 등)', () => {
    expect(
      isReceivedFamilyAlarm({ is_family_alarm: true, sender_user_id: 'a' }, null),
    ).toBe(false);
  });

  it('가족 + 타인 발신 + self 로그인 → true', () => {
    expect(
      isReceivedFamilyAlarm(
        { is_family_alarm: true, sender_user_id: 'other' },
        'self',
      ),
    ).toBe(true);
  });

  it('백엔드가 is_received_family_alarm=true 를 내렸으면 즉시 true (selfUserId 불필요)', () => {
    expect(isReceivedFamilyAlarm({ is_received_family_alarm: true })).toBe(true);
  });

  it('백엔드가 is_received_family_alarm=false 를 내렸으면 즉시 false', () => {
    expect(
      isReceivedFamilyAlarm({
        is_received_family_alarm: false,
        is_family_alarm: true,
        sender_user_id: 'other',
      }),
    ).toBe(false);
  });
});

describe('buildFamilyAlarmLabel', () => {
  it('수신 가족 알람 아니면 visible=false', () => {
    const label = buildFamilyAlarmLabel({ is_family_alarm: false }, 'self');
    expect(label.visible).toBe(false);
    expect(label.text).toBe('');
  });

  it('sender_name 있으면 이름 사용', () => {
    const label = buildFamilyAlarmLabel(
      { is_family_alarm: true, sender_user_id: 'other', sender_name: '엄마' },
      'self',
    );
    expect(label).toEqual({ visible: true, text: '💌 엄마 님이 보낸 알람' });
  });

  it('sender_name 없고 sender_email 있으면 email 사용', () => {
    const label = buildFamilyAlarmLabel(
      {
        is_family_alarm: true,
        sender_user_id: 'other',
        sender_name: null,
        sender_email: 'mom@example.com',
      },
      'self',
    );
    expect(label.text).toBe('💌 mom@example.com 님이 보낸 알람');
  });

  it('sender_name 이 공백만이면 email fallback', () => {
    const label = buildFamilyAlarmLabel(
      {
        is_family_alarm: true,
        sender_user_id: 'other',
        sender_name: '   ',
        sender_email: 'dad@example.com',
      },
      'self',
    );
    expect(label.text).toBe('💌 dad@example.com 님이 보낸 알람');
  });

  it('이름·이메일 모두 없으면 "가족" 표시', () => {
    const label = buildFamilyAlarmLabel(
      {
        is_family_alarm: true,
        sender_user_id: 'other',
        sender_name: null,
        sender_email: null,
      },
      'self',
    );
    expect(label.text).toBe('💌 가족 님이 보낸 알람');
  });
});
