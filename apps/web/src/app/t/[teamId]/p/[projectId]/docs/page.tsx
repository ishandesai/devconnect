// app/t/[teamId]/p/[projectId]/docs/page.tsx
import type { ParamsPromise } from '@/types/route'
import DocsClient from './DocsClient'

type RouteParams = { teamId: string; projectId: string }

export default async function DocsPage({ params }: ParamsPromise<RouteParams>) {
  const { projectId } = await params
  return <DocsClient projectId={projectId} />
}
