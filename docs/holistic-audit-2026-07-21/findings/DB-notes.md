# Database & Data Integrity — audit notes (Phase 10 + 14.4)

Scope: `packages/db/**` (schema, crypto.ts, migrations, tenant DDL generator, audit triggers, indexes, drizzle config) plus tenant-provisioning callers in `apps/web`. Read-only white-box review. **The live DB was NOT queried** — every conclusion is reasoned from schema/migration source. Where DB state cannot be confirmed from code it is marked unable-to-verify below.

Repo commit context: master @ 610e99d.

---

## Encryption coverage table (SEC-008)

Codec: `encryptedText` custom type in `packages/db/src/crypto.ts` — AES-256-GCM, deterministic synthetic-IV (SIV), 16-byte tag, HMAC-domain-separated enc/iv subkeys, tamper-reject on read, legacy-plaintext passthrough.

| Field | Table / file | Encrypted at rest? | Evidence | Note |
|---|---|---|---|---|
| iqama_number_enc | employees (`schema/tenant/employees.ts:55`) | Yes (deterministic) | `iqamaNumberEnc: encryptedText("iqama_number_enc")` | Needs determinism for unique index (0009). Correct choice. |
| passport_number_enc | employees (`employees.ts:56`) | Yes (deterministic) | `passportNumberEnc: encryptedText(...)` | No uniqueness need → could use randomized IV. |
| bank_iban_enc | employees (`employees.ts:57`) | Yes (deterministic) | `bankIbanEnc: encryptedText(...)` | No uniqueness need → randomized IV would remove equality leak. |
| salary_basic / housing / transport | employees (`employees.ts:41-43`) | No (plaintext numeric) | `numeric(12,2)` | Deliberate — needed for arithmetic. Documented, acceptable. |
| salary / allowances | qiwa_contracts (`qiwa_contracts.ts:28,37-41`) | No | `numeric(12,2)` | Compensation plaintext. |
| base/expected/current/min/max salary | recruitment, retention, offers | No | `numeric(12,2)` | Compensation plaintext across modules. |
| all payslip components | payslips (`payslips.ts:15-49`) | No | `numeric(...)` | Computed values; plaintext. |
| mfa_secret (TOTP seed) | users (`public/users.ts:28`) | **No — GAP (DB-011)** | `mfaSecret: text("mfa_secret")` | Should be encrypted; MFA-bypass risk. |
| document numbers | documents (`documents.ts`) | N/A (not stored) | only `type`, `file_url` | Actual iqama/passport scans live at `file_url` (external storage; encryption there is out of DB scope). |
| iqama/passport/IBAN raw column type | `_enc` columns | plaintext `TEXT` at DB (DB-010) | `tenant-manager.ts:133-135` | Encryption enforced only by app codec; raw/seed writes can store plaintext undetected. |

Key sourcing: `FIELD_ENCRYPTION_KEY` (env) → SHA-256 → HMAC subkeys. Failure mode: throws only when `NODE_ENV==='production'`; otherwise silently uses committed `DEV_FALLBACK_KEY` (DB-007). No key rotation/versioning (static `encv1:` marker) — rotating the key makes all existing ciphertext fail GCM auth on read.

---

## Tenant provisioning vs. schema — drift map (the core problem)

There are **three divergent schema mechanisms** that do not agree:

1. **Canonical Drizzle schema** (`schema/tenant/*.ts`, ~24 tables) — the source of truth the app compiles against.
2. **Runtime provisioning DDL** (`tenant-manager.ts::generateTenantDDL`) — hand-written, creates **only `departments` + `employees`** (and an employees table missing immigration/gcc columns). This is what real signups get (`apps/web/app/api/auth/signup/route.ts` → `createTenantRegistry` → `createTenantSchema`).
3. **Drizzle migrations** (`drizzle/0000..0009`) — `0000` is one flat unqualified schema mixing public + all tenant tables (78 tables). `0001`/`0002` hardcode a single dev schema `tenant_1ed8b6bd3743`. `0006`/`0007`/`0009` correctly loop all `tenant_<hex>` schemas but only run once (new tenants created afterward miss them).

Consequence: a freshly signed-up tenant is missing ~22 tables, all indexes, the iqama unique index, and the audit-log append-only trigger. The team already works around this in `scripts/seed-rukn-modules.ts` ("PHASE 1 (DDL) — creates any MISSING tenant tables"). See DB-001..DB-005, DB-008.

---

## Audit log assessment

- Structure (`audit_logs.ts`): captures actor (`user_id`), `action`, `entity_type`, `entity_id`, before (`old_value` jsonb), after (`new_value` jsonb), `ip_address`, `created_at`. Good field coverage. **STRENGTH.**
- Append-only enforcement (`0007_audit_logs_append_only.sql`): `BEFORE UPDATE/DELETE` trigger `prevent_audit_mutation()` raises exception; idempotent; loops all tenant schemas that have the table. Well-built. **STRENGTH.**
- Gap: not wired into provisioning; new tenants have neither the table nor the trigger (DB-003). App users cannot tamper *once the trigger exists*, but on a new tenant there is nothing to tamper-protect.
- unable-to-verify: whether the application DB role is distinct from a superuser/owner that could `ALTER TABLE ... DISABLE TRIGGER`. Trigger blocks row DML but a role with table-owner privileges could disable it. Reasoned from code only; recommend confirming the runtime role has no ownership/DDL rights on tenant schemas.

