import { z } from "zod";
import { uuidSchema, paginationSchema } from "./common";

export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required").max(200).describe("Department name"),
  parentDepartmentId: uuidSchema.optional().describe("Parent department UUID"),
  headEmployeeId: uuidSchema.optional().describe("Head of department employee UUID"),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().describe("Partial update for department");

export const departmentQuerySchema = paginationSchema.extend({});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type DepartmentQueryInput = z.infer<typeof departmentQuerySchema>;
