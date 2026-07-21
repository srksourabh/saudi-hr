import { describe, it, expect } from "vitest";
import { calculateAccrual, runMonthlyAccrual, runAnnualAccrual, toLeaveTypeContext, toEmployeeContext, toLeaveBalanceContext } from "..";
import type { LeaveTypeContext, EmployeeContext, LeaveBalanceContext, AccrualConfig } from "../types";

function leaveType(id: string, name: string, daysAllowed: number, rules: LeaveTypeContext["rules"] = null): LeaveTypeContext {
  return { id, name, daysAllowed, rules };
}

function employee(id: string, hireDate: string, status = "active"): EmployeeContext {
  return { id, fullName: `Employee ${id}`, hireDate, employmentStatus: status };
}


describe("calculateAccrual", () => {
  const baseConfig: AccrualConfig = {
    effectiveDate: new Date("2024-06-15"),
    runForYear: 2024,
  };

  it("accrues full days for annual leave with annual frequency", () => {
    const lt = leaveType("lt1", "Annual", 30, { accrualFrequency: "annual" });
    const emp = employee("e1", "2020-01-01");
    const result = calculateAccrual(lt, emp, null, baseConfig);
    expect(result.daysAccrued).toBe(30);
    expect(result.newBalance).toBe(30);
  });

  it("returns zero for inactive employee", () => {
    const lt = leaveType("lt1", "Annual", 30);
    const emp = employee("e1", "2020-01-01", "terminated");
    const result = calculateAccrual(lt, emp, null, baseConfig);
    expect(result.daysAccrued).toBe(0);
  });

  it("returns zero during probation", () => {
    const lt = leaveType("lt1", "Annual", 30, { probationMonths: 3 });
    const emp = employee("e1", "2024-05-01"); // hired 1.5 months ago
    const result = calculateAccrual(lt, emp, null, baseConfig);
    expect(result.daysAccrued).toBe(0);
  });

  it("adds tenure bonus after threshold years", () => {
    const lt = leaveType("lt1", "Annual", 30, { accrualFrequency: "annual", tenureBonusYears: 5, tenureBonusDays: 5 });
    const emp = employee("e1", "2018-01-01"); // 6 years tenure
    const result = calculateAccrual(lt, emp, null, baseConfig);
    expect(result.daysAccrued).toBe(35); // 30 + 5
  });

  it("respects carryOverMax for existing balances", () => {
    const lt = leaveType("lt1", "Annual", 30, { accrualFrequency: "annual", carryOverMax: 10 });
    const emp = employee("e1", "2020-01-01");
    const existing = { id: "e1-lt1-2024", employeeId: "e1", leaveTypeId: "lt1", balance: 20, year: 2024 };
    const result = calculateAccrual(lt, emp, existing, baseConfig);
    expect(result.newBalance).toBe(40); // 10 (capped carry over) + 30
  });

  it("prorates monthly accrual for partial year", () => {
    const lt = leaveType("lt1", "Annual", 24, { accrualFrequency: "monthly" });
    const emp = employee("e1", "2024-01-01");
    const result = calculateAccrual(lt, emp, null, { effectiveDate: new Date("2024-07-15"), runForYear: 2024 });
    // 6.5 months * (24/12) = 13 days
    expect(result.daysAccrued).toBeGreaterThan(12);
    expect(result.daysAccrued).toBeLessThan(15);
  });
});

