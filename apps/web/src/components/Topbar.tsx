'use client';
import Link from 'next/link';

export default function Topbar(){
  return (
    <header className="h-12 flex items-center justify-between px-4 border-b">
      <Link href="/dashboard" className="font-semibold">DevConnect</Link>
      <nav className="flex gap-3 text-sm">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/login">Login</Link>
        <Link href="/signup">Signup</Link>
      </nav>
    </header>
  );
}