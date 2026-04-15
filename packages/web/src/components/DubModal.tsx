import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDubLanguages, startDub, getDubStatus } from '../services/api';
import type { DubLanguage } from '../services/api';
import type { Message } from '../types';

interface DubModalProps {
  message: Message;
  onClose: () => void;
}

const SOURCE_LANGUAGES = [
  { code: 'ko', name: '한국어' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'zh', name: '中文' },
];

export function DubModal({ message, onClose }: DubModalProps) {
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [sourceLanguage, setSourceLanguage] = useState('ko');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [status, setStatus] = useState<'idle' | 'starting' | 'processing' | 'ready' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [remainingMinutes, setRemainingMinutes] = useState<number | undefined>();
  const [error, setError] = useState('');
  const [dubId, setDubId] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);

  const { data: languages, isLoading: loadingLanguages } = useQuery({
    queryKey: ['dubLanguages'],
    queryFn: getDubLanguages,
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const pollStatus = async (id: string) => {
    try {
      const result = await getDubStatus(id);
      setProgress(result.progress);
      setRemainingMinutes(result.expected_remaining_minutes);

      if (result.status === 'ready') {
        if (pollRef.current) clearInterval(pollRef.current);
        setStatus('ready');
        if (result.audio_base64) {
          setAudioBase64(result.audio_base64);
        }
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      } else if (result.status === 'failed') {
        if (pollRef.current) clearInterval(pollRef.current);
        setStatus('failed');
        setError(result.error_message || '번역에 실패했습니다');
      }
    } catch {
      // polling error - retry on next interval
    }
  };

  const handleStart = async () => {
    if (!targetLanguage || sourceLanguage === targetLanguage) return;

    setStatus('starting');
    setError('');

    try {
      if (!message.audio_url) {
        setStatus('failed');
        setError('오디오 파일이 없습니다');
        return;
      }

      const audioRes = await fetch(message.audio_url);
      const blob = await audioRes.blob();
      const file = new File([blob], 'audio.mp3', { type: 'audio/mpeg' });

      const result = await startDub(file, sourceLanguage, targetLanguage, message.id);
      setDubId(result.dub_id);
      setStatus('processing');
      setProgress(0);

      pollRef.current = setInterval(() => {
        pollStatus(result.dub_id);
      }, 5000);
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : '번역 시작에 실패했습니다');
    }
  };

  const handlePlay = () => {
    if (audioRef.current && audioBase64) {
      audioRef.current.src = `data:audio/mp3;base64,${audioBase64}`;
      audioRef.current.play();
    }
  };

  const filteredLanguages = languages?.filter((l: DubLanguage) => l.code !== sourceLanguage) ?? [];
  const isProcessing = status === 'starting' || status === 'processing';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <audio ref={audioRef} className="hidden" />

        <div className="p-6 border-b border-[var(--color-border)]">
          <h3 className="text-xl font-bold text-[var(--color-text)]">음성 번역</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            원래 목소리를 유지하면서 다른 언어로 번역합니다
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] mb-6">
            <p className="text-sm text-[var(--color-primary)] font-medium mb-1">{message.voice_name}</p>
            <p className="text-[var(--color-text)] italic">"{message.text}"</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">원본 언어</label>
            <div className="flex gap-2 flex-wrap">
              {SOURCE_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSourceLanguage(lang.code)}
                  disabled={isProcessing}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sourceLanguage === lang.code
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">번역할 언어</label>
            {loadingLanguages ? (
              <p className="text-sm text-[var(--color-text-tertiary)]">언어 목록 불러오는 중...</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filteredLanguages.map((lang: DubLanguage) => (
                  <button
                    key={lang.code}
                    onClick={() => setTargetLanguage(lang.code)}
                    disabled={isProcessing}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      targetLanguage === lang.code
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]'
                    }`}
                  >
                    {lang.name}
                    {lang.experiment && (
                      <span className="ml-1 text-[10px] opacity-60">beta</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {status === 'processing' && (
            <div className="text-center py-6">
              <div className="w-12 h-12 border-4 border-[var(--color-primary-light)] border-t-[var(--color-primary)] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg font-semibold text-[var(--color-primary)]">{progress}% 완료</p>
              {remainingMinutes != null && (
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">약 {remainingMinutes}분 남음</p>
              )}
            </div>
          )}

          {status === 'ready' && (
            <div className="text-center py-6">
              <p className="text-lg font-bold text-green-600 mb-4">번역 완료!</p>
              {audioBase64 && (
                <button
                  onClick={handlePlay}
                  className="bg-[var(--color-primary)] text-white px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-colors"
                >
                  번역된 음성 재생
                </button>
              )}
              <p className="text-sm text-[var(--color-text-tertiary)] mt-3">라이브러리에 저장되었습니다</p>
            </div>
          )}

          {status === 'failed' && (
            <div className="text-center py-6">
              <p className="text-lg font-semibold text-red-500 mb-2">번역 실패</p>
              <p className="text-sm text-[var(--color-text-tertiary)] mb-4">{error}</p>
              <button
                onClick={handleStart}
                className="px-6 py-2 border border-[var(--color-primary)] text-[var(--color-primary)] rounded-xl hover:bg-[var(--color-primary)]/10 transition-colors font-medium"
              >
                다시 시도
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--color-border)] flex gap-2">
          {(status === 'idle' || status === 'starting') && (
            <button
              onClick={handleStart}
              disabled={!targetLanguage || isProcessing}
              className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary)] text-white hover:opacity-90 font-medium transition-opacity disabled:opacity-50"
            >
              {status === 'starting' ? '준비 중...' : '번역 시작'}
            </button>
          )}
          <button
            onClick={onClose}
            disabled={isProcessing}
            className={`${status === 'idle' ? '' : 'flex-1'} py-2.5 px-4 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors font-medium disabled:opacity-50`}
          >
            {status === 'ready' ? '닫기' : '취소'}
          </button>
        </div>
      </div>
    </div>
  );
}
