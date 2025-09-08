import type { Ctx } from './context';
import { compare, hash } from 'bcrypt';
import jwt from 'jsonwebtoken';

const requireAuth = (ctx: Ctx) => {
  if (!ctx.userId) throw new Error('UNAUTHENTICATED');
  return ctx.userId;
};

const requireEnv = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
};

async function isTeamAdmin(ctx: Ctx, teamId: string) {
  const userId = requireAuth(ctx);
  const m = await ctx.prisma.membership.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { role: true },
  });
  return m && (m.role === 'OWNER' || m.role === 'ADMIN');
}

export const resolvers = {
  Query: {
    currentUser: (_: unknown, __: unknown, ctx: Ctx) =>
      ctx.userId ? ctx.prisma.user.findUnique({ where: { id: ctx.userId } }) : null,

    // Only teams the user is in
    teams: async (_: unknown, __: unknown, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      return ctx.prisma.team.findMany({
        where: { members: { some: { userId } } },
        orderBy: { createdAt: 'desc' },
      });
    },

    teamById: async (_: unknown, { id }: { id: string }, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      const team = await ctx.prisma.team.findFirst({
        where: { id, members: { some: { userId } } },
      });
      if (!team) throw new Error('NOT_FOUND_OR_FORBIDDEN');
      return team;
    },

    projects: async (_: unknown, { teamId }: { teamId: string }, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      const member = await ctx.prisma.membership.findUnique({
        where: { userId_teamId: { userId, teamId } },
      });
      if (!member) throw new Error('FORBIDDEN');
      return ctx.prisma.project.findMany({ where: { teamId }, orderBy: { createdAt: 'desc' } });
    },

    documents: async (_: unknown, { projectId }: { projectId: string }, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      const project = await ctx.prisma.project.findFirst({
        where: { id: projectId, team: { members: { some: { userId } } } },
        select: { id: true },
      });
      if (!project) throw new Error('FORBIDDEN');
      return ctx.prisma.document.findMany({ where: { projectId }, orderBy: { updatedAt: 'desc' } });
    },

    channels: async (_: unknown, { projectId }: { projectId: string }, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      const ok = await ctx.prisma.project.findFirst({
        where: { id: projectId, team: { members: { some: { userId } } } },
        select: { id: true },
      });
      if (!ok) throw new Error('FORBIDDEN');
      return ctx.prisma.channel.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } });
    },

    messages: async (
      _: unknown,
      { channelId, limit }: { channelId: string; limit?: number },
      ctx: Ctx
    ) => {
      const userId = requireAuth(ctx);
      const ok = await ctx.prisma.channel.findFirst({
        where: { id: channelId, project: { team: { members: { some: { userId } } } } },
        select: { id: true },
      });
      if (!ok) throw new Error('FORBIDDEN');
      return ctx.prisma.message.findMany({
        where: { channelId },
        orderBy: { createdAt: 'asc' }, // typical chat ordering
        take: limit ?? 50,
      });
    },

    tasks: async (_: unknown, { projectId }: { projectId: string }, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      const ok = await ctx.prisma.project.findFirst({
        where: { id: projectId, team: { members: { some: { userId } } } },
        select: { id: true },
      });
      if (!ok) throw new Error('FORBIDDEN');
      return ctx.prisma.task.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } });
    },
  },

  Mutation: {
    signUp: async (_: unknown, { input }: any, ctx: Ctx) => {
      const exists = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (exists) throw new Error('EMAIL_TAKEN');
      const passwordHash = await hash(input.password, 10);
      const user = await ctx.prisma.user.create({
        data: { email: input.email, name: input.name, passwordHash },
      });
      const token = jwt.sign({ sub: user.id }, requireEnv('JWT_SECRET'), { expiresIn: '7d' });
      return { token, user };
    },

    signIn: async (_: unknown, { input }: any, ctx: Ctx) => {
      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (!user) throw new Error('INVALID_CREDENTIALS');
      const ok = await compare(input.password, user.passwordHash);
      if (!ok) throw new Error('INVALID_CREDENTIALS');
      const token = jwt.sign({ sub: user.id }, requireEnv('JWT_SECRET'), { expiresIn: '7d' });
      return { token, user };
    },

    createTeam: async (_: unknown, { input }: any, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      return ctx.prisma.team.create({
        data: {
          name: input.name,
          slug: input.slug,
          members: { create: { userId, role: 'OWNER' } },
        },
      });
    },

    addMember: async (_: unknown, { input }: any, ctx: Ctx) => {
      if (!(await isTeamAdmin(ctx, input.teamId))) throw new Error('FORBIDDEN');
      await ctx.prisma.membership.create({
        data: { teamId: input.teamId, userId: input.userId, role: input.role },
      });
      return true;
    },

    createProject: async (_: unknown, { input }: any, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      const member = await ctx.prisma.membership.findUnique({
        where: { userId_teamId: { userId, teamId: input.teamId } },
      });
      if (!member) throw new Error('FORBIDDEN');
      return ctx.prisma.project.create({
        data: { teamId: input.teamId, name: input.name, key: input.key },
      });
    },

    createDocument: async (_: unknown, { input }: any, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      const ok = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, team: { members: { some: { userId } } } },
      });
      if (!ok) throw new Error('FORBIDDEN');
      return ctx.prisma.document.create({
        data: { projectId: input.projectId, title: input.title, content: input.content ?? '' },
      });
    },

    createChannel: async (_: unknown, { input }: any, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      const ok = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, team: { members: { some: { userId } } } },
      });
      if (!ok) throw new Error('FORBIDDEN');
      return ctx.prisma.channel.create({ data: { projectId: input.projectId, name: input.name } });
    },

    sendMessage: async (_: unknown, { input }: any, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      const ok = await ctx.prisma.channel.findFirst({
        where: { id: input.channelId, project: { team: { members: { some: { userId } } } } },
      });
      if (!ok) throw new Error('FORBIDDEN');
      return ctx.prisma.message.create({
        data: { channelId: input.channelId, body: input.body, authorId: userId },
      });
    },

    addTask: async (_: unknown, { input }: any, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      const ok = await ctx.prisma.project.findFirst({
        where: { id: input.projectId, team: { members: { some: { userId } } } },
      });
      if (!ok) throw new Error('FORBIDDEN');
      return ctx.prisma.task.create({
        data: {
          projectId: input.projectId,
          title: input.title,
          description: input.description ?? '',
          priority: input.priority ?? 0,
          dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
          createdById: userId,
        },
      });
    },

    updateTask: async (_: unknown, { input }: any, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      // Ensure access
      const task = await ctx.prisma.task.findUnique({
        where: { id: input.id },
        select: { project: { select: { team: { select: { members: { where: { userId }, select: { id: true } } } } } } },
      });
      if (!task?.project.team.members.length) throw new Error('FORBIDDEN');

      const { id, dueAt, ...rest } = input;
      return ctx.prisma.task.update({
        where: { id },
        data: { ...rest, ...(dueAt !== undefined ? { dueAt: dueAt ? new Date(dueAt) : null } : {}) },
      });
    },

    assignTask: async (_: unknown, { input }: any, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      // Ensure access
      const task = await ctx.prisma.task.findUnique({
        where: { id: input.taskId },
        select: { project: { select: { team: { select: { members: { where: { userId }, select: { id: true } } } } } } },
      });
      if (!task?.project.team.members.length) throw new Error('FORBIDDEN');

      await ctx.prisma.taskAssignee.deleteMany({ where: { taskId: input.taskId } });
      await ctx.prisma.taskAssignee.createMany({
        data: input.userIds.map((uid: string) => ({ taskId: input.taskId, userId: uid })),
        skipDuplicates: true,
      });
      return ctx.prisma.task.findUnique({ where: { id: input.taskId } });
    },
  },

  // Field resolvers
  Message: {
    author: (m: any, _args: unknown, ctx: Ctx) =>
      ctx.prisma.user.findUnique({ where: { id: m.authorId } }),
  },

  Task: {
    assignees: async (t: any, _args: unknown, ctx: Ctx) => {
      const rows = await ctx.prisma.taskAssignee.findMany({
        where: { taskId: t.id },
        include: { user: true },
      });
      return rows.map(r => r.user);
    },
  },
};
