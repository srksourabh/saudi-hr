import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { payrollRuns } from "./payroll_runs";

export const checkStatusEnum = ["passed", "flagged", "blocked"] as const;

export const complianceChecks = pgTable("compliance_checks", {
  id: uuid("id").defaultRandom().primaryKey(),
  payrollRunId: uuid("payroll_run_id")
    .notNull()
    .references(() => payrollRuns.id, { onDelete: "cascade" }),
  checkType: text("check_type").notNull(),
  status: text("status", { enum: checkStatusEnum }).notNull(),
  flaggedIssues: jsonb("flagged_issues"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
