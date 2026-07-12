import { describe, it, expect } from "vitest";
import { runConsistencyGuard } from "../consistency";
import type { EmployeeContext, PayslipCalculation } from "../types";

const emp = (id: string, overrides: Partial<EmployeeContext> = {}): EmployeeContext => ({
  id,
  fullName: `Employee ${id}`,
  nationality: "saudi",
  gosiSystem: null,
  salaryBasic: 10000,
  salaryHousing: 2000,
  salaryTransport: 1000,
  hireDate: "2020-01-01",
  employmentStatus: "active",
  bankIbanEnc: "SA123456",
  gosiRegistrationDate: null,
  ...overrides,
});

const slip = (employeeId: string, overrides: Partial<PayslipCalculation> = {}): PayslipCalculation => ({
  employeeId,
  basic: 10000,
  housing: 2000,
  transport: 1000,
  overtime: 0,
  gosiEmployee: 1300,
  gosiEmployer: 1267.5,
  deductions: 0,
  netPay: 11700,
  ...overrides,
});

describe("runConsistencyGuard", () => {
  it("passes when all employees have payslips and totals balance", () => {
    const results = runConsistencyGuard({
      payslips: [slip("e1"), slip("e2")],
      employees: [emp("e1"), emp("e2")],
      totalAmount: 23400,
      payrollRunId: "run-1",
    });

    expect(results.every((r) => r.status === "passed")).toBe(true);
  });

  it("flags missing payslips", () => {
    const results = runConsistencyGuard({
      payslips: [slip("e1")],
      employees: [emp("e1"), emp("e2")],
      totalAmount: 11700,
      payrollRunId: "run-1",
    });

    const missingCheck = results.find((r) => r.checkType === "all_employees_covered");
    expect(missingCheck?.status).toBe("flagged");
    expect(missingCheck?.flaggedIssues?.length).toBeGreaterThan(0);
  });

  it("blocks negative net pay", () => {
    const results = runConsistencyGuard({
      payslips: [slip("e1", { netPay: -500 })],
      employees: [emp("e1")],
      totalAmount: -500,
      payrollRunId: "run-1",
    });

    const negativeCheck = results.find((r) => r.checkType === "no_negative_net_pay");
    expect(negativeCheck?.status).toBe("blocked");
  });

  it("flags missing bank IBAN", () => {
    const results = runConsistencyGuard({
      payslips: [slip("e1")],
      employees: [emp("e1", { bankIbanEnc: null })],
      totalAmount: 11700,
      payrollRunId: "run-1",
    });

    const ibanCheck = results.find((r) => r.checkType === "bank_iban_present");
    expect(ibanCheck?.status).toBe("flagged");
  });

  it("flags total amount mismatch", () => {
    const results = runConsistencyGuard({
      payslips: [slip("e1", { netPay: 10000 })],
      employees: [emp("e1")],
      totalAmount: 9999,
      payrollRunId: "run-1",
    });

    const totalCheck = results.find((r) => r.checkType === "total_amount_balanced");
    expect(totalCheck?.status).toBe("flagged");
  });
});
