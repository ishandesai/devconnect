# Monorepo Setup — Next.js (web) + Node GraphQL (api)

A copy‑pasteable scaffold to get you from zero → running in minutes. It uses **pnpm workspaces + Turborepo**, **TypeScript** across the stack, **Docker** for Postgres/Redis, and clean separation between **apps/** (product code) and **packages/** (shared code & config).

> Works on macOS/Linux **and** Windows (PowerShell). If you’re on Windows and see `corepack`/`pnpm` issues, see the *Windows notes* at the bottom.

---

## 0) Prerequisites

- **Node 20 LTS** (18+ is OK). Optional: install via `nvm` / `nvm-windows` / `fnm`.
- **Git** (init from the start).
- **Docker Desktop** (for Postgres & Redis via Compose).
- **Corepack** (ships with modern Node) to enable **pnpm**.

```bash
# macOS/Linux
node -v
corepack enable
corepack use pnpm@9
pnpm -v
```

```powershell
# Windows PowerShell
node -v
corepack enable
corepack use pnpm@9
pnpm -v
```

> If `corepack` isn’t recognized: `npm i -g corepack` then run `corepack enable`.

---

## 1) Create repo & workspace skeleton

```bash
mkdir devconnect && cd devconnect

git init -b main

echo "node_modules\n.pnp.cjs\n.pnpm-store\n.turbo\n.next\ndist\n.env*\n.DS_Store\ncoverage\n" > .gitignore

# Enable pnpm workspaces + add dev tooling
corepack enable
corepack use pnpm@9
pnpm init -y

pnpm add -D turbo typescript tsx eslint prettier eslint-config-prettier \
  eslint-plugin-import eslint-plugin-simple-import-sort @types/node \
  husky lint-staged commitlint @commitlint/config-conventional

# Workspace folders
mkdir -p apps/web apps/api packages/{tsconfig,eslint-config,types}
```

**Root `package.json`**
```json
{
  "name": "devconnect",
  "private": true,
  "packageManager": "pnpm@9",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "prepare": "husky install"
  },
  "lint-staged": {
    "**/*.{ts,tsx,js,jsx,md,css,json}": ["prettier --write"],
    "**/*.{ts,tsx,js,jsx}": ["eslint --fix"]
  },
  "devDependencies": {
    "@commitlint/config-conventional": "^19.0.0"
  }
}
```

**`turbo.json`**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "lint": {},
    "typecheck": {}
  }
}
```

**Husky & Commitlint**
```bash
pnpm dlx husky-init --yarn2 && pnpm exec husky install
# Update the created .husky/pre-commit to run lint-staged
sed -i.bak 's/pnpm test/pnpm exec lint-staged/' .husky/pre-commit || powershell -Command "(Get-Content .husky/pre-commit) -replace 'pnpm test','pnpm exec lint-staged' | Set-Content .husky/pre-commit"

echo "module.exports = { extends: ['@commitlint/config-conventional'] };" > commitlint.config.cjs
```

---

## 2) Shared config packages

