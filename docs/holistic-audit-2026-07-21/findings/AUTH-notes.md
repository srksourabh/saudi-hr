# Authentication and session management - audit notes (Phase 2)

Auditor role: Application Security Engineer (authorized white-box review)
Date: 2026-07-21
Repo: hrms-app (Next.js 16 App Router, tRPC v11, Drizzle, schema-per-tenant Postgres, NextAuth v5 JWT sessions)

## Methodology

- Read the full authentication surface listed in scope and traced the two live credential paths:
  - NextAuth credentials provider (`packages/auth/src/index.ts`) via `/api/auth/callback/credentials` (used by the login form `signIn()`), and
  - a second custom `POST /api/auth/login` route.
- For each control (login, lockout, rate limiting, password policy, reset flow, session, signup, MFA) I compared the intended behavior (in-code comments reference control IDs C1-C5 / AUTH-00x) against the actual enforced code path, and cross-checked the middleware `config.matcher` to confirm which routes the middleware actually protects.
- Verified backing state: `packages/db/src/schema/public/users.ts` (Drizzle schema) vs `packages/db/drizzle/0008_user_lockout_columns.sql` (migration) to assess schema drift risk for lockout.
- Confirmed the custom `/api/auth/login` route is not referenced by app code (only appears in generated `.next` type artifacts) - i.e. orphaned but still served.
- Every finding is grounded in a real file:line with a verbatim snippet in `AUTH-findings.json`. No dynamic exploitation was performed (static white-box review); reproduction steps are provided but marked by `status`.

## Coverage

Reviewed:
- `packages/auth/src/{index.ts, demo-identities.ts, totp.ts, rbac.ts}`
- `apps/web/app/api/auth/{login, signup, request-reset, reset, check-tenants, debug, [...nextauth]}/route.ts`
- `apps/web/middleware.ts`
- `apps/web/app/(auth)/{login/login-form.tsx, signup/page.tsx, reset-password/reset-form.tsx}`
- `apps/web/trpc/routers/{auth.ts, mfa.ts}` and `apps/web/trpc/server.ts`
- `packages/validators/src/auth.ts`, `packages/config/src/env.ts`, `packages/db/src/schema/public/users.ts`, `packages/db/drizzle/0008_user_lockout_columns.sql`

## Limitations

- Static analysis only; no live requests were issued against a running instance, so `confirmed` findings are confirmed by code reading, not by executed PoC.
- Runtime environment values (whether migration 0008 is applied in prod, whether `ENABLE_DEBUG_ENDPOINT`/`DEMO_MODE` are set) were not observed; findings that depend on env state are scoped accordingly (AUTH-004, AUTH-011). Prior session memory indicates `DEMO_MODE=true` is intentionally set on the public Vercel demo.
- NextAuth v5 cookie behavior was assessed from configuration (`trustHost`, `secureCookie` derivation, JWT strategy) and framework defaults, not from captured Set-Cookie headers.
- `forgot-password/page.tsx`, `login/page.tsx`, `reset-password/page.tsx` were treated as thin wrappers around the reviewed form components.

## Authentication sub-score: 62 / 100

Justification: The team has clearly invested in auth hardening and several controls are genuinely strong (bcrypt cost 12, robust reset-token design, durable lockout, MFA primitives, generic error messages, env-secret validation). The score is pulled down by two P1 issues that undercut that work:
- an unauthenticated cross-tenant data leak (`/api/auth/check-tenants`, AUTH-001), and
- a second credential endpoint (`/api/auth/login`, AUTH-002) that bypasses every brute-force control.
Combined with medium session-lifecycle gaps (no absolute expiry, stale role in JWT, no revocation), a lockout control that can silently disappear on schema drift, a reset token logged in plaintext, and MFA that is never actually required, the effective posture is middling rather than strong. Fixing AUTH-001, AUTH-002 and AUTH-005 would move this into the low-80s.

Score breakdown (informal):
- Password storage and policy: strong (bcrypt 12, composition rules) - minor deduction for 8-char min / no breach check.
- Reset flow design: strong (256-bit token, hashed at rest, single-use, 1h TTL, no enumeration) - undercut by plaintext token in logs.
- Login brute-force defense: mixed (good on NextAuth path; absent on the orphan route; in-memory rate limiter weak on serverless).
- Session management: weak (no absolute cap, no revocation, stale role).
- Access control of auth endpoints: weak (check-tenants open).
- MFA: present but not enforced; no recovery codes.

## Strengths (things done correctly)

1. Password hashing uses bcrypt with cost factor 12 on both signup and reset (`signup/route.ts:44`, `reset/route.ts:57`, `trpc/routers/auth.ts:26`).
2. Strong shared password policy: 8-128 chars with upper/lower/digit/special, and the 128 cap safely bounds bcrypt input (`packages/validators/src/auth.ts:4`).
3. Reset tokens are 256-bit CSPRNG values (`randomBytes(32)`), stored only as SHA-256 hashes, single-use (prior tokens deleted, token consumed after use), and time-limited to 1 hour (`request-reset/route.ts:36-43`, `reset/route.ts:35-59`).
4. `request-reset` always returns `{ ok: true }` and does not reveal whether an email is registered - no user enumeration (`request-reset/route.ts:55`).
5. Reset blocks reuse of the current password (`reset/route.ts:50-55`) and clears lockout state on success.
6. Login (NextAuth path) uses a generic "Invalid email or password" and implements durable per-account lockout with exponential backoff up to 60 min (`packages/auth/src/index.ts:32-47, 137-149`).
7. MFA secret is only persisted after the user proves possession with a valid TOTP code, so a half-finished enrollment cannot lock an account (`trpc/routers/mfa.ts:26-34`).
8. Dependency-free TOTP is a correct RFC 6238 implementation (HMAC-SHA1, 30s step, 6 digits, +/-1 window, 160-bit secret) with input-format validation (`packages/auth/src/totp.ts`).
9. Environment validation rejects a short (<32) or dev-fallback `AUTH_SECRET` and fails closed on missing `FIELD_ENCRYPTION_KEY` in production (`packages/config/src/env.ts:5-56`).
10. Demo identities are only accepted when `DEMO_MODE === "true"` and are resolved through a dedicated allowlist function (`packages/auth/src/demo-identities.ts:68-79`).
11. Session cookies rely on NextAuth v5 secure defaults with `trustHost` and TLS-derived `secureCookie` in middleware `getToken` (`middleware.ts:88-92`) - HttpOnly, SameSite=lax, Secure-in-prod session cookie.
12. Custom mutating API routes get a same-origin (CSRF) check plus rate limiting in middleware (`middleware.ts:33-61`), complementing NextAuth's built-in CSRF on the auth callback.
13. The `/api/auth/debug` diagnostics endpoint is disabled in production unless an explicit flag is set (`debug/route.ts:11-13`).
14. Login error messaging in the UI is uniform ("Invalid email or password.") regardless of failure cause (`login-form.tsx:47`).
15. tRPC `protectedProcedure` fails closed: it requires a session, a role-permitted procedure, and a resolved tenant DB context (`trpc/server.ts:60-73`).

## Note on scope item: self-serve signup mints super_admin

Confirmed intended-but-worth-flagging (AUTH-009). `super_admin` is a per-tenant role; cross-tenant registry access is separately and correctly gated behind the `PLATFORM_ADMIN_EMAILS` allowlist (`trpc/routers/auth.ts:63-78`), so a signup super_admin only controls its own new tenant. The residual issues are the absence of email verification and CR validation, and weak anti-automation on signup - hence Low, not High.
