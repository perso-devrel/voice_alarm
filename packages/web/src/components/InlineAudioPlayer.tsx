import { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
  audioUrl: string;
}

export function InlineAudioPlayer({ audioUrl }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setCurrentTime(audio.currentTime);
    setProgress(audio.currentTime / audio.duration);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setProgress(ratio);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <button
        onClick={togglePlay}
        aria-label={isPlaying ? '일시정지' : '재생'}
        className="w-7 h-7 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-xs hover:opacity-90 transition-opacity flex-shrink-0"
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <div
        className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full cursor-pointer relative"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-[var(--color-primary)] rounded-full transition-[width] duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="text-[10px] text-[var(--color-text-tertiary)] tabular-nums w-[70px] text-right flex-shrink-0">
        {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : '--:--'}
      </span>
    </div>
  );
}
