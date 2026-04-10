import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAlarms,
  updateAlarm,
  deleteAlarm,
  createAlarm,
  getMessages,
  getVoiceProfiles,
  getPresets,
  generateTTS,
} from '../services/api';
import type { Alarm, Message, VoiceProfile, PresetCategory } from '../types';
import { getApiErrorMessage } from '../types';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function AlarmsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: alarms, isLoading } = useQuery({
    queryKey: ['alarms'],
    queryFn: getAlarms,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updateAlarm(id, { is_active }),
    onMutate: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await queryClient.cancelQueries({ queryKey: ['alarms'] });
      const previous = queryClient.getQueryData<Alarm[]>(['alarms']);
      queryClient.setQueryData<Alarm[]>(['alarms'], (old) =>
        old ? old.map((a) => (a.id === id ? { ...a, is_active } : a)) : [],
      );
      return { previous };
    },
    onError: (_err: unknown, _vars: { id: string; is_active: boolean }, context: { previous?: Alarm[] } | undefined) => {
      if (context?.previous) {
        queryClient.setQueryData(['alarms'], context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['alarms'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAlarm,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['alarms'] });
      const previous = queryClient.getQueryData<Alarm[]>(['alarms']);
      queryClient.setQueryData<Alarm[]>(['alarms'], (old) =>
        old ? old.filter((a) => a.id !== id) : [],
      );
      return { previous };
    },
    onError: (_err: unknown, _id: string, context: { previous?: Alarm[] } | undefined) => {
      if (context?.previous) {
        queryClient.setQueryData(['alarms'], context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['alarms'] }),
  });

  const createMutation = useMutation({
    mutationFn: createAlarm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
      setShowCreate(false);
    },
  });

  const formatRepeat = (days: string) => {
    const parsed: number[] = JSON.parse(days || '[]');
    if (parsed.length === 0) return '한 번만';
    if (parsed.length === 7) return '매일';
    if (JSON.stringify(parsed.sort()) === JSON.stringify([1, 2, 3, 4, 5])) return '평일';
    if (JSON.stringify(parsed.sort()) === JSON.stringify([0, 6])) return '주말';
    return parsed.map((d) => DAYS[d]).join(', ');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-text)]">알람 설정</h2>
          <p className="text-[var(--color-text-secondary)] mt-1">웹에서 알람을 관리하고 앱에 동기화하세요</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          aria-expanded={showCreate}
          className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-colors"
        >
          + 알람 추가
        </button>
      </div>

      {showCreate && (
        <AlarmCreateForm
          onSubmit={(params) => createMutation.mutate(params)}
          onCancel={() => setShowCreate(false)}
          isPending={createMutation.isPending}
          error={createMutation.isError ? getApiErrorMessage(createMutation.error, '알람 생성 실패') : null}
        />
      )}

      {isLoading ? (
        <div role="status" aria-live="polite" className="text-center py-12 text-[var(--color-text-tertiary)]">
          로딩 중...
        </div>
      ) : !alarms?.length ? (
        <div className="text-center py-16 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] transition-colors">
          <p className="text-5xl mb-4">⏰</p>
          <p className="text-[var(--color-text-secondary)] text-lg">설정된 알람이 없어요</p>
          <p className="text-[var(--color-text-tertiary)] text-sm mt-1">앱에서 알람을 추가해주세요</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alarms.map((alarm: Alarm) => (
            <div
              key={alarm.id}
              className={`bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm flex items-center gap-6 transition-all ${
                !alarm.is_active ? 'opacity-50' : ''
              }`}
            >
              <div className="flex-1">
                <p className="text-4xl font-light text-[var(--color-text)]">{alarm.time}</p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{formatRepeat(alarm.repeat_days)}</p>
                <div className="mt-2">
                  <span className="text-sm text-[var(--color-primary)] font-medium">🗣️ {alarm.voice_name}</span>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">"{alarm.message_text}"</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!alarm.is_active}
                    onChange={() =>
                      toggleMutation.mutate({ id: alarm.id, is_active: !alarm.is_active })
                    }
                    aria-label={`${alarm.time} 알람 ${alarm.is_active ? '비활성화' : '활성화'}`}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[var(--color-surface-alt)] peer-focus:ring-2 peer-focus:ring-[var(--color-primary)] rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[var(--color-primary)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>

                <button
                  onClick={() => {
                    if (confirm('이 알람을 삭제하시겠어요?')) {
                      deleteMutation.mutate(alarm.id);
                    }
                  }}
                  aria-label={`${alarm.time} 알람 삭제`}
                  className="text-sm text-red-400 hover:text-red-500"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AlarmCreateForm({
  onSubmit,
  onCancel,
  isPending,
  error,
}: {
  onSubmit: (params: { message_id: string; time: string; repeat_days?: number[] }) => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
}) {
  const queryClient = useQueryClient();
  const [time, setTime] = useState('07:00');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showPreset, setShowPreset] = useState(false);
  const [presetCategory, setPresetCategory] = useState<string | null>(null);
  const [presetText, setPresetText] = useState<string | null>(null);
  const [presetVoiceId, setPresetVoiceId] = useState<string | null>(null);

  const { data: messages } = useQuery({
    queryKey: ['messages'],
    queryFn: () => getMessages(),
  });

  const { data: voices } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: getVoiceProfiles,
    enabled: showPreset,
  });

  const { data: presets } = useQuery({
    queryKey: ['presets'],
    queryFn: getPresets,
    enabled: showPreset,
  });

  const readyVoices = voices?.filter((v: VoiceProfile) => v.status === 'ready') ?? [];

  const ttsMutation = useMutation({
    mutationFn: generateTTS,
    onSuccess: (data: { message_id: string }) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setSelectedMessageId(data.message_id);
      setShowPreset(false);
      setPresetText(null);
    },
  });

  const toggleDay = (day: number) => {
    setRepeatDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleSubmit = () => {
    if (!selectedMessageId) return;
    onSubmit({ message_id: selectedMessageId, time, repeat_days: repeatDays });
  };

  const selectedPresets = presets?.find((c: PresetCategory) => c.category === presetCategory);

  return (
    <div className="bg-[var(--color-surface)] rounded-2xl p-6 mb-6 border border-[var(--color-border)] shadow-sm transition-colors">
      <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">새 알람 추가</h3>

      {/* 시간 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">시간</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] rounded-lg px-4 py-2 text-2xl font-light focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      {/* 반복 요일 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">반복</label>
        <div className="flex gap-2 mb-2">
          {DAYS.map((day, i) => (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              className={`w-10 h-10 rounded-full text-sm font-semibold transition-colors ${
                repeatDays.includes(i)
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setRepeatDays([0, 1, 2, 3, 4, 5, 6])} className="text-xs text-[var(--color-primary)] hover:underline">매일</button>
          <button onClick={() => setRepeatDays([1, 2, 3, 4, 5])} className="text-xs text-[var(--color-primary)] hover:underline">평일</button>
          <button onClick={() => setRepeatDays([0, 6])} className="text-xs text-[var(--color-primary)] hover:underline">주말</button>
        </div>
      </div>

      {/* 메시지 선택 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">알람 메시지</label>
        {messages && messages.length > 0 ? (
          <div className="grid gap-2 max-h-48 overflow-y-auto">
            {messages.map((msg: Message) => (
              <button
                key={msg.id}
                onClick={() => setSelectedMessageId(msg.id)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  selectedMessageId === msg.id
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                    : 'border-[var(--color-border)] hover:bg-[var(--color-bg)]'
                }`}
              >
                <span className="text-sm text-[var(--color-primary)] font-medium">🗣️ {msg.voice_name}</span>
                <p className="text-sm text-[var(--color-text)] mt-0.5 truncate">"{msg.text}"</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 bg-[var(--color-bg)] rounded-xl border border-dashed border-[var(--color-border)]">
            <p className="text-2xl mb-1">💬</p>
            <p className="text-sm text-[var(--color-text-secondary)]">아직 음성 메시지가 없어요</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">아래 프리셋으로 빠르게 만들어보세요</p>
          </div>
        )}
      </div>

      {/* 프리셋 토글 */}
      <button
        onClick={() => setShowPreset(!showPreset)}
        className="text-sm text-[var(--color-primary)] font-medium hover:underline mb-4"
      >
        {showPreset ? '▲' : '▼'} 프리셋으로 빠르게 만들기
      </button>

      {showPreset && (
        <div className="bg-[var(--color-bg)] rounded-xl p-4 mb-4 border border-[var(--color-border)]">
          {/* 음성 선택 */}
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">목소리 선택</label>
          {readyVoices.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)] mb-3">먼저 음성을 등록해주세요</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-3">
              {readyVoices.map((v: VoiceProfile) => (
                <button
                  key={v.id}
                  onClick={() => setPresetVoiceId(v.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    presetVoiceId === v.id
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          )}

          {/* 카테고리 */}
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">카테고리</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {presets?.map((cat: PresetCategory) => (
              <button
                key={cat.category}
                onClick={() => { setPresetCategory(cat.category); setPresetText(null); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  presetCategory === cat.category
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                }`}
              >
                {cat.emoji} {cat.category}
              </button>
            ))}
          </div>

          {/* 프리셋 메시지 */}
          {selectedPresets && (
            <div className="grid gap-2 mb-3">
              {selectedPresets.messages.map((msg: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setPresetText(msg)}
                  className={`text-left p-2 rounded-lg text-sm transition-colors ${
                    presetText === msg
                      ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] font-medium'
                      : 'hover:bg-[var(--color-surface)] text-[var(--color-text)]'
                  }`}
                >
                  "{msg}"
                </button>
              ))}
            </div>
          )}

          {/* 생성 버튼 */}
          <button
            onClick={() => {
              if (presetVoiceId && presetText) {
                ttsMutation.mutate({
                  voice_profile_id: presetVoiceId,
                  text: presetText,
                  category: presetCategory ?? 'custom',
                });
              }
            }}
            disabled={!presetVoiceId || !presetText || ttsMutation.isPending}
            className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {ttsMutation.isPending ? '생성 중...' : '🔊 이 메시지로 생성'}
          </button>
          {ttsMutation.isError && (
            <p className="text-red-500 text-xs mt-2">
              {getApiErrorMessage(ttsMutation.error, '음성 생성에 실패했습니다.')}
            </p>
          )}
        </div>
      )}

      {/* 폼 액션 */}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!selectedMessageId || isPending}
          className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
        >
          {isPending ? '생성 중...' : '⏰ 알람 설정하기'}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
        >
          취소
        </button>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
