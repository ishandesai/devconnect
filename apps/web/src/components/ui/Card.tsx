'use client';

import { cn } from '@/lib/cn';
import { forwardRef } from 'react';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'outlined' | 'elevated' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', ...props }, ref) => {
    const variantCls =
      {
        default: 'bg-white border border-gray-200 shadow-sm',
        outlined: 'bg-white border border-gray-200',
        elevated: 'bg-white shadow-lg border border-gray-100',
        flat: 'bg-gray-50 border border-gray-100',
      }[variant] || '';

    const paddingCls =
      {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8',
      }[padding] || '';

    return (
      <div
        ref={ref}
        className={cn('rounded-xl', variantCls, paddingCls, className)}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
