'use client';

import { cn } from '@/lib/cn';
import type { StatusProps } from '@/lib/design-system';

const statusConfig = {
  success: {
    icon: '✓',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  warning: {
    icon: '⚠',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
  },
  error: {
    icon: '✕',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
  },
  info: {
    icon: 'ℹ',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
} as const;

export function Status({
  type,
  message,
  showIcon = true,
  className,
}: StatusProps & { className?: string }) {
  const conf = statusConfig[type];

  return (
    <div
      className={cn(
        'flex items-center space-x-2 px-3 py-2 rounded-md border',
        conf.bgColor,
        conf.textColor,
        conf.borderColor,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {showIcon && <span className="text-sm font-medium" aria-hidden>{conf.icon}</span>}
      <span className="text-sm">{message}</span>
    </div>
  );
}
