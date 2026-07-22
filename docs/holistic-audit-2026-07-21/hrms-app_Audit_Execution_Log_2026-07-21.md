# Taazur HRMS (hrms-app) — Holistic Audit Execution Log

- **Date:** 2026-07-21
- **Auditor:** Autonomous multi-disciplinary audit team (8 specialist reviewers + orchestrator)
- **Target (white-box):** hrms-app monorepo (full source tree)
- **Target (black-box):** https://hrms-app-chi.vercel.app (production demo, fictitious "Rukn Energy" tenant)
- **Method:** Full independent re-audit across all 18 phases. White-box source review + live black-box + authenticated screenshot capture.
- **Test accounts used (live):** `admin@taazur.example` (HR Manager), `specialist@taazur.example` (HR Specialist), `manager@taazur.example` (Dept Manager), `employee@taazur.example` (Employee). Passwords masked in all deliverables.

> Non-destructive throughout. No records were created, modified, or deleted on the live application. No secrets, passwords, or real PII are printed in any deliverable (the demo tenant holds fictitious data).

---

## 1. Phase execution summary

| Phase | Method | Result | Evidence |
|---|---|---|---|
| 1 Discovery & inventory | Route enumeration (source) + live landing capture | Done | 80+ routes, 22 tRPC routers, 22 REST handlers; screenshots 01_Discovery |
| 2 Authentication | White-box (A1) + live probes | Done | AUTH-findings.json (12); live 401/404 probes |
| 3 RBAC & multi-tenant | White-box independent re-verify (A2) + live RBAC-denial capture | Done | RBAC-findings.json (9); screenshots 03_RBAC |
| 4 Functional / business logic | White-box (A5) | Done | BIZ-findings.json (15) |
| 5 User journeys | Live multi-role walk-through | Partial (4 of ~8 roles) | screenshots 04_Functional (30) |
| 6 UI & visual / responsive | White-box (A6) + live capture at 4 viewports | Done | UX-findings.json; screenshots 05_UI_UX |
| 7 UX & usability | White-box (A6) | Done | UX-notes.md (Usability 74) |
| 8 Accessibility (WCAG 2.2) | White-box markup review (A6) | Partial (no AT pass) | UX-findings.json (A11y 62) |
| 9 Security | White-box (A1/A3/A7) + live header/TLS/endpoint probes | Done | AUTH/API/PRIV findings; live probe log below |
| 10 Database & data integrity | White-box schema/migration review (A4) | Done (no live DB) | DB-findings.json (12) |
| 11 Performance | White-box + static analysis (A8) | Done | QA-findings.json |
| 12 Compatibility | Live (Chromium only) | Partial | Chromium capture only; Firefox/WebKit not run |
| 13 Error handling | White-box (A8) + live 404 capture | Done | screenshots 10_Errors |
| 14 Notifications | White-box (A7) | Done | PRIV-findings.json |
| 15 Audit logging | White-box (A7) | Done | PRIV-findings.json (PRIV-011) |
| 16 Privacy / PDPL | White-box (A7) | Done (no legal opinion) | PRIV-findings.json |
| 17 Source & repository | White-box (all) + build/test/lint/audit commands | Done | QA-notes.md |
| 18 Test coverage | White-box (A8) | Done | QA-notes.md |

---

## 2. Live black-box probes (non-destructive GETs)

| Probe | Result | Interpretation |
|---|---|---|
| `GET /` | 307 → /login, full security-header set | Auth-gated; HSTS preload, CSP, DENY, nosniff present |
| `GET /login` | 200, same headers, `Access-Control-Allow-Origin: *` on HTML | ACAO:* on static page (low) |
| `GET /api/auth/debug` | 404 | Debug correctly disabled in prod (strength) |
| `GET /api/health` | 200 `{status:ok, db:connected, redis:not_configured, uptime:1}` | Unauthenticated infra disclosure; Redis absent in prod |
| `GET /api/trpc/employee.list` (no session) | 401 UNAUTHORIZED | Server-side authz enforced (strength) |
| `GET /api/auth/check-tenants` | **200 — full tenant registry incl. schema names + user emails** | **RBAC-001 confirmed live (Critical)** |
| `GET /.env`, `/.git/config`, `/robots.txt` | 404 | No secret-file / VCS exposure |
| `*.js` chunk / `*.js.map` | 200 / 403 | Source maps disabled (strength) |
| `GET /api/company/invite` | 405 | POST-only; not tested destructively |

