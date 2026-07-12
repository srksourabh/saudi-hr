import { pgTable, uuid, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { employees } from "./employees";

export const finalSettlements = pgTable("final_settlements", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  esbAmount: numeric("esb_amount", { precision: 12, scale: 2 }),
  unpaidSalary: numeric("unpaid_salary", { precision: 12, scale: 2 }),
  accruedLeavePayout: numeric("accrued_leave_payout", { precision: 12, scale: 2 }),
  exitReason: text("exit_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
