import { z } from "zod";
import { uuidSchema, paginationSchema } from "./common";

export const createNotificationSchema = z.object({
  userId: uuidSchema.describe("User UUID to notify"),
  channel: z.enum(["email", "sms", "in_app"]).describe("Notification delivery channel"),
  title: z.string().min(1, "Title is required").describe("Notification title"),
  message: z.string().min(1, "Message is required").describe("Notification message body"),
});

export const notificationQuerySchema = paginationSchema.extend({
  read: z.boolean().optional().describe("Filter by read status"),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
