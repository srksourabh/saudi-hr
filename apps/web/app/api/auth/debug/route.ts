import { auth } from "@hrms-app/auth";

/**
 * Configuration diagnostics endpoint.
 *
 * Disabled in production — the response reveals internal env wiring which is
 * enough information to start a side-channel attack. In every environment the
 * endpoint additionally requires a platform-operator session (the same
 * PLATFORM_ADMIN_EMAILS allowlist that gates auth.tenantsList), because
 * preview/staging deployments are frequently internet-reachable
 * (AUTH-011 / RBAC-009). Secret metadata (AUTH_SECRET length) and DB
 * host/port are never returned.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEBUG_ENDPOINT !== "true") {
    return new Response("Not found", { status: 404 });
  }

  // Platform-operator gate — fail-closed when the allowlist is unset. Respond
  // 404 (not 403) so the route's existence is not confirmed to anonymous callers.
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  const allowedOperators = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!email || !allowedOperators.includes(email)) {
    return new Response("Not found", { status: 404 });
  }

  const authSecret = process.env.AUTH_SECRET;
  const authUrl = process.env.AUTH_URL;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const dbUrl = process.env.DATABASE_URL;
  const demoMode = process.env.DEMO_MODE;

  return Response.json({
    hasAuthSecret: !!authSecret,
    hasAuthUrl: !!authUrl,
    authUrlValue: authUrl ?? "not set",
    hasNextAuthUrl: !!nextAuthUrl,
    nextAuthUrlValue: nextAuthUrl ?? "not set",
    hasDbUrl: !!dbUrl,
    nodeEnv: process.env.NODE_ENV,
    demoModeValue: demoMode ?? "not set",
    demoModeIsTrue: demoMode === "true",
  });
}
