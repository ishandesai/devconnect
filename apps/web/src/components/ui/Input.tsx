'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import type { InputHTMLAttributes } from 'react';

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
}

const inputVariants = {
  default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  outlined: 'border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  filled:
    'bg-gray-100 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-blue-500',
};

const inputSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = 'default', size = 'md', error = false, className, ...props }, ref) => {
    const base =
      'block w-full rounded-md border shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed';

    return (
      <input
        ref={ref}
        className={cn(
          base,
          inputVariants[variant],
          inputSizes[size],
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        aria-invalid={error || undefined}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