**`packages/tsconfig/tsconfig.base.json`**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```

**`packages/eslint-config/index.cjs`**
```js
module.exports = {
  root: false,
  env: { es2022: true, node: true, browser: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['import', 'simple-import-sort'],
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  rules: {
    'import/order': 'off',
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
    'import/newline-after-import': 'warn'
  }
}
```

**`packages/types/package.json`**
```json
{
  "name": "@repo/types",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts"
}
```

**`packages/types/src/index.ts`**
```ts
export type UserId = string;
export type TenantId = string;
```

---

## 3) Web app — Next.js (TypeScript)

> We’ll scaffold via `create-next-app` and plug Apollo Client. Uses App Router.

```bash
pnpm create next-app@latest apps/web \
  --ts --eslint --tailwind --app --src-dir --use-pnpm \
  --import-alias "@/*" --no-experimental-app

cd apps/web
pnpm add @apollo/client graphql
pnpm add -D @types/node
```

**`apps/web/package.json`** (ensure name)
```json
{
  "name": "@devconnect/web",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "eslintConfig": { "extends": ["next/core-web-vitals", "@repo/eslint-config"] }
}
```

**`apps/web/src/lib/apollo.ts`**
```ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

export const makeClient = () =>
  new ApolloClient({
    link: new HttpLink({ uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql', fetch }),
    cache: new InMemoryCache(),
  });
```

**`apps/web/src/app/providers.tsx`**
```tsx
'use client';
import { PropsWithChildren } from 'react';
import { ApolloProvider } from '@apollo/client';
import { makeClient } from '@/lib/apollo';

export default function Providers({ children }: PropsWithChildren) {
  const client = makeClient();
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
```

**`apps/web/src/app/layout.tsx`** (wrap with Providers)
```tsx
import Providers from './providers';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**`apps/web/src/app/page.tsx`** (test query)
```tsx
'use client';
import { gql, useQuery } from '@apollo/client';

const HELLO = gql`query { hello }`;

export default function Home() {
  const { data } = useQuery(HELLO);
  return <main className="p-8">GraphQL says: <b>{data?.hello ?? '...'}</b></main>;
}
```

**Env for web** — `apps/web/.env.local`
```
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
```

---

## 4) API — Fastify + Apollo Server (GraphQL)

```bash
cd ../../
mkdir -p apps/api/src

pnpm add -F . -D tsx typescript @types/node
pnpm add -F ./apps/api fastify @apollo/server graphql @as-integrations/fastify @fastify/cors zod
```

**`apps/api/package.json`**
```json
{
  "name": "@devconnect/api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  }
}
```

**`apps/api/tsconfig.json`**
```json
{
  "extends": "../../packages/tsconfig/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

**`apps/api/src/index.ts`**
```ts
import 'dotenv/config';
import { fastify } from 'fastify';
import cors from '@fastify/cors';
import { ApolloServer } from '@apollo/server';
import { fastifyApollo } from '@as-integrations/fastify';

const typeDefs = `#graphql
  type Query { hello: String! }
`;
const resolvers = { Query: { hello: () => 'world' } };

async function main() {
  const app = fastify({ logger: true });
  await app.register(cors, { origin: process.env.CORS_ORIGIN?.split(',') ?? true, credentials: true });

  const apollo = new ApolloServer({ typeDefs, resolvers });
  await apollo.start();
  await app.register(fastifyApollo(apollo), { path: '/graphql' });

  app.get('/healthz', async () => ({ ok: true }));

  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ host: '0.0.0.0', port });
  console.log(`API ready at http://localhost:${port}/graphql`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

**Env for api** — `apps/api/.env`
```
PORT=4000
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/devconnect
REDIS_URL=redis://localhost:6379
```

---

## 5) Databases & services (Docker Compose)

**`docker-compose.yml`** (at repo root)
```yaml
version: '3.9'
services:
  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: devconnect
    ports:
      - '5432:5432'
    volumes:
      - db_data:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - '6379:6379'
volumes:
  db_data:
```

```bash
# Start infra
docker compose up -d
# Check health
docker compose ps
```

> Optional (later): add OpenSearch, object storage (MinIO), etc.

---

## 6) ESLint & Prettier at root

**`.eslintrc.cjs`**
```js
module.exports = {
  root: true,
  extends: ['@repo/eslint-config'],
  ignorePatterns: ['**/dist/**', '**/.next/**', '**/node_modules/**']
};
```

**`.prettierrc`**
```json
{ "singleQuote": true, "semi": true, "trailingComma": "es5" }
```

---

## 7) One‑and‑done: install & run everything

```bash
# 1) Start Postgres & Redis
docker compose up -d

# 2) Install deps across the monorepo
pnpm install

# 3) Create envs
cp apps/web/.env.local apps/web/.env.local.example 2>/dev/null || true
cp apps/api/.env apps/api/.env.example 2>/dev/null || true

# 4) Run web + api concurrently
pnpm dev
```

- Web: http://localhost:3000 — should render **GraphQL says: world**
- API: http://localhost:4000/graphql — Apollo Studio landing page

---

## 8) GitHub Actions (CI)

**`.github/workflows/ci.yml`**
```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: devconnect
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U postgres" --health-interval 10s --health-timeout 5s --health-retries 5
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: corepack enable
      - run: corepack use pnpm@9
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm build
```

---

## 9) Project structure (after scaffold)

```
devconnect/
├─ apps/
│  ├─ web/                 # Next.js app (App Router, TS, Apollo Client)
│  └─ api/                 # Fastify + Apollo Server (GraphQL)
├─ packages/
│  ├─ tsconfig/            # Shared TS config
│  ├─ eslint-config/       # Shared ESLint rules
│  └─ types/               # Shared TypeScript types
├─ docker-compose.yml
├─ turbo.json
├─ package.json
├─ tsconfig.json (optional; root)
├─ .eslintrc.cjs
├─ .prettierrc
├─ .gitignore
└─ .github/workflows/ci.yml
```

---

## 10) Grow‑ready conventions

- **Pathing:** favor package imports (`@repo/types`) over deep relative paths.
- **Env handling:** each app has its own `.env*`; never commit real secrets.
- **Scripts:** keep `dev/build/lint/typecheck` at each package + root turbo.
- **Branching:** trunk‑based with short‑lived feature branches; PR checks via CI.
- **Release:** blue/green later; for now `docker compose` for local.

---

## 11) Windows notes & common gotchas

- Run **PowerShell** in the repo root. If `pnpm` not found: `corepack enable && corepack use pnpm@9`.
- Don’t try to *run* plugin names as commands (e.g., `eslint-plugin-import`). Install them with `pnpm add -D eslint-plugin-import` and run `eslint`.
- If Husky hooks don’t fire on Windows, ensure `.husky` is not blocked by your anti‑virus and that `git config core.hooksPath .husky` is set (it is by husky‑init).
- If ports are busy, change `PORT`/Next.js `-p` in scripts.

---

## 12) What you have now

- **Monorepo** with clean separation (`apps/` vs `packages/`).
- **Next.js** web that queries a live **GraphQL** API.
- **Node Fastify + Apollo** server (TypeScript) with CORS.
- **Dockerized Postgres & Redis** ready for Prisma/Yjs/etc.
- **Prettier, ESLint, Husky, lint‑staged, CI** wired up.

From here, you can add Prisma, auth (OIDC), CRDT (yjs), and feature modules.

---

## 13) Reconcile with your current tree (quick fixes)

You pasted your tree (great!). A few tweaks will make it 1‑click runnable.

### A) Root files — ensure these contents

**`.eslintrc.cjs`**
```js
module.exports = {
  root: true,
  extends: ['@repo/eslint-config'],
  ignorePatterns: ['**/dist/**', '**/.next/**', '**/node_modules/**']
};
```

**`.lintstagedrc.json`** (you have this – good)
```json
{
  "**/*.{ts,tsx,js,jsx,md,css,json}": ["prettier --write"],
  "**/*.{ts,tsx,js,jsx}": ["eslint --fix"]
}
```

**`.prettierrc`**
```json
{ "singleQuote": true, "semi": true, "trailingComma": "es5" }
```

**`commitlint.config.cjs`**
```js
module.exports = { extends: ['@commitlint/config-conventional'] };
```

**`docker-compose.yml`**
```yaml
version: '3.9'
services:
  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: devconnect
    ports:
      - '5432:5432'
    volumes:
      - db_data:/var/lib/postgresql/data
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - '6379:6379'
volumes:
  db_data:
```

**`package.json`**
```json
{
  "name": "devconnect",
  "private": true,
  "packageManager": "pnpm@9",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@commitlint/config-conventional": "^19.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.3.0",
    "turbo": "^2.0.0"
  }
}
```

**`pnpm-workspace.yaml`**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**`turbo.json`**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "lint": {},
    "typecheck": {}
  }
}
```

**`.github/workflows/ci.yml`** (already present; keep as in the doc above)

### B) API package — remove the `.bak` and verify scripts

Delete `apps/api/package.json.bak` (backup from an editor). Keep **only** `apps/api/package.json` with:
```json
{
  "name": "@devconnect/api",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@apollo/server": "^4.11.0",
    "@as-integrations/fastify": "^2.4.0",
    "@fastify/cors": "^9.0.0",
    "fastify": "^4.27.0",
    "graphql": "^16.9.0",
    "zod": "^3.23.0"
  },
  "devDependencies": { "tsx": "^4.16.0", "typescript": "^5.5.0" }
}
```

### C) Web (Next.js) — align ESLint with shared config

You have `apps/web/eslint.config.mjs` from `create-next-app`. Update it to extend the shared repo rules:
```js
// apps/web/eslint.config.mjs
import next from 'eslint-config-next';
import repo from '@repo/eslint-config';

export default [
  ...next,
  repo,
  { ignores: ['.next/**', 'node_modules/**'] }
];
```

Also ensure these files exist (from earlier steps):
- `src/lib/apollo.ts`
- `src/app/providers.tsx`
- `src/app/layout.tsx` wraps with `<Providers>`
- `src/app/page.tsx` queries `hello`

### D) Envs — create examples & local

Create:
- `apps/api/.env`
```
PORT=4000
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/devconnect
REDIS_URL=redis://localhost:6379
```
- `apps/web/.env.local`
```
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
```

---

## 14) Smoke test checklist

1) `docker compose up -d` (db + redis running)
2) `corepack enable && corepack use pnpm@9`
3) `pnpm install`
4) `pnpm dev` (runs **web:3000** + **api:4000**)
5) Open http://localhost:3000 → should render **GraphQL says: world**
6) Open http://localhost:4000/graphql → Apollo landing page

If anything fails, paste the error and I’ll zero in.



---

# Step 2 — Core Backend (GraphQL API + Database + Auth)

This section adds **PostgreSQL schema** (via **Prisma**), **GraphQL types/resolvers**, and **JWT auth**. After this, you can create users/teams/docs/tasks/messages and authenticate.

## 2.1 Install server-side deps
```bash
pnpm add -F ./apps/api prisma @prisma/client bcrypt jsonwebtoken
pnpm add -F ./apps/api -D prisma-client-extension-types
```

> Ensure `apps/api/.env` already has `DATABASE_URL=postgres://postgres:postgres@localhost:5432/devconnect`

Initialize Prisma:
```bash
cd apps/api
pnpm dlx prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma` and `.env` (we already have one; keep the DATABASE_URL line).

## 2.2 Prisma schema (initial models)
**`apps/api/prisma/schema.prisma`**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String        @id @default(cuid())
  email       String        @unique
  name        String
  passwordHash String
  createdAt   DateTime      @default(now())
  memberships Membership[]
  messages    Message[]     @relation("UserMessages")
  tasks       Task[]        @relation("TaskCreator")
}

