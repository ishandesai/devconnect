import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

export const pubsub = new RedisPubSub({
  publisher: new Redis(process.env.REDIS_URL!),
  subscriber: new Redis(process.env.REDIS_URL!),
});

// Team-scoped subscription topics for tenant isolation
export const MSG_TOPIC = (channelId: string) => `MSG:${channelId}`;
export const TASK_ADDED = (projectId: string) => `TASK:ADDED:${projectId}`;
export const TASK_UPDATED = (projectId: string) => `TASK:UPDATED:${projectId}`;

// Team-based subscription topics for better isolation
export const TEAM_MSG_TOPIC = (teamId: string, channelId: string) =>
  `TEAM:${teamId}:MSG:${channelId}`;
export const TEAM_TASK_ADDED = (teamId: string, projectId: string) =>
  `TEAM:${teamId}:TASK:ADDED:${projectId}`;
export const TEAM_TASK_UPDATED = (teamId: string, projectId: string) =>
  `TEAM:${teamId}:TASK:UPDATED:${projectId}`;
export const TEAM_DOC_UPDATED = (teamId: string, documentId: string) =>
  `TEAM:${teamId}:DOC:UPDATED:${documentId}`;

// Helper to get team-scoped topics
export const getTeamScopedTopics = (teamId: string) => ({
  messageAdded: (channelId: string) => TEAM_MSG_TOPIC(teamId, channelId),
  taskAdded: (projectId: string) => TEAM_TASK_ADDED(teamId, projectId),
  taskUpdated: (projectId: string) => TEAM_TASK_UPDATED(teamId, projectId),
  documentUpdated: (documentId: string) => TEAM_DOC_UPDATED(teamId, documentId),
});
