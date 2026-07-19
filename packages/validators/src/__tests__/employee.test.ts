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

describe("createEmployeeSchema value bounds (VAL-004/VAL-008)", () => {
  it("accepts a large-but-in-range salary without overflow", () => {
    const r = createEmployeeSchema.safeParse({ ...base, salaryBasic: 999_999_999 });
    expect(r.success).toBe(true);
  });
  it("rejects a hire date far in the future", () => {
    const r = createEmployeeSchema.safeParse({ ...base, hireDate: "2099-01-01" });
    expect(r.success).toBe(false);
  });
  it("accepts a near-future hire date (pre-boarding)", () => {
    const soon = new Date();
    soon.setUTCMonth(soon.getUTCMonth() + 1);
    const r = createEmployeeSchema.safeParse({ ...base, hireDate: soon.toISOString().slice(0, 10) });
    expect(r.success).toBe(true);
  });
});
