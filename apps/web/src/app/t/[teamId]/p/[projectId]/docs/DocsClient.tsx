// app/t/[teamId]/p/[projectId]/docs/DocsClient.tsx
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// DocList is a *named* export; map it for dynamic()
const DocList = dynamic(
  () => import('@/components/DocList').then((m) => m.DocList),
  {
    // SSR stays on by default
    loading: () => (
      <div className="w-80 border-r border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-500">Loading documents…</p>
      </div>
    ),
  }
)

// CollaborativeEditor is heavy; load only on client
const CollaborativeEditor = dynamic(
  () => import('@/components/CollaborativeEditor'),
  {
    ssr: false,
    loading: () => <p className="p-4 text-sm text-gray-500">Loading editor…</p>,
  }
)

export default function DocsClient({ projectId }: { projectId: string }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div className="flex h-full">
      <DocList projectId={projectId} onOpen={setOpenId} selectedDocId={openId} />
      <div className="flex-1 min-w-0">
        {openId ? (
          <CollaborativeEditor docId={openId} />
        ) : (
          <p className="p-4 text-sm text-gray-500">Select a document</p>
        )}
      </div>
    </div>
  )
}
