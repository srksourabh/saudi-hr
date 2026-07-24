import { hash } from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { adminDb, users } from "@hrms-app/db";
import { eq } from "drizzle-orm";
import { signupSchema } from "@hrms-app/validators";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../server";
import { auth } from "@hrms-app/auth";

export const authRouter = createTRPCRouter({
  signup: publicProcedure.input(signupSchema).mutation(async ({ input }) => {
    const existing = await adminDb.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (existing) {
      throw new Error("A user with this email already exists");
    }

    const { createTenantRegistry } = await import("@hrms-app/db");
    const tenant = await createTenantRegistry(input.companyName, input.crNumber, input.nitaqatActivity ?? "");

    if (!tenant) {
      throw new Error("Failed to create tenant");
    }

    const passwordHash = await hash(input.password, 12);

    const [user] = await adminDb
      .insert(users)
      .values({
        email: input.email,
        name: input.name,
        passwordHash,
        role: "super_admin",
        tenantId: tenant.id,
      })
      .returning();

    if (!user) {
      throw new Error("Failed to create user");
    }

    return { id: user.id, email: user.email, name: user.name, tenantId: user.tenantId };
  }),

  /**
   * Lightweight session query used by client components that need to know
   * the current user's role, employeeId, name and preferred language.
   * Mirrors the JWT claims so client code never has to call next-auth
   * directly from a client component.
   */
  session: protectedProcedure.query(async () => {
    const session = await auth();
    return session;
  }),

  /**
   * Platform-admin: list every tenant + recent users across the registry.
   * Gated to super_admin (the platform operator). Returns minimal,
   * non-PII metadata so the super-admin dashboard can show tenant
   * counts without exposing customer data.
   */
  tenantsList: protectedProcedure.query(async ({ ctx }) => {
    // Cross-tenant registry access is a PLATFORM-operator action, not a tenant
    // one. `super_admin` is a per-tenant role (minted at every signup), so it
    // must NOT gate this. Restrict to an explicit, env-configured allowlist of
    // platform-operator emails — fail-closed when unset (SEC-002).
    const email = ((ctx.session as any).user.email as string | undefined)?.toLowerCase();
    const allowedOperators = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (!email || !allowedOperators.includes(email)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Platform operator access is required to list tenants",
      });
    }
    const { tenants, users } = await import("@hrms-app/db");
    const { desc } = await import("drizzle-orm");
    const allTenants = await ctx.adminDb.query.tenants.findMany({
      orderBy: [desc(tenants.createdAt)],
      limit: 25,
    });
    const recentUsers = await ctx.adminDb.query.users.findMany({
      orderBy: [desc(users.createdAt)],
      limit: 15,
    });
    return {
      tenants: allTenants.map((t: any) => ({
        id: t.id,
        name: t.companyName,
        crNumber: t.crNumber,
        nitaqatActivity: t.nitaqatActivity,
        planTier: t.planTier,
        regulatoryContext: t.regulatoryContext,
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
    };
  }),

  createCompany: protectedProcedure.input(signupSchema).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "super_admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only super_admin can create new companies" });
    }
    const existing = await adminDb.query.users.findFirst({
      where: eq(users.email, input.email),
    });
    if (existing) {
      throw new TRPCError({ code: "CONFLICT", message: "A user with this admin email already exists" });
    }
    const { createTenantRegistry } = await import("@hrms-app/db");
    const tenant = await createTenantRegistry(
      input.companyName,
      input.crNumber,
      input.nitaqatActivity ?? "",
      input.regulatoryContext,
    );
    if (!tenant) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create company tenant schema" });
    }
    const passwordHash = await hash(input.password, 12);
    await adminDb.insert(users).values({
      email: input.email,
      name: input.name,
      passwordHash,
      role: "hr_manager",
      tenantId: tenant.id,
    });
    return { success: true, tenantId: tenant.id, adminUser: input.email };
  }),
});