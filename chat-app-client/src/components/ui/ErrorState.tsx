import { WarningCircle, ArrowCounterClockwise } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-rose-50/60 border border-rose-100 max-w-md mx-auto my-4 shadow-2xs",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3" aria-hidden="true">
        <WarningCircle size={24} weight="bold" />
      </div>
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-600 max-w-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 min-h-[44px] px-4 py-2 text-sm font-semibold text-zinc-900 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-xs focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
        >
          <ArrowCounterClockwise size={16} weight="bold" aria-hidden="true" />
          <span>Try again</span>
        </button>
      )}
    </div>
  );
}
