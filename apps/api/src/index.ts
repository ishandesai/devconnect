import "dotenv/config";
import { fastify } from "fastify";
import cors from "@fastify/cors";
import { ApolloServer } from "@apollo/server";
import  fastifyApollo  from "@as-integrations/fastify";
const typeDefs = `#graphql
 type Query { hello: String! }
`;
const resolvers = { Query: { hello: () => "Hello World" } };
async function main() {
  const app = fastify({ logger: true });
 const allowed = (process.env.CORS_ORIGIN ?? '').split(',').map(s => s.trim()).filter(Boolean);

await app.register(cors, {
  origin: (origin, cb) => {
    // Allow server-to-server or curl (no Origin) and whitelisted dev origins
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'), false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Apollo-Require-Preflight', 'Apollo-Operation-Name'],
  credentials: true,
});
  const apollo = new ApolloServer({ typeDefs, resolvers });
  await apollo.start();
  await app.register(fastifyApollo(apollo), { path: "/graphql" });
  7;
  app.get("/healthz", async () => ({ ok: true }));
  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ host: "0.0.0.0", port });
  console.log(`API ready at http://localhost:${port}/graphql`);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
