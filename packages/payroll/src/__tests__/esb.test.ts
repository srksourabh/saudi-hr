import { describe, it, expect } from "vitest";
import { calculateEsb } from "../esb";
import type { EmployeeContext } from "../types";

const baseEmployee = (overrides: Partial<EmployeeContext> = {}): EmployeeContext => ({
  id: "emp-1",
  fullName: "Test Employee",
  nationality: "saudi",
  gosiSystem: null,
  salaryBasic: 10000,
  salaryHousing: 2000,
  salaryTransport: 1000,
  hireDate: "2020-01-01",
  employmentStatus: "active",
  bankIbanEnc: "SA123456",
  gosiRegistrationDate: "2020-01-15",
  ...overrides,
});

describe("calculateEsb", () => {
  it("returns 0 for zero years of service", () => {
    const result = calculateEsb(baseEmployee({ hireDate: new Date().toISOString().split("T")[0] }));
    expect(result).toBe(0);
  });

  it("calculates half-month per year for first 5 years", () => {
    const yearsAgo = new Date();
    yearsAgo.setFullYear(yearsAgo.getFullYear() - 3);
    const hireDate = yearsAgo.toISOString().split("T")[0];
    const result = calculateEsb(baseEmployee({ salaryBasic: 10000, salaryHousing: 0, salaryTransport: 0, hireDate }));
    expect(result).toBe(15000);
  });

  it("calculates full-month per year after 5 years", () => {
    const yearsAgo = new Date();
    yearsAgo.setFullYear(yearsAgo.getFullYear() - 8);
    const hireDate = yearsAgo.toISOString().split("T")[0];
    const result = calculateEsb(baseEmployee({ salaryBasic: 10000, salaryHousing: 0, salaryTransport: 0, hireDate }));
    expect(result).toBe(55000);
  });
});