model Team {
  id        String        @id @default(cuid())
  name      String
  slug      String        @unique
  createdAt DateTime      @default(now())
  projects  Project[]
  members   Membership[]
}

model Membership {
  id       String @id @default(cuid())
  role     Role
  user     User   @relation(fields: [userId], references: [id])
  userId   String
  team     Team   @relation(fields: [teamId], references: [id])
  teamId   String

  @@unique([userId, teamId])
}

enum Role {
  OWNER
  ADMIN
  MEMBER
  GUEST
}

model Project {
  id        String    @id @default(cuid())
  team      Team      @relation(fields: [teamId], references: [id])
  teamId    String
  name      String
  key       String
  createdAt DateTime  @default(now())
  documents Document[]
  channels  Channel[]
  tasks     Task[]

  @@index([teamId])
}

model Document {
  id         String   @id @default(cuid())
  project    Project  @relation(fields: [projectId], references: [id])
  projectId  String
  title      String
  content    String   @default("") // for now; later move to CRDT storage
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([projectId])
}

model Channel {
  id        String   @id @default(cuid())
  project   Project  @relation(fields: [projectId], references: [id])
  projectId String
  name      String
  createdAt DateTime @default(now())
  messages  Message[]

  @@index([projectId])
}

model Message {
  id         String   @id @default(cuid())
  channel    Channel  @relation(fields: [channelId], references: [id])
  channelId  String
  author     User     @relation("UserMessages", fields: [authorId], references: [id])
  authorId   String
  body       String
  createdAt  DateTime @default(now())

  @@index([channelId])
}

