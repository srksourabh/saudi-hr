# Contributing — hrms-app

## Setup

```bash
# Prerequisites: Node.js 20+, pnpm 9+, Docker
git clone <repo-url>
cd hrms-app
cp .env.example .env    # Fill in values
docker compose up -d    # Start Postgres + Redis
pnpm install
pnpm db:push            # Push schema to DB
pnpm dev                # Start dev server
```

## Development workflow

1. **Branch**: `git checkout -b feat/my-feature` or `fix/my-bug`
2. **Code**: Make changes, keeping them surgical
3. **Test**: `pnpm test` (unit + integration), `pnpm test:e2e` (E2E)
4. **Lint**: `pnpm lint` — ESLint must pass
5. **Typecheck**: `pnpm typecheck` — TypeScript must pass
6. **Build**: `pnpm build` — all packages must build
7. **Commit**: Follow conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
8. **PR**: Open against `main`, describe what and why

## Code conventions

- **Files**: kebab-case (`user-settings.tsx`)
- **Functions/variables**: camelCase (`getUserById`)
- **Components/types**: PascalCase (`UserSettings`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_LOGIN_ATTEMPTS`)
- **Imports**: Use package aliases (`@db`, `@validators`, `@ui`)
- **Exports**: Named exports preferred; default exports for pages only

## Testing conventions

- Unit tests in `__tests__/` next to source files
- Integration tests in `packages/db/src/__tests__/`
- E2E tests in `apps/web/e2e/`
- Tests should be hermetic: no network calls, no shared state
- Use factories for test data (`@db/test-utils/factories`)

## Pull request checklist

- [ ] Code compiles (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] No new `any` types
- [ ] No secrets committed
- [ ] No debug logs or console.log
- [ ] Changes are surgical (only what the PR describes)
