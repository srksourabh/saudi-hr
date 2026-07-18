import { NextResponse } from "next/server";
import { adminDb, tenants, users } from "@hrms-app/db";
import { desc } from "drizzle-orm";

/**
 * Health + diagnostics endpoint. Returns the most recent tenants and the
 * newly signed-up user. Used by the super-admin dashboard.
 */
export async function GET() {
  try {
    const allTenants = await adminDb.query.tenants.findMany({
      orderBy: [desc(tenants.createdAt)],
      limit: 10,
    });
    const recentUsers = await adminDb.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      limit: 10,
    });
    return NextResponse.json({
      tenants: allTenants.map((t: any) => ({
        id: t.id,
        name: t.companyName,
        crNumber: t.crNumber,
        nitaqatActivity: t.nitaqatActivity,
        planTier: t.planTier,
        regulatoryContext: t.regulatoryContext,
        schemaName: t.schemaName,
        createdAt: t.createdAt,
      })),
      users: recentUsers.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        tenantId: u.tenantId,
        createdAt: u.createdAt,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
