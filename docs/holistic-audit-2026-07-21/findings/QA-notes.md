# QA / Performance / Reliability / Test-Coverage / Maintainability audit notes

Audit date: 2026-07-21
Scope: Performance (Phase 11) + Error handling/resilience (Phase 13) + Source/build quality (Phase 17) + Test coverage (Phase 18)
Repo root: `c:\Users\soura\Dropbox\AI\Projects\Saudi-HR\hrms-app`

## Command results

### `pnpm typecheck` — PASS

```
Tasks:    15 successful, 15 total
Cached:    4 cached, 15 total
Time:    2m35.374s
```

All 17 packages in scope (`@hrms-app/auth`, `config`, `date`, `db`, `demo`, `documents`, `email`, `leave`, `llm`, `payroll`, `qiwa`, `queue`, `ui`, `validators`, `web`, + configs), 0 type errors.

### `pnpm lint` — FAIL

```
@hrms-app/web:lint: ✖ 387 problems (372 errors, 15 warnings)
@hrms-app/web:lint:   1 error and 0 warnings potentially fixable with the `--fix` option.
Tasks:    13 successful, 14 total
Failed:    @hrms-app/web#lint
```

All 16 other packages pass lint cleanly. Failure is confined to `@hrms-app/web`. Breakdown of the 387 problems by rule (manual tally from output):
- `@typescript-eslint/no-explicit-any` — large majority (dominant rule across ~84 files; raw `: any` / `as any` grep count in apps/web = 295 occurrences across 84 files)
- `@typescript-eslint/no-non-null-assertion` — ~30+ occurrences (attendance pages, payroll pages, leave.ts, invite.ts)
- `@typescript-eslint/no-unused-vars` — a dozen or so (unused imports/vars, e.g. `Badge`, `Card`, `router`)
- `react-hooks/exhaustive-deps` — 4 warnings (organogram page, expenses page)

### `pnpm test` (Vitest) — 25/26 suites pass, 1 fails due to local env only

```
Test Files  1 failed | 25 passed (26)
Tests  152 passed | 7 skipped (159)
Duration  68.30s
```

- **Real failure? No.** The 1 failing suite is `packages/config/src/__tests__/env.test.ts`, which throws `Invalid environment variables: DATABASE_URL, AUTH_SECRET` — this is the known-broken local `.env` (per project memory: apps/web/.env has a broken DATABASE_URL). This is an environment failure, not a code defect.
- 152 tests pass across 25 other suite files (auth/RBAC, TOTP, demo identities, payroll GOSI/ESB/Mudad/offboarding/orchestrator/consistency, documents letters/expiry, qiwa nitaqat, demo onboarding/workflows/taazur-energy, date conversion, validators auth/employee, leave accrual, llm client + a live smoke test, db crypto).
- 7 skipped tests, concentrated in tenant isolation: `tenant-manager.test.ts` (5 tests | **4 skipped**) and `tenant-isolation.test.ts` (4 tests | **3 skipped**) — see finding QA-008.

### Dependency audit — `pnpm audit --audit-level=high` and `pnpm audit`

```
5 vulnerabilities found
Severity: 4 moderate | 1 high
```

