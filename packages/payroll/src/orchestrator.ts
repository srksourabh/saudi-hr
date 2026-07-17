import type { EmployeeContext, PayslipCalculation } from "./types";
import { calculateGosi } from "./gosi";
import { runConsistencyGuard } from "./consistency";
import { calculateFinalSettlement } from "./esb";
import type { CheckSeverity } from "./types";

export interface OrchestratorInput {
  payrollRunId: string;
  employees:    EmployeeContext[];
  overtime?:    Record<string, number>;
  deductions?:  Record<string, number>;
  /** ISO date for the period being calculated (used for EOSB tenure + rate tier). */
  periodDate?:  string;
}

export interface OrchestratorResult {
  payslips:   PayslipCalculation[];
  checks:     { checkType: string; status: CheckSeverity; flaggedIssues: string[] }[];
  totalAmount: number;
}

export function orchestratePayrollRun(input: OrchestratorInput): OrchestratorResult {
  const { employees, overtime = {}, deductions = {} } = input;
  const periodDate = input.periodDate ?? new Date().toISOString().slice(0, 10);

  const payslips: PayslipCalculation[] = employees.map((emp) => {
    // ── GOSI calculation ────────────────────────────────────────────────
    // nationality mapping: "saudi" | "expat" from schema → "saudi" | "gcc" | "expat"
    const nationality = emp.gccStatus ? "gcc" : emp.nationality;
    const gosi = calculateGosi({
      nationality:      nationality as "saudi" | "gcc" | "expat",
      gosiRegistrationDate: emp.gosiRegistrationDate,
      salaryBasic:     emp.salaryBasic,
      salaryHousing:   emp.salaryHousing,
      effectiveDate:   periodDate,
    });

    // ── Core salary components ──────────────────────────────────────────
    const basic          = emp.salaryBasic;
    const housing        = emp.salaryHousing;
    const transport      = emp.salaryTransport;
    const overtimeAmount = overtime[emp.id] ?? 0;
    const deductionAmount = deductions[emp.id] ?? 0;

    const gross           = basic + housing + transport + overtimeAmount;
    const totalDeductions = gosi.totalEmployeeCost + deductionAmount;
    const netPay          = Math.max(0, roundToHalal(gross - totalDeductions));

    // ── EOSB accrual (informational) — full award amount, not the
    // resignation-reduced figure. Updated each payroll period so HR
    // can monitor liability.
    const eosb = calculateFinalSettlement({
      hireDate:           emp.hireDate,
      terminationDate:   periodDate,
      basicSalary:       basic,
      housingAllowance:  housing,
      transportAllowance: transport,
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