model Task {
  id         String   @id @default(cuid())
  project    Project  @relation(fields: [projectId], references: [id])
  projectId  String
  title      String
  description String  @default("")
  status     TaskStatus @default(TODO)
  priority   Int        @default(0)
  dueAt      DateTime?
  createdBy  User     @relation("TaskCreator", fields: [createdById], references: [id])
  createdById String
  assignees  TaskAssignee[]
  labels     TaskLabel[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([projectId])
}

enum TaskStatus {
  TODO
  DOING
  DONE
}

model TaskAssignee {
  task     Task   @relation(fields: [taskId], references: [id])
  taskId   String
  user     User   @relation(fields: [userId], references: [id])
  userId   String

  @@id([taskId, userId])
}

model TaskLabel {
  id     String @id @default(cuid())
  task   Task   @relation(fields: [taskId], references: [id])
  taskId String
  label  String

  @@index([taskId])
}
```

Run migrations & generate client:
```bash
pnpm dlx prisma migrate dev --name init
pnpm dlx prisma generate
```

Optional seed script later.

## 2.3 GraphQL schema
Replace the tiny placeholder in the API with a proper schema/resolvers.

**`apps/api/src/schema.ts`**
```ts
export const typeDefs = `#graphql
  scalar DateTime

  enum Role { OWNER ADMIN MEMBER GUEST }
  enum TaskStatus { TODO DOING DONE }

  type User { id: ID! email: String! name: String! createdAt: DateTime! }
  type Team { id: ID! name: String! slug: String! createdAt: DateTime! projects: [Project!]! }
  type Project { id: ID! teamId: ID! name: String! key: String! createdAt: DateTime! documents: [Document!]! channels: [Channel!]! tasks: [Task!]! }
  type Document { id: ID! projectId: ID! title: String! content: String! createdAt: DateTime! updatedAt: DateTime! }
  type Channel { id: ID! projectId: ID! name: String! createdAt: DateTime! }
  type Message { id: ID! channelId: ID! author: User! body: String! createdAt: DateTime! }
  type Task { id: ID! projectId: ID! title: String! description: String! status: TaskStatus! priority: Int! dueAt: DateTime createdAt: DateTime! updatedAt: DateTime! assignees: [User!]! }

  type AuthPayload { token: String!, user: User! }

  input SignUpInput { email: String!, name: String!, password: String! }
  input SignInInput { email: String!, password: String! }

  input CreateTeamInput { name: String!, slug: String! }
  input AddMemberInput { teamId: ID!, userId: ID!, role: Role! }

  input CreateProjectInput { teamId: ID!, name: String!, key: String! }
  input CreateDocumentInput { projectId: ID!, title: String!, content: String }
  input CreateChannelInput { projectId: ID!, name: String! }
  input SendMessageInput { channelId: ID!, body: String! }
  input AddTaskInput { projectId: ID!, title: String!, description: String, priority: Int, dueAt: DateTime }
  input UpdateTaskInput { id: ID!, title: String, description: String, status: TaskStatus, priority: Int, dueAt: DateTime }
  input AssignTaskInput { taskId: ID!, userIds: [ID!]! }

  type Query {
    currentUser: User
    teamById(id: ID!): Team
    teams: [Team!]!
    projects(teamId: ID!): [Project!]!
    documents(projectId: ID!): [Document!]!
    channels(projectId: ID!): [Channel!]!
    messages(channelId: ID!, limit: Int = 50): [Message!]!
    tasks(projectId: ID!): [Task!]!
  }

  type Mutation {
    signUp(input: SignUpInput!): AuthPayload!
    signIn(input: SignInInput!): AuthPayload!

    createTeam(input: CreateTeamInput!): Team!
    addMember(input: AddMemberInput!): Boolean!

    createProject(input: CreateProjectInput!): Project!
    createDocument(input: CreateDocumentInput!): Document!
    createChannel(input: CreateChannelInput!): Channel!
    sendMessage(input: SendMessageInput!): Message!

    addTask(input: AddTaskInput!): Task!
    updateTask(input: UpdateTaskInput!): Task!
    assignTask(input: AssignTaskInput!): Task!
  }
`;
```

## 2.4 Server context & auth utils
**`apps/api/src/context.ts`**
```ts
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

export const prisma = new PrismaClient();

export type Ctx = { prisma: PrismaClient; userId?: string };

export function getUserIdFromAuthHeader(auth?: string): string | undefined {
  if (!auth) return undefined;
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) return undefined;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret') as { sub: string };
    return payload.sub;
  } catch {
    return undefined;
  }
}
```

## 2.5 Resolvers (CRUD baseline)
**`apps/api/src/resolvers.ts`**
```ts
import type { Ctx } from './context';
import { compare, hash } from 'bcrypt';
import jwt from 'jsonwebtoken';

