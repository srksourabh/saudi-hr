import type { EmployeeContext, PayslipCalculation, ComplianceResult, CheckSeverity } from "./types";

interface GuardrailInput {
  payslips: PayslipCalculation[];
  employees: EmployeeContext[];
  totalAmount: number;
  payrollRunId: string;
}

export function runConsistencyGuard(input: GuardrailInput): ComplianceResult[] {
  const checks: ComplianceResult[] = [];

  checks.push(checkAllEmployeesHavePayslips(input));
  checks.push(checkNoNegativeNetPay(input));
  checks.push(checkTotalMatchesSum(input));
  checks.push(checkMissingBankIban(input));
  checks.push(checkGosiAnomalies(input));

  return checks;
}

function checkAllEmployeesHavePayslips(input: GuardrailInput): ComplianceResult {
  const activeEmployees = input.employees.filter((e) => e.employmentStatus === "active");
  const payslipedIds = new Set(input.payslips.map((p) => p.employeeId));
  const missing = activeEmployees.filter((e) => !payslipedIds.has(e.id));

  if (missing.length === 0) {
    return { checkType: "all_employees_covered", status: "passed", flaggedIssues: [] };
  }

  return {
    checkType: "all_employees_covered",
    status: "flagged",
    flaggedIssues: missing.map((e) => `Missing payslip for ${e.fullName} (${e.id})`),
  };
}

function checkNoNegativeNetPay(input: GuardrailInput): ComplianceResult {
  const negative = input.payslips.filter((p) => p.netPay < 0);
  if (negative.length === 0) {
    return { checkType: "no_negative_net_pay", status: "passed", flaggedIssues: [] };
  }

  return {
    checkType: "no_negative_net_pay",
    status: "blocked",
    flaggedIssues: negative.map(
      (p) => `Negative net pay for employee ${p.employeeId}: ${p.netPay}`
    ),
  };
}

function checkTotalMatchesSum(input: GuardrailInput): ComplianceResult {
  const calculatedTotal = input.payslips.reduce((sum, p) => sum + p.netPay, 0);
  const diff = Math.abs(input.totalAmount - calculatedTotal);

  if (diff < 0.01) {
    return { checkType: "total_amount_balanced", status: "passed", flaggedIssues: [] };
  }

  return {
    checkType: "total_amount_balanced",
    status: "flagged",
    flaggedIssues: [`Declared total ${input.totalAmount} differs from calculated sum ${calculatedTotal}`],
  };
}

function checkMissingBankIban(input: GuardrailInput): ComplianceResult {
  const missingIban = input.employees.filter(
    (e) => e.employmentStatus === "active" && !e.bankIbanEnc
  );

  if (missingIban.length === 0) {
    return { checkType: "bank_iban_present", status: "passed", flaggedIssues: [] };
  }

  return {
    checkType: "bank_iban_present",
    status: "flagged",
    flaggedIssues: missingIban.map(
      (e) => `No bank IBAN on file for ${e.fullName} (${e.id})`
    ),
  };
}

function checkGosiAnomalies(input: GuardrailInput): ComplianceResult {
  const anomalies = input.payslips.filter((p) => {
    const emp = input.employees.find((e) => e.id === p.employeeId);
    if (!emp || emp.nationality === "expat") return false;
    return p.gosiEmployee === 0 && p.gosiEmployer === 0;
  });

  if (anomalies.length === 0) {
    return { checkType: "gosi_calculated", status: "passed", flaggedIssues: [] };
  }

  return {
    checkType: "gosi_calculated",
    status: "flagged",
    flaggedIssues: anomalies.map(
      (p) => `Saudi employee ${p.employeeId} has zero GOSI contribution`
    ),
  };
}
