import { z } from "zod";
import { uuidSchema } from "./common";

export const createShiftSchema = z.object({
  name: z.string().min(1).max(100).describe("Shift name (e.g. Corporate day)"),
  nameAr: z.string().max(100).optional().describe("Shift name in Arabic"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Use HH:MM or HH:MM:SS")
    .describe("Scheduled start time (HH:MM)"),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Use HH:MM or HH:MM:SS")
    .describe("Scheduled end time (HH:MM)"),
  graceMinutes: z.number().int().nonnegative().max(240).default(10).describe("Late-grace minutes"),
  workDays: z
    .string()
    .min(1)
    .default("sun,mon,tue,wed,thu")
    .describe("Comma-separated working days"),
  breakMinutes: z.number().int().nonnegative().max(240).default(60),
});

export const updateShiftSchema = createShiftSchema.partial();

export const assignShiftSchema = z.object({
  employeeId: uuidSchema,
  shiftId: uuidSchema,
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const punchInSchema = z.object({
  workDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe("Defaults to today if omitted"),
  workLocation: z.string().max(100).optional(),
  // GPS captured at punch-in (from the browser / LocationPicker).
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  accuracy: z.number().nonnegative().optional().describe("GPS accuracy in metres"),
  notes: z.string().max(500).optional(),
});

export const punchOutSchema = z.object({
  workDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  workLocation: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const resolveExceptionSchema = z.object({
  id: uuidSchema,
  status: z.enum(["open", "acknowledged", "resolved", "waived"]),
  resolutionNotes: z.string().max(500).optional(),
});

export const punchInForEmployeeSchema = z.object({
  employeeId: uuidSchema,
  workDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .describe("Defaults to today if omitted"),
  workLocation: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const punchOutForEmployeeSchema = z.object({
  employeeId: uuidSchema,
  workDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  workLocation: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  punchSequence: z.number().int().positive().optional(),
});

export const attendanceQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  employeeId: uuidSchema.optional(),
  departmentId: uuidSchema.optional(),
  status: z
    .enum(["present", "absent", "late", "on_leave", "remote", "half_day", "holiday", "weekend"])
    .optional(),
});

export const employeeLocationSchema = z.object({
  employeeId: uuidSchema,
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
export type AssignShiftInput = z.infer<typeof assignShiftSchema>;
export type PunchInInput = z.infer<typeof punchInSchema>;
export type PunchOutInput = z.infer<typeof punchOutSchema>;
export type PunchInForEmployeeInput = z.infer<typeof punchInForEmployeeSchema>;
export type PunchOutForEmployeeInput = z.infer<typeof punchOutForEmployeeSchema>;
export type ResolveExceptionInput = z.infer<typeof resolveExceptionSchema>;
export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;
export type EmployeeLocationInput = z.infer<typeof employeeLocationSchema>;