const requireAuth = (ctx: Ctx) => {
  if (!ctx.userId) throw new Error('UNAUTHENTICATED');
  return ctx.userId;
};

export const resolvers = {
  Query: {
    currentUser: async (_: any, __: any, ctx: Ctx) => ctx.userId ? ctx.prisma.user.findUnique({ where: { id: ctx.userId } }) : null,
    teamById: (_: any, { id }: { id: string }, ctx: Ctx) => ctx.prisma.team.findUnique({ where: { id } }),
    teams: (_: any, __: any, ctx: Ctx) => ctx.prisma.team.findMany(),
    projects: (_: any, { teamId }: { teamId: string }, ctx: Ctx) => ctx.prisma.project.findMany({ where: { teamId } }),
    documents: (_: any, { projectId }: { projectId: string }, ctx: Ctx) => ctx.prisma.document.findMany({ where: { projectId } }),
    channels: (_: any, { projectId }: { projectId: string }, ctx: Ctx) => ctx.prisma.channel.findMany({ where: { projectId } }),
    messages: (_: any, { channelId, limit }: { channelId: string; limit?: number }, ctx: Ctx) => ctx.prisma.message.findMany({ where: { channelId }, orderBy: { createdAt: 'desc' }, take: limit ?? 50 }),
    tasks: (_: any, { projectId }: { projectId: string }, ctx: Ctx) => ctx.prisma.task.findMany({ where: { projectId } }),
  },
  Mutation: {
    signUp: async (_: any, { input }: any, ctx: Ctx) => {
      const exists = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (exists) throw new Error('EMAIL_TAKEN');
      const passwordHash = await hash(input.password, 10);
      const user = await ctx.prisma.user.create({ data: { email: input.email, name: input.name, passwordHash } });
      const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
      return { token, user };
    },
    signIn: async (_: any, { input }: any, ctx: Ctx) => {
      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } });
      if (!user) throw new Error('INVALID_CREDENTIALS');
      const ok = await compare(input.password, user.passwordHash);
      if (!ok) throw new Error('INVALID_CREDENTIALS');
      const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
      return { token, user };
    },

    createTeam: async (_: any, { input }: any, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      const team = await ctx.prisma.team.create({ data: { name: input.name, slug: input.slug, members: { create: { userId, role: 'OWNER' } } } });
      return team;
    },
    addMember: async (_: any, { input }: any, ctx: Ctx) => {
      requireAuth(ctx);
      await ctx.prisma.membership.create({ data: { teamId: input.teamId, userId: input.userId, role: input.role } });
      return true;
    },

    createProject: (_: any, { input }: any, ctx: Ctx) => {
      requireAuth(ctx);
      return ctx.prisma.project.create({ data: { teamId: input.teamId, name: input.name, key: input.key } });
    },
    createDocument: (_: any, { input }: any, ctx: Ctx) => {
      requireAuth(ctx);
      return ctx.prisma.document.create({ data: { projectId: input.projectId, title: input.title, content: input.content ?? '' } });
    },
    createChannel: (_: any, { input }: any, ctx: Ctx) => {
      requireAuth(ctx);
      return ctx.prisma.channel.create({ data: { projectId: input.projectId, name: input.name } });
    },
    sendMessage: async (_: any, { input }: any, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      return ctx.prisma.message.create({ data: { channelId: input.channelId, body: input.body, authorId: userId }, include: { author: true } }) as any;
    },

    addTask: (_: any, { input }: any, ctx: Ctx) => {
      const userId = requireAuth(ctx);
      return ctx.prisma.task.create({ data: { projectId: input.projectId, title: input.title, description: input.description ?? '', priority: input.priority ?? 0, dueAt: input.dueAt ? new Date(input.dueAt) : undefined, createdById: userId } });
    },
    updateTask: (_: any, { input }: any, ctx: Ctx) => {
      requireAuth(ctx);
      const { id, ...patch } = input;
      return ctx.prisma.task.update({ where: { id }, data: patch });
    },
    assignTask: async (_: any, { input }: any, ctx: Ctx) => {
      requireAuth(ctx);
      await ctx.prisma.taskAssignee.deleteMany({ where: { taskId: input.taskId } });
      await ctx.prisma.taskAssignee.createMany({ data: input.userIds.map((u: string) => ({ taskId: input.taskId, userId: u })) });
      return ctx.prisma.task.findUnique({ where: { id: input.taskId } });
    },
  },
  Message: {
    author: (m: any, _: any, ctx: Ctx) => ctx.prisma.user.findUnique({ where: { id: m.authorId } })
  },
  Task: {
    assignees: (t: any, _: any, ctx: Ctx) => ctx.prisma.taskAssignee.findMany({ where: { taskId: t.id }, include: { user: true } }).then(rows => rows.map(r => r.user))
  }
};
```

## 2.6 Wire schema/resolvers into server
**`apps/api/src/index.ts`** (replace with this fuller setup)
```ts
import 'dotenv/config';
import { fastify } from 'fastify';
import cors from '@fastify/cors';
import { ApolloServer } from '@apollo/server';
import { fastifyApollo } from '@as-integrations/fastify';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { prisma, getUserIdFromAuthHeader, type Ctx } from './context';

