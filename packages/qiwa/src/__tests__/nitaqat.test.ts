import { describe, it, expect } from "vitest";
import { computeNitaqatBand, requiredSaudizationRatio } from "../nitaqat";
import { evaluateContractConversion, validateExpatContract } from "../contracts";

describe("Nitaqat band engine (QIW-001)", () => {
  it("required ratio rises with workforce size (log curve), never flat", () => {
    const small = requiredSaudizationRatio(10);
    const large = requiredSaudizationRatio(1000);
    expect(large).toBeGreaterThan(small);
  });

  it("never returns a Yellow tier", () => {
    const bands = new Set<string>();
    for (let saudis = 0; saudis <= 50; saudis += 5) {
      bands.add(computeNitaqatBand({ documentedSaudis: saudis, totalWorkforce: 50 }).band);
    }
    expect([...bands].every((b) => b !== "yellow")).toBe(true);
  });

  it("counts only documented Saudis (QIW-005): undocumented lower the ratio", () => {
    const withDocs = computeNitaqatBand({ documentedSaudis: 15, totalWorkforce: 50 });
    const fewerDocs = computeNitaqatBand({ documentedSaudis: 10, totalWorkforce: 50 });
    expect(fewerDocs.ratio).toBeLessThan(withDocs.ratio);
  });

  it("classifies red below the required ratio and platinum at 40%+", () => {
    expect(computeNitaqatBand({ documentedSaudis: 0, totalWorkforce: 50 }).band).toBe("red");
    expect(computeNitaqatBand({ documentedSaudis: 25, totalWorkforce: 50 }).band).toBe("platinum");
  });
});

describe("contract conversion (QIW-002/003)", () => {
  it("Saudi limited, 2 renewals → stays limited", () => {
    const r = evaluateContractConversion({ nationality: "saudi", contractKind: "limited", renewalCount: 2, yearsOfService: 2 });
    expect(r.converts).toBe(false);
  });
  it("Saudi limited, 3 renewals → converts", () => {
    const r = evaluateContractConversion({ nationality: "saudi", contractKind: "limited", renewalCount: 3, yearsOfService: 2 });
    expect(r.converts).toBe(true);
  });
  it("Saudi limited, 4 years → converts (pre-conversion alert at 3+ years)", () => {
    expect(evaluateContractConversion({ nationality: "saudi", contractKind: "limited", renewalCount: 0, yearsOfService: 4 }).converts).toBe(true);
    expect(evaluateContractConversion({ nationality: "saudi", contractKind: "limited", renewalCount: 0, yearsOfService: 3.2 }).approaching).toBe(true);
  });
  it("expat never converts", () => {
    const r = evaluateContractConversion({ nationality: "expat", contractKind: "limited", renewalCount: 5, yearsOfService: 6 });
    expect(r.converts).toBe(false);
  });
});

describe("expat contract guard (QIW-006)", () => {
  it("blocks an unlimited contract for an expat", () => {
    expect(validateExpatContract({ nationality: "expat", contractKind: "unlimited" }).ok).toBe(false);
  });
  it("defaults a no-duration expat contract to 12 months", () => {
    const r = validateExpatContract({ nationality: "expat", contractKind: "limited" });
    expect(r.ok).toBe(true);
    expect(r.effectiveDurationMonths).toBe(12);
  });
  it("allows Saudi unlimited", () => {
    expect(validateExpatContract({ nationality: "saudi", contractKind: "unlimited" }).ok).toBe(true);
  });
});
