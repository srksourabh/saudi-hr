# Privacy, Audit & Notifications audit notes (PRIV)

Domain: Security headers + client-side security + Privacy/PDPL + Audit logging + Notifications
Scope phases: 9.3, 9.4, 9.5, 9.7, 9.8, 14, 15, 16
Repo: hrms-app (Saudi HR SaaS, Saudi PDPL). Read-only white-box. Date 2026-07-21.

## SECRETS - ROTATE

| Secret | File:line | Status | Action |
|---|---|---|---|
| Production Supabase DB password `0uKN********` (full connection string, tenant `rukn_energy_services`) | `_db_url.txt:1` | Real, gitignored but present in working tree (cleartext) | ROTATE the Supabase DB password now; delete the file; verify it never entered git history (`git log --all -- _db_url.txt`). See PRIV-003. |
| `VERCEL_OIDC_TOKEN` (signed JWT, short-lived) | `.env.local:2`, `.env.production.local:2` | Auto-generated, gitignored, ~12h TTL | Low risk; no rotation required. Don't share these files. See PRIV-004. |

Note: root `.env` could not be read (blocked by permission settings) and `apps/web/.env` exists on disk (untracked, 430 bytes) — contents unverified (unable-to-verify), but both are gitignored/untracked so not committed. No real `sk-`/`AKIA`/`re_`/`AIza`/`xox` secrets found in tracked source. Hardcoded `postgres:postgres@localhost` strings in `.env.example`, `docker/docker-compose.yml`, `packages/db/drizzle.config.ts` are dev-only defaults (acceptable). `packages/auth/src/__tests__/totp.test.ts:6` uses the standard RFC 6238 test vector (not a secret).

## PII inventory

| PII field | Stored where | Encrypted at rest? | Masked in UI/logs/exports? |
|---|---|---|---|
| Iqama / national ID | `employees.iqama_number_enc` | Yes — AES-256-GCM, deterministic SIV (`encryptedText`, crypto.ts) | Not masked: decrypted into salary certificate (`document.ts:59`) and self-export; UI shows full value. No masking helper found. |
| Passport number | `employees.passport_number_enc` | Yes — AES-256-GCM | Not masked in UI/exports (no masking util). |
| Bank IBAN | `employees.bank_iban_enc` | Yes — AES-256-GCM | Not masked in UI/exports. |
| Salary (basic/housing/transport) | `employees.salary_*` (numeric) | No (plaintext columns) | Access-gated to payroll roles (RBAC); appears in payslip email body (`payslip-ready.tsx:152`) and in `audit_logs` old/new JSON as plaintext (PRIV-013). |
| Full name | `employees.full_name` | No | Shown per RBAC scope; in audit newValue. |
| Immigration/visa dates, occupation, skill | `employees.*` | No | Operational, lower sensitivity. |
| Email | `public.users.email` | No | Logged in cleartext on failed login/MFA (PRIV-007) and in reset URL/logs (PRIV-005/006). |
| Password hash / MFA secret | `public.users` | Hash / secret | Correctly excluded from `user.me` and `employee` client projections (SEC-007) — strength. |
| Reset token | `public.verification_tokens.token` | Stored as SHA-256 hash (good) | BUT raw token logged via console.info (PRIV-005). |
| IP address | `audit_logs.ip_address` | No | Expected for audit. |
| Candidate data | recruitment tables | Not verified in depth | Explicit consent captured at intake (strength; mislabelled GDPR, PRIV-009). |

Encryption codec: `packages/db/src/crypto.ts` — AES-256-GCM, deterministic synthetic-IV so the iqama unique index/equality lookups keep working; marker `encv1:`; legacy plaintext passthrough on read (backfill pending per memory). Fail-closed: production requires `FIELD_ENCRYPTION_KEY` (>=32 chars) — enforced in `env.ts` superRefine and again in `deriveKeys()`.

## Privacy sub-score: 62 / 100

