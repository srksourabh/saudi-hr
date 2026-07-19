import { schema } from "@hrms-app/db";
import { eq } from "drizzle-orm";

interface ScopingContext {
  db: {
    query: {
      departments: { findMany: (args: unknown) => Promise<Array<{ id: string }>> };
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
