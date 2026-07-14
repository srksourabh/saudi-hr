import { z } from "zod";
import { uuidSchema, paginationSchema } from "./common";

export const expenseStatusSchema = z.enum([
  "draft",
  "pending",
  "approved",
  "rejected",
  "paid",
]);

export const expenseCategorySchema = z.enum([
  "travel",
  "meals",
  "accommodation",
  "supplies",
  "training",
  "client_entertainment",
  "field_operations",
  "other",
]);

export const createExpenseSchema = z.object({
  category: expenseCategorySchema.describe("Expense category"),
  description: z.string().min(1, "Description is required").max(500).describe("What was the expense for?"),
  amount: z.number().positive("Amount must be positive").max(1_000_000).describe("Amount in SAR"),
  currency: z.string().length(3).default("SAR").describe("ISO-4217 currency code"),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").describe("Date the expense was incurred"),
  receiptUrl: z.string().url().optional().describe("URL of the uploaded receipt"),
  approverEmployeeId: uuidSchema.optional().describe("Line manager who should approve; defaults to the employee's manager at submission time"),
});

export const updateExpenseSchema = z.object({
  id: uuidSchema,
  description: z.string().min(1).max(500).optional(),
  amount: z.number().positive().max(1_000_000).optional(),
  category: expenseCategorySchema.optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  receiptUrl: z.string().url().optional(),
});

export const approveExpenseSchema = z.object({
  id: uuidSchema,
  action: z.enum(["approve", "reject"]),
  rejectionReason: z.string().max(500).optional(),
});

export const expenseQuerySchema = paginationSchema.extend({
  status: expenseStatusSchema.optional().describe("Filter by status"),
  employeeId: uuidSchema.optional().describe("Filter by employee"),
  pendingFor: uuidSchema.optional().describe("Only show expenses waiting on this manager (employee UUID)"),
  category: expenseCategorySchema.optional().describe("Filter by category"),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ApproveExpenseInput = z.infer<typeof approveExpenseSchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;