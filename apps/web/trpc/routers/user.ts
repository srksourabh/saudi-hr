import { createTRPCRouter, protectedProcedure } from "../server";

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    // Project to safe columns only — never ship credential material
    // (passwordHash, mfaSecret) to the client (SEC-007).
    const user = await ctx.adminDb.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, ctx.user.id as string),
      columns: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        tenantId: true,
        employeeId: true,
        preferredLanguage: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  }),
});
