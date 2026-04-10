import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVoiceProfiles, createVoiceClone, deleteVoiceProfile, generateTTS } from '../services/api';
import type { VoiceProfile } from '../types';
import { getApiErrorMessage } from '../types';

export default function VoicesPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [provider, setProvider] = useState<'perso' | 'elevenlabs'>('perso');
  const [testingId, setTestingId] = useState<string | null>(null);
  const testAudioRef = useRef<HTMLAudioElement>(null);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['voiceProfiles'],
    queryFn: getVoiceProfiles,
  });

  const cloneMutation = useMutation({
    mutationFn: () => createVoiceClone(uploadFile!, uploadName, provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] });
      setShowUpload(false);
      setUploadName('');
      setUploadFile(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVoiceProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['voiceProfiles'] }),
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

  return (
    <div>
      <audio ref={testAudioRef} className="hidden" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-text)]">음성 프로필</h2>
          <p className="text-[var(--color-text-secondary)] mt-1">소중한 사람의 목소리를 관리하세요</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          aria-expanded={showUpload}
          className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-colors"
        >
          + 음성 등록
        </button>
      </div>

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
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">음성 AI</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setProvider('perso')}
                  aria-pressed={provider === 'perso'}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    provider === 'perso'
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
                  }`}
                >
                  Perso.ai
                </button>
                <button
                  onClick={() => setProvider('elevenlabs')}
                  aria-pressed={provider === 'elevenlabs'}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    provider === 'elevenlabs'
                      ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
                  }`}
                >
                  ElevenLabs
                </button>
              </div>
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

      {isLoading ? (
        <div role="status" className="text-center py-12 text-[var(--color-text-tertiary)]">
          로딩 중...
        </div>
      ) : !profiles?.length ? (
        <div className="text-center py-16 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] transition-colors">
          <p className="text-5xl mb-4">🎵</p>
          <p className="text-[var(--color-text-secondary)] text-lg">아직 등록된 음성이 없어요</p>
          <p className="text-[var(--color-text-tertiary)] text-sm mt-1">위의 버튼으로 음성을 등록해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile: VoiceProfile) => (
            <div
              key={profile.id}
              className="bg-[var(--color-surface)] rounded-2xl p-5 border border-[var(--color-border)] shadow-sm transition-colors"
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
                  onClick={() => handleTest(profile.id)}
                >
                  {testingId === profile.id ? '생성 중...' : '테스트'}
                </button>
                <button
                  aria-label={`${profile.name} 프로필 삭제`}
                  className="text-sm text-red-400 font-medium hover:underline ml-auto"
                  onClick={() => {
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
    </div>
  );
}
