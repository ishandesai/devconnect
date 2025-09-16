// app/t/[teamId]/p/[projectId]/chat/ChatClient.tsx
'use client'

import ChatPanel from '@/components/ChatPanel'
// If ChatPanel is heavy, you can dynamic() it with ssr:false similar to the editor.

export default function ChatClient({ projectId }: { projectId: string }) {
  return <ChatPanel projectId={projectId} />
}
