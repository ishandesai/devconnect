import type { Ctx } from './context';
import {
  assertTeamMember,
  assertTeamRole,
  teamIdForProject,
  teamIdForChannel,
  teamIdForDocument,
  teamIdForTask,
} from './tenant';
import { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pubsub, MSG_TOPIC, TASK_ADDED, TASK_UPDATED } from './pubsub';

import { GraphQLScalarType, Kind } from 'graphql';

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
  return !!m && (m.role === 'OWNER' || m.role === 'ADMIN');
}

const DateTime = new GraphQLScalarType({
  name: 'DateTime',
  serialize(value: unknown) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' || typeof value === 'number')
      return new Date(value).toISOString();
    throw new Error('DateTime serialization error');
  },
  parseValue(value: unknown) {
    if (typeof value === 'string' || typeof value === 'number')
      return new Date(value);
    throw new Error('DateTime parse error');
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return new Date(ast.value);
    if (ast.kind === Kind.INT) return new Date(Number(ast.value));
    return null;
  },
});

export const resolvers = {
  DateTime,

  Query: {
    currentUser: (_: unknown, __: unknown, ctx: Ctx) =>
      ctx.userId
        ? ctx.prisma.user.findUnique({ where: { id: ctx.userId } })
        : null,

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
      await assertTeamMember(ctx, teamId);
      return ctx.prisma.project.findMany({
        where: { teamId },
        orderBy: { createdAt: 'desc' },
      });
    },

    documents: async (
      _: unknown,
      { projectId }: { projectId: string },
      ctx: Ctx
    ) => {
      const teamId = await teamIdForProject(ctx, projectId);
      await assertTeamMember(ctx, teamId);
      return ctx.prisma.document.findMany({
        where: { projectId },
        orderBy: { updatedAt: 'desc' },
      });
    },

    document: async (_: unknown, { id }: { id: string }, ctx: Ctx) => {
      const teamId = await teamIdForDocument(ctx, id);
      await assertTeamMember(ctx, teamId);
      return ctx.prisma.document.findUnique({ where: { id } });
    },

    channels: async (
      _: unknown,
      { projectId }: { projectId: string },
      ctx: Ctx
    ) => {
      const teamId = await teamIdForProject(ctx, projectId);
      await assertTeamMember(ctx, teamId);
      return ctx.prisma.channel.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      });
    },

    messages: async (
      _: unknown,
      { channelId, limit }: { channelId: string; limit?: number },
      ctx: Ctx
    ) => {
      const teamId = await teamIdForChannel(ctx, channelId);
      await assertTeamMember(ctx, teamId);
      return ctx.prisma.message.findMany({
        where: { channelId },
        orderBy: { createdAt: 'asc' },
        take: limit ?? 50,
      });
    },

    tasks: async (
      _: unknown,
      { projectId }: { projectId: string },
      ctx: Ctx
    ) => {
      const teamId = await teamIdForProject(ctx, projectId);
      await assertTeamMember(ctx, teamId);
      return ctx.prisma.task.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Mutation: {
    signUp: async (_: unknown, { input }: any, ctx: Ctx) => {
      const exists = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (exists) throw new Error('EMAIL_TAKEN');
      const passwordHash = await hash(input.password, 10);
      const user = await ctx.prisma.user.create({
        data: { email: input.email, name: input.name, passwordHash },
      });
      const token = jwt.sign({ sub: user.id }, requireEnv('JWT_SECRET'), {
        expiresIn: '7d',
      });
      return { token, user };
    },

    signIn: async (_: unknown, { input }: any, ctx: Ctx) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });
      if (!user || !user.passwordHash) throw new Error('INVALID_CREDENTIALS');
      const ok = await compare(input.password, user.passwordHash);
      if (!ok) throw new Error('INVALID_CREDENTIALS');
      const token = jwt.sign({ sub: user.id }, requireEnv('JWT_SECRET'), {
        expiresIn: '7d',
      });
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
      await assertTeamRole(ctx, input.teamId, 'ADMIN');
      await ctx.prisma.membership.create({
        data: { teamId: input.teamId, userId: input.userId, role: input.role },
      });
      return true;
    },

    removeMember: async (
      _: unknown,
      { teamId, userId }: { teamId: string; userId: string },
      ctx: Ctx
    ) => {
      await assertTeamRole(ctx, teamId, 'ADMIN');

      const ownerCount = await ctx.prisma.membership.count({
        where: { teamId, role: 'OWNER' },
      });

      const targetMember = await ctx.prisma.membership.findUnique({
        where: { userId_teamId: { userId, teamId } },
        select: { role: true },
      });

      if (targetMember?.role === 'OWNER' && ownerCount <= 1) {
        throw new Error('CANNOT_REMOVE_LAST_OWNER');
      }

      await ctx.prisma.membership.delete({
        where: { userId_teamId: { userId, teamId } },
      });

      return true;
    },

    createProject: async (_: unknown, { input }: any, ctx: Ctx) => {
      await assertTeamMember(ctx, input.teamId);
      return ctx.prisma.project.create({
        data: { teamId: input.teamId, name: input.name, key: input.key },
      });
    },

    deleteProject: async (
      _: unknown,
      { projectId }: { projectId: string },
      ctx: Ctx
    ) => {
      const teamId = await teamIdForProject(ctx, projectId);
      await assertTeamRole(ctx, teamId, 'ADMIN');

      await ctx.prisma.task.deleteMany({ where: { projectId } });
      await ctx.prisma.message.deleteMany({
        where: { channel: { projectId } },
      });
      await ctx.prisma.channel.deleteMany({ where: { projectId } });
      await ctx.prisma.document.deleteMany({ where: { projectId } });
      await ctx.prisma.project.delete({ where: { id: projectId } });

      return true;
    },

    createDocument: async (_: unknown, { input }: any, ctx: Ctx) => {
      const teamId = await teamIdForProject(ctx, input.projectId);
      await assertTeamMember(ctx, teamId);
      return ctx.prisma.document.create({
        data: {
          projectId: input.projectId,
          title: input.title,
          content: input.content ?? '',
        },
      });
    },

    updateDocument: async (_: unknown, { input }: any, ctx: Ctx) => {
      const teamId = await teamIdForDocument(ctx, input.id);
      await assertTeamMember(ctx, teamId);
      const { id, ...updateData } = input;
      return ctx.prisma.document.update({
        where: { id },
        data: { ...updateData, updatedAt: new Date() },
      });
    },

    updateDocumentContent: async (
      _: unknown,
      { id, content }: { id: string; content: string },
      ctx: Ctx
    ) => {
      const teamId = await teamIdForDocument(ctx, id);
      await assertTeamMember(ctx, teamId);
      return ctx.prisma.document.update({
        where: { id },
        data: { content, updatedAt: new Date() },
      });
    },

    deleteDocument: async (_: unknown, { id }: { id: string }, ctx: Ctx) => {
      const teamId = await teamIdForDocument(ctx, id);
      await assertTeamRole(ctx, teamId, 'MEMBER');
      await ctx.prisma.document.delete({ where: { id } });
      return true;
    },

    createChannel: async (_: unknown, { input }: any, ctx: Ctx) => {
      const teamId = await teamIdForProject(ctx, input.projectId);
      await assertTeamMember(ctx, teamId);
      return ctx.prisma.channel.create({
        data: { projectId: input.projectId, name: input.name },
      });
    },

    deleteChannel: async (
      _: unknown,
      { channelId }: { channelId: string },
      ctx: Ctx
    ) => {
      const teamId = await teamIdForChannel(ctx, channelId);
      await assertTeamRole(ctx, teamId, 'MEMBER');

      await ctx.prisma.message.deleteMany({ where: { channelId } });
      await ctx.prisma.channel.delete({ where: { id: channelId } });

      return true;
    },

    sendMessage: async (_: unknown, { input }: any, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      const teamId = await teamIdForChannel(ctx, input.channelId);
      await assertTeamMember(ctx, teamId);

      const message = await ctx.prisma.message.create({
        data: {
          channelId: input.channelId,
          body: input.body,
          authorId: userId,
        },
        include: { author: true },
      });

      const teamScopedTopic = `TEAM:${teamId}:MSG:${input.channelId}`;
      await Promise.all([
        pubsub.publish(MSG_TOPIC(input.channelId), { messageAdded: message }),
        pubsub.publish(teamScopedTopic, { messageAdded: message }),
      ]);
      return message as any;
    },

    addTask: async (_: unknown, { input }: any, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      const teamId = await teamIdForProject(ctx, input.projectId);
      await assertTeamMember(ctx, teamId);

      const task = await ctx.prisma.task.create({
        data: {
          projectId: input.projectId,
          title: input.title,
          description: input.description ?? '',
          priority: input.priority ?? 0,
          dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
          createdById: userId,
        },
      });

      const teamScopedTopic = `TEAM:${teamId}:TASK_ADDED:${input.projectId}`;
      await Promise.all([
        pubsub.publish(TASK_ADDED(task.projectId), { taskAdded: task }),
        pubsub.publish(teamScopedTopic, { taskAdded: task }),
      ]);
      return task;
    },

    updateTask: async (_: unknown, { input }: any, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      const teamId = await teamIdForTask(ctx, input.id);
      await assertTeamMember(ctx, teamId);

      const { id, dueAt, ...rest } = input;
      const updated = await ctx.prisma.task.update({
        where: { id },
        data: {
          ...rest,
          ...(dueAt !== undefined
            ? { dueAt: dueAt ? new Date(dueAt) : null }
            : {}),
        },
      });

      const teamScopedTopic = `TEAM:${teamId}:TASK_UPDATED:${updated.projectId}`;
      await Promise.all([
        pubsub.publish(TASK_UPDATED(updated.projectId), {
          taskUpdated: updated,
        }),
        pubsub.publish(teamScopedTopic, { taskUpdated: updated }),
      ]);
      return updated;
    },

    updateTaskStatus: async (
      _: unknown,
      { id, status }: { id: string; status: 'TODO' | 'DOING' | 'DONE' },
      ctx: Ctx
    ) => {
      const userId = requireAuth(ctx);
      const teamId = await teamIdForTask(ctx, id);
      await assertTeamMember(ctx, teamId);

      const updated = await ctx.prisma.task.update({
        where: { id },
        data: { status },
      });

      const teamScopedTopic = `TEAM:${teamId}:TASK_UPDATED:${updated.projectId}`;
      await Promise.all([
        pubsub.publish(TASK_UPDATED(updated.projectId), {
          taskUpdated: updated,
        }),
        pubsub.publish(teamScopedTopic, { taskUpdated: updated }),
      ]);
      return updated;
    },

    assignTask: async (_: unknown, { input }: any, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      const teamId = await teamIdForTask(ctx, input.taskId);
      await assertTeamMember(ctx, teamId);

      await ctx.prisma.taskAssignee.deleteMany({
        where: { taskId: input.taskId },
      });
      await ctx.prisma.taskAssignee.createMany({
        data: input.userIds.map((uid: string) => ({
          taskId: input.taskId,
          userId: uid,
        })),
        skipDuplicates: true,
      });

      const updated = await ctx.prisma.task.findUnique({
        where: { id: input.taskId },
      });
      if (updated) {
        const teamScopedTopic = `TEAM:${teamId}:TASK_UPDATED:${updated.projectId}`;
        await Promise.all([
          pubsub.publish(TASK_UPDATED(updated.projectId), {
            taskUpdated: updated,
          }),
          pubsub.publish(teamScopedTopic, { taskUpdated: updated }),
        ]);
      }
      return updated;
    },

    deleteTask: async (
      _: unknown,
      { taskId }: { taskId: string },
      ctx: Ctx
    ) => {
      const teamId = await teamIdForTask(ctx, taskId);
      await assertTeamRole(ctx, teamId, 'MEMBER');

      await ctx.prisma.taskAssignee.deleteMany({ where: { taskId } });
      await ctx.prisma.task.delete({ where: { id: taskId } });

      return true;
    },
  },

  Subscription: {
    messageAdded: {
      subscribe: async (
        _: unknown,
        { channelId }: { channelId: string },
        ctx: Ctx
      ) => {
        const teamId = await teamIdForChannel(ctx, channelId);
        await assertTeamMember(ctx, teamId);
        const teamScopedTopic = `TEAM:${teamId}:MSG:${channelId}`;
        return pubsub.asyncIterator([MSG_TOPIC(channelId), teamScopedTopic]);
      },
    },

    taskAdded: {
      subscribe: async (
        _: unknown,
        { projectId }: { projectId: string },
        ctx: Ctx
      ) => {
        const teamId = await teamIdForProject(ctx, projectId);
        await assertTeamMember(ctx, teamId);
        const teamScopedTopic = `TEAM:${teamId}:TASK_ADDED:${projectId}`;
        return pubsub.asyncIterator([TASK_ADDED(projectId), teamScopedTopic]);
      },
    },
    taskUpdated: {
      subscribe: async (
        _: unknown,
        { projectId }: { projectId: string },
        ctx: Ctx
      ) => {
        const teamId = await teamIdForProject(ctx, projectId);
        await assertTeamMember(ctx, teamId);
        const teamScopedTopic = `TEAM:${teamId}:TASK_UPDATED:${projectId}`;
        return pubsub.asyncIterator([TASK_UPDATED(projectId), teamScopedTopic]);
      },
    },
  },

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
      return rows.map((r) => r.user);
    },
  },
};
