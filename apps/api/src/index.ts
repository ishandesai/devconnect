import 'dotenv/config';
import { fastify } from 'fastify';
import cors from '@fastify/cors';
import { ApolloServer } from '@apollo/server';
import  fastifyApollo  from '@as-integrations/fastify';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { prisma, getUserIdFromAuthHeader, type Ctx } from './context';

import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';

async function main() {
  const app = fastify({ logger: true });
  await app.register(cors, { origin: process.env.CORS_ORIGIN?.split(',') ?? true, credentials: true });

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const apollo = new ApolloServer<Ctx>({ schema });
  await apollo.start();

  await app.register(fastifyApollo(apollo), {
  path: '/graphql',
  context: async (request, reply): Promise<Ctx> => {
    const auth = request.headers['authorization']; // string | string[] | undefined
    const userId = getUserIdFromAuthHeader(
      typeof auth === 'string' ? auth : undefined
    );
    return { prisma, userId };
  },
});


  app.get('/healthz', async () => ({ ok: true }));

  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ port, host: '0.0.0.0' });

  // Attach WS server to Fastify's underlying HTTP server
  const wss = new WebSocketServer({ server: app.server, path: '/graphql' });
  useServer<Ctx>({
    schema,
    context: async (ctx/*, msg, args*/) => {
      const auth = (ctx.connectionParams as any)?.Authorization || (ctx.connectionParams as any)?.authorization;
      const userId = typeof auth === 'string' ? getUserIdFromAuthHeader(auth) : undefined;
      return { prisma, userId };
    }
  }, wss);

  app.log.info(`API ready at http://localhost:${port}/graphql (HTTP & WS)`);
}

main().catch((e) => { console.error(e); process.exit(1); });