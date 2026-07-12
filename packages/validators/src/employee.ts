import { z } from "zod";
import { uuidSchema, paginationSchema } from "./common";

export const createEmployeeSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(200).describe("Employee full name"),
  nationality: z.enum(["saudi", "expat"]).describe("Nationality classification"),
  departmentId: uuidSchema.optional().describe("Department UUID"),
  managerEmployeeId: uuidSchema.optional().describe("Manager employee UUID"),
  iqamaNumberEnc: z.string().optional().describe("Encrypted Iqama number"),
  passportNumberEnc: z.string().optional().describe("Encrypted passport number"),
  bankIbanEnc: z.string().optional().describe("Encrypted bank IBAN"),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Hire date must be YYYY-MM-DD").describe("Date of hire"),
  gosiRegistrationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional().describe("GOSI registration date"),
  gosiSystem: z.enum(["old", "new"]).optional().describe("GOSI system type"),
  salaryBasic: z.number().positive().describe("Basic salary"),
  salaryHousing: z.number().min(0).default(0).describe("Housing allowance"),
  salaryTransport: z.number().min(0).default(0).describe("Transport allowance"),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().describe("Partial update for employee");

export const employeeQuerySchema = paginationSchema.extend({
  status: z.enum(["active", "terminated", "suspended", "on_leave"]).optional().describe("Filter by employment status"),
  departmentId: uuidSchema.optional().describe("Filter by department"),
  search: z.string().max(200).optional().describe("Search text on full name"),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeQueryInput = z.infer<typeof employeeQuerySchema>;
