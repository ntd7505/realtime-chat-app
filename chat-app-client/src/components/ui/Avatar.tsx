import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  url?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ url, name, size = 'md', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [prevUrl, setPrevUrl] = useState(url);

  // Reset error state if url changes (derived state pattern to avoid useEffect cascading renders)
  if (url !== prevUrl) {
    setPrevUrl(url);
    setHasError(false);
  }

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl'
  };

  const getInitials = (str: string) => {
    return str
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const showImage = url && !hasError;

  return (
    <div 
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-zinc-200 flex-shrink-0",
        sizeClasses[size],
        className
      )}
      aria-label={name}
      title={name}
    >
      {showImage ? (
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="font-medium text-zinc-600">
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