---

## Money / precision assessment — STRENGTH

- All monetary columns are `numeric` with explicit precision/scale: money `numeric(12,2)`, payroll totals `numeric(14,2)`, GOSI rates `numeric(6,4)`, EOSB service years `numeric(6,3)`, leave balance `numeric(5,1)`.
- `grep` for `real|double precision|float` in `0000_thin_freak.sql` → **0 money matches**. The only `doublePrecision` use is GPS lat/lng in attendance (non-monetary, appropriate).
- Drizzle `numeric()` returns JS **string** by default (no mode override anywhere), so values are not coerced through IEEE-754 floats — precision preserved end-to-end at the DB boundary.

## Other integrity observations

- FKs: base migration has 106 `ADD CONSTRAINT` FKs with sensible cascade choices (`cascade` for child rows like payslips/expenses/attendance, `set null` for optional refs like department, `restrict` for leave_types/shifts). **STRENGTH** (within the single-schema migration).
- UUID defaults: 76/78 tables use `"id" uuid PRIMARY KEY DEFAULT gen_random_uuid()`; the 2 without an `id` default are the composite-key NextAuth tables (verification_tokens, invite_token_index) — expected, not a defect. The prior "some tables lacked gen_random_uuid" note maps to the runtime DDL context, not the base migration.
- `date` columns (hire/termination/leave/period_month/expiry) correctly use `date` — timezone-agnostic, appropriate.
- leave_balances missing unique + timestamps (DB-009).
- Soft vs hard delete: schema uses hard delete + FK cascades (e.g. deleting an employee cascades payslips/expenses/attendance). No soft-delete/tombstone columns. For payroll/audit history this risks losing historical records on employee deletion — flagged implicitly via cascade design; recommend reviewing whether terminated employees should ever be hard-deleted (out of strict scope, noted for Phase 10).

---

## Sub-scores (0-100)

### Data-Integrity sub-score: 46 / 100
Rationale: Money/precision, FK design, and UUID defaults are solid (would score ~85 in isolation). But the provisioning/migration layer is broken in ways that guarantee real data-integrity failures: incomplete tenant DDL (Critical), single-tenant-hardcoded migrations (Critical), missing immigration columns/type drift (High), missing iqama unique index on new tenants (High), no per-tenant migration runner (Medium), missing leave_balances uniqueness (Low), naive timestamps (Medium). The gap between the canonical schema and what tenants actually get is the dominant risk and pulls the score down hard.

### Database-Security sub-score: 63 / 100
Rationale: Encryption is cryptographically sound (AES-256-GCM, authenticated, domain-separated keys, tamper-reject, deterministic-by-design with documented tradeoff), append-only audit trigger is well-designed, schema-name validation prevents search_path SQL injection, and money is non-floating. Deductions: dev-fallback key silently used outside production (Medium), MFA secret plaintext (Medium), `_enc` columns not DB-enforced so plaintext can leak in (Low), audit table/trigger absent on new tenants (High), no key rotation path (Medium).

---

## STRENGTHS (consolidated)

1. Field-level PII encryption is a correct AES-256-GCM authenticated construction with domain-separated subkeys and tamper rejection (`crypto.ts`, verified by `__tests__/crypto.test.ts`).
2. Deterministic SIV is a deliberate, documented tradeoff that correctly enables the iqama unique index and equality lookups.
3. Audit-log append-only trigger (`0007`) is idempotent, schema-loop-safe, and blocks UPDATE/DELETE at the DB.
4. Money columns consistently `numeric` with correct precision/scale; no float/real; Drizzle returns strings (no precision loss).
5. FK constraints with deliberate cascade/set-null/restrict semantics; all `id` PKs default to `gen_random_uuid()`.
6. `assertSafeSchema` regex (`tenant-manager.ts:11-16`) blocks SQL injection via `search_path`; `prepare:false` + `SET LOCAL search_path` in a transaction hardens raw `db.execute` under poolers.
7. Legacy-plaintext passthrough on decrypt enables a safe, incremental PII backfill.
8. `0006`/`0007`/`0009` demonstrate the correct all-tenant DO-loop migration pattern (the template the hardcoded 0001/0002 should have followed).

## unable-to-verify (no live DB access)
- Whether existing production tenant schemas already contain the full table set (they may have been backfilled by seed scripts).
- Whether the app's runtime DB role is non-owner (needed to guarantee the audit trigger cannot be disabled).
- Actual timezone of serverless writers vs. stored naive timestamps (reasoned as a risk, not observed).
- Whether the PII backfill (`scripts/encrypt-pii-backfill.ts`) has been run in production (MEMORY.md notes it was still pending as of 2026-07-21).
