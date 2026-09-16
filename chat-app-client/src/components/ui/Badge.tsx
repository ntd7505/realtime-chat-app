import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'destructive' | 'primary';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200/60',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/60',
    destructive: 'bg-rose-50 text-rose-700 border-rose-200/60',
    primary: 'bg-zinc-900 text-white border-zinc-900',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
