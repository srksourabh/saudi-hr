import type { EmployeeContext } from "./types";

export function calculateEsb(employee: EmployeeContext): number {
  const totalSalary = employee.salaryBasic + employee.salaryHousing + employee.salaryTransport;
  const yearsOfService = calculateYearsOfService(employee.hireDate);

  if (yearsOfService <= 0) return 0;

  const fullYears = Math.floor(yearsOfService);

  if (fullYears <= 5) {
    return roundToHalal((totalSalary / 2) * fullYears);
  }

  const firstFive = (totalSalary / 2) * 5;
  const remaining = totalSalary * (fullYears - 5);

  return roundToHalal(firstFive + remaining);
}

function calculateYearsOfService(hireDate: string): number {
  const hire = new Date(hireDate);
  const now = new Date();
  const diffMs = now.getTime() - hire.getTime();
  return diffMs / (1000 * 60 * 60 * 24 * 365.25);
}

function roundToHalal(value: number): number {
  return Math.round(value * 100) / 100;
}
