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
          <h2 className="text-2xl font-bold text-gray-800">🎁 선물</h2>
          <p className="text-gray-400 text-sm mt-1">친구에게 받거나 보낸 음성 선물</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('received')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            tab === 'received' ? 'bg-[#FF7F6B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          받은 선물 {received?.length ? `(${received.length})` : ''}
        </button>
        <button
          onClick={() => setTab('sent')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            tab === 'sent' ? 'bg-[#FF7F6B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          보낸 선물 {sent?.length ? `(${sent.length})` : ''}
        </button>
      </div>

      {tab === 'received' && (
        loadingReceived ? (
          <p className="text-gray-400 text-center py-12">로딩 중...</p>
        ) : !received?.length ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎁</p>
            <p className="text-gray-500 font-medium">받은 선물이 없습니다</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {received.map((g: Gift) => (
              <div key={g.id} className="bg-white rounded-xl p-5 border border-[#F2E8E5]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{g.sender_name || '알 수 없음'}</p>
                    <p className="text-xs text-gray-400">{g.sender_email}</p>
                  </div>
                  <span className={`text-xs font-semibold ${statusColor(g.status)}`}>
                    {statusLabel(g.status)}
                  </span>
                </div>
                <div className="bg-[#FFF5F3] rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-400 uppercase mb-1">{g.category}</p>
                  <p className="text-gray-700">{g.message_text}</p>
                </div>
                {g.note && (
                  <p className="text-sm text-gray-400 italic mb-3">"{g.note}"</p>
                )}
                {g.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => acceptMutation.mutate(g.id)}
                      disabled={acceptMutation.isPending}
                      className="flex-1 py-2 bg-[#FF7F6B] text-white rounded-lg font-medium hover:bg-[#E05A47] disabled:opacity-50 transition-all"
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
                      className="flex-1 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-all"
                    >
                      거절
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'sent' && (
        loadingSent ? (
          <p className="text-gray-400 text-center py-12">로딩 중...</p>
        ) : !sent?.length ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📤</p>
            <p className="text-gray-500 font-medium">보낸 선물이 없습니다</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {sent.map((g: Gift) => (
              <div key={g.id} className="bg-white rounded-xl p-5 border border-[#F2E8E5]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{g.recipient_name || '알 수 없음'}</p>
                    <p className="text-xs text-gray-400">{g.recipient_email}</p>
                  </div>
                  <span className={`text-xs font-semibold ${statusColor(g.status)}`}>
                    {statusLabel(g.status)}
                  </span>
                </div>
                <div className="bg-[#FFF5F3] rounded-lg p-3">
                  <p className="text-xs text-gray-400 uppercase mb-1">{g.category}</p>
                  <p className="text-gray-700">{g.message_text}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
