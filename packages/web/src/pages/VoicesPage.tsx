import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVoiceProfiles, createVoiceClone, diarizeAudio, deleteVoiceProfile } from '../services/api';

export default function VoicesPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [provider, setProvider] = useState<'perso' | 'elevenlabs'>('perso');

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

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ready: 'bg-green-100 text-green-700',
      processing: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">음성 프로필</h2>
          <p className="text-gray-500 mt-1">소중한 사람의 목소리를 관리하세요</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-[#FF7F6B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#E05A47] transition-colors"
        >
          + 음성 등록
        </button>
      </div>

      {/* 업로드 폼 */}
      {showUpload && (
        <div className="bg-white rounded-2xl p-6 mb-6 border border-[#F2E8E5] shadow-sm">
          <h3 className="text-lg font-semibold mb-4">새 음성 등록</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="예: 엄마, 아빠"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF7F6B] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">음성 AI</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setProvider('perso')}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    provider === 'perso'
                      ? 'bg-[#FF7F6B] text-white border-[#FF7F6B]'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Perso.ai
                </button>
                <button
                  onClick={() => setProvider('elevenlabs')}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    provider === 'elevenlabs'
                      ? 'bg-[#FF7F6B] text-white border-[#FF7F6B]'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ElevenLabs
                </button>
              </div>
            </div>
          </div>

          <div
            className="border-2 border-dashed border-[#FFB4A8] rounded-xl p-8 text-center cursor-pointer hover:bg-[#FFF5F3] transition-colors mb-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            />
            <p className="text-4xl mb-2">📁</p>
            <p className="text-gray-600 font-medium">
              {uploadFile ? uploadFile.name : '오디오 파일을 선택하세요'}
            </p>
            <p className="text-gray-400 text-sm mt-1">MP3, WAV, M4A, AAC (최소 10초)</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => cloneMutation.mutate()}
              disabled={!uploadFile || !uploadName || cloneMutation.isPending}
              className="bg-[#FF7F6B] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E05A47] transition-colors disabled:opacity-50"
            >
              {cloneMutation.isPending ? '생성 중...' : '음성 등록'}
            </button>
            <button
              onClick={() => setShowUpload(false)}
              className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              취소
            </button>
          </div>

          {cloneMutation.isError && (
            <p className="text-red-500 text-sm mt-2">
              오류: {(cloneMutation.error as any)?.response?.data?.error || '업로드 실패'}
            </p>
          )}
        </div>
      )}

      {/* 프로필 목록 */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">로딩 중...</div>
      ) : !profiles?.length ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#F2E8E5]">
          <p className="text-5xl mb-4">🎵</p>
          <p className="text-gray-500 text-lg">아직 등록된 음성이 없어요</p>
          <p className="text-gray-400 text-sm mt-1">위의 버튼으로 음성을 등록해보세요</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile: any) => (
            <div key={profile.id} className="bg-white rounded-2xl p-5 border border-[#F2E8E5] shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#FFB4A8] flex items-center justify-center text-xl font-bold text-[#E05A47]">
                  {profile.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{profile.name}</h3>
                  {statusBadge(profile.status)}
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {new Date(profile.created_at).toLocaleDateString('ko-KR')}
              </p>
              <div className="flex gap-2">
                <button className="text-sm text-[#FF7F6B] font-medium hover:underline">
                  테스트
                </button>
                <button
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
