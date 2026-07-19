import type { EmployeeContext, PayslipCalculation } from "./types";
import { calculateGosi } from "./gosi";
import { runConsistencyGuard } from "./consistency";
import { calculateFinalSettlement } from "./esb";
import type { CheckSeverity } from "./types";

export interface OrchestratorInput {
  payrollRunId: string;
  employees:    EmployeeContext[];
  overtime?:    Record<string, number>;
  /** General (non-loan) deductions: fines, advances, garnishments. Subject to the 50% total cap. */
  deductions?:  Record<string, number>;
  /** Employer-loan repayment portion. Subject to the 10%/month cap (Art 92) and the 50% total cap. */
  loanDeductions?: Record<string, number>;
  /** ISO date for the period being calculated (used for EOSB tenure + rate tier). */
  periodDate?:  string;
}

/**
 * Statutory deduction caps — Saudi Labour Law Articles 92 & 93:
 *   - Employer-loan repayment may not exceed 10% of the wage per month.
 *   - Total deductions may not exceed 50% of the wage.
 * Base = actual monthly wage (basic + housing + transport); GOSI statutory
 * contributions are separate and not counted against these caps.
 */
const LOAN_DEDUCTION_CAP_RATE = 0.10;
const TOTAL_DEDUCTION_CAP_RATE = 0.50;

export interface DeductionCapResult {
  appliedLoan:    number;
  appliedOther:   number;
  appliedTotal:   number;
  requestedTotal: number;
  loanCapped:     boolean;
  totalCapped:    boolean;
}

export function applyDeductionCaps(wage: number, loan: number, other: number): DeductionCapResult {
  const loanCap  = roundToHalal(wage * LOAN_DEDUCTION_CAP_RATE);
  const totalCap = roundToHalal(wage * TOTAL_DEDUCTION_CAP_RATE);

  const appliedLoan = Math.min(Math.max(0, loan), loanCap);
  // Loan keeps its 10% room first; other deductions fill whatever is left under 50%.
  const otherRoom   = Math.max(0, totalCap - appliedLoan);
  const appliedOther = Math.min(Math.max(0, other), otherRoom);

  return {
    appliedLoan,
    appliedOther,
    appliedTotal:   roundToHalal(appliedLoan + appliedOther),
    requestedTotal: roundToHalal(Math.max(0, loan) + Math.max(0, other)),
    loanCapped:     Math.max(0, loan) > loanCap,
    totalCapped:    roundToHalal(Math.max(0, loan) + Math.max(0, other)) > totalCap,
  };
}

export interface OrchestratorResult {
  payslips:   PayslipCalculation[];
  checks:     { checkType: string; status: CheckSeverity; flaggedIssues: string[] }[];
  totalAmount: number;
}