async function main() {
  const app = fastify({ logger: true });
  await app.register(cors, { origin: process.env.CORS_ORIGIN?.split(',') ?? true, credentials: true });

  const server = new ApolloServer<Ctx>({ typeDefs, resolvers });
  await server.start();

  await app.register(fastifyApollo(server), {
    path: '/graphql',
    context: async ({ request }): Promise<Ctx> => {
      const userId = getUserIdFromAuthHeader(request.headers.authorization);
      return { prisma, userId };
    }
  });

  app.get('/healthz', async () => ({ ok: true }));

  const port = Number(process.env.PORT ?? 4000);
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`API ready at http://localhost:${port}/graphql`);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

## 2.7 Testing (copy/paste in Apollo Studio)
**Sign up → token**
```graphql
mutation {
  signUp(input: { email: "a@a.com", name: "Alice", password: "secret123" }) {
    token
    user { id email name }
  }
}
```
Set the returned `token` as the HTTP header: `Authorization: Bearer <token>`.

**Create team & project**
```graphql
mutation {
  createTeam(input: { name: "Core", slug: "core" }) { id name slug }
}
```
```graphql
mutation($teamId: ID!) { createProject(input: { teamId: $teamId, name: "DevConnect", key: "DC" }) { id name key teamId } }
```

