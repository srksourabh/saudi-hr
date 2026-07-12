import { describe, it, expect } from "vitest";
import { env } from "../env";

describe("env validation", () => {
  it("exports env with default values in dev", () => {
    expect(env).toBeDefined();
    expect(env.NODE_ENV).toBeDefined();
    expect(env.DATABASE_URL).toContain("localhost");
  });
});
