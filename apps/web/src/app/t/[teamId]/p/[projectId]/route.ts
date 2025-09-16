// app/t/[teamId]/p/[projectId]/route.ts
import { NextResponse } from 'next/server'

type RouteParams = { teamId: string; projectId: string }

export async function GET(
  req: Request,
  { params }: { params: Promise<RouteParams> }
) {
  const { teamId, projectId } = await params
  return NextResponse.redirect(
    new URL(`/t/${teamId}/p/${projectId}/docs`, req.url)
  )
}

export async function HEAD(
  req: Request,
  ctx: { params: Promise<RouteParams> }
) {
  return GET(req, ctx)
}
