import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSkeleton } from '../components/Skeleton';
import {
  getVoiceProfiles,
  getMessages,
  getPresets,
  generateTTS,
  getFriendList,
  sendGift,
  deleteMessage,
} from '../services/api';
import type { VoiceProfile, Message, PresetCategory, Friend } from '../types';
import { getApiErrorMessage } from '../types';
import { InlineAudioPlayer } from '../components/InlineAudioPlayer';

const CATEGORY_EMOJIS: Record<string, string> = {
  morning: '🌅',
  lunch: '🍽️',
  afternoon: '☕',
  evening: '🌙',
  night: '😴',
  cheer: '💪',
  love: '❤️',
  health: '🏥',
  custom: '✏️',
};

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'list' | 'create'>('list');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [messageText, setMessageText] = useState('');
  const [category, setCategory] = useState('custom');
  const audioRef = useRef<HTMLAudioElement>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const { data: voices } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: getVoiceProfiles,
  });
  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: () => getMessages(),
  });
  const { data: presets } = useQuery({
    queryKey: ['presets'],
    queryFn: getPresets,
  });

  const readyVoices = voices?.filter((v: VoiceProfile) => v.status === 'ready') || [];

  const ttsMutation = useMutation({
    mutationFn: generateTTS,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      if (audioRef.current) {
        audioRef.current.src = `data:audio/mp3;base64,${data.audio_base64}`;
        audioRef.current.play();
      }
      setMessageText('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMessage,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['messages'] });
      const previous = queryClient.getQueryData<Message[]>(['messages']);
      queryClient.setQueryData<Message[]>(['messages'], (old) =>
        old ? old.filter((m) => m.id !== id) : [],
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['messages'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const handleDelete = (msg: Message) => {
    if (confirm(`"${msg.text}" 메시지를 삭제하시겠어요?`)) {
      deleteMutation.mutate(msg.id);
    }
  };

  const handleGenerate = () => {
    if (!selectedVoice || !messageText.trim()) return;
    ttsMutation.mutate({
      voice_profile_id: selectedVoice,
      text: messageText.trim(),
      category,
    });
  };

  return (
    <div>
      <audio ref={audioRef} className="hidden" />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-text)]">메시지</h2>
          <p className="text-[var(--color-text-secondary)] mt-1">음성 메시지를 작성하고 관리하세요</p>
        </div>
        <div role="tablist" aria-label="메시지 탭" className="flex gap-2">
          <button
            role="tab"
            aria-selected={tab === 'list'}
            onClick={() => setTab('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'list'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
            }`}
          >
            목록
          </button>
          <button
            role="tab"
            aria-selected={tab === 'create'}
            onClick={() => setTab('create')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'create'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
            }`}
          >
            + 새 메시지
          </button>
        </div>
      </div>

      {tab === 'create' ? (
        <div className="max-w-2xl">
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">누구의 목소리로?</label>
            <div className="flex gap-2 flex-wrap">
              {readyVoices.map((v: VoiceProfile) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  aria-pressed={selectedVoice === v.id}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    selectedVoice === v.id
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
                  }`}
                >
                  {v.name}
                </button>
              ))}
              {readyVoices.length === 0 && (
                <p className="text-[var(--color-text-tertiary)] text-sm">먼저 음성을 등록해주세요</p>
              )}
            </div>
          </div>

          {presets && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">프리셋 메시지</label>
              <div className="flex gap-2 flex-wrap mb-3">
                {presets.map((cat: PresetCategory) => (
                  <button
                    key={cat.category}
                    onClick={() => setCategory(cat.category)}
                    aria-pressed={category === cat.category}
                    className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                      category === cat.category
                        ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
                    }`}
                  >
                    {cat.emoji} {cat.category}
                  </button>
                ))}
              </div>
              <div className="grid gap-2">
                {presets
                  .find((p: PresetCategory) => p.category === category)
                  ?.messages.map((msg: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setMessageText(msg)}
                      className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                        messageText === msg
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
                          : 'border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]'
                      }`}
                    >
                      {msg}
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              메시지 ({messageText.length}/200)
            </label>
            <textarea
              value={messageText}
              onChange={(e) => e.target.value.length <= 200 && setMessageText(e.target.value)}
              placeholder="메시지를 입력하세요..."
              rows={3}
              className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedVoice || !messageText.trim() || ttsMutation.isPending}
            className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {ttsMutation.isPending ? '음성 생성 중...' : '🔊 음성 메시지 생성'}
          </button>

          {ttsMutation.isSuccess && (
            <p role="status" className="text-green-600 text-sm mt-3">
              음성 메시지가 생성되었습니다!
            </p>
          )}
          {ttsMutation.isError && (
            <p role="alert" className="text-red-500 text-sm mt-3">
              오류: {getApiErrorMessage(ttsMutation.error, '생성 실패')}
            </p>
          )}
        </div>
      ) : (
        <div>
          {/* 검색 + 카테고리 필터 */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="메시지 검색 (텍스트, 음성 이름...)"
                aria-label="메시지 검색"
                className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-xl px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
                🔍
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap" role="radiogroup" aria-label="카테고리 필터">
              <button
                role="radio"
                aria-checked={filterCategory === 'all'}
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filterCategory === 'all'
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]'
                }`}
              >
                전체
              </button>
              {Object.entries(CATEGORY_EMOJIS).map(([cat, emoji]) => (
                <button
                  key={cat}
                  role="radio"
                  aria-checked={filterCategory === cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    filterCategory === cat
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <MessageSkeleton />
          ) : !messages?.length ? (
            <div className="text-center py-16 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] transition-colors">
              <p className="text-5xl mb-4">💌</p>
              <p className="text-[var(--color-text-secondary)]">아직 생성된 메시지가 없어요</p>
            </div>
          ) : (
            (() => {
              const q = search.toLowerCase().trim();
              const filtered = messages.filter((m: Message) => {
                if (filterCategory !== 'all' && m.category !== filterCategory) return false;
                if (q) {
                  return (
                    m.text.toLowerCase().includes(q) ||
                    (m.voice_name ?? '').toLowerCase().includes(q)
                  );
                }
                return true;
              });
              if (filtered.length === 0) {
                return (
                  <div className="text-center py-12 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] transition-colors">
                    <p className="text-3xl mb-3">🔍</p>
                    <p className="text-[var(--color-text-secondary)]">검색 결과가 없습니다</p>
                    <button onClick={() => { setSearch(''); setFilterCategory('all'); }} className="text-sm text-[var(--color-primary)] mt-2 hover:underline">
                      필터 초기화
                    </button>
                  </div>
                );
              }
              return (
            <div className="space-y-3">
              {filtered.map((msg: Message) => (
                <div
                  key={msg.id}
                  className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] flex items-center gap-4 transition-colors"
                >
                  <span className="text-2xl">{CATEGORY_EMOJIS[msg.category] || '💌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-primary)]">{msg.voice_name}</p>
                    <p className="text-[var(--color-text)]">"{msg.text}"</p>
                    {msg.audio_url && <InlineAudioPlayer audioUrl={msg.audio_url} />}
                    <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                      {new Date(msg.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      aria-label={`"${msg.text}" 메시지를 선물로 보내기`}
                      onClick={async () => {
                        try {
                          const friends = await getFriendList();
                          if (!friends?.length) {
                            alert('먼저 친구를 추가해주세요.');
                            return;
                          }
                          const name = prompt(
                            `선물할 친구의 이메일을 입력하세요:\n${friends.map((f: Friend) => `- ${f.friend_email} (${f.friend_name || ''})`).join('\n')}`,
                          );
                          if (!name) return;
                          await sendGift({ recipient_email: name, message_id: msg.id });
                          alert('선물을 보냈습니다!');
                        } catch (err: unknown) {
                          alert(getApiErrorMessage(err, '선물 전송 실패'));
                        }
                      }}
                      className="px-3 py-1.5 text-sm border border-[var(--color-primary)] text-[var(--color-primary)] rounded-lg hover:bg-[var(--color-primary)]/10 transition-colors"
                    >
                      🎁 선물
                    </button>
                    <button
                      aria-label={`"${msg.text}" 메시지 삭제`}
                      onClick={() => handleDelete(msg)}
                      className="px-3 py-1.5 text-sm border border-red-400 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
