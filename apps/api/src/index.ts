import 'dotenv/config';
import { fastify } from 'fastify';
import cors from '@fastify/cors';
import { ApolloServer } from '@apollo/server';
import fastifyApollo from '@as-integrations/fastify';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';

import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { prisma, getUserIdFromAuthHeader, type Ctx } from './context';
import { teamIdForDocument, assertTeamMember } from './tenant';

// ✅ Liveblocks server SDK
import { Liveblocks } from '@liveblocks/node';

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!, // set this in env
});

async function main() {
  const app = fastify({ logger: true });
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  });

  // ✅ Build GraphQL schema once
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  // ✅ Start Apollo once
  const apollo = new ApolloServer<Ctx>({ schema });
  await apollo.start();

  await app.register(fastifyApollo(apollo), {
    path: '/graphql',
    context: async (request, reply): Promise<Ctx> => {
      const userId = getUserIdFromAuthHeader(request.headers.authorization);
      return { prisma, userId };
    },
  });

  app.get('/healthz', async () => ({ ok: true }));

  // ✅ Liveblocks auth endpoint (access token)
  app.post('/liveblocks-auth', async (request, reply) => {
    const { room } = (request.body as any) ?? {};
    const auth = request.headers.authorization as string | undefined;
    const userId = getUserIdFromAuthHeader(auth);

    if (!userId) return reply.code(401).send({ error: 'UNAUTHENTICATED' });
    if (!room || typeof room !== 'string' || !room.startsWith('doc:')) {
      return reply.code(400).send({ error: 'INVALID_ROOM' });
    }

    const docId = room.slice(4);

    try {
      // Check team membership for the document
      const teamId = await teamIdForDocument({ prisma, userId }, docId);
      await assertTeamMember({ prisma, userId }, teamId);
    } catch (error) {
      // If user is not a member of the document's team, deny access
      return reply.code(403).send({ error: 'FORBIDDEN' });
    }

    const session = liveblocks.prepareSession(userId, {
      userInfo: { id: userId },
    });

    // Full access to this room; wildcard patterns also supported
    session.allow(room, session.FULL_ACCESS);

    // Access-token flow:
    const { body, status } = await session.authorize(); // returns { token } body
    reply.status(status).send(body);
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ port, host: '0.0.0.0' });

  // ✅ GraphQL over WebSocket subscriptions (graphql-ws)
  const wss = new WebSocketServer({ server: app.server, path: '/graphql' });
  useServer<Ctx>(
    {
      schema,
      context: async (ctx) => {
        const auth =
          (ctx.connectionParams as any)?.Authorization ??
          (ctx.connectionParams as any)?.authorization;
        const userId =
          typeof auth === 'string' ? getUserIdFromAuthHeader(auth) : undefined;
        return { prisma, userId };
      },
    },
    wss
  );

  app.log.info(`API ready at http://localhost:${port}/graphql (HTTP & WS)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
