'use client';

import { cn } from '@/lib/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  'aria-hidden'?: boolean;
}

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export function LoadingSpinner({
  size = 'md',
  text,
  className,
  ...rest
}: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)} role="status" aria-live="polite" {...rest}>
      <div
        className={cn(
          'rounded-full animate-spin border-2 border-gray-300 border-t-blue-600',
          spinnerSizes[size]
        )}
      />
      {text && <span className="text-sm text-gray-600">{text}</span>}
      <span className="sr-only">{text ?? 'Loading'}</span>
    </div>
  );
}
