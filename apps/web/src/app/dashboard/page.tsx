// app/dashboard/page.tsx  (Server Component — no "use client")
import { Suspense } from 'react'
import DashboardClient from './DashboardClient'

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-8">
      {/* 👇 this becomes your LCP element and is available immediately */}
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      <p className="text-gray-600 mt-2">Manage your teams and projects</p>
      <Suspense
        fallback={<div className="h-24 rounded-lg bg-gray-100 animate-pulse" />}
      >
        <DashboardClient /> {/* contains Apollo, queries, etc. */}
      </Suspense>
    </div>
  )
}
