import { z } from "zod";
import { createTRPCRouter, companyProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { eq, count, asc } from "drizzle-orm";

export const createDesignationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  code: z.string().optional(),
  description: z.string().optional(),
});

export const updateDesignationSchema = createDesignationSchema.partial();

export const designationRouter = createTRPCRouter({
  list: companyProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.designations.findMany({
      orderBy: (designations: any, { asc }: any) => asc(designations.title),
    });
  }),

  count: companyProcedure.query(async ({ ctx }) => {
    const [result] = await ctx.db
      .select({ value: count() })
      .from(schema.tenant.designations);
    return result?.value ?? 0;
  }),

  getById: companyProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    return await ctx.db.query.designations.findFirst({
      where: eq(schema.tenant.designations.id, input),
      with: { employees: true },
    });
  }),

  create: requireRole("super_admin", "hr_manager", "hr_specialist")
    .input(createDesignationSchema)
    .mutation(async ({ ctx, input }) => {
      const [designation] = await ctx.db.insert(schema.tenant.designations).values(input).returning();
      return designation;
    }),

  update: requireRole("super_admin", "hr_manager", "hr_specialist")
    .input(z.object({ id: z.string().uuid(), data: updateDesignationSchema }))
    .mutation(async ({ ctx, input }) => {
      const [designation] = await ctx.db
        .update(schema.tenant.designations)
        .set(input.data)
        .where(eq(schema.tenant.designations.id, input.id))
        .returning();
      return designation;
    }),

  delete: requireRole("super_admin", "hr_manager", "hr_specialist")
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      const assignedEmployee = await ctx.db.query.employees.findFirst({
        where: eq(schema.tenant.employees.designationId, input),
      });
      if (assignedEmployee) {
        throw new Error("Cannot delete designation assigned to active employees");
      }
      await ctx.db.delete(schema.tenant.designations).where(eq(schema.tenant.designations.id, input));
      return { success: true };
    }),
});
