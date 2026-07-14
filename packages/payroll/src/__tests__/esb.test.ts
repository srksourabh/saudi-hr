import { describe, it, expect } from "vitest";
import { calculateEsb } from "../esb";
import type { FinalSettlementInput } from "../types";

const baseInput = (overrides: Partial<FinalSettlementInput> = {}): FinalSettlementInput => ({
  hireDate:           "2020-01-01",
  terminationDate:    "2025-01-01",
  basicSalary:        10000,
  housingAllowance:   2000,
  transportAllowance: 1000,
  separationReason:   "termination",
  completedProbation: true,
  ...overrides,
});

describe("calculateEsb", () => {
  it("returns 0 for under 2 years of service", () => {
    const today = new Date().toISOString().split("T")[0]!;
    const result = calculateEsb(baseInput({
      hireDate:        today,
      terminationDate: today,
    }));
    expect(result).toBe(0);
  });

  it("calculates half-month per year for first 5 years of service", () => {
    const yearsAgo = new Date();
    yearsAgo.setFullYear(yearsAgo.getFullYear() - 3);
    const hireDate = yearsAgo.toISOString().split("T")[0]!;
    const today = new Date().toISOString().split("T")[0]!;
    const result = calculateEsb(baseInput({
      hireDate,
      terminationDate: today,
      basicSalary:     10000,
      housingAllowance: 0,
      transportAllowance: 0,
    }));
    expect(result).toBe(15000);
  });

  it("calculates full-month per year after 5 years of service", () => {
    const yearsAgo = new Date();
    yearsAgo.setFullYear(yearsAgo.getFullYear() - 8);
    const hireDate = yearsAgo.toISOString().split("T")[0]!;
    const today = new Date().toISOString().split("T")[0]!;
    const result = calculateEsb(baseInput({
      hireDate,
      terminationDate: today,
      basicSalary:     10000,
      housingAllowance: 0,
      transportAllowance: 0,
    }));
    expect(result).toBe(55000);
  });
});
