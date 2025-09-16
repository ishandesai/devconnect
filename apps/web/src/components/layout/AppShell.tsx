'use client';
import Link from 'next/link';
import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { TeamSelector } from '@/components/TeamSelector';

export function Topbar() {
  return (
    <header className="h-16 border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 h-full max-w-7xl mx-auto">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white font-bold text-sm">DC</span>
            </div>
            <span className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
              DevConnect
            </span>
          </Link>
          <TeamSelector />
        </div>
        <nav className="flex items-center space-x-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors relative group"
          >
            Dashboard
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-200"></span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors relative group"
          >
            Login
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-200"></span>
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 hover:shadow-md transition-all duration-200 shadow-sm"
          >
            Sign Up
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Sidebar({
  items,
  activePath,
  className,
}: {
  items: { href: string; label: string; icon?: string }[];
  activePath?: string;
  className?: string;
}) {
  const getIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'docs':
        return '📄';
      case 'chat':
        return '💬';
      case 'tasks':
        return '📝';
      default:
        return '📁';
    }
  };

  return (
    <aside
      className={cn('w-72 border-r border-gray-200 bg-white p-6', className)}
    >
      <div className="mb-8">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Project Navigation
        </h3>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                  activePath === item.href
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                )}
              >
                <span className="text-lg group-hover:scale-110 transition-transform">
                  {item.icon || getIcon(item.label)}
                </span>
                <span>{item.label}</span>
                {activePath === item.href && (
                  <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export function AppShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      <Topbar />
      <div className="flex flex-1 min-h-0">
        {sidebar}
        <main className="flex-1 min-h-0 bg-gray-50">
          <div className="h-full p-8 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
