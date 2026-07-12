export interface LeaveTypeContext {
  id: string;
  name: string;
  daysAllowed: number;
  rules: Record<string, unknown> | null;
}

export interface EmployeeContext {
  id: string;
  fullName: string;
  hireDate: string;
  employmentStatus: string;
}

export interface LeaveBalanceContext {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  balance: number;
  year: number;
}

export interface LeaveTypeRules {
  accrualFrequency?: "monthly" | "annual";
  carryOverMax?: number;
  probationMonths?: number;
  tenureBonusYears?: number;
  tenureBonusDays?: number;
}

export interface AccrualConfig {
  effectiveDate?: Date;
  runForYear?: number;
}

export interface AccrualResult {
  leaveTypeId: string;
  employeeId: string;
  year: number;
  daysAccrued: number;
  previousBalance: number;
  newBalance: number;
  created: boolean;
}

export interface LeaveAccrualResult {
  employeeId: string;
  leaveTypeId: string;
  year: number;
  daysAccrued: number;
  newBalance: number;
  created: boolean;
}