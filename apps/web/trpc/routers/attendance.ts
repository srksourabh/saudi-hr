import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte, desc, sql, inArray } from "drizzle-orm";
import {
  createTRPCRouter,
  companyProcedure,
  protectedProcedure,
  requireRole,
} from "../server";
import { schema } from "@hrms-app/db";
import {
  createShiftSchema,
  updateShiftSchema,
  assignShiftSchema,
  punchInSchema,
  punchOutSchema,
  resolveExceptionSchema,
  attendanceQuerySchema,
} from "@hrms-app/validators";

async function resolveEmployeeId(ctx: any): Promise<string | null> {
  if (ctx.user.role === "employee") {
    if (ctx.user.employeeId) return ctx.user.employeeId;
    const user = await ctx.adminDb.query.users.findFirst({
      where: (users: any, { eq }: any) => eq(users.id, ctx.user.id!),
    });
    return user?.employeeId ?? null;
  }
  return null;
}

function combineDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time.length === 5 ? `${time}:00` : time}+03:00`);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export const attendanceRouter = createTRPCRouter({
  // ── Shifts ────────────────────────────────────────────────────────────
  shift: createTRPCRouter({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await ctx.db.query.shifts.findMany({
        orderBy: (shifts: any, { asc }: any) => asc(shifts.name),
      });
    }),

    create: requireRole("super_admin", "hr_manager")
      .input(createShiftSchema)
      .mutation(async ({ ctx, input }) => {
        const [shift] = await ctx.db
          .insert(schema.tenant.shifts)
          .values(input)
          .returning();
        return shift;
      }),

    update: requireRole("super_admin", "hr_manager")
      .input(z.object({ id: z.string().uuid(), data: updateShiftSchema }))
      .mutation(async ({ ctx, input }) => {
        const [shift] = await ctx.db
          .update(schema.tenant.shifts)
          .set(input.data)
          .where(eq(schema.tenant.shifts.id, input.id))
          .returning();
        return shift;
      }),

    delete: requireRole("super_admin")
      .input(z.string().uuid())
      .mutation(async ({ ctx, input }) => {
        await ctx.db
          .delete(schema.tenant.shifts)
          .where(eq(schema.tenant.shifts.id, input));
        return { success: true };
      }),
  }),

  // ── Shift assignments ────────────────────────────────────────────────
  assignment: createTRPCRouter({
    list: companyProcedure
      .input(
        z
          .object({
            employeeId: z.string().uuid().optional(),
            shiftId: z.string().uuid().optional(),
          })
          .optional()
          .default({}),
      )
      .query(async ({ ctx, input }) => {
        const conditions: ReturnType<typeof eq>[] = [];
        if (input?.employeeId)
          conditions.push(eq(schema.tenant.shiftAssignments.employeeId, input.employeeId));
        if (input?.shiftId)
          conditions.push(eq(schema.tenant.shiftAssignments.shiftId, input.shiftId));
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        return await ctx.db.query.shiftAssignments.findMany({
          where,
          with: { employee: true, shift: true },
        });
      }),

    create: requireRole("super_admin", "hr_manager", "department_manager")
      .input(assignShiftSchema)
      .mutation(async ({ ctx, input }) => {
        const [assignment] = await ctx.db
          .insert(schema.tenant.shiftAssignments)
          .values(input)
          .returning();
        return assignment;
      }),
  }),

  // ── Punch in / out ───────────────────────────────────────────────────
  punchIn: protectedProcedure
    .input(punchInSchema)
    .mutation(async ({ ctx, input }) => {
      const employeeId = await resolveEmployeeId(ctx);
      if (!employeeId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Employee profile is not linked to this login",
        });
      }
      const workDate = input.workDate ?? todayISO();
      const existing = await ctx.db.query.attendanceRecords.findFirst({
        where: and(
          eq(schema.tenant.attendanceRecords.employeeId, employeeId),
          eq(schema.tenant.attendanceRecords.workDate, workDate),
        ),
      });
      if (existing?.punchInAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already punched in for this day",
        });
      }

      const assignment = await ctx.db.query.shiftAssignments.findFirst({
        where: and(
          eq(schema.tenant.shiftAssignments.employeeId, employeeId),
          lte(schema.tenant.shiftAssignments.effectiveFrom, workDate),
        ),
        with: { shift: true },
        orderBy: desc(schema.tenant.shiftAssignments.effectiveFrom),
      });

      const now = new Date();
      let lateMinutes = 0;
      let status: "present" | "late" | "remote" = "present";
      let scheduledStart: string | null = null;

      if (assignment?.shift) {
        scheduledStart = assignment.shift.startTime;
        const scheduledDateTime = combineDateTime(workDate, assignment.shift.startTime);
        const grace = assignment.shift.graceMinutes ?? 0;
        if (now.getTime() > scheduledDateTime.getTime() + grace * 60_000) {
          lateMinutes = Math.floor((now.getTime() - scheduledDateTime.getTime()) / 60_000);
          status = "late";
        }
      }
      if (input.workLocation && input.workLocation.toLowerCase().includes("remote")) {
        status = "remote";
      }

      if (existing) {
        const [record] = await ctx.db
          .update(schema.tenant.attendanceRecords)
          .set({
            punchInAt: now,
            lateMinutes,
            status,
            scheduledStart,
            workLocation: input.workLocation ?? existing.workLocation,
            notes: input.notes ?? existing.notes,
            shiftId: assignment?.shiftId ?? existing.shiftId,
          })
          .where(eq(schema.tenant.attendanceRecords.id, existing.id))
          .returning();
        return record;
      }

      const [record] = await ctx.db
        .insert(schema.tenant.attendanceRecords)
        .values({
          employeeId,
          workDate,
          punchInAt: now,
          status,
          lateMinutes,
          scheduledStart,
          workLocation: input.workLocation,
          notes: input.notes,
          shiftId: assignment?.shiftId ?? null,
        })
        .returning();
      return record;
    }),

  punchOut: protectedProcedure
    .input(punchOutSchema)
    .mutation(async ({ ctx, input }) => {
      const employeeId = await resolveEmployeeId(ctx);
      if (!employeeId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Employee profile is not linked to this login",
        });
      }
      const workDate = input.workDate ?? todayISO();
      const existing = await ctx.db.query.attendanceRecords.findFirst({
        where: and(
          eq(schema.tenant.attendanceRecords.employeeId, employeeId),
          eq(schema.tenant.attendanceRecords.workDate, workDate),
        ),
        with: { shift: true },
      });
      if (!existing?.punchInAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot punch out without a punch in for this day",
        });
      }
      if (existing.punchOutAt) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already punched out for this day",
        });
      }

      const now = new Date();
      const workedMinutes = Math.max(
        0,
        Math.floor((now.getTime() - existing.punchInAt.getTime()) / 60_000),
      );

      let overtimeMinutes = 0;
      let earlyLeaveMinutes = 0;
      let status = existing.status;
      const breakMinutes = existing.shift?.breakMinutes ?? 60;

      const netMinutes = Math.max(0, workedMinutes - breakMinutes);

      if (existing.scheduledEnd) {
        const scheduledEndDate = combineDateTime(workDate, existing.scheduledEnd);
        if (now.getTime() > scheduledEndDate.getTime()) {
          overtimeMinutes = Math.floor((now.getTime() - scheduledEndDate.getTime()) / 60_000);
        } else if (now.getTime() < scheduledEndDate.getTime()) {
          earlyLeaveMinutes = Math.floor(
            (scheduledEndDate.getTime() - now.getTime()) / 60_000,
          );
        }
      }

      if (netMinutes > 0 && netMinutes < 240 && status !== "late") {
        status = "half_day";
      }

      const [record] = await ctx.db
        .update(schema.tenant.attendanceRecords)
        .set({
          punchOutAt: now,
          workedMinutes,
          overtimeMinutes,
          earlyLeaveMinutes,
          status,
          workLocation: input.workLocation ?? existing.workLocation,
          notes: input.notes ?? existing.notes,
        })
        .where(eq(schema.tenant.attendanceRecords.id, existing.id))
        .returning();
      return record;
    }),

  // ── Today's status for the current user (employee self-service) ─────
  today: protectedProcedure.query(async ({ ctx }) => {
    const employeeId = await resolveEmployeeId(ctx);
    if (!employeeId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Employee profile is not linked to this login",
      });
    }
    const workDate = todayISO();
    const record = await ctx.db.query.attendanceRecords.findFirst({
      where: and(
        eq(schema.tenant.attendanceRecords.employeeId, employeeId),
        eq(schema.tenant.attendanceRecords.workDate, workDate),
      ),
      with: { shift: true, exceptions: true },
    });
    const assignment = await ctx.db.query.shiftAssignments.findFirst({
      where: and(
        eq(schema.tenant.shiftAssignments.employeeId, employeeId),
        lte(schema.tenant.shiftAssignments.effectiveFrom, workDate),
      ),
      with: { shift: true },
      orderBy: desc(schema.tenant.shiftAssignments.effectiveFrom),
    });
    return { record, assignment };
  }),

  // ── Self-service history for an employee ─────────────────────────────
  myHistory: protectedProcedure
    .input(
      z
        .object({
          from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
          to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        })
        .optional()
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const employeeId = await resolveEmployeeId(ctx);
      if (!employeeId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Employee profile is not linked to this login",
        });
      }
      const conditions: ReturnType<typeof eq>[] = [
        eq(schema.tenant.attendanceRecords.employeeId, employeeId),
      ];
      if (input?.from) conditions.push(gte(schema.tenant.attendanceRecords.workDate, input.from));
      if (input?.to) conditions.push(lte(schema.tenant.attendanceRecords.workDate, input.to));
      const where = and(...conditions);
      return await ctx.db.query.attendanceRecords.findMany({
        where,
        with: { shift: true, exceptions: true },
        orderBy: desc(schema.tenant.attendanceRecords.workDate),
        limit: 60,
      });
    }),

  // ── Monthly summary for the current user ─────────────────────────────
  myMonthlySummary: protectedProcedure
    .input(z.object({ month: z.string().regex(/^\d{4}-\d{2}$/) }))
    .query(async ({ ctx, input }) => {
      const employeeId = await resolveEmployeeId(ctx);
      if (!employeeId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Employee profile is not linked to this login",
        });
      }
      const from = `${input.month}-01`;
      const lastDay = new Date(
        Number(input.month.slice(0, 4)),
        Number(input.month.slice(5, 7)),
        0,
      )
        .toISOString()
        .slice(0, 10);
      const records = await ctx.db.query.attendanceRecords.findMany({
        where: and(
          eq(schema.tenant.attendanceRecords.employeeId, employeeId),
          gte(schema.tenant.attendanceRecords.workDate, from),
          lte(schema.tenant.attendanceRecords.workDate, lastDay),
        ),
      });
      const summary = {
        totalDays: records.length,
        present: 0,
        late: 0,
        absent: 0,
        onLeave: 0,
        remote: 0,
        halfDay: 0,
        weekend: 0,
        holiday: 0,
        totalWorkedMinutes: 0,
        totalOvertimeMinutes: 0,
        totalLateMinutes: 0,
      };
      for (const r of records) {
        summary.totalWorkedMinutes += r.workedMinutes;
        summary.totalOvertimeMinutes += r.overtimeMinutes;
        summary.totalLateMinutes += r.lateMinutes;
        switch (r.status) {
          case "present": summary.present++; break;
          case "late": summary.late++; break;
          case "absent": summary.absent++; break;
          case "on_leave": summary.onLeave++; break;
          case "remote": summary.remote++; break;
          case "half_day": summary.halfDay++; break;
          case "weekend": summary.weekend++; break;
          case "holiday": summary.holiday++; break;
        }
      }
      return { month: input.month, summary, records };
    }),

  // ── HR / manager view: every employee's day ─────────────────────────
  list: companyProcedure
    .input(attendanceQuerySchema.optional().default({}))
    .query(async ({ ctx, input }) => {
      const conditions: ReturnType<typeof eq>[] = [];
      if (input?.employeeId)
        conditions.push(eq(schema.tenant.attendanceRecords.employeeId, input.employeeId));
      if (input?.departmentId) {
        const empIds = await ctx.db
          .select({ id: schema.tenant.employees.id })
          .from(schema.tenant.employees)
          .where(eq(schema.tenant.employees.departmentId, input.departmentId));
        conditions.push(
          inArray(
            schema.tenant.attendanceRecords.employeeId,
            empIds.map((e: { id: string }) => e.id),
          ),
        );
      }
      if (input?.status)
        conditions.push(eq(schema.tenant.attendanceRecords.status, input.status));
      if (input?.from) conditions.push(gte(schema.tenant.attendanceRecords.workDate, input.from));
      if (input?.to) conditions.push(lte(schema.tenant.attendanceRecords.workDate, input.to));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return await ctx.db.query.attendanceRecords.findMany({
        where,
        with: { employee: { with: { department: true } }, shift: true, exceptions: true },
        orderBy: desc(schema.tenant.attendanceRecords.workDate),
        limit: 200,
      });
    }),

  // ── Aggregated monthly stats for HR ─────────────────────────────────
  monthlyReport: companyProcedure
    .input(
      z.object({
        month: z.string().regex(/^\d{4}-\d{2}$/),
        departmentId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const from = `${input.month}-01`;
      const lastDay = new Date(
        Number(input.month.slice(0, 4)),
        Number(input.month.slice(5, 7)),
        0,
      )
        .toISOString()
        .slice(0, 10);
      const employees = await ctx.db.query.employees.findMany({
        where: input.departmentId
          ? eq(schema.tenant.employees.departmentId, input.departmentId)
          : undefined,
        with: { department: true },
      });
      const empIds = employees.map((e: { id: string }) => e.id);
      if (empIds.length === 0) return { month: input.month, employees: [] as any[] };
      const records = await ctx.db.query.attendanceRecords.findMany({
        where: and(
          inArray(schema.tenant.attendanceRecords.employeeId, empIds),
          gte(schema.tenant.attendanceRecords.workDate, from),
          lte(schema.tenant.attendanceRecords.workDate, lastDay),
        ),
      });
      const grouped = new Map<string, typeof records>();
      for (const r of records) {
        const arr = grouped.get(r.employeeId) ?? [];
        arr.push(r);
        grouped.set(r.employeeId, arr);
      }
      const employees_report = employees.map((e: { id: string; fullName: string; department: { name: string } | null }) => {
        const list = grouped.get(e.id) ?? [];
        const summary = {
          present: 0,
          late: 0,
          absent: 0,
          onLeave: 0,
          remote: 0,
          halfDay: 0,
          totalWorkedMinutes: 0,
          totalOvertimeMinutes: 0,
          totalLateMinutes: 0,
          exceptions: 0,
        };
        for (const r of list) {
          summary.totalWorkedMinutes += r.workedMinutes;
          summary.totalOvertimeMinutes += r.overtimeMinutes;
          summary.totalLateMinutes += r.lateMinutes;
          switch (r.status) {
            case "present": summary.present++; break;
            case "late": summary.late++; break;
            case "absent": summary.absent++; break;
            case "on_leave": summary.onLeave++; break;
            case "remote": summary.remote++; break;
            case "half_day": summary.halfDay++; break;
          }
        }
        return {
          employeeId: e.id,
          fullName: e.fullName,
          department: e.department?.name ?? null,
          summary,
        };
      });
      return { month: input.month, employees: employees_report };
    }),

  // ── Exception queue for HR ──────────────────────────────────────────
  exceptions: companyProcedure
    .input(
      z
        .object({
          status: z.enum(["open", "acknowledged", "resolved", "waived"]).optional(),
        })
        .optional()
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      const conditions: ReturnType<typeof eq>[] = [];
      if (input?.status)
        conditions.push(eq(schema.tenant.attendanceExceptions.status, input.status));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      return await ctx.db.query.attendanceExceptions.findMany({
        where,
        with: {
          employee: true,
          record: true,
        },
        orderBy: desc(schema.tenant.attendanceExceptions.createdAt),
        limit: 100,
      });
    }),

  resolveException: requireRole("super_admin", "hr_manager", "department_manager")
    .input(resolveExceptionSchema)
    .mutation(async ({ ctx, input }) => {
      const [exc] = await ctx.db
        .update(schema.tenant.attendanceExceptions)
        .set({
          status: input.status,
          resolutionNotes: input.resolutionNotes,
          resolvedByUserId: ctx.user.id,
          resolvedAt: new Date(),
        })
        .where(eq(schema.tenant.attendanceExceptions.id, input.id))
        .returning();
      return exc;
    }),
});
