import { z } from "zod";
import { uuidSchema } from "./common";

export const createFinalSettlementSchema = z.object({
  employeeId: uuidSchema.describe("Employee UUID"),
  esbAmount: z.number().min(0).optional().describe("End of service benefit amount"),
  unpaidSalary: z.number().min(0).optional().describe("Unpaid salary amount"),
  accruedLeavePayout: z.number().min(0).optional().describe("Accrued leave payout amount"),
  exitReason: z.string().max(500).optional().describe("Reason for exit"),
});

export type CreateFinalSettlementInput = z.infer<typeof createFinalSettlementSchema>;
