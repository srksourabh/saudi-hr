import { pgTable, uuid, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { payrollRuns } from "./payroll_runs";

export const payslips = pgTable("payslips", {
  id: uuid("id").defaultRandom().primaryKey(),
  payrollRunId: uuid("payroll_run_id")
    .notNull()
    .references(() => payrollRuns.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  basic: numeric("basic", { precision: 12, scale: 2 }).notNull(),
  housing: numeric("housing", { precision: 12, scale: 2 }).notNull(),
  transport: numeric("transport", { precision: 12, scale: 2 }).notNull(),
  overtime: numeric("overtime", { precision: 12, scale: 2 }).notNull().default("0"),
  gosiEmployee: numeric("gosi_employee", { precision: 12, scale: 2 }).notNull().default("0"),
  gosiEmployer: numeric("gosi_employer", { precision: 12, scale: 2 }).notNull().default("0"),
  deductions: numeric("deductions", { precision: 12, scale: 2 }).notNull().default("0"),
  netPay: numeric("net_pay", { precision: 12, scale: 2 }).notNull(),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
