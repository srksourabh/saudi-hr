import { hash } from "bcryptjs";
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
  session: protectedProcedure.query(async ({ ctx }) => {
    const session = await auth();
    return session;
  }),
});