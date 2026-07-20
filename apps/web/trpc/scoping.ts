import { schema } from "@hrms-app/db";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

interface ScopingContext {
  db: {
    query: {
      departments: { findMany: (args: unknown) => Promise<{ id: string }[]> };
    };
  };
  user: { employeeId?: string; role: string };
}

/**
 * Department ids the current user manages. A department_manager heads the
 * department(s) whose `headEmployeeId` equals their employee id. Returns an
 * empty list when the user heads nothing (so scoped queries return nothing).
 */
export async function getManagedDepartmentIds(ctx: ScopingContext): Promise<string[]> {
  if (!ctx.user.employeeId) return [];
  const depts = await ctx.db.query.departments.findMany({
    where: eq(schema.tenant.departments.headEmployeeId, ctx.user.employeeId),
    columns: { id: true },
  });
  return depts.map((d) => d.id);
}

// ── Department-manager write scoping (SEC-013) ──────────────────────────────
// A department_manager may only write records belonging to employees in the
// department(s) they head. Company-wide roles (super_admin, hr_manager, ...)
// are unaffected. All checks are fail-closed: a manager heading nothing, or one
// targeting an out-of-scope / missing record, is denied.

interface FindOne<T> {
  findFirst: (args: unknown) => Promise<T | undefined>;
}

// Structural view of the tenant db the write-scope helpers rely on. Documents
// exactly which tables/columns each helper reads.
interface WriteScopeContext extends ScopingContext {
  db: ScopingContext["db"] & {
    query: {
      departments: { findMany: (args: unknown) => Promise<{ id: string }[]> };
      employees: FindOne<{ departmentId: string | null }>;
      goals: FindOne<{ employeeId: string }>;
      reviews: FindOne<{ employeeId: string }>;
      reviewResponses: FindOne<{ reviewId: string }>;
      attendanceExceptions: FindOne<{ employeeId: string }>;
    };
  };
}

const outOfScope = () =>
  new TRPCError({ code: "FORBIDDEN", message: "This record is outside your department scope." });

/** Assert the target employee is in a department the caller heads. */
export async function assertManagesEmployee(ctx: WriteScopeContext, employeeId: string): Promise<void> {
  if (ctx.user.role !== "department_manager") return;
  const managed = await getManagedDepartmentIds(ctx);
  if (managed.length === 0) throw outOfScope();
  const emp = await ctx.db.query.employees.findFirst({
    where: eq(schema.tenant.employees.id, employeeId),
    columns: { departmentId: true },
  });
  if (!emp?.departmentId || !managed.includes(emp.departmentId)) throw outOfScope();
}

/** Assert the goal belongs to an employee the caller manages. */
export async function assertManagesGoal(ctx: WriteScopeContext, goalId: string): Promise<void> {
  if (ctx.user.role !== "department_manager") return;
  const goal = await ctx.db.query.goals.findFirst({
    where: eq(schema.tenant.goals.id, goalId),
    columns: { employeeId: true },
  });
  if (!goal) throw new TRPCError({ code: "NOT_FOUND", message: "Goal not found." });
  await assertManagesEmployee(ctx, goal.employeeId);
}

/** Assert the review belongs to an employee the caller manages. */
export async function assertManagesReview(ctx: WriteScopeContext, reviewId: string): Promise<void> {
  if (ctx.user.role !== "department_manager") return;
  const review = await ctx.db.query.reviews.findFirst({
    where: eq(schema.tenant.reviews.id, reviewId),
    columns: { employeeId: true },
  });
  if (!review) throw new TRPCError({ code: "NOT_FOUND", message: "Review not found." });
  await assertManagesEmployee(ctx, review.employeeId);
}

/** Assert the review response's parent review belongs to a managed employee. */
export async function assertManagesReviewResponse(ctx: WriteScopeContext, responseId: string): Promise<void> {
  if (ctx.user.role !== "department_manager") return;
  const resp = await ctx.db.query.reviewResponses.findFirst({
    where: eq(schema.tenant.reviewResponses.id, responseId),
    columns: { reviewId: true },
  });
  if (!resp) throw new TRPCError({ code: "NOT_FOUND", message: "Review response not found." });
  await assertManagesReview(ctx, resp.reviewId);
}

/** Assert the attendance exception belongs to an employee the caller manages. */
export async function assertManagesException(ctx: WriteScopeContext, exceptionId: string): Promise<void> {
  if (ctx.user.role !== "department_manager") return;
  const exc = await ctx.db.query.attendanceExceptions.findFirst({
    where: eq(schema.tenant.attendanceExceptions.id, exceptionId),
    columns: { employeeId: true },
  });
  if (!exc) throw new TRPCError({ code: "NOT_FOUND", message: "Attendance exception not found." });
  await assertManagesEmployee(ctx, exc.employeeId);
}
