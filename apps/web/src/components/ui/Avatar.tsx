'use client';

import { cn } from '@/lib/cn';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  title?: string;
}

const avatarSizes: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-base',
};

const defaultColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-teal-500',
];

export function Avatar({
  name,
  size = 'md',
  color,
  className,
  title,
}: AvatarProps) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    (parts[0]?.[0] ?? '') + (parts.length > 1 ? (parts[1]?.[0] ?? '') : '');
  const safeInitials = (initials || '?').toUpperCase().slice(0, 2);

  const hash = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const bgColor = color ?? defaultColors[hash % defaultColors.length];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium text-white select-none',
        avatarSizes[size],
        bgColor,
        className
      )}
      title={title ?? name}
      aria-label={name}
      role="img"
    >
      {safeInitials}
    </div>
  );
}