| Severity | Package | Issue | Vulnerable | Patched |
|---|---|---|---|---|
| High | drizzle-orm (resolved 0.38.4, pinned `^0.38.0`) | SQL injection via improperly escaped SQL identifiers (GHSA-gpj5-g38j-94v9) | <0.45.2 | >=0.45.2 |
| Moderate | esbuild (via drizzle-kit -> @esbuild-kit/*) | Dev server allows any site to read responses (GHSA-67mh-4wv8-2f99) | <=0.24.2 | >=0.25.0 |
| Moderate | next-auth 5.0.0-beta.25 | Email misdelivery vulnerability (GHSA-5jpx-9hw9-2fx4) | >=5.0.0-beta.0 <5.0.0-beta.30 | >=5.0.0-beta.30 |
| Moderate | postcss (via next@16.2.10) | XSS via unescaped `</style>` in stringify output (GHSA-qx2v-qp2m-jg93) | <8.5.10 | >=8.5.10 |

See QA-004 for detail. The drizzle-orm advisory is notable because it is the ORM used for every tenant-scoped query in the app.

## Test-coverage inventory

31 unit/integration test files (`*.test.ts`) + 3 Playwright e2e specs:

**Unit/integration** (`__tests__/`):
auth: `rbac.test.ts`, `demo-identities.test.ts`, `totp.test.ts` · config: `env.test.ts` (env-gated, fails locally) · date: `convert.test.ts` · db: `crypto.test.ts`, `tenant-isolation.test.ts` (mostly skipped), `tenant-manager.test.ts` (mostly skipped) · demo: `company-onboarding.test.ts`, `module-workflows.test.ts`, `taazur-energy.test.ts` · documents: `expiry.test.ts`, `letters.test.ts` · leave: `accrual.test.ts` · llm: `client.test.ts`, `live.test.ts` · payroll: `consistency.test.ts`, `esb.test.ts`, `gosi.test.ts`, `leave.test.ts`, `mudad.test.ts`, `offboarding.test.ts`, `orchestrator.test.ts` · qiwa: `nitaqat.test.ts` · validators: `auth.test.ts`, `employee.test.ts` · apps/web/src: `password-strength.test.ts`, `query-defaults.test.ts`, `root-page-onboarding-gate.test.ts`

**E2E** (`apps/web/e2e/`): `auth.spec.ts`, `attendance-guide-map.spec.ts`, `attendance-reports.spec.ts` (+ `production-performance.mjs`, a script not a spec).

### Coverage vs critical flows

| Flow | Unit/integration | E2E | Verdict |
|---|---|---|---|
| Auth / login / MFA | rbac, totp, demo-identities, password-strength, query-defaults, root-page-onboarding-gate | auth.spec.ts | Good |
| RBAC / tenant isolation | rbac.test.ts (good); tenant-isolation/tenant-manager mostly **skipped** | — | Gap — see QA-008 |
| Payroll (GOSI/ESB/Mudad/offboarding) | 7 dedicated files, strong | — | Strong (strength) |
| Leave | accrual.test.ts (accrual math only) | — | Partial — request/approval flow in leave.ts router untested |
| Documents | expiry, letters | — | Good |
| Qiwa | nitaqat calc only | — | Partial — actual API client (packages/qiwa/src/index.ts) untested |
| Attendance | none (router logic) | 2 specs (UI only) | Gap — see QA-009 |
| Expense | none | none | Gap — see QA-009 |
| Compliance / Department / Settlement / Notification | none | none | Gap — see QA-009 |
| **Recruitment** (812-line router) | **none** | none | Gap — see QA-007 |
| **Retention** (1611-line router) | **none** | none | Gap — see QA-007 |

Biggest gaps, ranked: (1) retention.ts + recruitment.ts entirely untested at 0%, (2) tenant-isolation tests present but mostly skipped, (3) attendance/expense/compliance/department/settlement/notification routers have no logic-level tests, (4) e2e coverage limited to auth + 2 attendance screens (no payroll/leave/recruitment e2e).

## Sub-scores (0-100)

| Dimension | Score | Rationale |
|---|---|---|
| **Performance** | 62 | Consistent pagination pattern (limit/offset + `$count`) used correctly across most list endpoints (employee.ts, retention.ts, ai.ts) — a real strength. Offset by: zero indexes on the `employees` table and most other tenant tables (QA-001), one fully-unbounded tenant-wide query on a GPS/map endpoint (QA-002), and a sequential N+1 write loop in the leave-accrual cron (QA-003). |
| **Reliability** | 65 | Try/catch coverage is broad and generally used well (deliberate fallback behavior — e.g. AI chat context/audit failures never block a user reply). Offset by: no timeout or retry on any external call to Qiwa or the LLM providers (QA-005), meaning a hung upstream can hang a request indefinitely. |
| **Test coverage** | 55 | Payroll domain (the most statutory/compliance-critical area) is well tested. Offset by: two of the largest routers (retention, recruitment — together ~2400 lines) have zero tests, and the dedicated tenant-isolation test suites are mostly skipped in the observed run. |
| **Maintainability** | 58 | Typecheck is 100% clean across all 17 packages, and TODO/FIXME density is negligible (1 hit repo-wide). Offset by: lint fails with 372 errors concentrated in `apps/web` (dominated by `no-explicit-any`), one high + four moderate dependency advisories, and 2 router files exceeding the project's 800-line guideline (retention.ts at 1611 lines is 2x over). |

## Strengths

- **Typecheck clean**: 0 TypeScript errors across all 17 packages.
- **Pagination discipline**: employee.ts, retention.ts (`goal.list`, and consistently across its many sub-routers), and ai.ts all use the same `limit/offset` + `ctx.db.$count(...)` pattern for paginated lists — a genuinely consistent, well-applied convention.
- **Payroll test depth**: 7 dedicated test files (consistency, esb, gosi, leave, mudad, offboarding, orchestrator) covering the highest legal/financial-risk logic in the app (GOSI contributions, end-of-service benefits, WPS/Mudad).
- **Deliberate error-handling design, not just swallowed errors**: e.g. `ai.ts`'s chat procedure wraps tenant-context fetching and audit-logging in try/catch specifically so a DB hiccup or audit-log failure never blocks the user-facing AI reply — this is documented intent in code comments, not silent error suppression.
- **Low TODO/FIXME density**: only 1 hit across `apps/` — little unfinished-work debt left as markers.
- **RBAC-aware queries**: routers consistently gate reads/writes with `requireCapability`/`requireRole` and scope queries by `employeeId`/`departmentId` before hitting the DB (e.g. expense.ts explicitly documents a prior IDOR fix, SEC-004), consistent with the separate RBAC audit's 90/100 score.

## Limitations / not verified

- `pnpm build` was not run per instructions (time-box risk); typecheck was used as the faster proxy and passed cleanly, but a full production build was not confirmed.
- Runtime performance (actual query latency, bundle size analysis, Lighthouse/Core Web Vitals) was not measured — this audit is static-analysis + command-output based only, per the assignment's read-only constraint.
- The tenant-isolation test skip condition (QA-008) was not root-caused beyond observing the skip counts in the vitest summary; whether CI runs these un-skipped was not verified (no CI config was inspected as it was out of scope for this pass).
