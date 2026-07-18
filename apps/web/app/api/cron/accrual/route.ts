import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getTenantDb, adminDb } from "@hrms-app/db";
import { employees, leaveBalances } from "@hrms-app/db";
import { eq } from "drizzle-orm";
import { runMonthlyAccrual } from "@hrms-app/leave";
import type { LeaveTypeContext, EmployeeContext, LeaveBalanceContext } from "@hrms-app/leave";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetYear = new Date().getFullYear();
  let tenantsProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  try {
    const allTenants = await adminDb.query.tenants.findMany();

    for (const tenant of allTenants) {
      try {
        const tenantDb = getTenantDb(tenant.schemaName) as any;

        const leaveTypeRows = await tenantDb.query.leaveTypes.findMany();
        const employeeRows = await tenantDb.query.employees.findMany({
          where: eq(employees.employmentStatus, "active"),
        });
        const balanceRows = await tenantDb.query.leaveBalances.findMany({
          where: eq(leaveBalances.year, targetYear),
        });

        const leaveTypeContexts: LeaveTypeContext[] = leaveTypeRows.map((lt: any) => ({
          id: lt.id,
          name: lt.name,
          daysAllowed: lt.daysAllowed,
          rules: lt.rules,
        }));

        const employeeContexts: EmployeeContext[] = employeeRows.map((emp: any) => ({
          id: emp.id,
          fullName: emp.fullName,
          hireDate: emp.hireDate,
          employmentStatus: emp.employmentStatus,
        }));

        const balanceContexts: LeaveBalanceContext[] = balanceRows.map((bal: any) => ({
          id: bal.id,
          employeeId: bal.employeeId,
          leaveTypeId: bal.leaveTypeId,
          balance: Number(bal.balance),
          year: bal.year,
        }));

        const results = runMonthlyAccrual(leaveTypeContexts, employeeContexts, balanceContexts, {
          runForYear: targetYear,
        });

        const balanceMap = new Map<string, { id: string; employeeId: string; leaveTypeId: string; year: number; }>();
        for (const bal of balanceRows) {
          balanceMap.set(`${bal.employeeId}-${bal.leaveTypeId}-${bal.year}`, bal);
        }

        for (const result of results) {
          if (result.daysAccrued <= 0) continue;

          try {
            if (result.created) {
              await tenantDb.insert(leaveBalances).values({
                employeeId: result.employeeId,
                leaveTypeId: result.leaveTypeId,
                balance: String(result.newBalance),
                year: result.year,
              });
            } else {
              const key = `${result.employeeId}-${result.leaveTypeId}-${result.year}`;
              const existing = balanceMap.get(key);
              if (existing) {
                await tenantDb
                  .update(leaveBalances)
                  .set({ balance: String(result.newBalance) })
                  .where(eq(leaveBalances.id, existing.id));
              }
            }
            totalSucceeded++;
          } catch (e) {
            totalFailed++;
            errors.push(`Tenant ${tenant.companyName}: ${result.employeeId}/${result.leaveTypeId} - ${e instanceof Error ? e.message : String(e)}`);
          }
        }

        tenantsProcessed++;
      } catch (e) {
        errors.push(`Tenant ${tenant.companyName}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    errors.push(`Global: ${e instanceof Error ? e.message : String(e)}`);
  }

  return NextResponse.json({
    success: true,
    tenantsProcessed,
    totalSucceeded,
    totalFailed,
    errors,
  });
}
