import type { EmployeeContext, PayslipCalculation } from "./types";
import { calculateGosi } from "./gosi";
import { runConsistencyGuard } from "./consistency";
import type { CheckSeverity } from "./types";

export interface OrchestratorInput {
  payrollRunId: string;
  employees: EmployeeContext[];
  overtime?: Record<string, number>;
  deductions?: Record<string, number>;
}

export interface OrchestratorResult {
  payslips: PayslipCalculation[];
  checks: { checkType: string; status: CheckSeverity; flaggedIssues: string[] }[];
  totalAmount: number;
}

export function orchestratePayrollRun(input: OrchestratorInput): OrchestratorResult {
  const { employees, overtime = {}, deductions = {} } = input;

  const payslips: PayslipCalculation[] = employees.map((emp) => {
    const gosi = calculateGosi(emp);
    const basic = emp.salaryBasic;
    const housing = emp.salaryHousing;
    const transport = emp.salaryTransport;
    const overtimeAmount = overtime[emp.id] ?? 0;
    const deductionAmount = deductions[emp.id] ?? 0;

    const gross = basic + housing + transport + overtimeAmount;
    const totalDeductions = gosi.employeeContribution + deductionAmount;
    const netPay = Math.max(0, roundToHalal(gross - totalDeductions));

    return {
      employeeId: emp.id,
      basic,
      housing,
      transport,
      overtime: overtimeAmount,
      gosiEmployee: gosi.employeeContribution,
      gosiEmployer: gosi.employerContribution,
      deductions: deductionAmount,
      netPay,
    };
  });

  const totalAmount = payslips.reduce((sum, p) => sum + p.netPay, 0);

  const checks = runConsistencyGuard({ payslips, employees, totalAmount, payrollRunId: input.payrollRunId });

  return {
    payslips,
    checks,
    totalAmount: roundToHalal(totalAmount),
  };
}

function roundToHalal(value: number): number {
  return Math.round(value * 100) / 100;
}
