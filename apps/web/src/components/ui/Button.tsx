'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/cn';
import { LoadingSpinner } from './LoadingSpinner';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      type = 'button' as const, // prevent accidental form submits
      children,
      ...props
    },
    ref: React.Ref<HTMLButtonElement>
  ) => {
    const base =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const sizeCls =
      {
        xs: 'px-2 py-1 text-xs rounded-md',
        sm: 'px-3 py-1.5 text-sm rounded-md',
        md: 'px-4 py-2 text-sm rounded-lg',
        lg: 'px-6 py-3 text-base rounded-lg',
        xl: 'px-8 py-4 text-lg rounded-xl',
      }[size] || '';

    const variantCls =
      {
        primary:
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md',
        secondary:
          'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 border border-gray-200',
        outline:
          'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500',
        ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        danger:
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
      }[variant] || '';

    return (
      <button
        ref={ref}
        type={type}
        className={cn(base, sizeCls, variantCls, className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <LoadingSpinner size="sm" className="mr-2" aria-hidden />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