## 3. Authenticated screenshot capture

- Tool: Playwright (Chromium, headless), driving the live demo.
- Logins: all 4 demo roles authenticated successfully (SUCCESS).
- Output: **45 screenshots** — 01_Discovery (4), 02_Authentication (1), 03_RBAC (6), 04_Functional (30), 05_UI_UX (3), 10_Errors (1). Index: `evidence/screenshot-index.json`.
- Note: initial capture revealed that if the login submit fires before React hydration, the native form submits as GET and credentials land in the URL query string (minor observation; the fix was a hydration wait in the capture script).

## 4. Static commands executed (from repo root)

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS — 0 errors across 17 packages |
| `pnpm lint` | FAIL — 372 errors / 15 warnings (web only; 16 packages clean); mostly `no-explicit-any` |
| `pnpm test` (vitest) | 152 passed, 7 skipped; 1 of 26 suites failed = missing local DATABASE_URL (env, not code). Tenant-isolation suites mostly **skipped**. |
| `pnpm audit` | 5 vulns — 1 high (drizzle-orm 0.38.4, SQLi advisory, patched 0.45.2) + 4 moderate |

## 5. Reviewers (parallel white-box agents) and raw output

| Domain | Findings (raw) | Sub-score |
|---|---|---|
| Authentication & Session (A1) | 12 | 62 |
| RBAC & Multi-Tenant (A2) | 9 | 60 |
| API & Input Validation (A3) | 13 | 62 |
| Database & Data Integrity (A4) | 12 | Data 46 / DB-sec 63 |
| Business Logic (A5) | 15 | 68 |
| UI/UX & Accessibility (A6) | 13 | Usability 74 / A11y 62 |
| Privacy, Logging & Client Sec (A7) | 13 | 62 |
| Performance, Tests & Quality (A8) | 12 | Perf 62 / Rel 65 / Tests 55 / Maint 58 |
| **Total** | **99 raw → 90 de-duplicated** | **Overall 61/100** |

De-duplication: 9 findings suppressed from headline counts as cross-domain duplicates (kept in the raw JSON/CSV, corroboration recorded on the primary): AUTH-001, API-002, RBAC-002, RBAC-006, API-003, AUTH-005, RBAC-003, RBAC-005, AUTH-007.

## 6. Skipped / blocked tests and coverage limitations

- **Direct DB access:** not used — all DB findings reasoned from schema/migration source; live-verifiable items marked as such.
- **Authenticated privilege-escalation (e.g. invite → super_admin, /api/qiwa mutations):** verified in code, **not exploited live** (would create/alter data). `/api/qiwa` live impact also depends on Qiwa government credentials being configured.
- **Roles without public demo logins** (super_admin, payroll_admin, recruiter, candidate): assessed from source, not exercised live.
- **Browser compatibility:** Chromium only; Firefox/WebKit not run.
- **Accessibility:** markup-level review only; no screen-reader / assistive-technology pass; contrast not measured at runtime.
- **`.env` files:** untracked root `.env` and `apps/web/.env` could not be read (permissions); related items marked unable-to-verify.
- **MFA / lockout live behavior:** not brute-forced live (non-destructive constraint); assessed from source.
- **Local unit-test suite failure:** the single failing vitest suite is an environment issue (missing local DATABASE_URL), not a code defect.

## 7. Deliverables produced

- `hrms-app_Holistic_SaaS_Audit_Report_2026-07-21.pdf` — executive report (charts, heat map, RBAC matrix, findings, screenshots).
- `hrms-app_Holistic_SaaS_Audit_Report_2026-07-21.html` — source of the PDF.
- `hrms-app_Audit_Findings_2026-07-21.json` — machine-readable merged findings (all 99, with suppressed flags).
- `hrms-app_Detailed_Audit_Findings_2026-07-21.csv` — findings spreadsheet.
- `hrms-app_RBAC_Matrix_2026-07-21.csv` — RBAC permission matrix.
- `hrms-app_Audit_Execution_Log_2026-07-21.md` — this file.
- `evidence/screenshots/` (45 PNGs) + `evidence/screenshot-index.json`.
- `findings/*-findings.json` + `*-notes.md` — per-domain raw evidence with strengths and sub-scores.
