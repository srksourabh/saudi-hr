import { z } from "zod";
import { uuidSchema, paginationSchema } from "./common";

export const createDocumentSchema = z.object({
  employeeId: uuidSchema.describe("Employee UUID"),
  type: z.enum(["iqama", "passport", "work_permit", "contract", "certificate", "other"]).describe("Document type"),
  fileName: z.string().min(1, "File name is required").max(255).describe("Original file name"),
  fileUrl: z.string().min(1, "File URL is required").describe("URL to the stored file"),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional().describe("Document expiry date"),
  version: z.string().default("1").describe("Document version"),
});

export const updateDocumentSchema = createDocumentSchema.partial().describe("Partial update for document");

export const documentQuerySchema = paginationSchema.extend({
  type: z.enum(["iqama", "passport", "work_permit", "contract", "certificate", "other"]).optional().describe("Filter by document type"),
  employeeId: uuidSchema.optional().describe("Filter by employee"),
  expiryBefore: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional().describe("Filter documents expiring before this date"),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type DocumentQueryInput = z.infer<typeof documentQuerySchema>;
