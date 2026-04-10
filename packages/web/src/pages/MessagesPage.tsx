import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getVoiceProfiles,
  getMessages,
  getPresets,
  generateTTS,
  getFriendList,
  sendGift,
} from '../services/api';
import type { VoiceProfile, Message, PresetCategory, Friend } from '../types';
import { getApiErrorMessage } from '../types';

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
      // base64 오디오를 재생
      if (audioRef.current) {
        audioRef.current.src = `data:audio/mp3;base64,${data.audio_base64}`;
        audioRef.current.play();
      }
      setMessageText('');
    },
  });

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
          <h2 className="text-3xl font-bold text-gray-900">메시지</h2>
          <p className="text-gray-500 mt-1">음성 메시지를 작성하고 관리하세요</p>
        </div>
        <div role="tablist" aria-label="메시지 탭" className="flex gap-2">
          <button
            role="tab"
            aria-selected={tab === 'list'}
            onClick={() => setTab('list')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'list' ? 'bg-[#FF7F6B] text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            목록
          </button>
          <button
            role="tab"
            aria-selected={tab === 'create'}
            onClick={() => setTab('create')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'create' ? 'bg-[#FF7F6B] text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            + 새 메시지
          </button>
        </div>
      </div>

      {tab === 'create' ? (
        <div className="max-w-2xl">
          {/* 음성 선택 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">누구의 목소리로?</label>
            <div className="flex gap-2 flex-wrap">
              {readyVoices.map((v: VoiceProfile) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  aria-pressed={selectedVoice === v.id}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                    selectedVoice === v.id
                      ? 'bg-[#FF7F6B] text-white border-[#FF7F6B]'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {v.name}
                </button>
              ))}
              {readyVoices.length === 0 && (
                <p className="text-gray-400 text-sm">먼저 음성을 등록해주세요</p>
              )}
            </div>
          </div>

          {/* 프리셋 */}
          {presets && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">프리셋 메시지</label>
              <div className="flex gap-2 flex-wrap mb-3">
                {presets.map((cat: PresetCategory) => (
                  <button
                    key={cat.category}
                    onClick={() => setCategory(cat.category)}
                    aria-pressed={category === cat.category}
                    className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${
                      category === cat.category
                        ? 'bg-[#FF7F6B] text-white border-[#FF7F6B]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
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
                          ? 'border-[#FF7F6B] bg-[#FFF5F3] text-[#FF7F6B]'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {msg}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* 직접 입력 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메시지 ({messageText.length}/200)
            </label>
            <textarea
              value={messageText}
              onChange={(e) => e.target.value.length <= 200 && setMessageText(e.target.value)}
              placeholder="메시지를 입력하세요..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#FF7F6B] resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedVoice || !messageText.trim() || ttsMutation.isPending}
            className="bg-[#FF7F6B] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#E05A47] transition-colors disabled:opacity-50"
          >
            {ttsMutation.isPending ? '음성 생성 중...' : '🔊 음성 메시지 생성'}
          </button>

          {ttsMutation.isSuccess && (
            <p role="status" className="text-green-600 text-sm mt-3">
              ✅ 음성 메시지가 생성되었습니다!
            </p>
          )}
          {ttsMutation.isError && (
            <p role="alert" className="text-red-500 text-sm mt-3">
              오류: {getApiErrorMessage(ttsMutation.error, '생성 실패')}
            </p>
          )}
        </div>
      ) : (
        /* 메시지 목록 */
        <div>
          {isLoading ? (
            <div role="status" className="text-center py-12 text-gray-400">
              로딩 중...
            </div>
          ) : !messages?.length ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#F2E8E5]">
              <p className="text-5xl mb-4">💌</p>
              <p className="text-gray-500">아직 생성된 메시지가 없어요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg: Message) => (
                <div
                  key={msg.id}
                  className="bg-white rounded-xl p-4 border border-[#F2E8E5] flex items-center gap-4"
                >
                  <span className="text-2xl">{CATEGORY_EMOJIS[msg.category] || '💌'}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#FF7F6B]">{msg.voice_name}</p>
                    <p className="text-gray-900">"{msg.text}"</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(msg.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
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
                    className="px-3 py-1.5 text-sm border border-[#FF6B8A] text-[#FF6B8A] rounded-lg hover:bg-[#FFF0ED] transition-colors"
                  >
                    🎁 선물
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
