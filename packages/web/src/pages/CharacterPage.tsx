import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCharacterMe, grantCharacterXp } from '../services/api';
import type { XpEvent } from '../services/api';
import {
  formatProgress,
  pickRandomDialogue,
  progressBarWidthPct,
  stageToEmoji,
  stageToLabel,
} from '../lib/character';
import { getApiErrorMessage } from '../types';

const DEV_EVENTS: { event: XpEvent; label: string }[] = [
  { event: 'alarm_completed', label: '알람 정상 종료 +30 XP' },
  { event: 'alarm_snoozed', label: '스누즈 +5 XP' },
  { event: 'family_alarm_received', label: '가족 알람 수신 +10 XP' },
];

export default function CharacterPage() {
  const queryClient = useQueryClient();
  const [dialogueSeed, setDialogueSeed] = useState(0);
  const [lastGrantNotice, setLastGrantNotice] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['character-me'],
    queryFn: getCharacterMe,
  });

  const grantMutation = useMutation({
    mutationFn: grantCharacterXp,
    onSuccess: (res) => {
      const suffix = res.grant.capped ? ' (일일 캡 도달)' : '';
      setLastGrantNotice(`+${res.grant.granted_xp} XP · +${res.grant.affection} 애정도${suffix}`);
      queryClient.invalidateQueries({ queryKey: ['character-me'] });
    },
    onError: (err) => {
      setLastGrantNotice(getApiErrorMessage(err, 'XP 지급 실패'));
    },
  });

  const stage = data?.character.stage ?? 'seed';
  const dialogue = useMemo(
    () => pickRandomDialogue(stage, () => ((dialogueSeed * 9301 + 49297) % 233280) / 233280),
    [stage, dialogueSeed],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="캐릭터 불러오는 중">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center text-[var(--color-text-secondary)]">
        <p>캐릭터를 불러오지 못했어요.</p>
        <p className="text-sm mt-2 text-red-400">{getApiErrorMessage(error, '알 수 없는 오류')}</p>
      </div>
    );
  }

  const { character, progress } = data;

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-primary)]">내 캐릭터</h1>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
          알람을 잘 들을수록 캐릭터가 자라요.
        </p>
      </header>

      <section
        onClick={() => setDialogueSeed((n) => n + 1)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setDialogueSeed((n) => n + 1);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="캐릭터를 탭하면 새 대사가 나와요"
        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 text-center cursor-pointer hover:bg-[var(--color-surface-alt)] transition-colors"
      >
        <div className="text-7xl mb-4" aria-hidden="true">
          {stageToEmoji(character.stage)}
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xl font-bold text-[var(--color-text)]">{character.name}</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
            Lv.{character.level} · {stageToLabel(character.stage)}
          </span>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">{dialogue}</p>
      </section>

      <section className="mt-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm font-semibold text-[var(--color-text)]">성장 진행도</span>
          <span className="text-xs text-[var(--color-text-tertiary)]">{formatProgress(progress)}</span>
        </div>
        <div
          className="h-3 bg-[var(--color-surface-alt)] rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progressBarWidthPct(progress))}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="경험치 진행도"
        >
          <div
            className="h-full bg-[var(--color-primary)] transition-all"
            style={{ width: `${progressBarWidthPct(progress)}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)]">총 XP</div>
            <div className="text-lg font-bold">{character.xp}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)]">애정도</div>
            <div className="text-lg font-bold">💗 {character.affection}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-tertiary)]">오늘 획득</div>
            <div className="text-lg font-bold">{character.daily_xp} / 200</div>
          </div>
        </div>
      </section>

      <section className="mt-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-3 text-[var(--color-text)]">테스트용 XP 지급</h2>
        <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
          실제 앱에서는 알람 종료/가족 알람 수신 시 자동으로 호출돼요.
        </p>
        <div className="flex flex-wrap gap-2">
          {DEV_EVENTS.map((e) => (
            <button
              key={e.event}
              onClick={() => grantMutation.mutate({ event: e.event })}
              disabled={grantMutation.isPending}
              className="px-3 py-2 text-xs rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 disabled:opacity-50 transition-colors"
            >
              {e.label}
            </button>
          ))}
        </div>
        {lastGrantNotice && (
          <p className="mt-3 text-xs text-[var(--color-text-secondary)]" role="status">
            {lastGrantNotice}
          </p>
        )}
      </section>
    </div>
  );
}
