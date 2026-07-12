import type { EmployeeContext, GosiResult } from "./types";

const GOSI_MONTHLY_CAP = 45000;

interface GosiRateSet {
  employee: number;
  employer: number;
}

const GOSI_CURRENT: GosiRateSet = { employee: 0.10, employer: 0.0975 };
const GOSI_OLD: GosiRateSet = { employee: 0.09, employer: 0.09 };

export function calculateGosi(employee: EmployeeContext): GosiResult {
  if (employee.nationality === "expat") {
    return { employeeContribution: 0, employerContribution: 0 };
  }

  const wage = Math.min(
    employee.salaryBasic + employee.salaryHousing + employee.salaryTransport,
    GOSI_MONTHLY_CAP
  );

  const rates = employee.gosiSystem === "old" ? GOSI_OLD : GOSI_CURRENT;

  return {
    employeeContribution: roundToHalal(wage * rates.employee),
    employerContribution: roundToHalal(wage * rates.employer),
  };
}

function roundToHalal(value: number): number {
  return Math.round(value * 100) / 100;
}
