import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const designations = pgTable("designations", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  code: text("code"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
