import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFriendList,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  deleteFriend,
} from '../services/api';
import type { Friend, PendingFriendRequest } from '../types';
import { getApiErrorMessage } from '../types';

export default function FriendsPage() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [tab, setTab] = useState<'friends' | 'pending'>('friends');

  const { data: friends, isLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriendList,
  });

  const { data: pending } = useQuery({
    queryKey: ['friends-pending'],
    queryFn: getPendingRequests,
  });

  const sendMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['friends-pending'] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['friends'] });
      await queryClient.cancelQueries({ queryKey: ['friends-pending'] });

      const prevFriends = queryClient.getQueryData<Friend[]>(['friends']);
      const prevPending = queryClient.getQueryData<PendingFriendRequest[]>(['friends-pending']);

      const accepted = prevPending?.find((p) => p.id === id);
      if (accepted) {
        queryClient.setQueryData<PendingFriendRequest[]>(
          ['friends-pending'],
          (old) => old?.filter((p) => p.id !== id) ?? [],
        );
        queryClient.setQueryData<Friend[]>(['friends'], (old) => [
          ...(old ?? []),
          {
            id: accepted.id,
            friend_name: accepted.requester_name,
            friend_email: accepted.requester_email,
            created_at: accepted.created_at,
          },
        ]);
      }

      return { prevFriends, prevPending };
    },
    onError: (_err, _id, context) => {
      if (context?.prevFriends) queryClient.setQueryData(['friends'], context.prevFriends);
      if (context?.prevPending) queryClient.setQueryData(['friends-pending'], context.prevPending);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friends-pending'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: deleteFriend,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['friends'] });
      await queryClient.cancelQueries({ queryKey: ['friends-pending'] });

      const prevFriends = queryClient.getQueryData<Friend[]>(['friends']);
      const prevPending = queryClient.getQueryData<PendingFriendRequest[]>(['friends-pending']);

      queryClient.setQueryData<Friend[]>(
        ['friends'],
        (old) => old?.filter((f) => f.id !== id) ?? [],
      );
      queryClient.setQueryData<PendingFriendRequest[]>(
        ['friends-pending'],
        (old) => old?.filter((p) => p.id !== id) ?? [],
      );

      return { prevFriends, prevPending };
    },
    onError: (_err, _id, context) => {
      if (context?.prevFriends) queryClient.setQueryData(['friends'], context.prevFriends);
      if (context?.prevPending) queryClient.setQueryData(['friends-pending'], context.prevPending);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friends-pending'] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text)]">👥 친구</h2>
          <p className="text-[var(--color-text-tertiary)] text-sm mt-1">친구를 추가하고 선물을 주고받으세요</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="email"
          placeholder="이메일로 친구 추가"
          aria-label="친구 이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && email.trim() && sendMutation.mutate(email.trim())}
          className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          disabled={sendMutation.isPending}
        />
        <button
          onClick={() => email.trim() && sendMutation.mutate(email.trim())}
          disabled={!email.trim() || sendMutation.isPending}
          className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {sendMutation.isPending ? '...' : '추가'}
        </button>
      </div>

      {sendMutation.isError && (
        <p role="alert" className="text-red-500 text-sm mb-4">
          {getApiErrorMessage(sendMutation.error, '친구 요청에 실패했습니다.')}
        </p>
      )}
      {sendMutation.isSuccess && (
        <p role="status" className="text-green-500 text-sm mb-4">
          친구 요청을 보냈습니다!
        </p>
      )}

      <div role="tablist" aria-label="친구 목록" className="flex gap-2 mb-6">
        <button
          role="tab"
          aria-selected={tab === 'friends'}
          onClick={() => setTab('friends')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            tab === 'friends'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:opacity-80'
          }`}
        >
          내 친구 {friends?.length ? `(${friends.length})` : ''}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'pending'}
          onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            tab === 'pending'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:opacity-80'
          }`}
        >
          받은 요청 {pending?.length ? `(${pending.length})` : ''}
        </button>
      </div>

      {tab === 'friends' &&
        (isLoading ? (
          <p role="status" className="text-[var(--color-text-tertiary)] text-center py-12">
            로딩 중...
          </p>
        ) : !friends?.length ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🤝</p>
            <p className="text-[var(--color-text-secondary)] font-medium">아직 친구가 없습니다</p>
            <p className="text-[var(--color-text-tertiary)] text-sm mt-1">이메일로 친구를 추가해 보세요</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {friends.map((f: Friend) => (
              <div
                key={f.id}
                className="flex items-center bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary-dark)] font-bold mr-4">
                  {(f.friend_name || f.friend_email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--color-text)]">{f.friend_name || '이름 없음'}</p>
                  <p className="text-sm text-[var(--color-text-tertiary)]">{f.friend_email}</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`${f.friend_name || f.friend_email}님을 삭제하시겠습니까?`)) {
                      removeMutation.mutate(f.id);
                    }
                  }}
                  aria-label={`${f.friend_name || f.friend_email} 삭제`}
                  className="text-sm text-red-400 hover:text-red-500 transition-colors"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        ))}

      {tab === 'pending' &&
        (!pending?.length ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-[var(--color-text-secondary)] font-medium">대기 중인 요청이 없습니다</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {pending.map((p: PendingFriendRequest) => (
              <div
                key={p.id}
                className="flex items-center bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary-dark)] font-bold mr-4">
                  {(p.requester_name || p.requester_email || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--color-text)]">{p.requester_name || '이름 없음'}</p>
                  <p className="text-sm text-[var(--color-text-tertiary)]">{p.requester_email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptMutation.mutate(p.id)}
                    aria-label={`${p.requester_name || p.requester_email} 요청 수락`}
                    className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all"
                  >
                    수락
                  </button>
                  <button
                    onClick={() => removeMutation.mutate(p.id)}
                    aria-label={`${p.requester_name || p.requester_email} 요청 거절`}
                    className="px-4 py-2 bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] rounded-lg text-sm font-medium hover:opacity-80 transition-all"
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
