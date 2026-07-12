import { pgTable, uuid, integer, numeric } from "drizzle-orm/pg-core";
import { employees } from "./employees";
import { leaveTypes } from "./leave_types";

export const leaveBalances = pgTable("leave_balances", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  leaveTypeId: uuid("leave_type_id")
    .notNull()
    .references(() => leaveTypes.id, { onDelete: "restrict" }),
  balance: numeric("balance", { precision: 5, scale: 1 }).notNull(),
  year: integer("year").notNull(),
});
