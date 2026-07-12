import type { EmployeeContext, PayslipCalculation } from "./types";

export interface MudadEmployeeRecord {
  employeeId: string;
  fullName: string;
  iqamaNumber: string | null;
  basic: number;
  housing: number;
  transport: number;
  overtime: number;
  grossWage: number;
  gosiEmployee: number;
  gosiEmployer: number;
  netPay: number;
}

export interface MudadWageFile {
  format: "mudad";
  period: string;
  generatedAt: string;
  totalEmployees: number;
  totalWages: number;
  employees: MudadEmployeeRecord[];
}

export interface MudadGenerationInput {
  periodMonth: string;
  payslips: PayslipCalculation[];
  employees: EmployeeContext[];
}

export function generateMudadFile(input: MudadGenerationInput): MudadWageFile {
  const employeeMap = new Map(input.employees.map((e) => [e.id, e]));

  const records: MudadEmployeeRecord[] = input.payslips.map((payslip) => {
    const emp = employeeMap.get(payslip.employeeId);
    return {
      employeeId: payslip.employeeId,
      fullName: emp?.fullName ?? "Unknown",
      iqamaNumber: null,
      basic: payslip.basic,
      housing: payslip.housing,
      transport: payslip.transport,
      overtime: payslip.overtime,
      grossWage: payslip.basic + payslip.housing + payslip.transport + payslip.overtime,
      gosiEmployee: payslip.gosiEmployee,
      gosiEmployer: payslip.gosiEmployer,
      netPay: payslip.netPay,
    };
  });

  return {
    format: "mudad",
    period: input.periodMonth,
    generatedAt: new Date().toISOString(),
    totalEmployees: records.length,
    totalWages: roundToHalal(records.reduce((sum, r) => sum + r.grossWage, 0)),
    employees: records,
  };
}

export function mudadToXml(file: MudadWageFile): string {
  const rows = file.employees
    .map(
      (e) => `  <employee>
    <employeeId>${escapeXml(e.employeeId)}</employeeId>
    <fullName>${escapeXml(e.fullName)}</fullName>
    <basic>${e.basic.toFixed(2)}</basic>
    <housing>${e.housing.toFixed(2)}</housing>
    <transport>${e.transport.toFixed(2)}</transport>
    <overtime>${e.overtime.toFixed(2)}</overtime>
    <grossWage>${e.grossWage.toFixed(2)}</grossWage>
    <gosiEmployee>${e.gosiEmployee.toFixed(2)}</gosiEmployee>
    <gosiEmployer>${e.gosiEmployer.toFixed(2)}</gosiEmployer>
    <netPay>${e.netPay.toFixed(2)}</netPay>
  </employee>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<wageFile format="mudad">
  <period>${escapeXml(file.period)}</period>
  <generatedAt>${file.generatedAt}</generatedAt>
  <totalEmployees>${file.totalEmployees}</totalEmployees>
  <totalWages>${file.totalWages.toFixed(2)}</totalWages>
  <employees>
${rows}
  </employees>
</wageFile>`;
}

export function mudadToCsv(file: MudadWageFile): string {
  const header = "employeeId,fullName,basic,housing,transport,overtime,grossWage,gosiEmployee,gosiEmployer,netPay";
  const rows = file.employees.map(
    (e) =>
      `${e.employeeId},"${e.fullName}",${e.basic.toFixed(2)},${e.housing.toFixed(2)},${e.transport.toFixed(2)},${e.overtime.toFixed(2)},${e.grossWage.toFixed(2)},${e.gosiEmployee.toFixed(2)},${e.gosiEmployer.toFixed(2)},${e.netPay.toFixed(2)}`
  );
  return [header, ...rows].join("\n");
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function roundToHalal(value: number): number {
  return Math.round(value * 100) / 100;
}
