export function generateWaveform(seed: string, barCount: number): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const bars: number[] = [];
  for (let i = 0; i < barCount; i++) {
    hash = ((hash * 1103515245 + 12345) & 0x7fffffff);
    const normalized = (hash % 1000) / 1000;
    const envelope = Math.sin((i / barCount) * Math.PI);
    bars.push(0.15 + normalized * 0.85 * (0.3 + envelope * 0.7));
  }
  return bars;
}

export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
