import { pgTable, uuid, text, timestamp, pgEnum, numeric, date } from "drizzle-orm/pg-core";
import { departments } from "./departments";

export const employmentStatusEnum = pgEnum("employment_status", ["active", "terminated", "suspended", "on_leave"]);
export const gosiSystemEnum = pgEnum("gosi_system", ["old", "new"]);
export const nationalityEnum = pgEnum("nationality", ["saudi", "expat"]);

export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  departmentId: uuid("department_id").references(() => departments.id, { onDelete: "set null" }),
  managerEmployeeId: uuid("manager_employee_id"),
  iqamaNumberEnc: text("iqama_number_enc"),
  passportNumberEnc: text("passport_number_enc"),
  bankIbanEnc: text("bank_iban_enc"),
  nationality: nationalityEnum("nationality").notNull(),
  fullName: text("full_name").notNull(),
  employmentStatus: employmentStatusEnum("employment_status").notNull().default("active"),
  hireDate: date("hire_date").notNull(),
  terminationDate: date("termination_date"),
  gosiRegistrationDate: date("gosi_registration_date"),
  gosiSystem: gosiSystemEnum("gosi_system"),
  salaryBasic: numeric("salary_basic", { precision: 12, scale: 2 }).notNull(),
  salaryHousing: numeric("salary_housing", { precision: 12, scale: 2 }).notNull().default("0"),
  salaryTransport: numeric("salary_transport", { precision: 12, scale: 2 }).notNull().default("0"),
  rehireEligible: text("rehire_eligible"),
  rehireReason: text("rehire_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
