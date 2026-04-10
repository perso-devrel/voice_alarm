import { useQuery } from '@tanstack/react-query';
import { getStats, getRecentActivity } from '../services/api';
import type { Stats, Activity, WeekTrend } from '../services/api';

interface StatCardProps {
  emoji: string;
  label: string;
  value: number | undefined;
  isLoading: boolean;
  trend?: WeekTrend;
  onClick?: () => void;
}

function StatCard({ emoji, label, value, isLoading, trend, onClick }: StatCardProps) {
  const diff = trend ? trend.thisWeek - trend.lastWeek : 0;
  const showTrend = trend && (trend.thisWeek > 0 || trend.lastWeek > 0);

  return (
    <button
      onClick={onClick}
      className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] shadow-sm transition-all hover:border-[var(--color-primary)] hover:shadow-md text-left w-full"
    >
      <span className="text-3xl">{emoji}</span>
      <p className="text-3xl font-bold text-[var(--color-text)] mt-3">
        {isLoading ? (
          <span className="inline-block w-8 h-8 bg-[var(--color-surface-alt)] rounded animate-pulse" />
        ) : (
          value ?? 0
        )}
      </p>
      <p className="text-sm text-[var(--color-text-secondary)] mt-1">{label}</p>
      {!isLoading && showTrend && (
        <p className={`text-xs mt-2 font-medium ${
          diff > 0 ? 'text-green-500' : diff < 0 ? 'text-red-400' : 'text-[var(--color-text-tertiary)]'
        }`}>
          {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0'} vs 지난주
          {diff > 0 ? ' ↑' : diff < 0 ? ' ↓' : ''}
        </p>
      )}
    </button>
  );
}

const TYPE_META: Record<Activity['type'], { emoji: string; label: string; page: string }> = {
  alarm: { emoji: '⏰', label: '알람', page: 'alarms' },
  message: { emoji: '💌', label: '메시지', page: 'messages' },
  gift: { emoji: '🎁', label: '선물', page: 'gifts' },
  voice: { emoji: '🎙️', label: '음성', page: 'voices' },
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default function DashboardPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ['recentActivity'],
    queryFn: getRecentActivity,
  });

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--color-text)]">대시보드</h2>
        <p className="text-[var(--color-text-secondary)] mt-1">VoiceAlarm 현황을 한눈에 확인하세요</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          emoji="⏰"
          label="알람"
          value={stats?.alarms.total}
          isLoading={isLoading}
          trend={stats?.trends.alarms}
          onClick={() => onNavigate('alarms')}
        />
        <StatCard
          emoji="💌"
          label="메시지"
          value={stats?.messages.total}
          isLoading={isLoading}
          trend={stats?.trends.messages}
          onClick={() => onNavigate('messages')}
        />
        <StatCard
          emoji="🎙️"
          label="음성 프로필"
          value={stats?.voices.total}
          isLoading={isLoading}
          trend={stats?.trends.voices}
          onClick={() => onNavigate('voices')}
        />
        <StatCard
          emoji="👥"
          label="친구"
          value={stats?.friends.total}
          isLoading={isLoading}
          trend={stats?.trends.friends}
          onClick={() => onNavigate('friends')}
        />
        <StatCard
          emoji="🎁"
          label="받은 선물"
          value={stats?.gifts.received}
          isLoading={isLoading}
          trend={stats?.trends.gifts}
          onClick={() => onNavigate('gifts')}
        />
      </div>

      {stats && (stats.alarms.active > 0 || stats.gifts.receivedPending > 0) && (
        <div className="space-y-3 mb-8">
          {stats.alarms.active > 0 && (
            <div
              onClick={() => onNavigate('alarms')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('alarms'); }}
              className="bg-[var(--color-primary)]/10 rounded-xl p-4 border border-[var(--color-primary)]/20 cursor-pointer hover:bg-[var(--color-primary)]/15 transition-colors"
            >
              <p className="text-[var(--color-primary)] font-semibold">
                {stats.alarms.active}개의 알람이 활성화되어 있어요
              </p>
            </div>
          )}
          {stats.gifts.receivedPending > 0 && (
            <div
              onClick={() => onNavigate('gifts')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('gifts'); }}
              className="bg-[var(--color-accent)]/10 rounded-xl p-4 border border-[var(--color-accent)]/20 cursor-pointer hover:bg-[var(--color-accent)]/15 transition-colors"
            >
              <p className="text-[var(--color-accent)] font-semibold">
                {stats.gifts.receivedPending}개의 대기 중인 선물이 있어요
              </p>
            </div>
          )}
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">최근 활동</h3>
        {activitiesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-[var(--color-surface-alt)] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !activities?.length ? (
          <div className="text-center py-8 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-[var(--color-text-secondary)]">아직 활동이 없어요</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => {
              const meta = TYPE_META[activity.type];
              return (
                <div
                  key={activity.id}
                  onClick={() => onNavigate(meta.page)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(meta.page); }}
                  className="flex items-center gap-3 p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-primary)] transition-colors"
                >
                  <span className="text-xl">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text)] truncate">{activity.summary}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{meta.label}</p>
                  </div>
                  <span className="text-xs text-[var(--color-text-tertiary)] whitespace-nowrap">
                    {formatRelativeTime(activity.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
