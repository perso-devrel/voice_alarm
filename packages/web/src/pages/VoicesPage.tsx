import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVoiceProfiles, createVoiceClone, deleteVoiceProfile, updateVoiceProfile, generateTTS, getMessagesByVoice, getAlarms } from '../services/api';
import type { VoiceProfile, Message, Alarm } from '../types';
import { getApiErrorMessage } from '../types';
import { VoiceCardSkeleton } from '../components/Skeleton';
import SpeakerPicker from '../components/SpeakerPicker';
import { sanitizeVoiceName } from '../lib/voiceName';

export default function VoicesPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const testAudioRef = useRef<HTMLAudioElement>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailProfile, setDetailProfile] = useState<VoiceProfile | null>(null);
  const [showSpeakerPicker, setShowSpeakerPicker] = useState(false);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: getVoiceProfiles,
  });

  const cloneMutation = useMutation({
    mutationFn: () => createVoiceClone(uploadFile!, uploadName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
      setShowUpload(false);
      setUploadName('');
      setUploadFile(null);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateVoiceProfile(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
    },
    onError: (err) => {
      alert(`이름 변경 실패: ${getApiErrorMessage(err, '네트워크 오류')}`);
    },
  });

  const handleRename = (profile: VoiceProfile) => {
    const raw = window.prompt('새 이름을 입력하세요 (1~50자)', profile.name);
    if (raw === null) return;
    const sanitized = sanitizeVoiceName(raw);
    if (!sanitized.ok) {
      alert(sanitized.error ?? '이름이 올바르지 않습니다.');
      return;
    }
    if (sanitized.value === profile.name) return;
    renameMutation.mutate({ id: profile.id, name: sanitized.value });
  };

  const deleteMutation = useMutation({
    mutationFn: deleteVoiceProfile,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['voiceProfiles'] });
      const previous = queryClient.getQueryData<VoiceProfile[]>(['voiceProfiles']);
      queryClient.setQueryData<VoiceProfile[]>(['voiceProfiles'], (old) =>
        old ? old.filter((p) => p.id !== id) : [],
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['voiceProfiles'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
    },
  });

  const handleTest = async (profileId: string) => {
    setTestingId(profileId);
    try {
      const data = await generateTTS({
        voice_profile_id: profileId,
        text: '안녕하세요, 음성 테스트입니다.',
        category: 'custom',
      });
      if (testAudioRef.current && data.audio_base64) {
        testAudioRef.current.src = `data:audio/mp3;base64,${data.audio_base64}`;
        testAudioRef.current.play();
      }
    } catch {
      alert('음성 테스트에 실패했습니다.');
    } finally {
      setTestingId(null);
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ready: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      processing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    const labels: Record<string, string> = {
      ready: '사용 가능',
      processing: '생성 중',
      failed: '실패',
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredProfiles = (() => {
    if (!profiles) return [];
    const q = search.toLowerCase().trim();
    return profiles.filter((p: VoiceProfile) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (q) return p.name.toLowerCase().includes(q);
      return true;
    });
  })();

  return (
    <div>
      <audio ref={testAudioRef} className="hidden" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-text)]">음성 프로필</h2>
          <p className="text-[var(--color-text-secondary)] mt-1">소중한 사람의 목소리를 관리하세요</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSpeakerPicker(true)}
            className="bg-[var(--color-surface)] border border-[var(--color-primary)] text-[var(--color-primary)] px-5 py-3 rounded-xl font-semibold hover:bg-[var(--color-primary-light)]/20 transition-colors"
          >
            화자 감지
          </button>
          <button
            onClick={() => setShowUpload(!showUpload)}
            aria-expanded={showUpload}
            className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-colors"
          >
            + 음성 등록
          </button>
        </div>
      </div>

      {showSpeakerPicker && (
        <SpeakerPicker onClose={() => setShowSpeakerPicker(false)} />
      )}

      {showUpload && (
        <div className="bg-[var(--color-surface)] rounded-2xl p-6 mb-6 border border-[var(--color-border)] shadow-sm transition-colors">
          <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">새 음성 등록</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">이름</label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="예: 엄마, 아빠"
                className="w-full border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
              />
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            aria-label={uploadFile ? `선택된 파일: ${uploadFile.name}` : '오디오 파일 선택'}
            className="border-2 border-dashed border-[var(--color-primary-light)] rounded-xl p-8 text-center cursor-pointer hover:bg-[var(--color-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors mb-4"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
            <p className="text-4xl mb-2" aria-hidden="true">
              📁
            </p>
            <p className="text-[var(--color-text-secondary)] font-medium">
              {uploadFile ? uploadFile.name : '오디오 파일을 선택하세요'}
            </p>
            <p className="text-[var(--color-text-tertiary)] text-sm mt-1">MP3, WAV, M4A, AAC (최소 10초)</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => cloneMutation.mutate()}
              disabled={!uploadFile || !uploadName || cloneMutation.isPending}
              className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {cloneMutation.isPending ? '생성 중...' : '음성 등록'}
            </button>
            <button
              onClick={() => setShowUpload(false)}
              className="px-6 py-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
            >
              취소
            </button>
          </div>

          {cloneMutation.isError && (
            <p className="text-red-500 text-sm mt-2">
              오류: {getApiErrorMessage(cloneMutation.error, '업로드 실패')}
            </p>
          )}
        </div>
      )}

      {/* 검색 + 상태 필터 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="음성 프로필 검색..."
            aria-label="음성 프로필 검색"
            className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] rounded-xl px-4 py-2.5 pl-10 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-colors"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
            🔍
          </span>
        </div>
        <div className="flex gap-2" role="radiogroup" aria-label="상태 필터">
          {([['all', '전체'], ['ready', '사용 가능'], ['processing', '생성 중'], ['failed', '실패']] as const).map(([value, label]) => (
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

      {isLoading ? (
        <VoiceCardSkeleton />
      ) : !profiles?.length ? (
        <div className="text-center py-16 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] transition-colors">
          <p className="text-5xl mb-4">🎵</p>
          <p className="text-[var(--color-text-secondary)] text-lg">아직 등록된 음성이 없어요</p>
          <p className="text-[var(--color-text-tertiary)] text-sm mt-1">위의 버튼으로 음성을 등록해보세요</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="text-center py-12 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] transition-colors">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-[var(--color-text-secondary)]">검색 결과가 없습니다</p>
          <button onClick={() => { setSearch(''); setStatusFilter('all'); }} className="text-sm text-[var(--color-primary)] mt-2 hover:underline">
            필터 초기화
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((profile: VoiceProfile) => (
            <div
              key={profile.id}
              className="bg-[var(--color-surface)] rounded-2xl p-5 border border-[var(--color-border)] shadow-sm transition-colors cursor-pointer hover:border-[var(--color-primary)]"
              onClick={() => setDetailProfile(profile)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-xl font-bold text-[var(--color-primary-dark)]">
                  {profile.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--color-text)]">{profile.name}</h3>
                  {statusBadge(profile.status)}
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
                {new Date(profile.created_at).toLocaleDateString('ko-KR')}
              </p>
              <div className="flex gap-2">
                <button
                  aria-label={`${profile.name} 음성 테스트`}
                  className="text-sm text-[var(--color-primary)] font-medium hover:underline disabled:opacity-50"
                  disabled={testingId === profile.id || profile.status !== 'ready'}
                  onClick={(e) => { e.stopPropagation(); handleTest(profile.id); }}
                >
                  {testingId === profile.id ? '생성 중...' : '테스트'}
                </button>
                <button
                  aria-label={`${profile.name} 이름 변경`}
                  className="text-sm text-[var(--color-text-secondary)] font-medium hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename(profile);
                  }}
                >
                  이름 변경
                </button>
                <button
                  aria-label={`${profile.name} 프로필 삭제`}
                  className="text-sm text-red-400 font-medium hover:underline ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`"${profile.name}" 프로필을 삭제하시겠어요?`)) {
                      deleteMutation.mutate(profile.id);
                    }
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailProfile && (
        <VoiceDetailModal
          profile={detailProfile}
          onClose={() => setDetailProfile(null)}
        />
      )}
    </div>
  );
}

export function VoiceDetailModal({ profile, onClose, onCreateMessage }: { profile: VoiceProfile; onClose: () => void; onCreateMessage?: () => void }) {
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['voiceMessages', profile.id],
    queryFn: () => getMessagesByVoice(profile.id),
  });

  const { data: allAlarms, isLoading: loadingAlarms } = useQuery({
    queryKey: ['alarms'],
    queryFn: getAlarms,
  });

  const voiceAlarms = allAlarms?.filter((a: Alarm) => a.voice_name === profile.name) ?? [];
  const isLoading = loadingMessages || loadingAlarms;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[var(--color-border)] text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-2xl font-bold text-[var(--color-primary-dark)] mx-auto mb-3">
            {profile.name.charAt(0)}
          </div>
          <h3 className="text-xl font-bold text-[var(--color-text)]">{profile.name}</h3>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            {new Date(profile.created_at).toLocaleDateString('ko-KR')}
          </p>
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--color-primary)]">{messages?.length ?? 0}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">메시지</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[var(--color-primary)]">{voiceAlarms.length}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">알람</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">불러오는 중...</div>
          ) : (messages?.length === 0 && voiceAlarms.length === 0) ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              아직 이 음성으로 만든 메시지나 알람이 없어요
            </div>
          ) : (
            <>
              {messages && messages.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">메시지</h4>
                  <div className="space-y-2">
                    {messages.map((m: Message) => (
                      <div key={m.id} className="bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-border)]">
                        <p className="text-xs text-[var(--color-text-tertiary)] mb-1">{m.category}</p>
                        <p className="text-sm text-[var(--color-text)] line-clamp-2">{m.text}</p>
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                          {new Date(m.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {voiceAlarms.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">알람</h4>
                  <div className="space-y-2">
                    {voiceAlarms.map((a: Alarm) => (
                      <div key={a.id} className="bg-[var(--color-surface)] rounded-xl p-3 border border-[var(--color-border)]">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-light text-[var(--color-text)]">{a.time}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${a.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                            {a.is_active ? '활성' : '비활성'}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-1">{a.message_text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-[var(--color-border)] flex gap-2">
          {onCreateMessage && profile.status === 'ready' && (
            <button
              onClick={onCreateMessage}
              className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity font-medium"
            >
              이 음성으로 메시지 만들기
            </button>
          )}
          <button
            onClick={onClose}
            className={`${onCreateMessage && profile.status === 'ready' ? 'flex-1' : 'w-full'} py-2.5 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors font-medium`}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