describe("runMonthlyAccrual", () => {
  it("processes all employees and leave types", () => {
    const leaveTypes = [
      leaveType("lt1", "Annual", 30),
      leaveType("lt2", "Sick", 10),
    ];
    const employees = [employee("e1", "2020-01-01"), employee("e2", "2021-01-01")];
    const existing = [{ id: "e1-lt1-2024", employeeId: "e1", leaveTypeId: "lt1", balance: 5, year: 2024 }];

    const config = { effectiveDate: new Date("2024-06-15"), runForYear: 2024 };
    const results = runMonthlyAccrual(leaveTypes, employees, existing, config);

    expect(results.length).toBe(4); // 2 employees * 2 leave types
    expect(results.every((r) => r.daysAccrued >= 0)).toBe(true);
  });

  it("processes inactive employees with zero accrual", () => {
    const leaveTypes = [leaveType("lt1", "Annual", 30)];
    const employees = [employee("e1", "2020-01-01", "active"), employee("e2", "2021-01-01", "terminated")];

    const config = { effectiveDate: new Date("2024-06-15"), runForYear: 2024 };
    const results = runMonthlyAccrual(leaveTypes, employees, [], config);

    // Both employees processed, but terminated gets 0 accrual
    expect(results.length).toBe(2);
    expect(results.find((r) => r.employeeId === "e2")?.daysAccrued).toBe(0);
  });

  it("applies carryOverMax to existing balances", () => {
    const leaveTypes = [leaveType("lt1", "Annual", 30, { carryOverMax: 10 })];
    const employees = [employee("e1", "2020-01-01")];
    const existing = [{ id: "e1-lt1-2024", employeeId: "e1", leaveTypeId: "lt1", balance: 20, year: 2024 }];

    const config = { effectiveDate: new Date("2024-12-31"), runForYear: 2024 };
    const results = runMonthlyAccrual(leaveTypes, employees, existing, config);

    const result = results[0];
    expect(result?.previousBalance).toBe(20);
    expect(result?.newBalance).toBe(40); // 10 (capped carry over) + 30
  });

  it("BIZ-007: repeated monthly runs do not compound the balance", () => {
    const leaveTypes = [leaveType("lt1", "Annual", 24, { accrualFrequency: "monthly" })];
    const employees = [employee("e1", "2020-01-01")];
    const config = { effectiveDate: new Date("2024-07-15"), runForYear: 2024 };

    const first = runMonthlyAccrual(leaveTypes, employees, [], config);
    const firstBalance = first[0]!.newBalance;

    // Feed the first run's balance back in, exactly as the monthly cron would.
    const existing = [{ id: "e1-lt1-2024", employeeId: "e1", leaveTypeId: "lt1", balance: firstBalance, year: 2024 }];
    const second = runMonthlyAccrual(leaveTypes, employees, existing, config);
    expect(second[0]!.newBalance).toBe(firstBalance);
  });
});

describe("runAnnualAccrual", () => {
  it("delegates to monthly accrual", () => {
    const leaveTypes = [leaveType("lt1", "Annual", 30)];
    const employees = [employee("e1", "2020-01-01")];
    const existing: LeaveBalanceContext[] = [];

    const config = { effectiveDate: new Date("2024-12-31"), runForYear: 2024 };
    const results = runAnnualAccrual(leaveTypes, employees, existing, config);

    expect(results.length).toBe(1);
    expect(results[0]?.daysAccrued).toBe(30);
  });
});

describe("to*Context helpers", () => {
  it("converts leave type row to context", () => {
    const row = { id: "lt1", name: "Annual", daysAllowed: 30, rules: { accrualFrequency: "annual" } };
    const ctx = toLeaveTypeContext(row);
    expect(ctx.id).toBe("lt1");
    expect(ctx.daysAllowed).toBe(30);
  });

  it("converts employee row to context", () => {
    const row = { id: "e1", fullName: "John Doe", hireDate: "2020-01-01", employmentStatus: "active" };
    const ctx = toEmployeeContext(row);
    expect(ctx.fullName).toBe("John Doe");
    expect(ctx.hireDate).toBe("2020-01-01");
  });

  it("converts leave balance row to context", () => {
    const row = { employeeId: "e1", leaveTypeId: "lt1", balance: "15.5", year: 2024 };
    const ctx = toLeaveBalanceContext(row);
    expect(ctx.balance).toBe(15.5);
  });
});