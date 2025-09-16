// src/context.ts
import type { FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

export const prisma = new PrismaClient();
export type Ctx = {
  prisma: PrismaClient;
  userId?: string;
  teamId?: string; // Add team context for tenant isolation
};

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';
type JwtPayload = { sub: string };

export function getUserIdFromAuthHeader(auth?: string): string | undefined {
  if (!auth) return;
  const [scheme, token] = auth.trim().split(/\s+/);
  if (scheme !== 'Bearer' || !token) return;
  try {
    return (jwt.verify(token, JWT_SECRET) as JwtPayload).sub;
  } catch {
    return;
  }
}

// Enhanced tenant isolation helpers
export async function requireTeamAccess(
  ctx: Ctx,
  teamId: string
): Promise<void> {
  if (!ctx.userId) throw new Error('UNAUTHENTICATED');

  const membership = await ctx.prisma.membership.findUnique({
    where: { userId_teamId: { userId: ctx.userId, teamId } },
    select: { role: true },
  });

  if (!membership) throw new Error('FORBIDDEN');
}

export async function requireProjectAccess(
  ctx: Ctx,
  projectId: string
): Promise<string> {
  if (!ctx.userId) throw new Error('UNAUTHENTICATED');

  const project = await ctx.prisma.project.findFirst({
    where: {
      id: projectId,
      team: { members: { some: { userId: ctx.userId } } },
    },
    select: { teamId: true },
  });

  if (!project) throw new Error('FORBIDDEN');
  return project.teamId;
}

export async function requireChannelAccess(
  ctx: Ctx,
  channelId: string
): Promise<string> {
  if (!ctx.userId) throw new Error('UNAUTHENTICATED');

  const channel = await ctx.prisma.channel.findFirst({
    where: {
      id: channelId,
      project: { team: { members: { some: { userId: ctx.userId } } } },
    },
    select: { project: { select: { teamId: true } } },
  });

  if (!channel) throw new Error('FORBIDDEN');
  return channel.project.teamId;
}

export async function requireTaskAccess(
  ctx: Ctx,
  taskId: string
): Promise<string> {
  if (!ctx.userId) throw new Error('UNAUTHENTICATED');

  const task = await ctx.prisma.task.findFirst({
    where: {
      id: taskId,
      project: { team: { members: { some: { userId: ctx.userId } } } },
    },
    select: { project: { select: { teamId: true } } },
  });

  if (!task) throw new Error('FORBIDDEN');
  return task.project.teamId;
}

export async function requireDocumentAccess(
  ctx: Ctx,
  documentId: string
): Promise<string> {
  if (!ctx.userId) throw new Error('UNAUTHENTICATED');

  const document = await ctx.prisma.document.findFirst({
    where: {
      id: documentId,
      project: { team: { members: { some: { userId: ctx.userId } } } },
    },
    select: { project: { select: { teamId: true } } },
  });

  if (!document) throw new Error('FORBIDDEN');
  return document.project.teamId;
}
