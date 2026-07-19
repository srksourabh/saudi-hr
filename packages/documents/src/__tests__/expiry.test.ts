import { describe, it, expect } from "vitest";
import { checkDocumentExpiry } from "../expiry";
import { EXPIRY_THRESHOLDS } from "../types";
import type { DocumentContext, ExpiryThreshold } from "../types";

function doc(id: string, expiryDate: string | null, type = "passport"): DocumentContext {
  return {
    id,
    employeeId: "e1",
    employeeName: "John Doe",
    type,
    fileName: `${type}.pdf`,
    fileUrl: "/files/" + id,
    expiryDate,
    version: "1",
  };
}

function thresholds(days: number[]): ExpiryThreshold[] {
  return days.map((d) => ({
    days: d,
    label: `${d} days`,
    severity: d <= 30 ? "critical" : d <= 60 ? "warning" : "info",
  }));
}

describe("checkDocumentExpiry", () => {
  const checkDate = "2024-07-01";

  it("flags documents expiring within threshold", () => {
    const documents = [
      doc("d1", "2024-07-15"), // 14 days
      doc("d2", "2024-08-15"), // 45 days
      doc("d3", "2024-10-15"), // 106 days - no alert
      doc("d4", null), // no expiry
    ];

    const result = checkDocumentExpiry(documents, { checkDate, thresholds: thresholds([90, 60, 30, 15, 7]) });

    expect(result.alerts).toHaveLength(2);
    // d1 is ~14 days out → now caught by the 15-day tier (was 14).
    expect(result.alerts[0]?.threshold.days).toBe(15);
    expect(result.alerts[1]?.daysUntilExpiry).toBe(45);
    expect(result.alerts[1]?.threshold.days).toBe(60);
  });

  it("marks expired documents", () => {
    const documents = [
      doc("d1", "2024-06-15"), // already expired
    ];

    const result = checkDocumentExpiry(documents, { checkDate, includeExpired: true });

    expect(result.expiredCount).toBe(1);
    expect(result.alerts[0]?.threshold.label).toBe("Expired");
    expect(result.alerts[0]?.threshold.severity).toBe("critical");
  });

  it("excludes expired when includeExpired is false", () => {
    const documents = [doc("d1", "2024-06-15")];

    const result = checkDocumentExpiry(documents, { checkDate, includeExpired: false });

    expect(result.alerts).toHaveLength(0);
  });

  it("uses default thresholds when none provided", () => {
    const documents = [doc("d1", "2024-07-20")]; // 19 days

    const result = checkDocumentExpiry(documents, { checkDate });

    expect(result.alerts.length).toBeGreaterThan(0);
    expect(result.alerts[0]?.threshold.days).toBeLessThanOrEqual(30);
  });

  it("filters by employee", () => {
    const documents = [
      { ...doc("d1", "2024-07-15"), employeeId: "e1", employeeName: "Alice" },
      { ...doc("d2", "2024-07-15"), employeeId: "e2", employeeName: "Bob" },
    ];

    const result = checkDocumentExpiry(documents, { checkDate });
    const e1Alerts = result.alerts.filter((a) => a.employeeId === "e1");

    expect(e1Alerts).toHaveLength(1);
    expect(e1Alerts[0]?.employeeName).toBe("Alice");
  });

  it("groups alerts by severity", () => {
    const documents = [
      doc("d1", "2024-07-02"), // 1 day - critical
      doc("d2", "2024-07-15"), // 14 days - critical
      doc("d3", "2024-08-15"), // 45 days - warning
      doc("d4", "2024-09-15"), // 76 days - info
    ];

    const result = checkDocumentExpiry(documents, { checkDate, thresholds: thresholds([90, 60, 30, 15, 7]) });

    const critical = result.alerts.filter((a) => a.threshold.severity === "critical");
    const warning = result.alerts.filter((a) => a.threshold.severity === "warning");
    const info = result.alerts.filter((a) => a.threshold.severity === "info");

    expect(critical).toHaveLength(2);
    expect(warning).toHaveLength(1);
    expect(info).toHaveLength(1);
  });

  it("uses default EXPIRY_THRESHOLDS", () => {
    expect(EXPIRY_THRESHOLDS.map((t) => t.days)).toEqual([90, 60, 30, 15, 7]);
  });
});