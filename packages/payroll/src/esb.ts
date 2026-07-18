/**
 * End-of-Service Benefit (EOSB) / Final Settlement Calculation Engine
 *
 * Legal basis: Saudi Labour Law Articles 84, 85, 86, 87, 88, 89, and 90;
 * Executive Regulations Part 7; GOSI EOSB rules for registered employees.
 *
 * ⚠️  INTERNAL CALCULATION ENGINE
 *    Final settlement amounts must be reviewed by HR and validated against
 *    GOSI records before payment. This engine provides the statutory calculation
 *    baseline; actual payments may be subject to court orders, settlement
 *    agreements, or contractual terms that override the default formula.
 *
 * Saudi Labour Law EOSB Summary:
 * ┌──────────────────────────────────────────────────────────────┐
 * │ Termination by employer (not for cause):                    │
 * │   < 2 years  → 0                                            │
 * │   2-5 years  → half-month salary × years                   │
 * │   5-10 years → two-thirds-month salary × years              │
 * │   > 10 years → full-month salary × years                    │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Resignation by employee:                                    │
 * │   < 2 years  → 0                                            │
 * │   2-5 years  → 1/3 of EOSB (half/whole × years × fraction) │
 * │   5-10 years → 2/3 of EOSB                                  │
 * │   > 10 years → full EOSB                                    │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Exceptions with NO EOSB (Article 84):                        │
 * │   - Employee resigns before completing probation (60 days)   │
 * │   - Employee terminates contract without notice (Art. 77/78) │
 * │   - Employee dismissed for cause under Article 80             │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Monthly salary = basic + housing + transport
 * Half-month salary = (basic + housing + transport) / 2
 */

import type {
  FinalSettlementInput,
  FinalSettlementResult,
} from "./types";

// Backward-compatibility alias so existing callers and tests don't break
export { calculateFinalSettlement as calculateEsb };

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_PER_MONTH_APPROX = 30;
const DAYS_PER_YEAR_APPROX  = 365.25;

/**
 * Saudi Labour Law — EOSB fractions by tenure bracket.
 * Key: minimum completed years of service.
 */
const EOSB_TENURE_TABLE: { minYears: number; fraction: number }[] = [
  { minYears: 10, fraction: 1.0 },   // 10+ years → full monthly salary
  { minYears: 5,  fraction: 2 / 3 }, // 5-9 years → two-thirds
  { minYears: 2,  fraction: 1 / 3 }, // 2-4 years → one-third
  { minYears: 0,  fraction: 0    },  // < 2 years → zero
];

/**
 * Resignation penalty fractions (applied to the full termination EOSB amount).
 * Key: minimum completed years of service.
 */
const RESIGNATION_PENALTY_TABLE: { minYears: number; fraction: number }[] = [
  { minYears: 10, fraction: 1.0  },  // 10+ years → no reduction
  { minYears: 5,  fraction: 2 / 3 }, // 5-9 years → 2/3 of EOSB payable
  { minYears: 2,  fraction: 1 / 3 }, // 2-4 years → 1/3 of EOSB payable
  { minYears: 0,  fraction: 0    },  // < 2 years → 0 (also barred by probation)
];

// ─── Core Calculation ──────────────────────────────────────────────────────────

