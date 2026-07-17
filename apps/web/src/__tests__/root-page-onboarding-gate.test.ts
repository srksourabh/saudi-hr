/**
 * Regression test for the onboarding gate in apps/web/app/page.tsx (RootPage).
 *
 * The bug: redirect("/settings/company") was called INSIDE a try/catch. Next.js
 * implements redirect() by throwing a NEXT_REDIRECT signal, so the catch block
 * swallowed it — un-onboarded tenants silently reached the dashboard instead of
 * being sent to onboarding. This page is the ONLY enforcement point (middleware
 * has no onboarding check), so the gate simply didn't exist.
 *
 * The fix moves the redirect OUTSIDE the try/catch. This test locks that in: it
 * asserts the NEXT_REDIRECT signal PROPAGATES out of RootPage (not swallowed)
 * for an un-onboarded tenant, and that no redirect fires for an onboarded one.
 * If someone moves redirect() back inside the try/catch, case 1 fails because
 * RootPage resolves instead of rejecting.
 *
 * We mock the render-only imports (DashboardShell, icons, etc.) so importing the
 * server component in a node env doesn't drag in the client-component graph.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mimic the Next.js redirect signal: redirect() throws an error whose message
// contains NEXT_REDIRECT. A try/catch that swallows it (the bug) would stop it
// from propagating out of RootPage.
class NextRedirectError extends Error {
  digest: string;
  constructor(url: string) {
    super("NEXT_REDIRECT");
    this.digest = `NEXT_REDIRECT;push;${url};307;`;
  }
}

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new NextRedirectError(url);
  }),
}));

vi.mock("@hrms-app/auth", () => ({ auth: vi.fn() }));
vi.mock("@hrms-app/auth/rbac", () => ({ can: () => true }));

vi.mock("@hrms-app/db", () => ({
  adminDb: { query: { tenants: { findFirst: vi.fn() } } },
  getTenantDb: vi.fn(() => ({
    execute: vi.fn().mockResolvedValue([{ count: 0 }]),
  })),
  tenants: {},
}));

// Render-only imports — stubbed so the node-env import graph stays small.
vi.mock("next/link", () => ({ default: () => null }));
vi.mock("~/components/dashboard-shell", () => ({ DashboardShell: () => null }));
vi.mock("~/components/demo/employee-command-center", () => ({ EmployeeCommandCenter: () => null }));
// Stub every named icon. Guard `then` and symbol keys so the mocked module
// namespace is not mistaken for a thenable (which would hang `await import`).
vi.mock("lucide-react", () =>
  new Proxy(
    {},
    { get: (_t, prop) => (typeof prop === "string" && prop !== "then" ? () => null : undefined) },
  ),
);

import RootPage from "~/app/page";
import { redirect } from "next/navigation";
import { auth } from "@hrms-app/auth";
import { adminDb } from "@hrms-app/db";

const onboardedSession = {
  user: { id: "user-1", tenantId: "tenant-1", role: "hr_manager" },
} as unknown as Awaited<ReturnType<typeof auth>>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth).mockResolvedValue(onboardedSession);
  // Keep the redirect stub throwing after clearAllMocks wiped its impl.
  vi.mocked(redirect).mockImplementation((url: string) => {
    throw new NextRedirectError(url);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RootPage onboarding gate", () => {
  it("propagates the redirect for an un-onboarded tenant (not swallowed by try/catch)", async () => {
    vi.mocked(adminDb.query.tenants.findFirst).mockResolvedValue({
      onboardingCompleted: "false",
      schemaName: "tenant_abc123",
    } as never);

    // If the redirect were swallowed (the bug), RootPage would resolve and
    // render instead of rejecting. Rejecting proves the signal escapes.
    await expect(RootPage()).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirect).toHaveBeenCalledWith("/settings/company");
  });

  it("does not redirect an onboarded tenant", async () => {
    vi.mocked(adminDb.query.tenants.findFirst).mockResolvedValue({
      onboardingCompleted: "true",
      schemaName: "tenant_abc123",
    } as never);

    const result = await RootPage();

    expect(redirect).not.toHaveBeenCalledWith("/settings/company");
    expect(result).toBeTruthy();
  });
});
