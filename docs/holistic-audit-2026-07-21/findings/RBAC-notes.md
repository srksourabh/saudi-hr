# RBAC, Authorization & Multi-Tenant Isolation - independent re-audit

**Audit date:** 2026-07-21
**Scope:** packages/auth/src/rbac.ts, apps/web/trpc/server.ts + scoping.ts, all 21 tRPC routers, every apps/web/app/api/** REST route, middleware.ts, route-auth.ts, employees schema.
**Method:** white-box read of the guard on every procedure and every REST handler; each SEC-001..SEC-013 claimed fix verified against live code; capability model cross-checked against enforced backend reality.

**Headline:** the tRPC layer is genuinely well-hardened and most of the 13 prior findings hold up. But two of them (SEC-002 cross-tenant registry, SEC-009 Qiwa government actions) are **re-opened through unauthenticated custom REST "twin" routes** that the prior audit never enumerated (`/api/auth/check-tenants`, `/api/qiwa`). Combined with residual over-permissive reads the Phase 2 fix missed, the 90/100 does not hold.

---

## 1. Per-role capability summary (intended vs enforced)

Source of truth for intent: `packages/auth/src/rbac.ts` `roleCapabilities`. Backend enforcement primitives: `protectedProcedure` (blocks only employee/candidate via allowlist), `companyProcedure` (blocks employee/candidate), `requireRole(...)` (fail-closed enum), `requireCapability(cap)` (consults `can()` - the real capability model).

| Role | Intended capabilities (rbac.ts) | Enforced reality & deltas |
|---|---|---|
| **super_admin** | all | Full access. Also the only role that can create tenants (signup). NOTE: super_admin is per-tenant, minted at every signup - correctly no longer gates cross-tenant `auth.tenantsList` (now `PLATFORM_ADMIN_EMAILS`). |
| **hr_manager** | all except dashboard:view_employee | Matches. Broad HR/payroll/settings authority, correctly gated. |
| **hr_specialist** | people/attendance/leave/recruitment/performance/documents manage + payroll:view_company, compliance | Matches; cannot apply salary changes directly (employee.update blocks hr_specialist salary edits - good). |
| **payroll_admin** | payroll:view/run, attendance/leave view, documents view, compliance, integrations | Mostly matches. `payroll.run.create` requires super_admin/hr_manager so payroll_admin **cannot run payroll** despite holding payroll:run (under-permissive, usability not security). Correctly excluded from recruitment reads after Phase 2. |
| **department_manager** | people/attendance/leave view, leave:approve, performance:view_team, recruitment:view, expenses:approve, reports | Write-scoping to managed dept now enforced on goals/reviews/exceptions/leave-approve (SEC-013 good). **Read gaps:** `employee.getById` not dept-scoped + exposes salary/payslips (RBAC-003). |
| **recruiter** | people:view_company, recruitment:view/manage, documents:view_self, reports | Recruitment reads correctly gated to recruitment:view. **Over-exposure residuals:** reads all-employee attendance & leave (RBAC-004), can markPaid expenses (RBAC-005), sees salary via employee.list (RBAC-003). |
| **employee** | self-service (profile/attendance/leave/payslip/documents/performance/learning/expenses self) | Enforced via `employeeProcedures` allowlist. NOTE: allowlist omits `expense.create/list/summary` though `expenses:submit_self` is granted - employee expense self-service is **unreachable** (under-permissive, fail-closed, not a vuln). |
| **candidate** | profile:view_self | Enforced via `candidateProcedures` allowlist (myApplications/myInterviews/user.me/ai.chat.send). Tight. |

**Central mechanism check:** `ctx.tenantDb` is resolved exclusively from `session.user.tenantId` -> `resolveTenantSchema` -> `getTenantDb(schemaName)` in `createTRPCContext`. No procedure accepts a client `tenantId`/`schemaName` for tenant DB selection. Tenant isolation via schema-per-tenant is structurally sound **inside tRPC**. The breaches are in custom REST routes that hit `adminDb`/Qiwa directly (RBAC-001, RBAC-002).

---

## 2. Verification table - SEC-001..SEC-013 (prior audit claims vs live code)

| ID | Prior claim | Still fixed? | Evidence / note |
|---|---|---|---|
| **SEC-001** invite escalation | Fixed | **YES** | `api/company/invite/route.ts:23,33` role gate `INVITE_ROLES` + `ASSIGNABLE_ROLES` (excludes super_admin). tRPC `invite.create` also gated + role enum excludes super_admin. |
| **SEC-002** cross-tenant registry | Fixed (tRPC) | **REGRESSED** | `auth.tenantsList` correctly gated to `PLATFORM_ADMIN_EMAILS` and schemaName removed (auth.ts:63-108). **But `GET /api/auth/check-tenants` dumps the same registry incl. `schemaName` with NO auth -> RBAC-001 (Critical).** |
| **SEC-003** company REST routes | Fixed | **YES** | `forbidIfNotRole(session, COMPANY_ADMIN_ROLES)` on profile PATCH, departments POST, setup-complete POST (route-auth.ts + each route). |
| **SEC-004** expense.list IDOR | Fixed | **YES** | `pendingFor` uses session `userEmployeeId`, non-company roles scoped to own + approval queue (expense.ts:46-87). |
| **SEC-005** seed/migrate in prod | Fixed | **YES** | `NODE_ENV==='production'` 404 guard + `MIGRATION_TOKEN` on all three (verified via grep). |
| **SEC-006** over-permissive reads | Fixed (systemic) | **PARTIAL** | recruitment/retention/settlement/document/ai reads now `requireCapability` (verified). **Missed:** attendance.list/monthlyReport/exceptions/assignment.list + leave.request.list/balance.list still companyProcedure -> recruiter (RBAC-004); employee.list/getById salary+payslips (RBAC-003); expense.markPaid (RBAC-005); ai.assistant reads (RBAC-008). |
| **SEC-007** user.me credential leak | Fixed | **YES** | `user.me` explicit safe-column projection; no passwordHash/mfaSecret (user.ts:9-21). |
| **SEC-008** PII plaintext | Fixed | **YES** | `encryptedText` codec on iqama/passport/bankIban columns (schema employees.ts:55-57 + crypto codec). |
| **SEC-009** Qiwa gov actions | Fixed (tRPC) | **REGRESSED** | `qiwa.sync/testConnection/dashboard` now `requireRole(QIWA_MANAGE_ROLES)`. **But `/api/qiwa` POST/PUT/GET proxies to the Qiwa government API with NO auth -> RBAC-002 (High).** |
| **SEC-010** IDOR writes | Fixed | **PARTIAL** | offer.accept/decline -> requireRole; recognition.create binds session fromEmployeeId; surveyResponse.create/update -> requireRole (all verified). **Missed:** recruitment.application.create & referral.create still bare protectedProcedure trusting client payload -> RBAC-007 (Low). |
| **SEC-011** getSubtree GPS dump | Fixed | **YES** | `getSubtree` -> requireCapability('attendance:view_company'); department_manager root forced to own employeeId (attendance.ts:711-720). |
| **SEC-012** leave.create trusts client id | Fixed | **YES** | `LEAVE_ONBEHALF_ROLES` (HR only) may pass employeeId; all other roles bound to session (leave.ts:167-181). |
| **SEC-013** dept-manager write scope | Fixed | **YES (writes)** | `assertManagesEmployee/Goal/Review/ReviewResponse/Exception` applied to retention goal/review/response writes + attendance.resolveException + leave.updateStatus. **Residual read gap:** employee.getById not scoped (folded into RBAC-003). |

**Net:** 9 of 13 fully hold; SEC-002 & SEC-009 re-opened via unguarded REST twins; SEC-006 & SEC-010 partially incomplete.

---

## 3. New / residual findings (see RBAC-findings.json)

| ID | Severity | Title | Anchor |
|---|---|---|---|
| RBAC-001 | **Critical** | Unauth cross-tenant registry + schemaName via `/api/auth/check-tenants` | api/auth/check-tenants/route.ts:9,27 |
| RBAC-002 | **High** | Unauth Qiwa government API proxy `/api/qiwa` | api/qiwa/route.ts:50,105 |
| RBAC-003 | Medium | employee.getById/list expose salary+payslips; getById not dept-scoped | employee.ts:48; schema employees.ts:41 |
| RBAC-004 | Medium | attendance + leave company reads still companyProcedure (recruiter) | attendance.ts:409; leave.ts:119 |
| RBAC-005 | Medium | expense.markPaid callable by any staff role | expense.ts:277 |
| RBAC-006 | Medium | `/api/auth/login` bypasses lockout + rate-limit | api/auth/login/route.ts:13 |
| RBAC-007 | Low | recruitment application/referral create trust client payload | recruitment.ts:288,653 |
| RBAC-008 | Low | ai.assistant reads on companyProcedure | ai.ts:46 |
| RBAC-009 | Info | `/api/auth/debug` metadata (prod-gated) | api/auth/debug/route.ts:11 |

---

## 4. Strengths (do not "fix")

- **Tenant DB isolation inside tRPC is sound** - `ctx.db` always resolves from `session.user.tenantId`; no procedure accepts a client-supplied tenantId/schemaName. Cross-tenant tenant-schema data is unreachable through the RPC surface.
- **`requireCapability` primitive** genuinely consults the same `can()` model the UI uses - backend and navigation now agree for recruitment, retention (perf + comp split), settlement, document, ai.suggestion, attendance.getSubtree.
- **Department-manager write-scoping (SEC-013)** is fail-closed and consistently applied across retention writes, attendance exceptions, and leave approvals (`assertManages*`, `getManagedDepartmentIds`).
- **Payroll router** - every read gated to `PAYROLL_VIEW_ROLES`, every write to super_admin/hr_manager, self-service via `payslip.myLatest`; period-lock and audited reopen. Clean.
- **Invite flow** - both the tRPC and the (previously vulnerable) REST door now share the same role gate + assignable-role allowlist that excludes super_admin.
- **user.me** projection, **PII field encryption** (encryptedText), **upload** magic-byte validation, **cron** routes secret-gated and fail-closed, **audit.list** HR-only, **notification** self-scoped by userId, **mfa** self-scoped with proof-of-possession enrollment.
- **requireRole is fail-closed** on unknown/invalid roles (`isAppRole`), and `protectedProcedure` fails closed when `ctx.tenantDb` is absent.

---

## 5. RBAC sub-score: 60 / 100

**Rationale:** The RPC authorization core is strong (would score ~90 on its own). But a full re-audit must weight the **custom REST surface**, and there it finds an **unauthenticated cross-tenant registry disclosure that leaks the very `schemaName` isolation key SEC-002 removed** (RBAC-001, Critical) plus an **unauthenticated proxy to a government API** (RBAC-002, High). These two directly re-open findings the prior audit scored as closed, so the 90/100 cannot stand. Deduct heavily for the Critical (-25) and High (-10), plus the four Medium over-permissive/hardening residuals the "systemic" Phase 2 fix left behind (RBAC-003/004/005/006, ~-4 each). Net ~60/100.

**Path back to 90+:** delete or gate `/api/auth/check-tenants`, `/api/qiwa`, `/api/auth/login`, `/api/auth/debug` (or route them through the guarded tRPC equivalents), then finish the SEC-006 pass on attendance/leave company reads, employee salary projection, and expense.markPaid. All are small, surgical changes.

**Verification limits:** static white-box review only; no running instance was exercised. Exploit reproductions are reasoned from code paths, not executed. Actual reachability of `/api/qiwa` government calls depends on `QIWA_CLIENT_ID/SECRET` being set (authz gap is confirmed regardless).
