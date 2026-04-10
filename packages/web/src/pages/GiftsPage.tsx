import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReceivedGifts, getSentGifts, acceptGift, rejectGift } from '../services/api';
import type { Gift } from '../types';

export default function GiftsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'received' | 'sent'>('received');

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts-received'] });
      queryClient.invalidateQueries({ queryKey: ['library'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectGift,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts-received'] });
    },
  });

  const statusLabel = (s: string) =>
    s === 'accepted' ? '수락됨' : s === 'rejected' ? '거절됨' : '대기 중';

  const statusColor = (s: string) =>
    s === 'accepted' ? 'text-green-500' : s === 'rejected' ? 'text-red-400' : 'text-amber-500';

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

      {tab === 'received' &&
        (loadingReceived ? (
          <p role="status" className="text-[var(--color-text-tertiary)] text-center py-12">
            로딩 중...
          </p>
        ) : !received?.length ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎁</p>
            <p className="text-[var(--color-text-secondary)] font-medium">받은 선물이 없습니다</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {received.map((g: Gift) => (
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
          <p role="status" className="text-[var(--color-text-tertiary)] text-center py-12">
            로딩 중...
          </p>
        ) : !sent?.length ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📤</p>
            <p className="text-[var(--color-text-secondary)] font-medium">보낸 선물이 없습니다</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {sent.map((g: Gift) => (
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
