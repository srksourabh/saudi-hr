# Security — hrms-app

## Authentication
- **Method**: Session-based (NextAuth v5)
- **Providers**: Email/password + OAuth (Google)
- **Password policy**: Minimum 8 characters, 1 uppercase, 1 number
- **Session rotation**: On login, logout, and role upgrade
- **Brute force**: 5 failed attempts → 15-minute lockout

## Authorization (RBAC)
- **Roles**: `admin`, `user`, `viewer`
- **Enforcement**: tRPC middleware — `requireRole('admin')`
- **Default**: All new users get role `user`

## API security
- **Rate limiting**: In-memory (Upstash/Vercel KV in prod) — 10 req/s per IP for auth, 100 req/s per user for API
- **Input validation**: Every tRPC mutation validated with Zod
- **CORS**: Whitelist origins only (configured in `packages/config`)
- **Headers**: CSP + Helmet set in Next.js middleware

## Data protection
- **SQL injection**: Prevented by Drizzle ORM (parameterized queries)
- **XSS**: React auto-escapes + CSP prevents inline scripts
- **Secrets**: `.env` gitignored, `.env.example` committed with dummy values
- **Passwords**: Hashed with bcrypt (12 rounds)

## Audit logging
All sensitive operations are logged to `audit_logs` table:
- Login / logout (success and failure)
- Role changes
- Account deletion
- Data export
- Failed authentication attempts (batch: logs after N failures)

## Dependency security
- `pnpm audit` runs in CI
- Dependabot configured for weekly vulnerability scans
- Pin major versions in package.json; minors float

## Incident response
- Errors logged to Sentry with user context (but no PII)
- Rate limit alerts at threshold
- Audit log reviewed weekly
