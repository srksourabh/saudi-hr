import { describe, it, expect } from "vitest";
import { encryptField, decryptField, isEncrypted } from "../crypto";

describe("field encryption (SEC-008)", () => {
  it("round-trips a value", () => {
    const plain = "2234567890";
    const enc = encryptField(plain);
    expect(decryptField(enc)).toBe(plain);
  });

  it("stores ciphertext, never the plaintext", () => {
    const plain = "SA0380000000608010167519";
    const enc = encryptField(plain);
    expect(enc).not.toContain(plain);
    expect(isEncrypted(enc)).toBe(true);
  });

  it("is deterministic so unique indexes and equality lookups still work", () => {
    // Same input -> identical ciphertext (required for the iqama unique index).
    expect(encryptField("1234567890")).toBe(encryptField("1234567890"));
    // Different inputs -> different ciphertext.
    expect(encryptField("1234567890")).not.toBe(encryptField("1234567891"));
  });

  it("passes through legacy plaintext on read", () => {
    // Rows written before encryption (no marker) must remain readable.
    expect(decryptField("1234567890")).toBe("1234567890");
    expect(isEncrypted("1234567890")).toBe(false);
  });

  it("rejects tampered ciphertext", () => {
    const enc = encryptField("2234567890");
    const tampered = enc.slice(0, -4) + (enc.endsWith("AAAA") ? "BBBB" : "AAAA");
    expect(() => decryptField(tampered)).toThrow();
  });
});
