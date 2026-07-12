import { hash } from "bcryptjs";
import { adminDb, createTenantRegistry } from "@hrms-app/db";
import { users } from "@hrms-app/db";
import { eq } from "drizzle-orm";
import { signupSchema } from "@hrms-app/validators";
import { createTRPCRouter, publicProcedure } from "../server";

export const authRouter = createTRPCRouter({
  signup: publicProcedure.input(signupSchema).mutation(async ({ input }) => {
    const existing = await adminDb.query.users.findFirst({
      where: eq(users.email, input.email),
    });

    if (existing) {
      throw new Error("A user with this email already exists");
    }

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
});
