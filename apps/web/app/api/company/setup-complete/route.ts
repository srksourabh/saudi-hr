import { NextResponse } from "next/server";
import { auth } from "@hrms-app/auth";
import { adminDb, tenants } from "@hrms-app/db";
import { eq } from "drizzle-orm";
import { forbidIfNotRole, COMPANY_ADMIN_ROLES } from "../../../../lib/route-auth";

export async function POST(_request: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const forbidden = forbidIfNotRole(session, COMPANY_ADMIN_ROLES);
  if (forbidden) return forbidden;

  try {
    await adminDb
      .update(tenants)
      .set({ onboardingCompleted: "true" })
      .where(eq(tenants.id, session.user.tenantId as string));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/company/setup-complete]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
