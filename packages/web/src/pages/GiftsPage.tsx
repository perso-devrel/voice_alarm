import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReceivedGifts, getSentGifts, acceptGift, rejectGift } from '../services/api';
import type { Gift } from '../types';
import { GiftSkeleton } from '../components/Skeleton';

export default function GiftsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: received, isLoading: loadingReceived } = useQuery({
    queryKey: ['gifts-received'],
    queryFn: getReceivedGifts,
  });

  const { data: sent, isLoading: loadingSent } = useQuery({
    queryKey: ['gifts-sent'],
    queryFn: getSentGifts,
  });

  const acceptMutation = useMutation({
    mutationFn: acceptGift,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['gifts-received'] });
      const prev = queryClient.getQueryData<Gift[]>(['gifts-received']);
      queryClient.setQueryData<Gift[]>(['gifts-received'], (old) =>
        old?.map((g) => (g.id === id ? { ...g, status: 'accepted' } : g)) ?? [],
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(['gifts-received'], context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts-received'] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectGift,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['gifts-received'] });
      const prev = queryClient.getQueryData<Gift[]>(['gifts-received']);
      queryClient.setQueryData<Gift[]>(['gifts-received'], (old) =>
        old?.map((g) => (g.id === id ? { ...g, status: 'rejected' } : g)) ?? [],
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(['gifts-received'], context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts-received'] });
    },
  });

  const statusLabel = (s: string) =>
    s === 'accepted' ? '수락됨' : s === 'rejected' ? '거절됨' : '대기 중';

  const statusColor = (s: string) =>
    s === 'accepted' ? 'text-green-500' : s === 'rejected' ? 'text-red-400' : 'text-amber-500';

  const filterGifts = (gifts: Gift[] | undefined) => {
    if (!gifts) return [];
    const q = search.toLowerCase().trim();
    return gifts.filter((g: Gift) => {
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      if (q) {
        const name = tab === 'received'
          ? (g.sender_name || g.sender_email || '')
          : (g.recipient_name || g.recipient_email || '');
        return (
          name.toLowerCase().includes(q) ||
          (g.message_text ?? '').toLowerCase().includes(q) ||
          (g.note ?? '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  };

  const filteredReceived = filterGifts(received);
  const filteredSent = filterGifts(sent);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">🎁 선물</h2>
          <p className="text-[var(--color-text-tertiary)] text-sm mt-1">친구에게 받거나 보낸 음성 선물</p>
        </div>
      </div>

      <div role="tablist" aria-label="선물 목록" className="flex gap-2 mb-6">
        <button
          role="tab"
          aria-selected={tab === 'received'}
          onClick={() => setTab('received')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            tab === 'received'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:opacity-80'
          }`}
        >
          받은 선물 {received?.length ? `(${received.length})` : ''}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'sent'}
          onClick={() => setTab('sent')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            tab === 'sent'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:opacity-80'
          }`}
        >
          보낸 선물 {sent?.length ? `(${sent.length})` : ''}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 이메일, 메시지 검색..."
            aria-label="선물 검색"
            className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-xl px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
            🔍
          </span>
        </div>
        <div className="flex gap-2" role="radiogroup" aria-label="상태 필터">
          {([['all', '전체'], ['pending', '대기'], ['accepted', '수락'], ['rejected', '거절']] as const).map(([value, label]) => (
            <button
              key={value}
              role="radio"
              aria-checked={statusFilter === value}
              onClick={() => setStatusFilter(value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === value
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-alt)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'received' &&
        (loadingReceived ? (
          <GiftSkeleton />
        ) : !received?.length ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎁</p>
            <p className="text-[var(--color-text-secondary)] font-medium">받은 선물이 없습니다</p>
          </div>
        ) : filteredReceived.length === 0 ? (
          <div className="text-center py-12 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] transition-colors">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-[var(--color-text-secondary)]">검색 결과가 없습니다</p>
            <button onClick={() => { setSearch(''); setStatusFilter('all'); }} className="text-sm text-[var(--color-primary)] mt-2 hover:underline">
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredReceived.map((g: Gift) => (
              <div key={g.id} className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-[var(--color-text)]">{g.sender_name || '알 수 없음'}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{g.sender_email}</p>
                  </div>
                  <span className={`text-xs font-semibold ${statusColor(g.status)}`}>
                    {statusLabel(g.status)}
                  </span>
                </div>
                <div className="bg-[var(--color-bg)] rounded-lg p-3 mb-3 transition-colors">
                  <p className="text-xs text-[var(--color-text-tertiary)] uppercase mb-1">{g.category}</p>
                  <p className="text-[var(--color-text)]">{g.message_text}</p>
                </div>
                {g.note && <p className="text-sm text-[var(--color-text-tertiary)] italic mb-3">"{g.note}"</p>}
                {g.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptMutation.mutate(g.id)}
                      disabled={acceptMutation.isPending}
                      aria-label={`${g.sender_name || g.sender_email}님의 선물 수락`}
                      className="flex-1 py-2 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('이 선물을 거절하시겠습니까?')) {
                          rejectMutation.mutate(g.id);
                        }
                      }}
                      disabled={rejectMutation.isPending}
                      aria-label={`${g.sender_name || g.sender_email}님의 선물 거절`}
                      className="flex-1 py-2 bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:opacity-80 disabled:opacity-50 transition-all"
                    >
                      거절
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}

      {tab === 'sent' &&
        (loadingSent ? (
          <GiftSkeleton />
        ) : !sent?.length ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📤</p>
            <p className="text-[var(--color-text-secondary)] font-medium">보낸 선물이 없습니다</p>
          </div>
        ) : filteredSent.length === 0 ? (
          <div className="text-center py-12 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] transition-colors">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-[var(--color-text-secondary)]">검색 결과가 없습니다</p>
            <button onClick={() => { setSearch(''); setStatusFilter('all'); }} className="text-sm text-[var(--color-primary)] mt-2 hover:underline">
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredSent.map((g: Gift) => (
              <div key={g.id} className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-[var(--color-text)]">
                      {g.recipient_name || '알 수 없음'}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{g.recipient_email}</p>
                  </div>
                  <span className={`text-xs font-semibold ${statusColor(g.status)}`}>
                    {statusLabel(g.status)}
                  </span>
                </div>
                <div className="bg-[var(--color-bg)] rounded-lg p-3 transition-colors">
                  <p className="text-xs text-[var(--color-text-tertiary)] uppercase mb-1">{g.category}</p>
                  <p className="text-[var(--color-text)]">{g.message_text}</p>
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
