import { describe, it, expect } from "vitest";
import { createEmployeeSchema } from "../employee";

const base = {
  fullName: "Test Employee",
  nationality: "saudi" as const,
  hireDate: "2024-01-01",
  salaryBasic: 10000,
};

describe("createEmployeeSchema national ID / iqama format (VAL-005)", () => {
  it("accepts a valid Saudi national ID (10 digits, starts with 1)", () => {
    const r = createEmployeeSchema.safeParse({ ...base, iqamaNumberEnc: "1234567890" });
    expect(r.success).toBe(true);
  });
  it("accepts a valid iqama for an expat (starts with 2)", () => {
    const r = createEmployeeSchema.safeParse({ ...base, nationality: "expat", iqamaNumberEnc: "2234567890" });
    expect(r.success).toBe(true);
  });
  it("rejects a non-10-digit ID", () => {
    const r = createEmployeeSchema.safeParse({ ...base, iqamaNumberEnc: "12345" });
    expect(r.success).toBe(false);
  });
  it("rejects a Saudi ID not starting with 1", () => {
    const r = createEmployeeSchema.safeParse({ ...base, iqamaNumberEnc: "2234567890" });
    expect(r.success).toBe(false);
  });
  it("allows omitting the ID (optional)", () => {
    const r = createEmployeeSchema.safeParse(base);
    expect(r.success).toBe(true);
  });
});
