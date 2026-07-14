import type { EmployeeContext, PayslipCalculation } from "./types";
import { calculateGosi } from "./gosi";
import { runConsistencyGuard } from "./consistency";
import type { CheckSeverity } from "./types";

export interface OrchestratorInput {
  payrollRunId: string;
  employees:    EmployeeContext[];
  overtime?:    Record<string, number>;
  deductions?:  Record<string, number>;
}

export interface OrchestratorResult {
  payslips:   PayslipCalculation[];
  checks:     { checkType: string; status: CheckSeverity; flaggedIssues: string[] }[];
  totalAmount: number;
}

export function orchestratePayrollRun(input: OrchestratorInput): OrchestratorResult {
  const { employees, overtime = {}, deductions = {} } = input;

  const payslips: PayslipCalculation[] = employees.map((emp) => {
    // ── GOSI calculation ────────────────────────────────────────────────
    // nationality mapping: "saudi" | "expat" from schema → "saudi" | "gcc" | "expat"
    const nationality = emp.gccStatus ? "gcc" : emp.nationality;
    const gosi = calculateGosi({
      nationality:      nationality as "saudi" | "gcc" | "expat",
      gosiRegistrationDate: emp.gosiRegistrationDate,
      salaryBasic:     emp.salaryBasic,
      salaryHousing:   emp.salaryHousing,
      effectiveDate:   new Date().toISOString().split("T")[0],
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
        gosiPensionEmployee:    gosi.pension.employee,
        gosiPensionEmployer:    gosi.pension.employer,
        gosiOccupationalHaz:    gosi.occupationalHazards.employer,
        gosiSaned:              gosi.saned.employer,
        contributoryBase:      gosi.contributoryBase,
        nationality:            gosi.nationality,
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
