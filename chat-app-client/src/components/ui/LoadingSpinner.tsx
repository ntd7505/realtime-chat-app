
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullCenter?: boolean;
}

export function LoadingSpinner({ size = 'md', fullCenter = false }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  const spinner = (
    <div
      className={`inline-block ${sizeClasses[size]} rounded-full border-gray-200 border-t-indigo-600 animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullCenter) {
    return (
      <div className="flex justify-center items-center h-full w-full p-8">
        {spinner}
      </div>
    );
  }

  return spinner;
}
