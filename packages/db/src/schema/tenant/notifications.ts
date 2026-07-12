import { pgTable, uuid, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

export const notificationChannelEnum = ["email", "sms", "in_app"] as const;

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  channel: text("channel", { enum: notificationChannelEnum }).notNull(),
  type: text("type"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity"),
  metadata: jsonb("metadata"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
