export function formatRelativeTime(dateStr: string, now: number = Date.now()): string {
  const diff = now - new Date(dateStr).getTime();
  if (diff < 0) return '방금 전';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}
