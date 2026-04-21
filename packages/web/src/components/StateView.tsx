import { resolveStateView, type StateViewVariant } from '@voice-alarm/ui';

interface StateViewProps {
  variant: StateViewVariant;
  emoji?: string;
  title?: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}

export default function StateView({ variant, emoji, title, subtitle, action }: StateViewProps) {
  const cfg = resolveStateView(variant, { emoji, title, subtitle });

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center"
      role={variant === 'error' ? 'alert' : 'status'}
      aria-busy={variant === 'loading'}
    >
      {variant === 'loading' ? (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)] mb-4" />
      ) : (
        <span className="text-4xl mb-4" aria-hidden="true">{cfg.emoji}</span>
      )}
      <h3 className="text-base font-semibold text-[var(--color-text)] mb-1">{cfg.title}</h3>
      {cfg.subtitle && (
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">{cfg.subtitle}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
