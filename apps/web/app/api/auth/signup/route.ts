import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { adminDb, createTenantRegistry, tenants } from "@hrms-app/db";
import { users } from "@hrms-app/db";
import { eq } from "drizzle-orm";
import { signupSchema } from "@hrms-app/validators";

// Per-IP signup throttle (AUTH-009): each signup creates a tenant + schema, so
// it needs tighter anti-automation than the loose shared auth-route limit.
// Same in-memory pattern as middleware.ts — best-effort per instance.
const signupAttempts = new Map<string, { count: number; resetAt: number }>();
const SIGNUP_MAX_PER_HOUR = 5;

function allowSignup(ip: string): boolean {
  const now = Date.now();
  const entry = signupAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    signupAttempts.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= SIGNUP_MAX_PER_HOUR) return false;
  entry.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    if (!allowSignup(ip)) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
    }

    const { email, password, name, companyName, crNumber, nitaqatActivity, regulatoryContext } = parsed.data;

    // Saudi Commercial Registration numbers are 10 digits (AUTH-009). Only
    // enforced for the saudi regulatory context; other contexts keep the
    // schema's looser bound.
    if ((regulatoryContext ?? "saudi") === "saudi" && !/^\d{10}$/.test(crNumber)) {
      return NextResponse.json(
        { error: "Validation failed", errors: { crNumber: ["CR number must be exactly 10 digits"] } },
        { status: 400 },
      );
    }

    const existing = await adminDb.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const tenant = await createTenantRegistry(
      companyName,
      crNumber,
      nitaqatActivity ?? "",
      regulatoryContext,
    );
    if (!tenant) {
      throw new Error("Failed to create tenant");
    }

    // Mark new tenant as needing onboarding
    await adminDb
      .update(tenants)
      .set({ onboardingCompleted: "false" })
      .where(eq(tenants.id, tenant.id));

    const passwordHash = await hash(password, 12);

    await adminDb.insert(users).values({
      email,
      name,
      passwordHash,
      role: "super_admin",
      tenantId: tenant.id,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
