import { z } from "zod";
import { uuidSchema, paginationSchema } from "./common";

export const createLeaveTypeSchema = z.object({
  name: z.string().min(1, "Leave type name is required").max(100).describe("Leave type name"),
  daysAllowed: z.number().int().positive().describe("Number of days allowed per year"),
  rules: z.object({}).passthrough().optional().describe("JSON rules for this leave type"),
});

export const updateLeaveTypeSchema = createLeaveTypeSchema.partial().describe("Partial update for leave type");

export const createLeaveRequestSchema = z
  .object({
    employeeId: uuidSchema.describe("Employee UUID"),
    leaveTypeId: uuidSchema.describe("Leave type UUID"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD").describe("Leave start date"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be YYYY-MM-DD").describe("Leave end date"),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const updateLeaveRequestSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).describe("Leave request status"),
  approvedByUserId: uuidSchema.optional().describe("User who approved the request"),
});

export const leaveBalanceSchema = z.object({
  employeeId: uuidSchema.describe("Employee UUID"),
  leaveTypeId: uuidSchema.describe("Leave type UUID"),
  balance: z.number().positive().describe("Leave balance in days"),
  year: z.number().int().describe("Calendar year"),
});

export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>;
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type UpdateLeaveRequestInput = z.infer<typeof updateLeaveRequestSchema>;
export type LeaveBalanceInput = z.infer<typeof leaveBalanceSchema>;
