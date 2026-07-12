import { pgTable, uuid, text, timestamp, numeric, date } from "drizzle-orm/pg-core";

export const payrollStatusEnum = ["draft", "pre_check", "ready", "completed", "cancelled"] as const;

export const payrollRuns = pgTable("payroll_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodMonth: date("period_month").notNull(),
  status: text("status", { enum: payrollStatusEnum }).notNull().default("draft"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
