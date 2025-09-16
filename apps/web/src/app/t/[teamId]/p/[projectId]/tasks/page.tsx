// app/t/[teamId]/p/[projectId]/tasks/page.tsx
import TaskBoard from '@/components/TaskBoard'
import type { ParamsPromise } from '@/types/route'

type RouteParams = { teamId: string; projectId: string }

export default async function TasksPage({ params }: ParamsPromise<RouteParams>) {
  const { projectId } = await params
  return <TaskBoard projectId={projectId} />
}
