import { pgTable, uuid, text, timestamp, date } from "drizzle-orm/pg-core";
import { employees } from "./employees";

export const documentTypeEnum = ["iqama", "passport", "work_permit", "contract", "certificate", "other"] as const;

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  type: text("type", { enum: documentTypeEnum }).notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  expiryDate: date("expiry_date"),
  version: text("version").notNull().default("1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
