import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../server";
import { adminDb, users } from "@hrms-app/db";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { generateTotpSecret, totpAuthUri, verifyTotp } from "@hrms-app/auth";

/**
 * TOTP MFA enrollment (C4). The secret is only persisted after the user proves
 * possession with a valid code, so a half-finished enrollment never locks an
 * account. Login enforcement lives in the auth authorize() callback and only
 * activates once mfaSecret is set.
 */
export const mfaRouter = createTRPCRouter({
  status: protectedProcedure.query(async ({ ctx }) => {
    const user = await adminDb.query.users.findFirst({ where: eq(users.id, ctx.user.id) });
    return { enabled: Boolean(user?.mfaSecret) };
  }),

  beginEnrollment: protectedProcedure.mutation(async ({ ctx }) => {
    const secret = generateTotpSecret();
    const account = ctx.user.email ?? ctx.user.id;
    return { secret, otpauthUri: totpAuthUri(secret, account) };
  }),

  confirmEnrollment: protectedProcedure
    .input(z.object({ secret: z.string().min(16), code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code") }))
    .mutation(async ({ ctx, input }) => {
      if (!verifyTotp(input.secret, input.code)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "That code is incorrect. Please try again." });
      }
      await adminDb.update(users).set({ mfaSecret: input.secret }).where(eq(users.id, ctx.user.id));
      return { ok: true };
    }),

  disable: protectedProcedure
    .input(z.object({ code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code") }))
    .mutation(async ({ ctx, input }) => {
      const user = await adminDb.query.users.findFirst({ where: eq(users.id, ctx.user.id) });
      if (!user?.mfaSecret) return { ok: true };
      if (!verifyTotp(user.mfaSecret, input.code)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "That code is incorrect." });
      }
      await adminDb.update(users).set({ mfaSecret: null }).where(eq(users.id, ctx.user.id));
      return { ok: true };
    }),
});
