export type Nationality = "saudi" | "expat";
export type GosiSystem = "old" | "new";

export interface EmployeeContext {
  id: string;
  fullName: string;
  nationality: Nationality;
  gosiSystem: GosiSystem | null;
  salaryBasic: number;
  salaryHousing: number;
  salaryTransport: number;
  hireDate: string;
  employmentStatus: string;
  bankIbanEnc: string | null;
  gosiRegistrationDate: string | null;
}

export interface GosiResult {
  employeeContribution: number;
  employerContribution: number;
}

export interface PayslipCalculation {
  employeeId: string;
  basic: number;
  housing: number;
  transport: number;
  overtime: number;
  gosiEmployee: number;
  gosiEmployer: number;
  deductions: number;
  netPay: number;
}

export type CheckSeverity = "passed" | "flagged" | "blocked";

export interface ComplianceResult {
  checkType: string;
  status: CheckSeverity;
  flaggedIssues: string[];
}
