import type { LeaveTypeContext, EmployeeContext, LeaveBalanceContext, LeaveTypeRules, AccrualConfig, AccrualResult } from "./types";

function parseRules(rules: Record<string, unknown> | null): LeaveTypeRules {
  if (!rules) return {};
  return rules as unknown as LeaveTypeRules;
}

function getTenureYears(hireDate: string, asOfDate: Date): number {
  const hire = new Date(hireDate);
  const diffMs = asOfDate.getTime() - hire.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 365.25);
}

function isInProbation(hireDate: string, asOfDate: Date, probationMonths: number): boolean {
  const hire = new Date(hireDate);
  const probationEnd = new Date(hire);
  probationEnd.setMonth(probationEnd.getMonth() + probationMonths);
  return asOfDate < probationEnd;
}

function getMonthlyAccrual(daysAllowed: number): number {
  return daysAllowed / 12;
}

function getTenureBonus(tenureYears: number, rules: LeaveTypeRules): number {
  if (!rules.tenureBonusYears || !rules.tenureBonusDays) return 0;
  if (tenureYears >= rules.tenureBonusYears) {
    return rules.tenureBonusDays;
  }
  return 0;
}

export function calculateAccrual(
  leaveType: LeaveTypeContext,
  employee: EmployeeContext,
  existingBalance: LeaveBalanceContext | null,
  config: AccrualConfig = {}
): AccrualResult {
  const asOfDate = config.effectiveDate ?? new Date();
  const targetYear = config.runForYear ?? asOfDate.getFullYear();
  const rules = parseRules(leaveType.rules);

  const tenureYears = getTenureYears(employee.hireDate, asOfDate);

  if (employee.employmentStatus !== "active") {
    return {
      leaveTypeId: leaveType.id,
      employeeId: employee.id,
      year: targetYear,
      daysAccrued: 0,
      previousBalance: existingBalance?.balance ?? 0,
      newBalance: existingBalance?.balance ?? 0,
      created: false,
    };
  }

  if (rules.probationMonths && isInProbation(employee.hireDate, asOfDate, rules.probationMonths)) {
    return {
      leaveTypeId: leaveType.id,
      employeeId: employee.id,
      year: targetYear,
      daysAccrued: 0,
      previousBalance: existingBalance?.balance ?? 0,
      newBalance: existingBalance?.balance ?? 0,
      created: false,
    };
  }

  const frequency = rules.accrualFrequency ?? "monthly";
  const monthlyAccrual = getMonthlyAccrual(leaveType.daysAllowed);
  let daysAccrued = 0;

  if (frequency === "monthly") {
    const monthsElapsed = Math.min(12, asOfDate.getMonth() + 1);
    daysAccrued = Math.round(monthlyAccrual * monthsElapsed * 10) / 10;
  } else {
    daysAccrued = leaveType.daysAllowed;
  }

  const tenureBonus = getTenureBonus(tenureYears, rules);
  daysAccrued += tenureBonus;

  const previousBalance = existingBalance?.balance ?? 0;
  // BIZ-007: `daysAccrued` is already the year-to-date entitlement, so accrual
  // is an idempotent recompute to that target — NOT an additive step. Adding it
  // onto the same-year balance on every monthly run compounded the balance ~6.5x
  // over a year. The balance now converges to the YTD entitlement.
  let newBalance = daysAccrued;

  if (rules.carryOverMax !== undefined) {
    // Prior-year carryover, capped, plus this year's entitlement.
    const carryOver = Math.min(previousBalance, rules.carryOverMax);
    newBalance = carryOver + daysAccrued;
  }

  return {
    leaveTypeId: leaveType.id,
    employeeId: employee.id,
    year: targetYear,
    daysAccrued: Math.round(daysAccrued * 10) / 10,
    previousBalance: Math.round(previousBalance * 10) / 10,
    newBalance: Math.round(newBalance * 10) / 10,
    created: !existingBalance,
  };
}

export function runMonthlyAccrual(
  leaveTypes: LeaveTypeContext[],
  employees: EmployeeContext[],
  existingBalances: LeaveBalanceContext[],
  config: AccrualConfig = {}
): AccrualResult[] {
  const results: AccrualResult[] = [];
  const balanceMap = new Map<string, LeaveBalanceContext>();

  for (const bal of existingBalances) {
    balanceMap.set(`${bal.employeeId}-${bal.leaveTypeId}-${bal.year}`, bal);
  }

  for (const employee of employees) {
    for (const leaveType of leaveTypes) {
      const key = `${employee.id}-${leaveType.id}-${config.runForYear ?? new Date().getFullYear()}`;
      const existing = balanceMap.get(key) ?? null;
      const result = calculateAccrual(leaveType, employee, existing, config);
      results.push(result);
    }
  }

  return results;
}

export function runAnnualAccrual(
  leaveTypes: LeaveTypeContext[],
  employees: EmployeeContext[],
  existingBalances: LeaveBalanceContext[],
  config: AccrualConfig = {}
): AccrualResult[] {
  return runMonthlyAccrual(leaveTypes, employees, existingBalances, config);
}