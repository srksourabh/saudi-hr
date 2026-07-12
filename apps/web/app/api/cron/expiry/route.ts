import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getTenantDb, adminDb } from "@hrms-app/db";
import { documents, notifications } from "@hrms-app/db";
import { isNotNull } from "drizzle-orm";
import { checkDocumentExpiry } from "@hrms-app/documents";
import type { DocumentContext } from "@hrms-app/documents";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  let tenantsProcessed = 0;
  let totalChecked = 0;
  let totalAlertsCreated = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  try {
    const allTenants = await adminDb.query.tenants.findMany();

    for (const tenant of allTenants) {
      try {
        const tenantDb = getTenantDb(tenant.schemaName) as any;

        const docRows = await tenantDb.query.documents.findMany({
          where: isNotNull(documents.expiryDate),
          with: { employee: true },
        });

        const docContexts: DocumentContext[] = docRows.map((row: any) => ({
          id: row.id,
          employeeId: row.employeeId,
          employeeName: row.employee?.fullName ?? "Unknown",
          type: row.type,
          fileName: row.fileName,
          fileUrl: row.fileUrl,
          expiryDate: row.expiryDate,
          version: row.version,
        }));

        const result = checkDocumentExpiry(docContexts, {
          includeExpired: true,
          checkDate: todayStr,
        });

        totalChecked += result.checkedCount;

        for (const alert of result.alerts) {
          try {
            await tenantDb.insert(notifications).values({
              userId: alert.employeeId,
              channel: "in_app",
              type: "document_expiry",
              title: `Document Expiring: ${alert.documentType}`,
              message: `${alert.employeeName}'s ${alert.documentType} expires in ${alert.daysUntilExpiry} days`,
              severity: alert.threshold.severity,
              metadata: {
                documentId: alert.documentId,
                documentType: alert.documentType,
                expiryDate: alert.expiryDate,
                daysUntilExpiry: alert.daysUntilExpiry,
              },
            });
            totalSucceeded++;
            totalAlertsCreated++;
          } catch (e) {
            totalFailed++;
            errors.push(`Tenant ${tenant.companyName}: notification ${alert.documentId} - ${e instanceof Error ? e.message : String(e)}`);
          }
        }

        tenantsProcessed++;
      } catch (e) {
        errors.push(`Tenant ${tenant.companyName}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  } catch (e) {
    errors.push(`Global: ${e instanceof Error ? e.message : String(e)}`);
  }

  return NextResponse.json({
    success: true,
    tenantsProcessed,
    totalChecked,
    totalAlertsCreated,
    totalSucceeded,
    totalFailed,
    errors,
  });
}
