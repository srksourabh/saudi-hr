import { z } from "zod";
import { createTRPCRouter, protectedProcedure, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { desc, eq } from "drizzle-orm";

export const guideMapRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.guideMaps.findMany({
      orderBy: desc(schema.tenant.guideMaps.createdAt),
      limit: 50,
    });
  }),

  getById: protectedProcedure.input(z.string().uuid()).query(async ({ ctx, input }) => {
    return await ctx.db.query.guideMaps.findFirst({
      where: eq(schema.tenant.guideMaps.id, input),
    });
  }),

  create: requireRole("super_admin", "hr_manager", "hr_specialist")
    .input(z.object({
      name: z.string().min(1).max(100),
      centerLat: z.number(),
      centerLng: z.number(),
      zoom: z.string().default("12"),
    }))
    .mutation(async ({ ctx, input }) => {
      const [map] = await ctx.db
        .insert(schema.tenant.guideMaps)
        .values({
          name: input.name,
          centerLat: String(input.centerLat),
          centerLng: String(input.centerLng),
          zoom: input.zoom,
          createdBy: ctx.user.id,
        })
        .returning();
      return map;
    }),

  delete: requireRole("super_admin", "hr_manager")
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(schema.tenant.guideMaps).where(eq(schema.tenant.guideMaps.id, input));
      return { success: true };
    }),
});
