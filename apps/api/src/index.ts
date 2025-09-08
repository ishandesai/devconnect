// apps/api/src/index.ts
import 'dotenv/config';
import { ApolloServer } from '@apollo/server';
import  fastifyApollo  from '@as-integrations/fastify';
import Fastify from 'fastify';
import cors from '@fastify/cors';

import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { prisma, getUserIdFromAuthHeader } from './context';

async function main() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  const app = Fastify();
  await app.register(cors, { origin: true });

  await app.register(fastifyApollo(server), {
    context: async (request, reply) => ({
      prisma,
      userId: getUserIdFromAuthHeader(
        // Fastify headers live on `request.headers`
        (request.headers.authorization as string | undefined) ??
        (request.headers['Authorization'] as string | undefined) // just in case
      ),
    }),
    path: '/graphql',
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`🚀 GraphQL ready at http://localhost:${port}/graphql`);
}

main().catch((e) => { console.error(e); process.exit(1); });
