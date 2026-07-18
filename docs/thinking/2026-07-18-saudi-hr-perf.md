# Saudi-HR performance optimization — progress

Date: 2026-07-18
Scope: Saudi-HR HRMS app (Next.js 16 + tRPC + Drizzle + PostgreSQL)
Baseline: 614 KB gzipped JS, 120 KB CSS, 95 chunks. Map libs properly lazy-loaded.

## Tier 1 — broken features (DONE)

- [x] Delete `apps/web/app/(dashboard)/page.tsx` — duplicate route collides with `app/page.tsx` server component. Server root already does the auth + count work correctly.
- [x] Remove `geolocation=()` from Permissions-Policy in `next.config.ts:21`. Was killing the Geolocation API for the location picker.
- [x] Self-host 3 Leaflet marker PNGs under `apps/web/public/icons/leaflet/`. CSP `img-src` was blocking the unpkg.com URLs the picker was fetching.
- [x] Update `components/location-picker.tsx:54-56` to point at `/icons/leaflet/...`.

**Verification:** `pnpm typecheck` clean (15/15 packages). Lint baseline is 368 errors / 13 warnings (all pre-existing `no-explicit-any` debt, not regressions from this change).

## Tier 2 — first paint speed (IN PROGRESS)

- [ ] Add `count` query to employee router (`api.employee.count`)
- [ ] Add `count` query to department router (`api.department.count`)
- [ ] Add `apps/web/app/(dashboard)/loading.tsx` skeleton for nav feedback

### Skipped from Tier 2 (punted to Tier 3)

The remaining 5 `pageSize: 500` sites are in form pages (recruitment/offers/new, recruitment/interviews/new) and reports pages (attendance/reports, attendance/guide-map). Those pages genuinely need the data for select boxes and map markers. Right fix is server-side filter+search, not a count endpoint. Will tackle in Tier 3.

## Tier 3 — API/DB scaling (PENDING)

- [ ] Add `.limit(50)` to `notification.ts:21` list query
- [ ] Migration: composite indexes on (userId, createdAt) for notifications and similar for other list endpoints
- [ ] Rewrite `expense.ts:286-300` summary using `db.$count()` instead of full history scans
- [ ] Add `.limit()` to remaining list endpoints (leave, document, payroll.payslip, attendance.assignment, settlement, policy, guideMap, invite, retention)

## Tier 4 — interaction jank (DONE)

- [x] Replace `window.location.href = ...` with `router.push(...)` in 7 recruitment list pages (candidates, applications, interviews, offers, onboarding, referrals, checks). Sub-components (Tables) also got `const router = useRouter()` declarations since rows render inside them.
- [x] Install `web-vitals@5.3.0`. Create `apps/web/components/web-vitals-reporter.tsx` (LCP/INP/CLS/FCP/TTFB → POST `/api/vitals` via sendBeacon). Wire into `DashboardProviders`.
- [x] Create `apps/web/app/api/vitals/route.ts` server endpoint with name allowlist + log path.
- [ ] Skipped: `React.memo` on table rows. Bigger refactor, needs usage data on which tables are slow first.
- [ ] Skipped: memoize `todayByEmployee` / `countTree` in `attendance/reports/page.tsx`. Will revisit after RUM data shows it's a hot path.

## Verifications after each tier

- [x] Tier 1 typecheck clean
- [x] Tier 2 typecheck clean
- [x] Tier 3 typecheck clean
- [x] Tier 4 typecheck clean
- [ ] `pnpm build` not run (out of session scope)
- [ ] Migration `0006_add_perf_indexes.sql` not applied (requires live DB; runner script `apply-migration-0006.js` provided)