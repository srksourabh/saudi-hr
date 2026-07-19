export interface DocumentContext {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  fileName: string;
  fileUrl: string;
  expiryDate: string | null;
  version: string;
}

export interface ExpiryThreshold {
  days: number;
  label: string;
  severity: "info" | "warning" | "critical";
}

// Protocol NOT-002 tiers: 90 / 60 / 30 / 15 / 7 days.
export const EXPIRY_THRESHOLDS: ExpiryThreshold[] = [
  { days: 90, label: "90 days", severity: "info" },
  { days: 60, label: "60 days", severity: "warning" },
  { days: 30, label: "30 days", severity: "warning" },
  { days: 15, label: "15 days", severity: "critical" },
  { days: 7, label: "7 days", severity: "critical" },
];

export interface ExpiryAlertConfig {
  thresholds?: ExpiryThreshold[];
  includeExpired?: boolean;
  checkDate?: string;
}

export interface ExpiryAlert {
  documentId: string;
  employeeId: string;
  employeeName: string;
  documentType: string;
  fileName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  threshold: ExpiryThreshold;
}

export interface ExpiryCheckResult {
  alerts: ExpiryAlert[];
  checkedCount: number;
  expiredCount: number;
}