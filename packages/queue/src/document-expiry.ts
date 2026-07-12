import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { isNotNull } from "drizzle-orm";
import { checkDocumentExpiry, type ExpiryAlertConfig, type ExpiryCheckResult } from "@hrms-app/documents";
import type { ExpiryAlertJobData, JobResult } from "./index";

import { documents, notifications } from "@hrms-app/db";

export interface DocumentExpiryServiceConfig {
  tenantId: string;
  databaseUrl: string;
}

export class DocumentExpiryService {
  private db: any;

  constructor(private config: DocumentExpiryServiceConfig) {
    const pool = new Pool({ connectionString: this.config.databaseUrl });
    this.db = drizzle(pool, { schema: { documents, notifications } });
  }

  async runExpiryCheck(jobData: ExpiryAlertJobData): Promise<JobResult> {
    const { checkDate, thresholds } = jobData;
    const targetDate = checkDate ? new Date(checkDate) : new Date();

    const docs = await this.db.query.documents.findMany({
      where: isNotNull(documents.expiryDate),
      with: { employee: true },
    });

    const config: ExpiryAlertConfig = {
      thresholds: thresholds?.map((days: number) => ({
        days,
        label: `${days} days`,
        severity: days <= 30 ? "critical" : days <= 60 ? "warning" : "info",
      })),
      includeExpired: true,
      checkDate: targetDate.toISOString().split("T")[0],
    };

    const result: ExpiryCheckResult = checkDocumentExpiry(
      docs.map(toDocumentContext),
      config
    );

    let processed = 0;
    let succeeded = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const alert of result.alerts) {
      processed++;
      try {
        await this.createNotification(alert);
        succeeded++;
      } catch (error) {
        failed++;
        errors.push(`Document ${alert.documentId}: ${error}`);
      }
    }

    return { processed, succeeded, failed, errors };
  }

  private async createNotification(alert: ExpiryCheckResult["alerts"][0]) {
    const severity = alert.threshold.severity;
    const title = `Document Expiring: ${alert.documentType}`;
    const message = `${alert.employeeName}'s ${alert.documentType} "${alert.fileName}" expires in ${alert.daysUntilExpiry} days (on ${alert.expiryDate})`;

    await this.db.insert(notifications).values({
      userId: alert.employeeId,
      channel: "in_app",
      type: "document_expiry",
      title,
      message,
      severity,
      metadata: {
        documentId: alert.documentId,
        documentType: alert.documentType,
        expiryDate: alert.expiryDate,
        daysUntilExpiry: alert.daysUntilExpiry,
      },
    });
  }

  async close() {
    // Pool cleanup handled by drizzle
  }
}

function toDocumentContext(row: typeof documents.$inferSelect & { employee: { fullName: string } }) {
  return {
    id: row.id,
    employeeId: row.employeeId,
    employeeName: row.employee?.fullName ?? "Unknown",
    type: row.type,
    fileName: row.fileName,
    fileUrl: row.fileUrl,
    expiryDate: row.expiryDate,
    version: row.version,
  };
}