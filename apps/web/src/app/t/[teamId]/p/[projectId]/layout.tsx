// src/app/t/[teamId]/p/[projectId]/layout.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const runtime = 'nodejs'

import { AppShell, Sidebar } from '@/components/layout/AppShell'

type RouteParams = { teamId: string; projectId: string }

export default async function ProjectLayout({
  params,
  children,
}: {
  params: Promise<RouteParams> // 👈 Next 15 types expect a Promise here
  children: React.ReactNode
}) {
  const { teamId, projectId } = await params

  return (
    <AppShell
      sidebar={
        <Sidebar
          items={[
            { href: `/t/${teamId}/p/${projectId}/docs`, label: 'Docs', icon: '📄' },
            { href: `/t/${teamId}/p/${projectId}/chat`, label: 'Chat', icon: '💬' },
            { href: `/t/${teamId}/p/${projectId}/tasks`, label: 'Tasks', icon: '📝' },
          ]}
        />
      }
    >
      <div className="h-full flex flex-col">
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-2">
          <div className="flex items-center space-x-2 text-sm text-blue-700">
            <span className="font-medium">Team:</span>
            <span className="font-semibold">{teamId}</span>
            <span className="text-blue-500">•</span>
            <span className="font-medium">Project:</span>
            <span className="font-semibold">{projectId}</span>
          </div>
        </div>
        {children}
      </div>
    </AppShell>
  )
}
