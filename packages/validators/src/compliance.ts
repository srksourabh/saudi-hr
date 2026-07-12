import { z } from "zod";
import { uuidSchema, paginationSchema } from "./common";

export const createComplianceCheckSchema = z.object({
  payrollRunId: uuidSchema.describe("Payroll run UUID"),
  checkType: z.string().min(1, "Check type is required").describe("Type of compliance check"),
  status: z.enum(["passed", "flagged", "blocked"]).describe("Compliance check status"),
  flaggedIssues: z.array(z.string()).optional().describe("List of flagged issues"),
});

export const complianceQuerySchema = paginationSchema.extend({
  status: z.enum(["passed", "flagged", "blocked"]).optional().describe("Filter by check status"),
  checkType: z.string().optional().describe("Filter by check type"),
});

export type CreateComplianceCheckInput = z.infer<typeof createComplianceCheckSchema>;
export type ComplianceQueryInput = z.infer<typeof complianceQuerySchema>;
