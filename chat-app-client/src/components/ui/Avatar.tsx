import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  url?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  isOnline?: boolean;
}

export function Avatar({ url, name, size = 'md', className = '', isOnline }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [prevUrl, setPrevUrl] = useState(url);

  // Reset error state if url changes
  if (url !== prevUrl) {
    setPrevUrl(url);
    setHasError(false);
  }

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };

  const statusDotSizes = {
    xs: 'w-1.5 h-1.5 border',
    sm: 'w-2 h-2 border',
    md: 'w-2.5 h-2.5 border-2',
    lg: 'w-3.5 h-3.5 border-2',
    xl: 'w-4 h-4 border-2',
  };

  const getInitials = (str: string) => {
    if (!str.trim()) return '?';
    return str
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const showImage = Boolean(url && !hasError);

  return (
    <div className={cn("relative inline-block flex-shrink-0", sizeClasses[size], className)}>
      <div
        className={cn(
          "w-full h-full inline-flex items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-zinc-700 font-medium select-none shadow-2xs",
        )}
        aria-label={name}
        title={name}
      >
        {showImage ? (
          <img
            src={url!}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
            loading="lazy"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>

      {typeof isOnline === 'boolean' && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-white",
            statusDotSizes[size],
            isOnline ? "bg-emerald-500" : "bg-zinc-500"
          )}
          role="img"
          aria-label={isOnline ? 'Online' : 'Offline'}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}
