import { describe, it, expect } from "vitest";
import { calculateGosi } from "../gosi";
import type { EmployeeContext } from "../types";

const saudiEmployee = (overrides: Partial<EmployeeContext> = {}): EmployeeContext => ({
  id: "emp-1",
  fullName: "Saudi Employee",
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

describe("calculateGosi", () => {
  it("returns 0 for expat employees", () => {
    const result = calculateGosi(saudiEmployee({ nationality: "expat" }));
    expect(result).toEqual({ employeeContribution: 0, employerContribution: 0 });
  });

  it("calculates employee 10% and employer 9.75% for Saudi on current system", () => {
    const result = calculateGosi(saudiEmployee({ salaryBasic: 10000, salaryHousing: 2000, salaryTransport: 1000 }));
    expect(result.employeeContribution).toBe(1300);
    expect(result.employerContribution).toBe(1267.5);
  });

  it("calculates on (basic + housing + transport) capped at 45,000", () => {
    const result = calculateGosi(saudiEmployee({ salaryBasic: 50000, salaryHousing: 0, salaryTransport: 0 }));
    expect(result.employeeContribution).toBe(4500);
    expect(result.employerContribution).toBe(4387.5);
  });

  it("uses old rates (9% / 9%) when gosiSystem is 'old'", () => {
    const result = calculateGosi(saudiEmployee({ gosiSystem: "old", salaryBasic: 10000, salaryHousing: 0, salaryTransport: 0 }));
    expect(result.employeeContribution).toBe(900);
    expect(result.employerContribution).toBe(900);
  });
});
