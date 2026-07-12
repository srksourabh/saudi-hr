import type { DocumentContext, ExpiryAlert, ExpiryAlertConfig, ExpiryCheckResult, ExpiryThreshold } from "./types";
import { EXPIRY_THRESHOLDS } from "./types";

export { EXPIRY_THRESHOLDS };

function parseDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1]!, 10);
  const month = parseInt(match[2]!, 10) - 1;
  const day = parseInt(match[3]!, 10);
  return new Date(year, month, day);
}

function daysUntil(targetDate: Date, fromDate: Date = new Date()): number {
  const diffMs = targetDate.getTime() - fromDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function normalizeThresholds(thresholds?: ExpiryThreshold[] | number[]): ExpiryThreshold[] {
  if (!thresholds) return EXPIRY_THRESHOLDS;
  if (thresholds.length === 0) return EXPIRY_THRESHOLDS;
  if (typeof thresholds[0] === "number") {
    return (thresholds as number[]).map((days) => ({
      days,
      label: `${days} days`,
      severity: days <= 30 ? "critical" : days <= 60 ? "warning" : "info",
    }));
  }
  return thresholds as ExpiryThreshold[];
}

export function checkDocumentExpiry(
  documents: DocumentContext[],
  config: ExpiryAlertConfig = {}
): ExpiryCheckResult {
  const thresholds = normalizeThresholds(config.thresholds);
  const includeExpired = config.includeExpired ?? true;
  const today = config.checkDate ? parseDate(config.checkDate) ?? new Date() : new Date();
  const alerts: ExpiryAlert[] = [];
  let checkedCount = 0;
  let expiredCount = 0;

  for (const doc of documents) {
    const expiryDate = doc.expiryDate;
    if (!expiryDate) continue;

    checkedCount++;
    const expiry = parseDate(expiryDate);
    if (!expiry) continue;

    const days = daysUntil(expiry, today);

    if (days < 0) {
      expiredCount++;
      if (includeExpired) {
        alerts.push({
          documentId: doc.id,
          employeeId: doc.employeeId,
          employeeName: doc.employeeName,
          documentType: doc.type,
          fileName: doc.fileName,
          expiryDate,
          daysUntilExpiry: days,
          threshold: { days: 0, label: "Expired", severity: "critical" },
        });
      }
      continue;
    }

    // Find the most specific (smallest) threshold that matches
    let matchedThreshold: ExpiryThreshold | null = null;
    for (const threshold of thresholds) {
      if (days <= threshold.days) {
        matchedThreshold = threshold;
      }
    }
    if (matchedThreshold) {
      alerts.push({
        documentId: doc.id,
        employeeId: doc.employeeId,
        employeeName: doc.employeeName,
        documentType: doc.type,
        fileName: doc.fileName,
        expiryDate,
        daysUntilExpiry: days,
        threshold: matchedThreshold,
      });
    }
  }

  return { alerts, checkedCount, expiredCount };
}

export function filterAlertsByThreshold(alerts: ExpiryAlert[], maxDays: number): ExpiryAlert[] {
  return alerts.filter((a) => a.daysUntilExpiry <= maxDays);
}

export function filterAlertsByEmployee(alerts: ExpiryAlert[], employeeId: string): ExpiryAlert[] {
  return alerts.filter((a) => a.employeeId === employeeId);
}

export function groupAlertsBySeverity(
  alerts: ExpiryAlert[]
): Record<"info" | "warning" | "critical", ExpiryAlert[]> {
  const groups: Record<"info" | "warning" | "critical", ExpiryAlert[]> = {
    info: [],
    warning: [],
    critical: [],
  };
  for (const alert of alerts) {
    groups[alert.threshold.severity].push(alert);
  }
  return groups;
}