Rationale: Strong PII-at-rest encryption, fail-closed key handling, an audited self-service data export, soft-delete that preserves history, no client-side token/PII storage, and solid transport headers lift the baseline. Deductions: reset token + email in server logs (High, PRIV-005); real prod DB credential in a working-tree file (High, PRIV-003); no rectification/erasure/consent-withdrawal or retention policy (PRIV-008); PII export (letters) unaudited (PRIV-010); auth/role/export events absent from the audit trail (PRIV-011); salary in email + audit plaintext; CSP `script-src 'unsafe-inline'` removes XSS containment (PRIV-001). Legal review required before asserting PDPL compliance — this score is a technical posture indicator, not a compliance attestation.

## Audit-logging note

- Central writer `apps/web/trpc/audit.ts` (`writeAudit`) records userId, action, entityType, entityId, old/new value (+ `_actingRole`), ipAddress, timestamp. Audit failure never blocks the primary op but is surfaced via `console.error` — good design.
- Read surface `apps/web/trpc/routers/audit.ts` is read-only, `requireRole("super_admin","hr_manager")`, tenant-scoped (schema-per-tenant DB via `getTenantDb`), no update/delete procedures. Users cannot modify or delete audit entries through the API. Strength.
- Coverage: employee create/update/delete, salary_change, payroll runs, settlement, and `pdpl.self_export`. GAPS: login/logout/lockout, MFA enable/disable, role assignment (invites), document/letter generation, PII/salary views, config/settings changes are not persisted (PRIV-010, PRIV-011). Auth events are only `console.warn` (ephemeral).
- Salary before/after stored plaintext in `audit_logs` jsonb (PRIV-013).

## Notifications note

- `notification.list/markRead/markAllRead/unreadCount` are all scoped to `ctx.user.id`; `markRead` re-checks ownership in the WHERE clause. No cross-user read/write surface found — strength.
- No user notification-preferences / unsubscribe model; `channel` enum has email/sms/in_app but no opt-out (PRIV-012).
- No email dispatch implemented anywhere (`resend.emails.send` not called; request-reset has `TODO(email)`). Templates exist (welcome, leave-request, leave-status, payslip-ready, document-expiry). PayslipReady email body renders net pay — remove before wiring dispatch (PRIV-012).

## STRENGTHS

- Field-level AES-256-GCM encryption at rest for iqama/passport/IBAN with fail-closed production key enforcement (`crypto.ts`, `env.ts`).
- Transport/security headers generated in source (`next.config.ts`): HSTS `max-age=63072000; includeSubDomains; preload`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=()`, `X-XSS-Protection: 0` (correct modern value), `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, and `'unsafe-eval'` dropped. Cross-checks the live prod response.
- `productionBrowserSourceMaps` not enabled (default off) — no client source maps in prod.
- No `localStorage`/`sessionStorage`/`document.cookie` storage of tokens or PII in client code — sessions ride NextAuth httpOnly cookies.
- `NEXT_PUBLIC_*` vars hold only non-sensitive values (APP_URL, BRAND_*, DEMO_MODE); no secret reaches the client bundle.
- `user.me` and employee client projections deliberately exclude passwordHash/mfaSecret (SEC-007).
- Reset tokens stored only as SHA-256 hashes; reset flow is non-enumerating (always returns `{ ok: true }`).
- Audited PDPL self-service data export (`employee.exportMyData`); soft-delete preserves payroll/audit history (no silent hard-delete).
- Explicit candidate consent capture with validation at recruitment intake.
- Read-only, role-gated, tenant-scoped audit read API with no tamper surface.
- CSRF same-origin check + per-endpoint rate limiting + brute-force login throttling in `middleware.ts`.

## Unable-to-verify

- Root `.env` contents (read blocked by permission settings) and `apps/web/.env` contents (untracked file on disk) — not inspected; both gitignored/untracked so not committed.
- Whether any PII/salary is rendered unmasked in specific HR detail pages was not exhaustively traced (no direct `*_enc` field references found in `app/`/`components/`; access is via router projections).
