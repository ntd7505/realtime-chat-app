import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullCenter?: boolean;
  className?: string;
  label?: string;
}

export function LoadingSpinner({
  size = 'md',
  fullCenter = false,
  className = '',
  label = 'Loading...',
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const spinner = (
    <div
      role="status"
      aria-label={label}
      className={cn("inline-flex items-center justify-center text-zinc-900", className)}
    >
      <CircleNotch
        size={sizeMap[size]}
        weight="bold"
        className="animate-spin text-zinc-800"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullCenter) {
    return (
      <div className="flex h-full w-full min-h-[200px] flex-1 items-center justify-center p-8">
        {spinner}
      </div>
    );
  }

  return spinner;
}