**Doc/Channel/Message/Task**
```graphql
mutation($projectId: ID!) { createDocument(input: { projectId: $projectId, title: "Spec", content: "Hello" }) { id title } }
```
```graphql
mutation($projectId: ID!) { createChannel(input: { projectId: $projectId, name: "general" }) { id name } }
```
```graphql
mutation($channelId: ID!) { sendMessage(input: { channelId: $channelId, body: "hi team" }) { id body author { email } } }
```
```graphql
mutation($projectId: ID!) { addTask(input: { projectId: $projectId, title: "Ship MVP", priority: 1 }) { id title status } }
```

**Queries**
```graphql
query($teamId: ID!, $projectId: ID!, $channelId: ID!) {
  currentUser { id email name }
  teamById(id: $teamId) { id name }
  projects(teamId: $teamId) { id name }
  documents(projectId: $projectId) { id title }
  channels(projectId: $projectId) { id name }
  messages(channelId: $channelId) { id body author { email } }
  tasks(projectId: $projectId) { id title status }
}
```

## 2.8 Web: store auth token and call authed queries
Minimal client-side helper.

**`apps/web/src/lib/auth.ts`**
```ts
export const saveToken = (t: string) => localStorage.setItem('token', t);
export const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
```

**`apps/web/src/lib/apollo.ts`** — attach `Authorization`
```ts
import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, from } from '@apollo/client';
import { getToken } from './auth';

const authLink = new ApolloLink((operation, forward) => {
  const token = getToken();
  operation.setContext(({ headers = {} }) => ({ headers: { ...headers, Authorization: token ? `Bearer ${token}` : '' } }));
  return forward(operation);
});

export const makeClient = () =>
  new ApolloClient({
    link: from([authLink, new HttpLink({ uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:4000/graphql', fetch })]),
    cache: new InMemoryCache(),
  });
```

