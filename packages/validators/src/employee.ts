import { z } from "zod";
import { uuidSchema, paginationSchema } from "./common";

/**
 * Saudi government ID format (VAL-005). Both a Saudi national ID and an iqama
 * are 10 digits; a citizen ID starts with 1, an iqama (resident) starts with 2.
 * The value is stored in `iqamaNumberEnc` and validated on the plaintext input.
 */
export function validateNationalId(
  value: string | undefined,
  nationality: "saudi" | "expat",
  ctx: z.RefinementCtx,
): void {
  if (!value) return; // optional
  if (!/^\d{10}$/.test(value)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["iqamaNumberEnc"], message: "ID must be exactly 10 digits" });
    return;
  }
  const expectedPrefix = nationality === "saudi" ? "1" : "2";
  if (value[0] !== expectedPrefix) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["iqamaNumberEnc"],
      message:
        nationality === "saudi"
          ? "A Saudi national ID must start with 1"
          : "An iqama number must start with 2",
    });
  }
}

const employeeBaseSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(200).describe("Employee full name"),
  nationality: z.enum(["saudi", "expat"]).describe("Nationality classification"),
  departmentId: uuidSchema.optional().describe("Department UUID"),
  managerEmployeeId: uuidSchema.optional().describe("Manager employee UUID"),
  iqamaNumberEnc: z.string().optional().describe("National ID / Iqama number (10 digits)"),
  passportNumberEnc: z.string().optional().describe("Encrypted passport number"),
  bankIbanEnc: z.string().optional().describe("Encrypted bank IBAN"),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Hire date must be YYYY-MM-DD").describe("Date of hire"),
  gosiRegistrationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional().describe("GOSI registration date"),
  gosiSystem: z.enum(["old", "new"]).optional().describe("GOSI system type"),
  salaryBasic: z.number().positive().describe("Basic salary"),
  salaryHousing: z.number().min(0).default(0).describe("Housing allowance"),
  salaryTransport: z.number().min(0).default(0).describe("Transport allowance"),
});

export const createEmployeeSchema = employeeBaseSchema.superRefine((data, ctx) => {
  validateNationalId(data.iqamaNumberEnc, data.nationality, ctx);
});

export const updateEmployeeSchema = employeeBaseSchema.partial().superRefine((data, ctx) => {
  if (data.iqamaNumberEnc !== undefined && data.nationality) {
    validateNationalId(data.iqamaNumberEnc, data.nationality, ctx);
  }
});

export const employeeQuerySchema = paginationSchema.extend({
  status: z.enum(["active", "terminated", "suspended", "on_leave"]).optional().describe("Filter by employment status"),
  departmentId: uuidSchema.optional().describe("Filter by department"),
  search: z.string().max(200).optional().describe("Search text on full name"),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeQueryInput = z.infer<typeof employeeQuerySchema>;