export function orchestratePayrollRun(input: OrchestratorInput): OrchestratorResult {
  const { employees, overtime = {}, deductions = {}, loanDeductions = {} } = input;
  const periodDate = input.periodDate ?? new Date().toISOString().slice(0, 10);

  const payslips: PayslipCalculation[] = employees.map((emp) => {
    // ── GOSI calculation ────────────────────────────────────────────────
    // nationality mapping: "saudi" | "expat" from schema → "saudi" | "gcc" | "expat"
    const nationality = emp.gccStatus ? "gcc" : emp.nationality;
    // Proration factor for the period (1 for a full month). Declared before
    // GOSI so a mid-month joiner/leaver's contribution is prorated too.
    const proration = computeProrationFactor(periodDate, emp.hireDate, emp.lastWorkingDay ?? null);
    const gosi = calculateGosi({
      nationality:      nationality as "saudi" | "gcc" | "expat",
      gosiRegistrationDate: emp.gosiRegistrationDate,
      salaryBasic:     emp.salaryBasic,   // full monthly base; prorated via factor below
      salaryHousing:   emp.salaryHousing,
      effectiveDate:   periodDate,
      prorationFactor: proration,
    });

    // ── Core salary components (prorated for a partial month) ────────────
    // Article-88 day-count basis: worked days / days in the period month.
    const basic          = roundToHalal(emp.salaryBasic * proration);
    const housing        = roundToHalal(emp.salaryHousing * proration);
    const transport      = roundToHalal(emp.salaryTransport * proration);
    const overtimeAmount = overtime[emp.id] ?? 0;

    // ── Statutory deduction caps (Art 92/93) ─────────────────────────────
    // Cap base is the actual monthly wage; GOSI is a separate statutory
    // contribution and is not counted against these caps.
    const wageForCaps    = basic + housing + transport;
    const caps           = applyDeductionCaps(
      wageForCaps,
      loanDeductions[emp.id] ?? 0,
      deductions[emp.id] ?? 0,
    );
    const deductionAmount = caps.appliedTotal;

    const gross           = basic + housing + transport + overtimeAmount;
    const totalDeductions = gosi.totalEmployeeCost + deductionAmount;
    const netPay          = Math.max(0, roundToHalal(gross - totalDeductions));

    // ── EOSB accrual (informational) — full award amount, not the
    // resignation-reduced figure. Updated each payroll period so HR
    // can monitor liability.
    const eosb = calculateFinalSettlement({
      hireDate:           emp.hireDate,
      terminationDate:   periodDate,
      basicSalary:       emp.salaryBasic,      // full monthly wage, not prorated
      housingAllowance:  emp.salaryHousing,
      transportAllowance: emp.salaryTransport,
      separationReason:  "termination", // assume employer-side for accrual
      completedProbation: true,
    });
    const monthlyEosbAccrual = roundToHalal(eosb.eosbAmount / Math.max(eosb.components.yearsOfService, 1) / 12);

    // Resolve which GOSI system was used (old vs new) by looking at the registration date.
    const gosiSystem: "old" | "new" | null =
      nationality === "expat" || nationality === "gcc"
        ? null
        : emp.gosiRegistrationDate && emp.gosiRegistrationDate < "2024-07-01"
          ? "old"
          : "new";

    return {
      employeeId: emp.id,
      basic,
      housing,
      transport,
      overtime: overtimeAmount,
      // Employee deduction: GOSI pension employee contribution only
      gosiEmployee: gosi.totalEmployeeCost,
      // Employer contribution: pension + occ.hazards + SANED (for audit trail)
      gosiEmployer: gosi.totalEmployerCost,
      deductions: deductionAmount,
      netPay,
      // Extended breakdown attached for display purposes
      _breakdown: {
        gross,
        gosiPensionEmployee:    gosi.pension.employee,
        gosiPensionEmployer:    gosi.pension.employer,
        gosiOccupationalHaz:    gosi.occupationalHazards.employer,
        gosiSaned:              gosi.saned.employer,
        contributoryBase:       gosi.contributoryBase,
        gosiRateEmployee:       gosi.pension.rateEmployee + (gosi.occupationalHazards.rateEmployee + gosi.saned.rateEmployee),
        gosiRateEmployer:       gosi.pension.rateEmployer + gosi.occupationalHazards.rateEmployer + gosi.saned.rateEmployer,
        gosiSystem,
        nationality:            gosi.nationality,
        eosbAccrued:            monthlyEosbAccrual,
        eosbYearsOfService:     eosb.components.yearsOfService,
        eosbFullAmount:         eosb.eosbAmount,
        // Statutory deduction caps (Art 92/93)
        deductionLoanApplied:   caps.appliedLoan,
        deductionOtherApplied:  caps.appliedOther,
        deductionRequested:     caps.requestedTotal,
        deductionLoanCapped:    caps.loanCapped,
        deductionTotalCapped:   caps.totalCapped,
      },
    };
  });

  const totalAmount = roundToHalal(
    payslips.reduce((sum, p) => sum + p.netPay, 0)
  );

  const checks = runConsistencyGuard({
    payslips,
    employees,
    totalAmount,
    payrollRunId: input.payrollRunId,
  });

  return { payslips, checks, totalAmount };
}

function roundToHalal(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Fraction of the period month the employee actually worked, using the
 * worked-days / days-in-month basis (Article 88 day count).
 *   - Joiner mid-month: from the hire day to month-end.
 *   - Leaver mid-month: from month-start to the last working day.
 *   - Joined and left in the same month: the inclusive span.
 * Returns 1 for a full month, 0 if the employee was not employed in the period.
 */
export function computeProrationFactor(
  periodDate: string,
  hireDate: string,
  lastWorkingDay: string | null,
): number {
  const period = new Date(periodDate);
  const year = period.getUTCFullYear();
  const month = period.getUTCMonth(); // 0-based
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const dayOf = (iso: string): number => {
    const d = new Date(iso);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };
  const monthStart = Date.UTC(year, month, 1);
  const monthEnd   = Date.UTC(year, month, daysInMonth);

  // First worked day of the month
  let firstDay = 1;
  const hireMs = dayOf(hireDate);
  if (hireMs > monthEnd) return 0;                    // not yet joined
  if (hireMs >= monthStart) firstDay = new Date(hireDate).getUTCDate();

  // Last worked day of the month
  let lastDay = daysInMonth;
  if (lastWorkingDay) {
    const lwMs = dayOf(lastWorkingDay);
    if (lwMs < monthStart) return 0;                  // already left
    if (lwMs <= monthEnd) lastDay = new Date(lastWorkingDay).getUTCDate();
  }

  const worked = lastDay - firstDay + 1;
  if (worked <= 0) return 0;
  if (worked >= daysInMonth) return 1;
  return worked / daysInMonth;
}
