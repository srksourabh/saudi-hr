# UX / Accessibility audit notes — hrms-app (2026-07-21)

Scope: apps/web/app/**, apps/web/components/**, packages/ui/**, apps/web/styles/globals.css.
Source-only review (no browser/runtime pass); findings are grounded in file:line evidence in UX-findings.json.

## Sub-scores

### Usability sub-score: 74 / 100

Justification:
- **Strong foundations** (+): Real shadcn/ui + Radix primitives (Dialog, Select, DropdownMenu) exist and are used correctly in most places (login form, attendance/portal punch dialog, documents/upload, compliance, retention forms). Empty/loading states are handled thoughtfully (module-explorer's "no matches" state, employees list's "No employees found" / "Loading..." rows, dashboard-shell's skeleton loading.tsx). Multi-step flows (new-employee stepper, careers apply) give clear progress feedback with icon + label + color, not color alone.
- **Deductions**: A dead language toggle on the very first screen a user sees (UX-002) is a first-impression usability failure. Two destructive deletes fire with zero confirmation (UX-009) against an otherwise-consistent confirm() pattern elsewhere — a real error-prevention gap (Nielsen heuristic #5). Confirmations that do exist are native, unstyled, unlocalized `window.confirm()` calls rather than the app's own themed dialog (UX-010), which is a consistency gap (heuristic #4) though not a functional blocker. A hand-rolled modal on the Guide Map page bypasses the app's own accessible Dialog component (UX-007), and several forms mix raw `<select>`/manually-retyped Tailwind with the shared `<Select>`/`<Input>` components used elsewhere, indicating no enforced form-field convention.
- Net: the product is usable and mostly polished, but has a handful of concrete, fixable consistency and error-prevention gaps concentrated in older/core modules (employees, leave, attendance guide-map) versus newer modules (recruitment, retention, offboarding) which are noticeably more disciplined.

### Accessibility sub-score: 62 / 100

Justification:
- **Strong foundations** (+): Semantic landmarks are present (`<header>`, `<nav>`, `<main>`, `<aside>`); focus-visible styling is the default across the design system (28 of 29 `focus:outline-none` instances correctly pair a replacement ring/border — only one lacks it, UX-005); the login form is a model example (proper `htmlFor`/`id`, `role="alert"` on errors, `aria-pressed`/`aria-label` on the show/hide-password toggle, `aria-hidden` on decorative SVGs); the loading skeleton correctly uses `aria-busy`/`aria-live="polite"`; decorative/illustrative images use empty `alt=""` appropriately; a repo-wide scan found zero `<div onClick>` div-soup patterns — interactive elements are consistently real buttons/links.
- **Deductions**: The single biggest system-wide gap is **broken label/input association** on several of the app's most business-critical forms — new employee, leave request, expenses, settings, payroll — a straightforward WCAG 1.3.1/4.1.2 failure repeated across ~40+ fields (UX-003), made worse by the fact newer modules (recruitment, retention, offboarding, documents/upload) get this right, proving it's an inconsistency rather than a skill gap. Required-field and error-announcement gaps compound this on the same forms (UX-004). The app's own documented "RTL-first" design intent (globals.css comment) is not honored by the dashboard shell itself, which hardcodes physical `left`/`padding-left` (UX-001) — a significant, repo-wide issue for the product's primary Arabic-speaking market. A hand-rolled modal lacks dialog semantics/focus-trap/Escape (UX-007), the help chatbot's message stream has no `aria-live` (UX-008), there's no skip-navigation link anywhere in the app (UX-011), and table headers omit explicit `scope="col"` (UX-012, low severity/best-practice).
- Net: accessibility infrastructure (Radix primitives, focus-visible defaults, RTL CSS hooks) is genuinely good, but adoption is inconsistent — a bimodal codebase where newer feature modules meet a much higher bar than older/core ones. Closing UX-001 and UX-003 alone would meaningfully move this score.

## Strengths (for the record)

1. **Radix-based accessible primitives already in place** — Dialog (focus trap, Escape, aria-modal via @radix-ui/react-dialog), Select, DropdownMenu in packages/ui/src/ui/*, correctly consumed in most of the app (attendance/portal punch dialog, documents/upload, compliance, retention/talent, retention/goals).
2. **Exemplary login form** (apps/web/app/(auth)/login/login-form.tsx) — every field has matched `htmlFor`/`id`, the error banner uses `role="alert"`, the show/hide-password toggle uses `aria-pressed` + `aria-label`, decorative icons are `aria-hidden`. This should be the template other forms are migrated to.
3. **No div-onClick anti-pattern anywhere** — a repo-wide search for `<div ... onClick=` in apps/web/app returned zero matches; all interactivity is built on real `<button>`/`<a>` elements or (in one case, employees list) a deliberately keyboard-enabled synthetic row.
4. **Focus-visible is the default, not the exception** — 28 of 29 `focus:outline-none` usages in the codebase correctly pair a replacement ring/border; the one gap (UX-005) is a clear outlier, not the norm.
5. **Thoughtful empty/loading states** — module-explorer's no-results state (icon + message + one-click "Reset filters"), dashboard-shell's `loading.tsx` skeleton with correct `aria-busy`/`aria-live="polite"`, employees list's explicit "Loading…"/"No employees found" table rows.
6. **Status conveyed with text + color, never color alone** — employee status badges, module status chips (live/demo/mock), and stepper states all pair a text label (and often an icon) with color, avoiding a common WCAG 1.4.1 pitfall.
7. **Working runtime RTL mechanism exists** — DashboardShell's `handleSetLanguage` correctly flips `document.documentElement.dir`/`lang` at runtime (dashboard-shell.tsx:33-37), and a `.rtl-flip` utility class correctly mirrors directional chevron icons in globals.css. The remaining RTL work (UX-001) is about applying this existing, working mechanism consistently to the shell's own physical-property classes — not about building RTL support from scratch.

## Severity counts

| Severity | Count |
|---|---|
| Critical | 0 |
| High | 2 |
| Medium | 6 |
| Low | 5 |
| **Total** | **13** |
