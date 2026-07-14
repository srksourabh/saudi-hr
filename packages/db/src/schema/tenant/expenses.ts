import { pgTable, uuid, text, timestamp, date, numeric } from "drizzle-orm/pg-core";
import { employees } from "./employees";

// Lifecycle states for an expense submission.
//   draft     — employee is still editing
//   pending   — submitted and waiting on the line manager for approval
//   approved  — manager approved; payable on next payroll run
//   rejected  — manager declined with a reason
//   paid      — reimbursed / settled
export const expenseStatusEnum = ["draft", "pending", "approved", "rejected", "paid"] as const;

export const expenseCategoryEnum = [
  "travel",
  "meals",
  "accommodation",
  "supplies",
  "training",
  "client_entertainment",
  "field_operations",
  "other",
] as const;

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  // The line manager assigned at the time of submission. This is captured
  // separately from employees.manager_employee_id because the chain of
  // command may change after the expense is filed, but the approval workflow
  // must follow the manager who was responsible when the expense happened.
  approverEmployeeId: uuid("approver_employee_id")
    .references(() => employees.id, { onDelete: "set null" }),
  category: text("category", { enum: expenseCategoryEnum }).notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("SAR"),
  expenseDate: date("expense_date").notNull(),
  receiptUrl: text("receipt_url"),
  status: text("status", { enum: expenseStatusEnum }).notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});