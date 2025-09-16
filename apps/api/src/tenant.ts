import type { Ctx } from './context';

export function requireRole(
  m: { role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST' },
  min: 'ADMIN' | 'MEMBER'
) {
  const order = ['GUEST', 'MEMBER', 'ADMIN', 'OWNER'];
  return order.indexOf(m.role) >= order.indexOf(min);
}

export async function assertTeamMember(ctx: Ctx, teamId: string) {
  if (!ctx.userId) throw new Error('UNAUTHENTICATED');
  const membership = await ctx.prisma.membership.findFirst({
    where: { userId: ctx.userId, teamId },
  });
  if (!membership) throw new Error('FORBIDDEN');
  return membership; // use role later if needed
}

export async function getTeamMembership(ctx: Ctx, teamId: string) {
  if (!ctx.userId) throw new Error('UNAUTHENTICATED');
  const membership = await ctx.prisma.membership.findFirst({
    where: { userId: ctx.userId, teamId },
    select: { role: true },
  });
  if (!membership) throw new Error('FORBIDDEN');
  return membership;
}

export async function assertTeamRole(
  ctx: Ctx,
  teamId: string,
  minRole: 'ADMIN' | 'MEMBER'
) {
  const membership = await getTeamMembership(ctx, teamId);
  if (!requireRole(membership, minRole)) {
    throw new Error('INSUFFICIENT_PERMISSIONS');
  }
  return membership;
}

export async function teamIdForProject(ctx: Ctx, projectId: string) {
  const p = await ctx.prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true },
  });
  if (!p) throw new Error('NOT_FOUND');
  return p.teamId;
}

export async function teamIdForChannel(ctx: Ctx, channelId: string) {
  const c = await ctx.prisma.channel.findUnique({
    where: { id: channelId },
    select: { project: { select: { teamId: true } } },
  });
  if (!c) throw new Error('NOT_FOUND');
  return c.project.teamId;
}

export async function teamIdForDocument(ctx: Ctx, docId: string) {
  const d = await ctx.prisma.document.findUnique({
    where: { id: docId },
    select: { project: { select: { teamId: true } } },
  });
  if (!d) throw new Error('NOT_FOUND');
  return d.project.teamId;
}

export async function teamIdForTask(ctx: Ctx, taskId: string) {
  const t = await ctx.prisma.task.findUnique({
    where: { id: taskId },
    select: { project: { select: { teamId: true } } },
  });
  if (!t) throw new Error('NOT_FOUND');
  return t.project.teamId;
}

// Convenience function to check access and return teamId
export async function requireProjectAccess(ctx: Ctx, projectId: string) {
  const teamId = await teamIdForProject(ctx, projectId);
  await assertTeamMember(ctx, teamId);
  return teamId;
}

export async function requireChannelAccess(ctx: Ctx, channelId: string) {
  const teamId = await teamIdForChannel(ctx, channelId);
  await assertTeamMember(ctx, teamId);
  return teamId;
}

export async function requireDocumentAccess(ctx: Ctx, documentId: string) {
  const teamId = await teamIdForDocument(ctx, documentId);
  await assertTeamMember(ctx, teamId);
  return teamId;
}

export async function requireTaskAccess(ctx: Ctx, taskId: string) {
  const teamId = await teamIdForTask(ctx, taskId);
  await assertTeamMember(ctx, teamId);
  return teamId;
}

// Team-scoped subscription helpers
export async function getTeamScopedChannelTopic(ctx: Ctx, channelId: string) {
  const teamId = await teamIdForChannel(ctx, channelId);
  await assertTeamMember(ctx, teamId);
  return `TEAM:${teamId}:MSG:${channelId}`;
}

export async function getTeamScopedProjectTopic(
  ctx: Ctx,
  projectId: string,
  event: 'TASK_ADDED' | 'TASK_UPDATED'
) {
  const teamId = await teamIdForProject(ctx, projectId);
  await assertTeamMember(ctx, teamId);
  return `TEAM:${teamId}:${event}:${projectId}`;
}
