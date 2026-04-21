import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  listSpeakers as listSpeakersDefault,
  renameSpeaker as renameSpeakerDefault,
  separateUpload as separateUploadDefault,
  uploadVoiceAudio as uploadVoiceAudioDefault,
  type Speaker,
  type VoiceUploadMeta,
} from '../services/api';

export interface SpeakerPickerApi {
  uploadVoiceAudio: (file: File, durationMs?: number) => Promise<VoiceUploadMeta>;
  separateUpload: (uploadId: string) => Promise<Speaker[]>;
  listSpeakers: (uploadId: string) => Promise<Speaker[]>;
  renameSpeaker: (uploadId: string, speakerId: string, label: string) => Promise<{ id: string; label: string }>;
}

export interface SpeakerPickerProps {
  onClose: () => void;
  onConfirm?: (speaker: Speaker, upload: VoiceUploadMeta) => void;
  api?: Partial<SpeakerPickerApi>;
}

const DEFAULT_API: SpeakerPickerApi = {
  uploadVoiceAudio: uploadVoiceAudioDefault,
  separateUpload: separateUploadDefault,
  listSpeakers: listSpeakersDefault,
  renameSpeaker: renameSpeakerDefault,
};

type Phase = 'idle' | 'uploading' | 'separating' | 'ready' | 'error';

export default function SpeakerPicker({ onClose, onConfirm, api }: SpeakerPickerProps) {
  const apiFns: SpeakerPickerApi = useMemo(() => ({ ...DEFAULT_API, ...api }), [api]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [upload, setUpload] = useState<VoiceUploadMeta | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  const hydrate = useCallback(
    async (uploadId: string) => {
      try {
        const existing = await apiFns.listSpeakers(uploadId);
        if (existing.length > 0) {
          setSpeakers(existing);
          setPhase('ready');
          return true;
        }
      } catch {
        // 조회 실패 → 새 분리 시도로 fallback
      }
      return false;
    },
    [apiFns],
  );

  async function handleUpload() {
    if (!file) return;
    setError(null);
    setPhase('uploading');
    try {
      const meta = await apiFns.uploadVoiceAudio(file);
      setUpload(meta);
      const reused = await hydrate(meta.id);
      if (!reused) {
        setPhase('separating');
        const detected = await apiFns.separateUpload(meta.id);
        setSpeakers(detected);
        setPhase('ready');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 실패');
      setPhase('error');
    }
  }

  async function commitLabel(speaker: Speaker) {
    if (!upload) return;
    const next = draftLabel.trim();
    if (next.length === 0 || next === speaker.label) {
      setEditingId(null);
      return;
    }
    try {
      await apiFns.renameSpeaker(upload.id, speaker.id, next);
      setSpeakers((prev) => prev.map((s) => (s.id === speaker.id ? { ...s, label: next } : s)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '라벨 수정 실패');
    }
  }

  useEffect(() => {
    // 모달 내부에 자동 포커스
    fileInputRef.current?.focus();
  }, []);

  const selected = speakers.find((s) => s.id === selectedId) ?? null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-label="화자 감지 및 선택"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-bold text-[var(--color-text)]">화자 감지</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            오디오를 업로드하면 모의 알고리즘이 화자를 나눕니다.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {phase === 'idle' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                aria-label="오디오 파일 선택"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm"
              />
              {file && (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  선택된 파일: <strong>{file.name}</strong>
                </p>
              )}
              <button
                onClick={handleUpload}
                disabled={!file}
                className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                업로드 후 화자 감지
              </button>
            </div>
          )}

          {(phase === 'uploading' || phase === 'separating') && (
            <div className="text-center py-10 text-[var(--color-text-secondary)]" role="status">
              {phase === 'uploading' ? '업로드 중…' : '화자 분리 중…'}
            </div>
          )}

          {phase === 'error' && (
            <div
              role="alert"
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-400"
            >
              {error ?? '알 수 없는 오류'}
            </div>
          )}

          {phase === 'ready' && (
            <>
              {speakers.length === 0 ? (
                <p className="text-center py-8 text-[var(--color-text-secondary)]">
                  감지된 화자가 없습니다.
                </p>
              ) : (
                <ul className="space-y-2" role="radiogroup" aria-label="감지된 화자 목록">
                  {speakers.map((sp) => {
                    const isSelected = selectedId === sp.id;
                    const isEditing = editingId === sp.id;
                    const durationSec = Math.max(0, (sp.end_ms - sp.start_ms) / 1000);
                    return (
                      <li
                        key={sp.id}
                        className={`border rounded-xl p-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/20'
                            : 'border-[var(--color-border)] hover:border-[var(--color-primary-light)]'
                        }`}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelectedId(sp.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          {isEditing ? (
                            <input
                              autoFocus
                              aria-label={`${sp.label} 라벨 편집`}
                              value={draftLabel}
                              onChange={(e) => setDraftLabel(e.target.value)}
                              onBlur={() => void commitLabel(sp)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') void commitLabel(sp);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg px-2 py-1 text-sm"
                            />
                          ) : (
                            <p className="font-semibold text-[var(--color-text)]">{sp.label}</p>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDraftLabel(sp.label);
                              setEditingId(sp.id);
                            }}
                            aria-label={`${sp.label} 이름 변경`}
                            className="text-xs text-[var(--color-primary)] hover:underline"
                          >
                            이름 변경
                          </button>
                        </div>
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                          {durationSec.toFixed(1)}초 · 신뢰도{' '}
                          {(sp.confidence * 100).toFixed(0)}%
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-[var(--color-border)] flex gap-2">
          {phase === 'ready' && onConfirm && upload && (
            <button
              onClick={() => selected && onConfirm(selected, upload)}
              disabled={!selected}
              className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              선택한 화자로 진행
            </button>
          )}
          <button
            onClick={onClose}
            className={`${
              phase === 'ready' && onConfirm ? 'flex-1' : 'w-full'
            } py-2.5 rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors font-medium`}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
