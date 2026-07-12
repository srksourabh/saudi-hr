# CLAUDE.md — hrms-app

## Project type
Full-stack TypeScript SaaS (Next.js 16 + tRPC + Drizzle + PostgreSQL)

## Stack
- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui
- **Backend**: tRPC v11 (type-safe RPC), Next.js API routes
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: NextAuth v5
- **Validation**: Zod
- **ORM**: Drizzle (with drizzle-kit for migrations)
- **Queue**: BullMQ + Redis
- **Email**: Resend + React Email
- **Testing**: Vitest (unit/integration) + Playwright (E2E)
- **CI/CD**: GitHub Actions
- **Monorepo**: Turborepo + pnpm workspaces

## Commands
- `pnpm dev` — start all apps in dev mode
- `pnpm build` — build all packages
- `pnpm lint` — ESLint (flat config)
- `pnpm typecheck` — TypeScript check (noEmit)
- `pnpm test` — Vitest (unit + integration)
- `pnpm test:e2e` — Playwright E2E tests
- `pnpm db:push` — push Drizzle schema to DB
- `pnpm db:generate` — generate migration
- `pnpm db:migrate` — apply migrations
- `pnpm db:studio` — Drizzle Studio (GUI)

## Project structure
```
apps/web/          — Next.js app
packages/ui/       — Shared UI components
packages/db/       — Drizzle schema + migrations
packages/auth/     — Auth configuration
packages/validators/ — Zod schemas
packages/email/    — Email templates
packages/config/   — Shared environment + constants
tooling/           — ESLint, TypeScript configs
scripts/           — Scaffolding generators
docs/              — Architecture, decisions, progress
```

## Conventions
- **Naming**: kebab-case for files, camelCase for variables/functions, PascalCase for components/types
- **Imports**: use package aliases (`@db`, `@validators`, `@ui`, `@config`, `@auth`)
- **Testing**: co-locate unit tests in `__tests__/` next to source
- **API**: all public endpoints via tRPC (no REST unless external-facing)
- **Errors**: custom error classes from `@config/src/errors.ts`
- **Env vars**: defined and validated in `packages/config/src/env.ts`
- **Database**: all queries through Drizzle ORM, never raw SQL

## Security rules
- Every tRPC mutation validates input with Zod
- Protected procedures check auth + role
- Never log passwords, tokens, or PII
- Audit log for all sensitive operations
- CSP + Helmet headers via middleware
