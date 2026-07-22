# Business-logic and functional-correctness audit — hrms-app

Domain: Functional Correctness and Business-Logic Security (Phase 4 + 9.9)
Scope: payroll, expense, leave, settlement, recruitment, retention, attendance routers plus
`packages/payroll`, `packages/leave` calculators. Method: white-box read of tRPC mutation
logic, validators, calculators, and the RBAC/procedure model. All findings are grounded in
file:line evidence in `BIZ-findings.json`.

Date: 2026-07-21

## How the procedure model works (context for the findings)

- `protectedProcedure` -> auth + `canAccessProcedure(role, path)` (an allow-list only for
  `employee`/`candidate`; every other staff role is allowed) + tenant db.
- `companyProcedure` -> `protectedProcedure` and additionally blocks only `employee` and
  `candidate`. So `department_manager`, `hr_specialist`, `payroll_admin`, `recruiter` all pass.
- `requireRole(...)` / `requireCapability(cap)` -> explicit role/capability gates (the strong ones).

Most business-logic gaps below stem from `companyProcedure`/bare `protectedProcedure` being
used where an identity-aware or capability check was needed, plus missing `actor != subject`
checks and missing idempotency guards.

## Workflow-by-workflow risk table

| Workflow | Money at risk | Key finding(s) | Severity | Status |
|---|---|---|---|---|
| Expense submit -> approve | Yes | BIZ-001 self-set approver => approve own expense | High | confirmed |
| Expense approve -> pay | Yes | BIZ-002 `markPaid` on `companyProcedure` (recruiter/dept-mgr can pay); no SoD | High | confirmed |
| Expense (all) | Yes | BIZ-003 zero audit trail on create/approve/pay | Medium | confirmed |
| Leave request -> approve | Indirect | BIZ-004 balance not re-checked at approval; negative floored to 0 | Medium | suspected |
| Leave approve | Indirect | BIZ-005 self-approval (mgr/HR approves own leave) | Medium | confirmed |
| Leave request | Indirect | BIZ-006 back-dating (no min start date) | Low | confirmed |
| Leave accrual (cron) | Yes | BIZ-007 monthly accrual compounds YTD -> ~6.5x over-accrual | High | suspected |
| Final settlement create | Yes | BIZ-008 duplicate settlement / EOSB (no uniqueness/status) | High | suspected |
| Payroll run status | Yes | BIZ-009 loose state machine; completed->cancelled un-audited re-opens period | Medium | confirmed |
| Payslip create | Yes | BIZ-010 manual arbitrary-amount injection, engine + audit bypass | Medium | confirmed |
| Compensation adjustment | Yes | BIZ-011 self-approval (client status+approvedById) | Medium | suspected |
| Recruitment offer outcome | Indirect | BIZ-012 unconditional status set (no state machine) | Low | confirmed |
| Referral create | Indirect | BIZ-013 client-supplied referrer + reward amount | Low | suspected |
| Performance review | No (integrity) | BIZ-014 manager self-review possible | Low | suspected |
| Approve/pay/leave (all) | Yes | BIZ-015 no atomic status guard (race double-processing) | Low | suspected |

### Severity counts (15 findings total)
- High: 4 (BIZ-001, BIZ-002, BIZ-007, BIZ-008)
- Medium: 6 (BIZ-003, BIZ-004, BIZ-005, BIZ-009, BIZ-010, BIZ-011)
- Low: 5 (BIZ-006, BIZ-012, BIZ-013, BIZ-014, BIZ-015)

## The three biggest business risks

1. **Expense self-dealing chain (BIZ-001 + BIZ-002 + BIZ-003).** A single staff-role user can
   submit an expense, name themselves the approver, approve it, and mark it paid — with no
   segregation of duties and no audit record anywhere. This is the clearest money-out fraud path.
2. **Leave-accrual compounding (BIZ-007).** The monthly accrual adds the year-to-date figure to
   the existing balance on every run, so a monthly cron inflates every employee's balance to
   ~6.5x entitlement by year end. It is automatic, tenant-wide, and inflates leave-payout liability.
3. **Duplicate EOSB (BIZ-008).** `final_settlements` has no uniqueness/status guard and both
   `settlement.create` and `offboarding.initiate` insert fresh rows, so one employee can carry
   multiple end-of-service records — a duplicate large-payout risk.

## Strengths observed (good controls to preserve)

- **EOSB is computed server-side, never trusted from the client (DOC-003)**; Article 80
  investigation-document gate (EOSB-010) and Article 87 auto-derivation are implemented and the
  ESB/GOSI engines are well-documented and correct (half-month/full-month linear formula, GOSI
  45,000 cap, SANED/occ-haz branches, netPay floored at 0). `settlement.create` writes an audit record.
- **Payroll period lock (PAY-010)** blocks a second run for a month unless the prior is cancelled;
  **reopen** requires a >=10-char reason and writes an audit record; a completed period is locked
  against generic edits.
- **Statutory deduction caps (Art 92/93)** enforced in the orchestrator (10% loan, 50% total).
- **Expense create binds `employeeId` to the session**, and **approve binds the approver to the
  session** (SEC-004 IDOR remediation), so cross-employee tampering by id is prevented.
- **Leave overlap check (LEV-010)** and on-behalf gating (SEC-012) are present.
- **Attendance punch guards**: open-sequence prevents double punch-in and double punch-out;
  GPS/time captured; department-manager subtree restricted to own team (SEC-011).
- **Recruitment offer accept/decline and survey/recognition writes** were moved off bare
  `protectedProcedure` to HR-only / session-bound (SEC-010).
- **Iqama-expiry payroll block** excludes expats with expired iqama from a run and flags them.
- Recruitment/retention reads are capability-gated (`recruitment:view`, `performance:view_team`,
  `payroll:view_company`) rather than open to all staff.

## Functional-Quality sub-score: 68 / 100

Rationale: The highest-value, most-scrutinised paths (payroll runs, EOSB calculation, IDOR
remediation, attendance punch integrity) are genuinely well-guarded and well-tested, which
lifts the base score. Points are deducted for: a real segregation-of-duties hole on the expense
approve+pay chain with no audit (High), a systematic leave-accrual calculation bug (High), a
duplicate-settlement/EOSB idempotency gap (High), and several self-approval / missing-audit /
loose-state-machine issues across leave, payroll status, compensation and reviews (Medium/Low).
The pattern is consistent: strong role gates and server-side calculation, but weak
`actor != subject` enforcement, missing idempotency/uniqueness guards, and inconsistent audit
coverage outside payroll/settlement.

### Fastest wins (recommended order)
1. BIZ-002 (swap `companyProcedure` -> capability gate) — ~0.5 day, removes the worst SoD hole.
2. BIZ-001 (`actor != approver` on expense create/approve) — ~0.5 day.
3. BIZ-007 (accrual: grant one month + idempotency key) — ~1-2 days incl. tests.
4. BIZ-008 (unique/active settlement + existing-check) — ~1 day incl. migration.
5. BIZ-003 (add `writeAudit` to expense mutations) — ~0.5 day.