**Quick sign-in button (temporary)**
**`apps/web/src/app/page.tsx`** (replace body for a quick demo)
```tsx
'use client';
import { gql, useMutation, useQuery } from '@apollo/client';
import { saveToken } from '@/lib/auth';

const SIGN_UP = gql`mutation($email:String!,$name:String!,$password:String!){
  signUp(input:{email:$email,name:$name,password:$password}){ token user{ id email name } }
}`;
const ME = gql`query{ currentUser { id email name } }`;

export default function Home() {
  const { data, refetch } = useQuery(ME);
  const [signUp, { loading }] = useMutation(SIGN_UP, { onCompleted: (r) => { saveToken(r.signUp.token); refetch(); } });
  return (
    <main className="p-8 space-y-4">
      <div>Me: <pre>{JSON.stringify(data?.currentUser ?? null, null, 2)}</pre></div>
      <button className="px-3 py-2 rounded bg-black text-white" disabled={loading}
        onClick={() => signUp({ variables: { email: 'a@a.com', name: 'Alice', password: 'secret123' } })}>
        Quick Sign Up
      </button>
    </main>
  );
}
```

## 2.9 Notes & next steps
- Move from naïve role checks to **tenant-scoped RBAC** soon (authorize by membership).
- Add indices as needed; consider **row-level security** later if using Supabase/PG RLS.
- Password reset flows & refresh tokens if you want web cookies instead of localStorage.
- Next step: **Subscriptions (WS)** + **yjs** for real-time docs, and **search indexing**.

