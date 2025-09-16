// app/t/[teamId]/p/[projectId]/chat/page.tsx
import type { ParamsPromise } from '@/types/route'
import ChatClient from './ChatClient'

type RouteParams = { teamId: string; projectId: string }

export default async function ChatPage({ params }: ParamsPromise<RouteParams>) {
  const { projectId } = await params
  return <ChatClient projectId={projectId} />
}
