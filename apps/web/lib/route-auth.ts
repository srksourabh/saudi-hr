import { NextResponse } from "next/server";
import type { Session } from "next-auth";

/**
 * Role gate for custom REST route handlers (SEC-003). tRPC procedures use
 * `requireRole`/`requireCapability`; the hand-rolled `/api/**` routes have no
 * such wrapper, so this provides the equivalent server-side check.
 *
 * Returns a 403 `NextResponse` when the session role is not in `roles`, or
 * `null` when the caller is authorised (proceed).
 */
export function forbidIfNotRole(
  session: Session | null,
  roles: readonly string[],
): NextResponse | null {
  const role = session?.user?.role;
  if (!role || !roles.includes(role)) {
    return NextResponse.json(
      { error: "You do not have permission to perform this action" },
      { status: 403 },
    );
  }
  return null;
}

/** Roles allowed to change company-level settings (mirrors `settings:manage`). */
export const COMPANY_ADMIN_ROLES = ["super_admin", "hr_manager"] as const;
