import { describe, it, expect } from "vitest";
import { orchestratePayrollRun, applyDeductionCaps, computeProrationFactor } from "../orchestrator";
import type { EmployeeContext } from "../types";

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

describe("orchestratePayrollRun", () => {
  it("calculates payslips for all employees", () => {
    const result = orchestratePayrollRun({
      payrollRunId: "run-1",
      employees: [emp("e1"), emp("e2")],
    });

    expect(result.payslips).toHaveLength(2);
    expect(result.totalAmount).toBeGreaterThan(0);
  });

  it("applies overtime and deductions", () => {
    const result = orchestratePayrollRun({
      payrollRunId: "run-1",
      employees: [emp("e1")],
      overtime: { e1: 1000 },
      deductions: { e1: 500 },
    });

    const slip = result.payslips[0];
    expect(slip?.overtime).toBe(1000);
    expect(slip?.deductions).toBe(500);
  });

  it("calculates net pay as gross minus GOSI and deductions", () => {
    const result = orchestratePayrollRun({
      payrollRunId: "run-1",
      employees: [emp("e1", { salaryBasic: 10000, salaryHousing: 0, salaryTransport: 0 })],
    });

    const slip = result.payslips[0];
    // Gross = 10000. GOSI employee = pension (9% × 10000) + SANED (0.75% × 10000) = 975
    expect(slip?.gosiEmployee).toBeGreaterThan(0);
    expect(slip?.netPay).toBe(10000 - (slip?.gosiEmployee ?? 0));
  });

  it("returns empty payslips for no employees", () => {
    const result = orchestratePayrollRun({
      payrollRunId: "run-1",
      employees: [],
    });

    expect(result.payslips).toHaveLength(0);
    expect(result.totalAmount).toBe(0);
  });

  it("runs consistency checks", () => {
    const result = orchestratePayrollRun({
      payrollRunId: "run-1",
      employees: [emp("e1")],
    });

    expect(result.checks.length).toBeGreaterThan(0);
  });

  // ── Statutory deduction caps (Art 92/93) ──────────────────────────────────

  it("PAY-001: total deductions capped at 50% of wage", () => {
    // wage = 10000; deductions 5400 → capped at 5000
    const caps = applyDeductionCaps(10000, 0, 5400);
    expect(caps.appliedTotal).toBe(5000);
    expect(caps.totalCapped).toBe(true);
  });

  it("PAY-002: employer-loan deduction capped at 10% of wage", () => {
    // wage = 10000; loan 3000 → capped at 1000
    const caps = applyDeductionCaps(10000, 3000, 0);
    expect(caps.appliedLoan).toBe(1000);
    expect(caps.appliedTotal).toBe(1000);
    expect(caps.loanCapped).toBe(true);
  });

  it("caps flow through payroll: net pay never drops below the 50% floor for deductions", () => {
    // wage 10000 (basic only), request 8000 general deduction → applied 5000
    const result = orchestratePayrollRun({
      payrollRunId: "run-1",
      employees: [emp("e1", { salaryBasic: 10000, salaryHousing: 0, salaryTransport: 0 })],
      deductions: { e1: 8000 },
    });
    const slip = result.payslips[0];
    expect(slip?.deductions).toBe(5000); // capped from 8000
    // net = 10000 - gosiEmployee - 5000 (not - 8000)
    expect(slip?.netPay).toBe(10000 - (slip?.gosiEmployee ?? 0) - 5000);
  });

  it("loan keeps its 10% room, other deductions fill the rest under 50%", () => {
    // wage 10000; loan 1000 (=10%), other 9000 → other room = 5000-1000 = 4000
    const caps = applyDeductionCaps(10000, 1000, 9000);
    expect(caps.appliedLoan).toBe(1000);
    expect(caps.appliedOther).toBe(4000);
    expect(caps.appliedTotal).toBe(5000);
  });

  // ── Mid-month proration (Art 88 day count) ────────────────────────────────

  it("PAY-004: joiner on 15 Jul is paid 17/31 of the month", () => {
    expect(computeProrationFactor("2026-07-01", "2026-07-15", null)).toBeCloseTo(17 / 31, 6);
    const result = orchestratePayrollRun({
      payrollRunId: "run-1",
      periodDate: "2026-07-01",
      employees: [emp("e1", {
        salaryBasic: 12000, salaryHousing: 0, salaryTransport: 0,
        hireDate: "2026-07-15",
      })],
    });
    const slip = result.payslips[0];
    expect(slip?.basic).toBeCloseTo(6580.65, 1); // 12000 × 17/31
  });

  it("PAY-005: leaver on 15 Jul is paid 15/31 of the month", () => {
    expect(computeProrationFactor("2026-07-01", "2020-01-01", "2026-07-15")).toBeCloseTo(15 / 31, 6);
    const result = orchestratePayrollRun({
      payrollRunId: "run-1",
      periodDate: "2026-07-01",
      employees: [emp("e1", {
        salaryBasic: 12000, salaryHousing: 0, salaryTransport: 0,
        lastWorkingDay: "2026-07-15",
      })],
    });
    const slip = result.payslips[0];
    expect(slip?.basic).toBeCloseTo(5806.45, 1); // 12000 × 15/31
  });

  it("PAY-009: GOSI is prorated for a mid-month joiner", () => {
    const full = orchestratePayrollRun({
      payrollRunId: "run-1",
      periodDate: "2026-07-01",
      employees: [emp("e1", { salaryBasic: 15000, salaryHousing: 5000, salaryTransport: 0, gosiRegistrationDate: "2020-01-01" })],
    });
    const partial = orchestratePayrollRun({
      payrollRunId: "run-1",
      periodDate: "2026-07-01",
      employees: [emp("e1", { salaryBasic: 15000, salaryHousing: 5000, salaryTransport: 0, gosiRegistrationDate: "2020-01-01", hireDate: "2026-07-15" })],
    });
    // Existing-system full month employee GOSI = 1950; partial should be ~17/31 of it
    expect(full.payslips[0]?.gosiEmployee).toBe(1950);
    expect(partial.payslips[0]?.gosiEmployee).toBeCloseTo(1950 * 17 / 31, 0);
  });

  it("full-month employee is unaffected by proration (factor = 1)", () => {
    expect(computeProrationFactor("2026-07-01", "2020-01-01", null)).toBe(1);
  });
});