export function calculateFinalSettlement(input: FinalSettlementInput): FinalSettlementResult {
  const { hireDate, terminationDate, basicSalary, housingAllowance, transportAllowance,
    separationReason, completedProbation } = input;

  const totalMonthlySalary = basicSalary + housingAllowance + transportAllowance;
  const halfMonthSalary   = totalMonthlySalary / 2;

  // ── Tenure calculation (years and days) ───────────────────────────────
  const { years, days } = calculateTenure(hireDate, terminationDate);

  const warnings: string[] = [];
  let   requiresHrReview = false;

  // ── Article 84 bar conditions ────────────────────────────────────────
  if (separationReason === "resignation" && !completedProbation) {
    // Resigning before completing 60-day probation → zero EOSB (Labour Law Art. 84)
    warnings.push("Employee resigned before completing probation — EOSB is legally zero under Article 84.");
    return {
      eosbAmount: 0,
      eosbResignationFraction: 0,
      components: {
        yearsOfService:       round(years, 3),
        dailyWage:            round(totalMonthlySalary / DAYS_PER_MONTH_APPROX, 2),
        halfSalaryPerYear:    halfMonthSalary,
        totalYearsCalculated: round(years, 3),
        eosbFraction:        0,
      },
      warnings,
      requiresHrReview: false,
    };
  }

  // ── Termination for cause (Article 80) ────────────────────────────────
  if (separationReason === "termination") {
    // Article 80 dismissal for cause — EOSB is ZERO regardless of tenure
    // (willful misconduct, violation of contract, criminal conduct, etc.)
    // Requires documented investigation evidence.
    warnings.push(
      "Termination for cause claimed — EOSB is zero under Article 80 only if " +
      "a formal investigation (Article 57) has been completed. " +
      "Attach investigation findings before finalising settlement."
    );
    requiresHrReview = true;
    return {
      eosbAmount: 0,
      eosbResignationFraction: 0,
      components: {
        yearsOfService:       round(years, 3),
        dailyWage:            round(totalMonthlySalary / DAYS_PER_MONTH_APPROX, 2),
        halfSalaryPerYear:    halfMonthSalary,
        totalYearsCalculated: round(years, 3),
        eosbFraction:        0,
      },
      warnings,
      requiresHrReview,
    };
  }

  // ── Force majeure, death, mutual termination ──────────────────────────
  if (
    separationReason === "force_majeure" ||
    separationReason === "death" ||
    separationReason === "mutual_termination"
  ) {
    // Special cases — full EOSB regardless of reason
    const fullEosb = applyTenureBracket(years, halfMonthSalary, warnings);
    return {
      eosbAmount:              fullEosb,
      eosbResignationFraction: 1,
      components: {
        yearsOfService:       round(years, 3),
        dailyWage:            round(totalMonthlySalary / DAYS_PER_MONTH_APPROX, 2),
        halfSalaryPerYear:    halfMonthSalary,
        totalYearsCalculated: round(years, 3),
        eosbFraction:        1,
      },
      warnings,
      requiresHrReview: separationReason === "mutual_termination",
    };
  }

  // ── Resignation (employee-initiated) ─────────────────────────────────
  if (separationReason === "resignation") {
    const resignationFraction = lookupFraction(years, RESIGNATION_PENALTY_TABLE);
    const fullEosb           = applyTenureBracket(years, halfMonthSalary, warnings);

    if (resignationFraction === 0) {
      warnings.push("Employee has less than 2 years of service — resignation EOSB is zero.");
      return {
        eosbAmount: 0,
        eosbResignationFraction: 0,
        components: {
          yearsOfService:       round(years, 3),
          dailyWage:            round(totalMonthlySalary / DAYS_PER_MONTH_APPROX, 2),
          halfSalaryPerYear:    halfMonthSalary,
          totalYearsCalculated: round(years, 3),
          eosbFraction:        0,
        },
        warnings,
        requiresHrReview: false,
      };
    }

    const payableEosb = round(fullEosb * resignationFraction, 2);
    warnings.push(
      `Resignation: ${resignationFraction < 1 ? `only ${Math.round(resignationFraction * 100)}%` : "100%"} ` +
      `of the full EOSB is payable (${years < 2 ? "0" : years < 5 ? "1/3" : years < 10 ? "2/3" : "full"} ` +
      `for ${round(years, 1)} years of service).`
    );
    if (years < 5) requiresHrReview = true;

    return {
      eosbAmount:              payableEosb,
      eosbResignationFraction: resignationFraction,
      components: {
        yearsOfService:       round(years, 3),
        dailyWage:            round(totalMonthlySalary / DAYS_PER_MONTH_APPROX, 2),
        halfSalaryPerYear:    halfMonthSalary,
        totalYearsCalculated: round(years, 3),
        eosbFraction:        resignationFraction,
      },
      warnings,
      requiresHrReview,
    };
  }

  // ── End of contract / termination by employer ─────────────────────────
  if (separationReason === "end_of_contract" || separationReason === "termination") {
    const eosbFraction = lookupFraction(years, EOSB_TENURE_TABLE);
    const eosbAmount   = round(halfMonthSalary * eosbFraction * years, 2);

    if (days > 0 && days < 30) {
      warnings.push(
        `Partial month: ${days} additional days (${round(days / DAYS_PER_MONTH_APPROX * 30, 0)} days ` +
        `≈ ${round(days / DAYS_PER_MONTH_APPROX, 2)} months) are not counted in whole-year EOSB. ` +
        `Confirm whether the partial period should be included per the contract.`
      );
      requiresHrReview = true;
    }

    return {
      eosbAmount:              eosbAmount,
      eosbResignationFraction: 1,
      components: {
        yearsOfService:       round(years, 3),
        dailyWage:            round(totalMonthlySalary / DAYS_PER_MONTH_APPROX, 2),
        halfSalaryPerYear:    halfMonthSalary,
        totalYearsCalculated: round(years, 3),
        eosbFraction:        eosbFraction,
      },
      warnings,
      requiresHrReview,
    };
  }

  // Fallback — unknown reason
  warnings.push("Unknown separation reason — please select a reason before calculating.");
  return {
    eosbAmount: 0,
    eosbResignationFraction: 0,
    components: {
      yearsOfService:       round(years, 3),
      dailyWage:            round(totalMonthlySalary / DAYS_PER_MONTH_APPROX, 2),
      halfSalaryPerYear:    halfMonthSalary,
      totalYearsCalculated: round(years, 3),
      eosbFraction:        0,
    },
    warnings,
    requiresHrReview: true,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function applyTenureBracket(
  years: number,
  halfMonthSalary: number,
  warnings: string[]
): number {
  const fraction = lookupFraction(years, EOSB_TENURE_TABLE);
  const amount   = round(halfMonthSalary * fraction * years, 2);
  if (years < 2) warnings.push("Service period under 2 years — EOSB is zero.");
  if (years >= 10) warnings.push("Service period 10+ years — full EOSB applies.");
  return amount;
}

function lookupFraction(years: number, table: { minYears: number; fraction: number }[]): number {
  for (const row of table) {
    if (years >= row.minYears) return row.fraction;
  }
  return 0;
}

function calculateTenure(
  hireDate: string,
  terminationDate: string
): { years: number; days: number; totalDays: number } {
  const hire        = new Date(hireDate);
  const term       = new Date(terminationDate);
  const totalMs    = term.getTime() - hire.getTime();
  const totalDays  = Math.max(0, Math.floor(totalMs / (1000 * 60 * 60 * 24)));
  const years      = totalDays / DAYS_PER_YEAR_APPROX;
  const days       = totalDays % Math.floor(DAYS_PER_YEAR_APPROX);
  return { years, days, totalDays };
}

function round(value: number, decimals = 2): number {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}
