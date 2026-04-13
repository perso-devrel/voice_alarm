function Pulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--color-surface-alt)] ${className ?? ''}`}
    />
  );
}

export function AlarmSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-[var(--color-surface)] rounded-2xl p-6 border border-[var(--color-border)] flex items-center gap-6"
        >
          <div className="flex-1">
            <Pulse className="h-10 w-24 mb-2" />
            <Pulse className="h-4 w-16 mb-3" />
            <Pulse className="h-3 w-32 mb-1" />
            <Pulse className="h-3 w-48" />
          </div>
          <Pulse className="h-6 w-11 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function VoiceCardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-[var(--color-surface)] rounded-2xl p-5 border border-[var(--color-border)]"
        >
          <div className="flex items-center gap-3 mb-3">
            <Pulse className="w-12 h-12 rounded-full" />
            <div className="flex-1">
              <Pulse className="h-4 w-24 mb-1" />
              <Pulse className="h-3 w-16" />
            </div>
          </div>
          <Pulse className="h-3 w-full mb-2" />
          <Pulse className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] flex items-center gap-4"
        >
          <Pulse className="w-10 h-10 rounded-lg" />
          <div className="flex-1">
            <Pulse className="h-3 w-20 mb-2" />
            <Pulse className="h-4 w-3/4 mb-1" />
            <Pulse className="h-3 w-24" />
          </div>
          <Pulse className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function FriendSkeleton() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]"
        >
          <Pulse className="w-10 h-10 rounded-full mr-4" />
          <div className="flex-1">
            <Pulse className="h-4 w-28 mb-1" />
            <Pulse className="h-3 w-40" />
          </div>
          <Pulse className="h-8 w-14 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function GiftSkeleton() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)]"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <Pulse className="h-4 w-24 mb-1" />
              <Pulse className="h-3 w-36" />
            </div>
            <Pulse className="h-5 w-12 rounded" />
          </div>
          <Pulse className="h-4 w-3/4 mb-2" />
          <Pulse className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}
