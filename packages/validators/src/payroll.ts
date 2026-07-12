import { z } from "zod";
import { uuidSchema, paginationSchema } from "./common";

const payrollStatusEnum = z.enum(["draft", "pre_check", "ready", "completed", "cancelled"]);

export const createPayrollRunSchema = z.object({
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/, "Period month must be YYYY-MM").describe("Payroll period month"),
});

export const updatePayrollRunSchema = z.object({
  status: payrollStatusEnum.describe("Payroll run status"),
});

export const createPayslipSchema = z.object({
  payrollRunId: uuidSchema.describe("Payroll run UUID"),
  employeeId: uuidSchema.describe("Employee UUID"),
  basic: z.number().positive().describe("Basic salary"),
  housing: z.number().min(0).describe("Housing allowance"),
  transport: z.number().min(0).describe("Transport allowance"),
  overtime: z.number().min(0).default(0).describe("Overtime amount"),
  gosiEmployee: z.number().min(0).default(0).describe("GOSI employee contribution"),
  gosiEmployer: z.number().min(0).default(0).describe("GOSI employer contribution"),
  deductions: z.number().min(0).default(0).describe("Other deductions"),
  netPay: z.number().positive().describe("Net pay after all calculations"),
});

export const payrollQuerySchema = paginationSchema.extend({
  periodMonth: z.string().regex(/^\d{4}-\d{2}$/, "Period month must be YYYY-MM").optional().describe("Filter by period month"),
  status: payrollStatusEnum.optional().describe("Filter by payroll run status"),
});

export type CreatePayrollRunInput = z.infer<typeof createPayrollRunSchema>;
export type UpdatePayrollRunInput = z.infer<typeof updatePayrollRunSchema>;
export type CreatePayslipInput = z.infer<typeof createPayslipSchema>;
export type PayrollQueryInput = z.infer<typeof payrollQuerySchema>;
