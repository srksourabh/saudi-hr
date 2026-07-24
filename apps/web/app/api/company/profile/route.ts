import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@hrms-app/auth";
import { adminDb, tenants } from "@hrms-app/db";
import { eq } from "drizzle-orm";
import { forbidIfNotRole, COMPANY_ADMIN_ROLES } from "../../../../lib/route-auth";

// Bounded PATCH body (API-011) — matches the project's Zod-everywhere convention.
const profilePatchSchema = z.object({
  industry: z.string().max(120).nullish(),
  companySize: z.string().max(60).nullish(),
  website: z.string().max(255).nullish(),
  logoUrl: z.string().url().max(500).or(z.literal("")).nullish(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const tenant = await adminDb.query.tenants.findFirst({
      where: eq(tenants.id, session.user.tenantId as string),
    });
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

    return NextResponse.json({
      industry: tenant.industry ?? "",
      companySize: tenant.companySize ?? "",
      website: tenant.website ?? "",
      logoUrl: tenant.logoUrl ?? "",
    });
  } catch (err) {
    console.error("[GET /api/company/profile]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const forbidden = forbidIfNotRole(session, COMPANY_ADMIN_ROLES);
  if (forbidden) return forbidden;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = profilePatchSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json({ error: first }, { status: 400 });
  }
  const { industry, companySize, website, logoUrl } = parsed.data;

  try {
    await adminDb
      .update(tenants)
      .set({
        industry: industry ?? null,
        companySize: companySize ?? null,
        website: website ?? null,
        logoUrl: logoUrl || null,
      })
      .where(eq(tenants.id, session.user.tenantId as string));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/company/profile]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
