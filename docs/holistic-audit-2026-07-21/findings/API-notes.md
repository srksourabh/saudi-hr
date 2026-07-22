# API security & input validation - audit notes (Phase 9.1 / 9.2 / 9.6)

Scope audited: all `apps/web/trpc/routers/*.ts` + `trpc/server.ts` + `trpc/scoping.ts`; non-auth REST routes under `apps/web/app/api/**` (upload, qiwa, cron/*, vitals, health, migrate/*, seed/*, company/*, auth/* custom routes); `packages/validators/**`; CSV/XML generators in `packages/payroll`.

Date: 2026-07-21. Read-only white-box review.

---

## Zod validation coverage (rough)

### tRPC surface - strong (~95-99% of mutations validated)
- ~286 `.input(...)` declarations across the routers; **175** `.mutation(...)` handlers.
- Every state-changing mutation that takes a payload validates it with a Zod schema from `@hrms-app/validators` (or an inline `z.object`).
- The only no-input mutations are self-scoped, payload-free actions that legitimately need none: `notification.markAllRead`, `mfa.beginEnrollment`. No dangerous unvalidated mutation was found.
- No-input **queries** (list/me/summary/session/tenantsList/myLatest/mine/today) are legitimate self/company reads.
- Ids are consistently `z.string().uuid()`; pagination capped at `max(500)`; salary bounded to `max(9_999_999_999)`; national-ID format enforced (`^\d{10}$` + prefix); AI chat capped (`max(20)` messages, `max(8000)` chars, temperature `min(0).max(2)`).

### REST surface - mixed
- **Validated with Zod:** `auth/signup` (`signupSchema`), `auth/reset` (`resetPasswordSchema`), `auth/request-reset` (`requestPasswordResetSchema`).
- **NOT validated / no auth:** `qiwa` (no auth, body forwarded raw, `z.record(z.any())` in the shared schema anyway), `auth/check-tenants` (no auth), `auth/login` (presence-only), `health`/`vitals` (partial), `company/profile` + `company/invite` (manual destructuring, no Zod).

**Overall estimate:** tRPC ~95%+ Zod input coverage (the well-built core); REST ~50% - the REST gaps are where the Critical/High findings live.

### Loose Zod types found (`z.any()` / `z.record(z.unknown()())`)
- `trpc/routers/qiwa.ts:47,70` - `otherAllowances: z.record(z.any())`.
- `packages/validators/src/ai.ts:25,36,40` - `config`/`suggestion`/`metadata: z.record(z.unknown())`.
- `packages/validators/src/recruitment.ts:123,148,165,240,247,274` - `z.record(z.unknown()/boolean)`.
- `packages/validators/src/retention.ts:37,124,233,254,296,297,312,326,327,328,392` - `metrics/responses/competencies/milestones/questions/targetAudience/riskFactors/actionItems/eligibilityCriteria: z.any()`.
These are stored as JSON columns behind capability-gated procedures; risk is unbounded/unvalidated JSON (data-quality / potential large-payload storage), not direct injection. Recommend replacing `z.any()` with typed shapes + size bounds. (Feeds API-009 / general hardening.)

---

## Raw-SQL sites (injection review)

No raw SQL in any tRPC router - the entire tRPC data layer uses the Drizzle query builder (good, matches CLAUDE.md "never raw SQL"). Raw `adminDb.execute` usage is confined to:

| File | Nature | Assessment |
|---|---|---|
| `apps/web/app/api/seed/demo-data/route.ts:82-149` | **String interpolation** of DB-derived UUIDs/numbers into INSERT/UPDATE | Injection-prone pattern; values are trusted + guarded by `NODE_ENV!=production` + `MIGRATION_TOKEN`. See **API-008**. |
| `apps/web/app/api/migrate/fix-critical-bugs/route.ts:20-55` | Static DDL, hardcoded `SCHEMA` constant | No user input; guarded. Low. |
| `apps/web/app/api/migrate/fix-schema-drift/route.ts:16-50` | Static DDL, hardcoded `SCHEMA` constant | No user input; guarded. Low. |
| `apps/web/app/api/health/route.ts:15` | `adminDb.execute(sql\`SELECT 1\`)` | Parameter-free. Safe. |
| `apps/web/app/api/auth/reset/route.ts:61` | `sql\`UPDATE users ... WHERE id = ${user.id}\`` | **Parameterized** via Drizzle `sql` tag. Safe. |
| `packages/payroll/src/mudad.ts` | CSV/XML string building | Not SQL; cells escaped (see strengths). |

Parameterization verdict: no confirmed SQL-injection sink. The seed route's string concatenation is the one anti-pattern (low real risk, demo-only).

---

## API-security sub-score: 62 / 100

Rationale:
- The **tRPC core** (the bulk of the API) is genuinely well-built: near-total Zod coverage, consistent object-level authorization on the sensitive self-service surfaces (expense, notification, leave, payslip.myLatest), session-derived ownership ids, field-scoped updates, audit logging, and a proper capability model. This alone is 80+ territory.
- It is dragged down hard by **two unauthenticated REST endpoints** that bypass the entire tRPC security model: `/api/qiwa` (unauth proxy to a government API, API-001) and `/api/auth/check-tenants` (unauth cross-tenant PII/CR-number/schema-name dump, API-002), plus an unthrottled password oracle `/api/auth/login` (API-003). These are Critical/High and represent a "strong front door, unlocked side doors" pattern.
- Secondary deductions: data-layer over-selection of salary/PII with a getById IDOR (API-004), upload path traversal via `category` (API-005), per-instance rate limiter + Origin-optional CSRF (API-007), and error-string leakage (API-006).

Severity counts: Critical 2, High 2, Medium 2, Low 7. (13 findings, API-001 .. API-013.)

Fixing API-001/002/003 (all small-to-medium, mostly "add auth() + matcher entry or delete the route") would move this to ~85/100.

---

## Strengths (record these)

1. **SEC-007 fixed - `user.me` column projection** (`trpc/routers/user.ts:4`): explicitly selects safe columns; `passwordHash`/`mfaSecret` are never shipped to the client.
2. **File upload hardening** (`app/api/upload/route.ts`): MIME allowlist, 10MB size cap, **magic-byte validation** (does not trust client MIME), filename sanitization, remote object storage only with **no web-root fallback** (503 if unconfigured), tenant-prefixed path. (Only gap: `category` segment unsanitized - API-005.)
3. **CSV/XML formula-injection neutralization** (`packages/payroll/src/mudad.ts:153`): `csvCell()` prefixes a leading `'` for `^[=+\-@\t\r]` and quote-escapes; `escapeXml()` for XML. This is the correct defense and is easy to get wrong - well done.
4. **Expense router object-level authorization** (`trpc/routers/expense.ts`): getById enforces owner/approver/HR; create derives `employeeId` from the session (never client); approve checks `approverEmployeeId == session`; update uses an explicit field allowlist. SEC-004 IDOR is closed.
5. **Notification router** fully scoped to `ctx.user.id` on every read and write (`trpc/routers/notification.ts`).
6. **Leave create** binds `employeeId` to the session unless the caller is HR (SEC-012), and `createLeaveRequestSchema` deliberately omits `status`, so status cannot be mass-assigned to `approved` at creation.
7. **Invite flow**: assignable-role allowlist **excludes `super_admin`** in both the tRPC procedure and the REST route (no privilege escalation via invite); public `getByToken`/`acceptInvite` resolve the tenant via a constant-time `inviteTokenIndex` using parameterized Drizzle queries (no per-tenant scan, no string concat); password bounded `min(8).max(128)`.
8. **`auth.tenantsList`** is gated to a `PLATFORM_ADMIN_EMAILS` allowlist, fail-closed when unset (SEC-002), and omits `schemaName`. (The REST `check-tenants` route is the unprotected violation - API-002.)
9. **Password reset**: SHA-256-hashed single-use tokens, 1-hour TTL, generic responses that never reveal whether an email exists (no user enumeration), current-password-reuse block, lockout cleared on reset. (Only gap: token logged - API-012.)
10. **Employee update** is field-scoped by role (salary vs profile, WF-003/RBAC-003/004), and `updateEmployeeSchema` is a bounded allowlist (no `id`/`tenantId`/`employmentStatus`) - so the `.set(input.data)` spread is not a mass-assignment vector. Changes are audited old/new.
11. **tRPC error formatter** returns only flattened Zod errors, not stack traces; `login`/`signup`/`reset` return generic messages and log detail server-side. (Exceptions: `qiwa`/`health` - API-006.)
12. **Middleware** implements same-origin CSRF for custom state-changing routes, a tight login rate-limit (5/min) complemented by durable per-account lockout, and route-level RBAC via `canAccessRoute`. (Effectiveness caveats in API-007.)
13. **Demo/migrate/debug endpoints** are guarded by a `NODE_ENV==="production"` 404 plus a `MIGRATION_TOKEN`/`ENABLE_DEBUG_ENDPOINT` gate.
14. **No raw SQL in the tRPC data layer** - 100% Drizzle query builder; the `sql` tag usage that exists (`reset`) is parameterized.
15. **Department-manager write-scoping helpers** (`trpc/scoping.ts`) provide fail-closed object-level checks (`assertManagesEmployee/Goal/Review/...`) for the performance/retention surface.

## Notes / follow-ups for other agents
- API-004 (salary/PII over-selection to recruiter/department_manager + getById IDOR) overlaps **RBAC-004**; coordinate with the RBAC owner. Reported here strictly as data-layer over-selection + missing object-level scoping.
- Confirm each retention `*.update` mutation actually calls its `assertManages*` helper (API-009 is `suspected` pending that trace).
- Confirm `packages/llm` allowlists the model id before API-010 can be downgraded to informational.
