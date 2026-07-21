import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { encryptedText } from "../../crypto";

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "hr_manager",
  "department_manager",
  "hr_specialist",
  "payroll_admin",
  "recruiter",
  "employee",
  "candidate",
]);
export const preferredLanguageEnum = pgEnum("preferred_language", ["en", "ar"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name"),
  image: text("image"),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  role: userRoleEnum("role").notNull().default("employee"),
  preferredLanguage: preferredLanguageEnum("preferred_language").notNull().default("en"),
  // TOTP seed, encrypted at rest (DB-011). Legacy plaintext rows pass through
  // on read until scripts/encrypt-mfa-backfill.ts is run once per environment.
  mfaSecret: encryptedText("mfa_secret"),
  employeeId: uuid("employee_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
