# Architecture — hrms-app

## System overview

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  Next.js 16  │────▶│  tRPC v11    │────▶│ Drizzle ORM │
│  (App Router)│     │  (API Layer) │     │ (PostgreSQL)│
└──────┬──────┘     └──────┬───────┘     └────────────┘
       │                   │
       │                   ▼
       │            ┌──────────────┐
       │            │  Redis        │
       └───────────▶│  (Queue +     │
                    │   Rate Limiting)│
                    └──────────────┘
```

## Request flow

1. Browser → Next.js (RSC or client component)
2. If data needed: client → tRPC (HTTP) → context (auth + db) → procedure
3. Procedure validates input (Zod), checks auth (session), executes query (Drizzle)
4. Response → client (type-safe, serialized)

## Data model

### Users
- `id` — UUID, primary key
- `email` — unique, indexed
- `name` — nullable
- `avatar_url` — nullable
- `password_hash` — nullable (for credentials auth)
- `role` — enum: admin, user, viewer
- `created_at`, `updated_at` — timestamps

### Sessions
- `id` — UUID, primary key
- `user_id` — FK to users
- `expires_at` — timestamp
- `created_at` — timestamp

### Audit logs
- `id` — UUID, primary key
- `user_id` — FK to users (nullable for unauthenticated actions)
- `action` — string (e.g., "user.login", "user.role_change")
- `resource` — string (e.g., "users:abc-123")
- `details` — JSONB
- `ip_address` — string
- `created_at` — timestamp

## Security boundaries

| Layer | Protection |
|-------|-----------|
| Network | Rate limiting per IP + per user |
| Transport | HTTPS enforced (Next.js/Vercel default) |
| Application | CSP + Helmet headers, input validation (Zod) |
| Auth | Session-based, OAuth + credentials, RBAC |
| Data | Drizzle ORM (parameterized queries), audit logging |

## Package dependency graph

```
apps/web ──▶ packages/ui ──▶ tooling/eslint
  │                        tooling/typescript
  ├──▶ packages/auth ──▶ packages/db
  │                       packages/config
  ├──▶ packages/validators
  ├──▶ packages/email ──▶ packages/config
  └──▶ packages/config
```
