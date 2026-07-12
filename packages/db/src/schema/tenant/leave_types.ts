import { pgTable, uuid, text, integer, jsonb, timestamp } from "drizzle-orm/pg-core";

export const leaveTypes = pgTable("leave_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  daysAllowed: integer("days_allowed").notNull(),
  rules: jsonb("rules"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
