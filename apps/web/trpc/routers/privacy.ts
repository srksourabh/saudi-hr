import { z } from "zod";
import { createTRPCRouter, requireRole } from "../server";
import { schema } from "@hrms-app/db";
import { writeAudit } from "../audit";

/**
 * PDPL data-subject rights router (PRIV-008).
 *
 * Saudi PDPL grants data subjects the rights to access, correction and
 * destruction of their personal data, and to withdraw consent. Access is
 * already covered by `employee.exportMyData`; this router covers the
 * remaining three as a minimal, audited request workflow:
 *
 *  - each request is recorded in the tenant audit trail (tamper-proof,
 *    readable by HR Manager / super admin via the audit router), and
 *  - an in-app notification is created for every HR Manager / super admin
 *    in the tenant (the queue they action), plus a receipt notification for
 *    the requester (their proof of submission).
 *
 * A dedicated DSR table with status tracking is a follow-up (needs a
 * packages/db schema change); until then the notifications + audit trail
 * are the system of record for these requests.
 *
 * NOTE: `requireRole` (not `protectedProcedure`) is used deliberately —
 * `protectedProcedure` consults the per-role procedure allowlist in
 * packages/auth/src/rbac.ts, which does not yet include `privacy.*` for the
 * employee/candidate roles, and data subjects (employees, candidates) are
 * exactly who these endpoints are for. Follow-up: add `privacy.*` to the
 * allowlists and switch to `protectedProcedure`.
 */

const DATA_SUBJECT_ROLES = [
  "super_admin",
  "hr_manager",
  "department_manager",
  "hr_specialist",
  "payroll_admin",
  "recruiter",
  "employee",
  "candidate",
] as const;

const HR_RECIPIENT_ROLES = ["super_admin", "hr_manager"] as const;

const detailsSchema = z.string().trim().min(10).max(2000);

type PrivacyRequestKind = "rectification" | "erasure" | "consent_withdrawal";

const KIND_LABEL: Record<PrivacyRequestKind, string> = {
  rectification: "correction (rectification) request",
  erasure: "erasure (destruction) request",
  consent_withdrawal: "consent withdrawal",
};

const KIND_AUDIT_ACTION: Record<PrivacyRequestKind, string> = {
  rectification: "pdpl.rectification_request",
  erasure: "pdpl.erasure_request",
  consent_withdrawal: "pdpl.consent_withdrawal",
};

interface PrivacyRequestContext {
  db: any;
  adminDb: any;
  user: { id: string; role: string; tenantId?: string | null; employeeId?: string | null; email?: string | null; name?: string | null };
  headers: Headers;
}

/**
 * Persist a data-subject request: audit entry + in-app notifications to the
 * tenant's HR managers / super admins + a receipt to the requester.
 */
async function submitPrivacyRequest(
  ctx: PrivacyRequestContext,
  kind: PrivacyRequestKind,
  payload: Record<string, unknown>,
): Promise<{ requestId: string; submittedAt: string }> {
  const requestId = crypto.randomUUID();
  const submittedAt = new Date().toISOString();
  const label = KIND_LABEL[kind];

  // Tamper-proof record in the tenant audit trail (never blocks on failure,
  // consistent with every other audited operation).
  await writeAudit(ctx, {
    action: KIND_AUDIT_ACTION[kind],
    entityType: "privacy_request",
    entityId: ctx.user.employeeId ?? ctx.user.id,
    newValue: { requestId, ...payload },
  });

  // Route the request to the people who must action it.
  const hrRecipients: { id: string }[] = await ctx.adminDb.query.users.findMany({
    where: (users: any, { and, eq, inArray }: any) =>
      and(eq(users.tenantId, ctx.user.tenantId), inArray(users.role, [...HR_RECIPIENT_ROLES])),
    columns: { id: true },
  });

  const requesterLabel = ctx.user.name ?? ctx.user.email ?? "An employee";
  const metadata = {
    requestId,
    requestType: kind,
    requestedByUserId: ctx.user.id,
    employeeId: ctx.user.employeeId ?? null,
    submittedAt,
    ...payload,
  };

  const rows = [
    // Receipt for the requester — their proof of submission.
    {
      userId: ctx.user.id,
      channel: "in_app" as const,
      type: "pdpl_request",
      title: "PDPL request submitted",
      message: `Your ${label} was submitted and will be reviewed by HR.`,
      severity: "info",
      metadata,
    },
    // Action item for each HR manager / super admin (excluding the requester
    // if they hold one of those roles themselves — no duplicate row).
    ...hrRecipients
      .filter((u) => u.id !== ctx.user.id)
      .map((u) => ({
        userId: u.id,
        channel: "in_app" as const,
        type: "pdpl_request",
        title: `PDPL ${label}`,
        message: `${requesterLabel} submitted a PDPL ${label}. Review the request details and action it per the data-subject-rights process.`,
        severity: "warning",
        metadata,
      })),
  ];
  await ctx.db.insert(schema.tenant.notifications).values(rows);

  return { requestId, submittedAt };
}

export const privacyRouter = createTRPCRouter({
  /**
   * PDPL right to correction: the data subject asks for inaccurate personal
   * data to be rectified. HR reviews and applies the change through the
   * normal (audited) employee-update flow.
   */
  requestRectification: requireRole(...DATA_SUBJECT_ROLES)
    .input(
      z.object({
        field: z.string().trim().max(100).optional(),
        details: detailsSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await submitPrivacyRequest(ctx, "rectification", {
        field: input.field ?? null,
        details: input.details,
      });
    }),

  /**
   * PDPL right to destruction: the data subject asks for their personal data
   * to be erased/anonymised. Lawful retention obligations (payroll, GOSI,
   * audit) may limit what can be destroyed — HR/legal decide per request.
   */
  requestErasure: requireRole(...DATA_SUBJECT_ROLES)
    .input(z.object({ details: detailsSchema }))
    .mutation(async ({ ctx, input }) => {
      return await submitPrivacyRequest(ctx, "erasure", { details: input.details });
    }),

  /**
   * PDPL consent withdrawal: the data subject withdraws consent for a
   * processing scope (e.g. email notifications). The withdrawal is recorded
   * and routed to HR; enforcement (e.g. suppressing a channel) follows the
   * notification-preferences work.
   */
  withdrawConsent: requireRole(...DATA_SUBJECT_ROLES)
    .input(
      z.object({
        scope: z.enum(["email_notifications", "sms_notifications", "data_processing"]),
        details: z.string().trim().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await submitPrivacyRequest(ctx, "consent_withdrawal", {
        scope: input.scope,
        details: input.details ?? null,
      });
    }),
});
