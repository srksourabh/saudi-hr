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
    const role = (ctx.session as any).user.role;
    if (role !== "super_admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only platform super_admin can list tenants",
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
    };
  }),
});