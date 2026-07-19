import { describe, it, expect } from "vitest";
import { calculateFinalSettlement, qualifiesForArt87FullAward } from "../esb";
import type { FinalSettlementInput } from "../types";

const baseInput = (overrides: Partial<FinalSettlementInput> = {}): FinalSettlementInput => ({
  hireDate:           "2020-01-01",
  terminationDate:    "2025-01-01",
  basicSalary:        10000,
  housingAllowance:   2000,
  transportAllowance: 1000,
  separationReason:   "end_of_contract",
  completedProbation: true,
  ...overrides,
});

describe("calculateFinalSettlement", () => {
  it("returns 0 for under 2 years of service", () => {
    const result = calculateFinalSettlement(baseInput({
      hireDate:        "2025-06-01",
      terminationDate: "2025-06-01",
    }));
    expect(result.eosbAmount).toBe(0);
  });

  it("calculates half-month per year for first 5 years: 3yr @ 10,000 ≈ 15,000", () => {
    // EOSB = 0.5 × wage × years. 3yr @ 10,000 = 15,000.
    // Tenure uses 365.25-day years, so partial-year fraction may cause ~±3 SAR rounding.
    const result = calculateFinalSettlement(baseInput({
      hireDate:           "2022-01-01",
      terminationDate:    "2025-01-01",
      basicSalary:        10000,
      housingAllowance:   0,
      transportAllowance: 0,
    }));
    expect(result.eosbAmount).toBeGreaterThan(14900);
    expect(result.eosbAmount).toBeLessThan(15100);
  });

  it("calculates half-month first 5 + full-month after: 8yr @ 10,000 = 55,000", () => {
    // EOSB = 0.5 × 10000 × 5 + 1.0 × 10000 × 3 = 25,000 + 30,000 = 55,000
    const result = calculateFinalSettlement(baseInput({
      hireDate:           "2017-01-01",
      terminationDate:    "2025-01-01",
      basicSalary:        10000,
      housingAllowance:   0,
      transportAllowance: 0,
    }));
    expect(result.eosbAmount).toBe(55000);
  });

  it("applies Article 80: termination for cause returns zero EOSB", () => {
    const result = calculateFinalSettlement(baseInput({
      hireDate:           "2017-01-01",
      terminationDate:    "2025-01-01",
      basicSalary:        10000,
      housingAllowance:   0,
      transportAllowance: 0,
      separationReason:   "termination_for_cause",
    }));
    expect(result.eosbAmount).toBe(0);
    expect(result.requiresHrReview).toBe(true);
  });

  it("EOSB-005: no-cause employer termination pays full award (15,000 @ 5yr = 37,500)", () => {
    // Full EOSB = 0.5 × 15000 × 5 = 37,500. A plain "termination" (no cause)
    // must NOT be treated as an Article 80 zero.
    const result = calculateFinalSettlement(baseInput({
      hireDate:           "2020-01-01",
      terminationDate:    "2025-01-01",
      basicSalary:        15000,
      housingAllowance:   0,
      transportAllowance: 0,
      separationReason:   "termination",
    }));
    expect(result.eosbAmount).toBeGreaterThan(37400);
    expect(result.eosbAmount).toBeLessThan(37600);
    expect(result.eosbResignationFraction).toBe(1);
  });

  it("EOSB-006: resignation within 6 months of marriage gets the full award (Art 87)", () => {
    // 12,000 wage, 4.5 yr → full EOSB = 0.5 × 12000 × 4.5 = 27,000
    const result = calculateFinalSettlement(baseInput({
      hireDate:           "2021-07-01",
      terminationDate:    "2026-01-01",   // ~4.5 yr
      basicSalary:        12000,
      housingAllowance:   0,
      transportAllowance: 0,
      separationReason:   "resignation",
      fullAwardOverride:  true,
    }));
    expect(result.eosbResignationFraction).toBe(1);
    expect(result.eosbAmount).toBeGreaterThan(26900);
    expect(result.eosbAmount).toBeLessThan(27100);
  });

  it("Art 87 window helper: marriage/childbirth only for a resignation in-window", () => {
    // resign 2026-05-01, married 2026-02-01 (3 months) → qualifies
    expect(qualifiesForArt87FullAward("resignation", "2026-05-01", { marriageDate: "2026-02-01" })).toBe(true);
    // married 2025-06-01 (11 months before) → out of window
    expect(qualifiesForArt87FullAward("resignation", "2026-05-01", { marriageDate: "2025-06-01" })).toBe(false);
    // childbirth 2026-03-15 (~1.5 months) → qualifies
    expect(qualifiesForArt87FullAward("resignation", "2026-05-01", { childbirthDate: "2026-03-15" })).toBe(true);
    // childbirth 2026-01-01 (4 months) → out of the 3-month window
    expect(qualifiesForArt87FullAward("resignation", "2026-05-01", { childbirthDate: "2026-01-01" })).toBe(false);
    // not a resignation → never qualifies
    expect(qualifiesForArt87FullAward("termination", "2026-05-01", { marriageDate: "2026-04-01" })).toBe(false);
  });
});
