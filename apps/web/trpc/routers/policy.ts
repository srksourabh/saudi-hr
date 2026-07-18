import { z } from "zod";
import { createTRPCRouter, companyProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { eq, desc } from "drizzle-orm";

const createPolicySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  category: z.enum(["hr_policy", "employee_handbook", "code_of_conduct", "anti_corruption", "health_safety", "other"]),
  version: z.string().default("1.0"),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileSize: z.string().optional(),
  mimeType: z.string().optional(),
  effectiveDate: z.string(), // YYYY-MM-DD
  expiryDate: z.string().optional(),
});

const updatePolicySchema = createPolicySchema.partial();

export const policyRouter = createTRPCRouter({
  list: companyProcedure.query(async ({ ctx }) => {
    return ctx.db.query.policyDocuments.findMany({
      orderBy: desc(schema.tenant.policyDocuments.createdAt),
      limit: 100,
    });
  }),

  getById: companyProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    return ctx.db.query.policyDocuments.findFirst({
      where: eq(schema.tenant.policyDocuments.id, input),
    });
  }),

  create: requireRole("super_admin", "hr_manager")
    .input(createPolicySchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const [row] = await ctx.db.insert(schema.tenant.policyDocuments).values({
        ...input,
        effectiveDate: input.effectiveDate,
        createdBy: userId,
      }).returning();
      return row;
    }),

  update: requireRole("super_admin", "hr_manager")
    .input(z.object({ id: z.string().uuid(), data: updatePolicySchema }))
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db.update(schema.tenant.policyDocuments)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(schema.tenant.policyDocuments.id, input.id))
        .returning();
      return row;
    }),

  delete: requireRole("super_admin", "hr_manager")
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(schema.tenant.policyDocuments)
        .where(eq(schema.tenant.policyDocuments.id, input));
      return { success: true };
    }),
});
