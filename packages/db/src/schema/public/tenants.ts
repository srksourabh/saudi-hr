import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const planTierEnum = pgEnum("plan_tier", ["basic", "pro", "enterprise"]);
export const regulatoryContextEnum = pgEnum("regulatory_context", ["saudi", "india"]);

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyName: text("company_name").notNull(),
  crNumber: text("cr_number").notNull().unique(),
  nitaqatActivity: text("nitaqat_activity").notNull().default(""),
  planTier: planTierEnum("plan_tier").notNull().default("basic"),
  regulatoryContext: regulatoryContextEnum("regulatory_context").notNull().default("saudi"),
  schemaName: text("schema_name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
