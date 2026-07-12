import { z } from "zod";
import { createTRPCRouter, protectedProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { createComplianceCheckSchema, complianceQuerySchema } from "@hrms-app/validators";
import { and, eq, desc } from "drizzle-orm";

export const complianceRouter = createTRPCRouter({
  list: requireRole("super_admin", "hr_manager", "payroll_admin")
    .input(complianceQuerySchema.optional().default({}))
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input?.status) conditions.push(eq(schema.tenant.complianceChecks.status, input.status));
      if (input?.checkType) conditions.push(eq(schema.tenant.complianceChecks.checkType, input.checkType));

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;

      const [items, total] = await Promise.all([
        ctx.db.query.complianceChecks.findMany({
          where,
          with: { payrollRun: true },
          orderBy: desc(schema.tenant.complianceChecks.createdAt),
          limit: pageSize,
          offset: (page - 1) * pageSize,
        }),
        ctx.db.$count(schema.tenant.complianceChecks, where),
      ]);

      return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }),

  getById: requireRole("super_admin", "hr_manager", "payroll_admin")
    .input(z.string().uuid())
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.complianceChecks.findFirst({
        where: eq(schema.tenant.complianceChecks.id, input),
        with: { payrollRun: true },
      });
    }),

  create: requireRole("super_admin", "hr_manager", "payroll_admin")
    .input(createComplianceCheckSchema)
    .mutation(async ({ ctx, input }) => {
      const [check] = await ctx.db.insert(schema.tenant.complianceChecks).values(input).returning();
      return check;
    }),

  updateStatus: requireRole("super_admin", "hr_manager")
    .input(z.object({ id: z.string().uuid(), status: z.enum(["passed", "flagged", "blocked"]), flaggedIssues: z.array(z.string()).optional() }))
    .mutation(async ({ ctx, input }) => {
      const [check] = await ctx.db
        .update(schema.tenant.complianceChecks)
        .set({ status: input.status, flaggedIssues: input.flaggedIssues ?? null })
        .where(eq(schema.tenant.complianceChecks.id, input.id))
        .returning();
      return check;
    }),
});
