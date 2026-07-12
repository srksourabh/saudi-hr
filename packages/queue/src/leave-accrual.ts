import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { and, eq } from "drizzle-orm";
import { runMonthlyAccrual, runAnnualAccrual, type AccrualConfig } from "@hrms-app/leave";
import type { AccrualJobData, JobResult } from "./index";

import { employees, leaveTypes, leaveBalances } from "@hrms-app/db";

export interface LeaveAccrualServiceConfig {
  tenantId: string;
  databaseUrl: string;
}

export class LeaveAccrualService {
  private db: any;

  constructor(private config: LeaveAccrualServiceConfig) {
    const pool = new Pool({ connectionString: this.config.databaseUrl });
    this.db = drizzle(pool, { schema: { employees, leaveTypes, leaveBalances } });
  }

  async runAccrual(jobData: AccrualJobData): Promise<JobResult> {
    const { frequency, effectiveDate, year } = jobData;
    const targetDate = effectiveDate ? new Date(effectiveDate) : new Date();
    const targetYear = year ?? targetDate.getFullYear();

    const cfg: AccrualConfig = {
      effectiveDate: targetDate,
      runForYear: targetYear,
    };

    const [leaveTypesList, employeesList, existingBalances] = await Promise.all([
      this.db.query.leaveTypes.findMany(),
      this.db.query.employees.findMany({
        where: eq(employees.employmentStatus, "active"),
      }),
      this.db.query.leaveBalances.findMany({
        where: eq(leaveBalances.year, targetYear),
      }),
    ]);

    const results = frequency === "annual"
      ? runAnnualAccrual(
          leaveTypesList.map(toLeaveTypeContext),
          employeesList.map(toEmployeeContext),
          existingBalances.map(toLeaveBalanceContext),
          cfg
        )
      : runMonthlyAccrual(
          leaveTypesList.map(toLeaveTypeContext),
          employeesList.map(toEmployeeContext),
          existingBalances.map(toLeaveBalanceContext),
          cfg
        );

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const result of results) {
      if (result.daysAccrued === 0) continue;
      processed++;

      try {
        if (result.created) {
          await this.db.insert(leaveBalances).values({
            employeeId: result.employeeId,
            leaveTypeId: result.leaveTypeId,
            balance: result.newBalance.toString(),
            year: result.year,
          });
        } else {
          await this.db
            .update(leaveBalances)
            .set({ balance: result.newBalance.toString() })
            .where(
              and(
                eq(leaveBalances.employeeId, result.employeeId),
                eq(leaveBalances.leaveTypeId, result.leaveTypeId),
                eq(leaveBalances.year, result.year)
              )
            );
        }
        succeeded++;
      } catch (error) {
        failed++;
        errors.push(`Employee ${result.employeeId}, leave type ${result.leaveTypeId}: ${error}`);
      }
    }

    return { processed, succeeded, failed, errors };
  }

  async close() {
    // Pool cleanup handled by drizzle
  }
}

function toLeaveTypeContext(row: typeof leaveTypes.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    daysAllowed: row.daysAllowed,
    rules: row.rules,
  };
}

function toEmployeeContext(row: typeof employees.$inferSelect) {
  return {
    id: row.id,
    fullName: row.fullName,
    hireDate: row.hireDate,
    employmentStatus: row.employmentStatus,
  };
}

function toLeaveBalanceContext(row: typeof leaveBalances.$inferSelect) {
  return {
    employeeId: row.employeeId,
    leaveTypeId: row.leaveTypeId,
    balance: typeof row.balance === "string" ? parseFloat(row.balance) : row.balance,
    year: row.year,
  };
}
