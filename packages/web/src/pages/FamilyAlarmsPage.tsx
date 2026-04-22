import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createFamilyAlarmText,
  getFamilyGroupCurrent,
  getUserProfile,
  type FamilyGroupMember,
} from '../services/api';
import {
  buildMemberDisplayName,
  filterFamilyAlarmRecipients,
  validateFamilyAlarmForm,
} from '../lib/familyAlarmForm';
import { getApiErrorMessage } from '../types';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function FamilyAlarmsPage() {
  const queryClient = useQueryClient();

  const { data: group, isLoading: loadingGroup } = useQuery({
    queryKey: ['familyGroupCurrent'],
    queryFn: getFamilyGroupCurrent,
  });

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: getUserProfile,
  });
  const selfUserId = (profile?.user?.id as string | undefined) ?? '';

  const [recipientUserId, setRecipientUserId] = useState<string | null>(null);
  const [wakeAt, setWakeAt] = useState('07:30');
  const [messageText, setMessageText] = useState('');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const allowedRecipients = useMemo(
    () => filterFamilyAlarmRecipients(group?.members ?? [], selfUserId),
    [group, selfUserId],
  );

  const createMutation = useMutation({
    mutationFn: createFamilyAlarmText,
    onSuccess: (res) => {
      setSuccessMsg(`알람이 예약되었습니다 (${res.alarm.wake_at}).`);
      setFormError(null);
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    },
    onError: (err: unknown) => {
      setFormError(getApiErrorMessage(err, '알람 예약에 실패했습니다.'));
      setSuccessMsg(null);
    },
  });

  function toggleDay(d: number) {
    setRepeatDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMsg(null);
    const res = validateFamilyAlarmForm({
      recipientUserId,
      wakeAt,
      messageText,
      repeatDays,
    });
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    setFormError(null);
    createMutation.mutate(res.payload);
  }

  if (loadingGroup) {
    return (
      <div
        className="flex items-center justify-center h-64"
        role="status"
        aria-label="가족 그룹 불러오는 중"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  if (!group?.group) {
    return (
      <section aria-labelledby="family-empty-title" className="max-w-xl">
        <h1 id="family-empty-title" className="text-2xl font-bold mb-3">
          가족 알람
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-4">
          아직 가족 그룹에 속해 있지 않습니다. 가족 플랜을 결제하거나 초대 코드를 입력해 참여해
          주세요.
        </p>
        <p className="text-sm text-[var(--color-text-tertiary)]">
          설정 페이지에서 구독/초대 관리를 할 수 있습니다.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="family-alarms-title" className="max-w-3xl">
      <h1 id="family-alarms-title" className="text-2xl font-bold mb-4">
        가족 알람 예약
      </h1>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">가족 그룹 멤버</h2>
        <ul className="grid gap-2">
          {group.members.map((m) => (
            <MemberRow key={m.id} member={m} isSelf={m.user_id === selfUserId} />
          ))}
        </ul>
      </div>

      {allowedRecipients.length === 0 ? (
        <div
          role="status"
          className="p-4 rounded-xl bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]"
        >
          가족 알람을 허용한 멤버가 없습니다. 각자 설정에서 '가족이 내게 알람 추가 허용'을 켜야
          알람을 예약할 수 있습니다.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          aria-label="가족 알람 예약 폼"
          className="grid gap-4 p-4 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)]"
        >
          <label className="grid gap-1">
            <span className="text-sm font-medium">수신자</span>
            <select
              value={recipientUserId ?? ''}
              onChange={(e) => setRecipientUserId(e.target.value || null)}
              className="px-3 py-2 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)]"
              aria-label="알람 수신자"
            >
              <option value="">수신자 선택</option>
              {allowedRecipients.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {buildMemberDisplayName(m)}
                  {m.role === 'owner' ? ' (소유자)' : ''}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">기상 시간</span>
            <input
              type="time"
              value={wakeAt}
              onChange={(e) => setWakeAt(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)]"
              aria-label="기상 시간 (HH:mm)"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">메시지 (최대 500자)</span>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="예: 좋은 아침! 오늘도 힘내자 💪"
              className="px-3 py-2 rounded-lg bg-[var(--color-surface-alt)] border border-[var(--color-border)]"
              aria-label="알람 메시지 내용"
            />
            <span className="text-xs text-[var(--color-text-tertiary)] text-right">
              {messageText.length}/500
            </span>
          </label>

          <fieldset className="grid gap-1">
            <legend className="text-sm font-medium mb-1">반복 요일 (선택)</legend>
            <div className="flex gap-1 flex-wrap">
              {DAYS.map((day, idx) => (
                <button
                  type="button"
                  key={day}
                  aria-pressed={repeatDays.includes(idx)}
                  onClick={() => toggleDay(idx)}
                  className={`w-10 h-10 rounded-full text-sm font-semibold transition-colors ${
                    repeatDays.includes(idx)
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </fieldset>

          {formError && (
            <div role="alert" className="text-sm text-red-500">
              {formError}
            </div>
          )}
          {successMsg && (
            <div role="status" className="text-sm text-emerald-500">
              {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white font-semibold disabled:opacity-60"
          >
            {createMutation.isPending ? '예약 중…' : '알람 예약'}
          </button>
        </form>
      )}
    </section>
  );
}

function MemberRow({ member, isSelf }: { member: FamilyGroupMember; isSelf: boolean }) {
  const label = buildMemberDisplayName(member);
  const roleBadge = member.role === 'owner' ? '소유자' : '멤버';
  return (
    <li className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[var(--color-surface-alt)]">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-sm font-semibold text-[var(--color-primary)]">
          {label.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium truncate">{label}</span>
            {isSelf && (
              <span className="text-xs text-[var(--color-text-tertiary)]">(나)</span>
            )}
          </div>
          <div className="text-xs text-[var(--color-text-tertiary)]">{roleBadge}</div>
        </div>
      </div>
      <span
        className={`text-xs font-semibold px-2 py-1 rounded-full ${
          member.allow_family_alarms
            ? 'bg-emerald-500/15 text-emerald-500'
            : 'bg-[var(--color-border)] text-[var(--color-text-tertiary)]'
        }`}
      >
        {member.allow_family_alarms ? '알람 허용' : '알람 거부'}
      </span>
    </li>
  );
}
