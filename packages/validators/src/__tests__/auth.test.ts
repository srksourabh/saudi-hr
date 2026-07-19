import { describe, it, expect } from "vitest";
import { signupSchema, loginSchema } from "../auth";

describe("signupSchema", () => {
  it("accepts valid input", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "Password1!",
      name: "Test User",
      companyName: "Test Company",
      crNumber: "CR-12345",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "Short1",
      name: "Test",
      companyName: "Test Co",
      crNumber: "CR-12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "password1",
      name: "Test",
      companyName: "Test Co",
      crNumber: "CR-12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "Password",
      name: "Test",
      companyName: "Test Co",
      crNumber: "CR-12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "PASSWORD1!",
      name: "Test",
      companyName: "Test Co",
      crNumber: "CR-12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without a special character", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "Password1",
      name: "Test",
      companyName: "Test Co",
      crNumber: "CR-12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = signupSchema.safeParse({
      email: "not-an-email",
      password: "Password1",
      name: "Test",
      companyName: "Test Co",
      crNumber: "CR-12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing company name", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "Password1",
      name: "Test",
      crNumber: "CR-12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "Password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});
