/**
 * Saudi contract conversion & expat contract rules.
 *
 * - Limited (fixed-term) → Unlimited conversion (Article 55): a Saudi
 *   employee's fixed-term contract becomes unlimited after 3 renewals OR
 *   4 years of continuous service, whichever comes first. Expats never convert.
 * - Expats (Article 37): must be on a written fixed-term contract, never
 *   unlimited; a fixed-term contract with no stated duration defaults to
 *   12 months.
 */

export type Nationality = "saudi" | "expat" | "gcc";
export type ContractKind = "limited" | "unlimited";

export interface ConversionInput {
  nationality: Nationality;
  contractKind: ContractKind;
  /** Number of times the fixed-term contract has been renewed. */
  renewalCount: number;
  /** Continuous years of service on the contract. */
  yearsOfService: number;
}

export interface ConversionResult {
  converts: boolean;
  /** True when close to the threshold — surface a pre-conversion alert. */
  approaching: boolean;
  reason: string;
}

const RENEWAL_THRESHOLD = 3;
const YEARS_THRESHOLD = 4;

export function evaluateContractConversion(input: ConversionInput): ConversionResult {
  if (input.contractKind === "unlimited") {
    return { converts: false, approaching: false, reason: "Already an unlimited contract." };
  }
  if (input.nationality !== "saudi") {
    // Art 37: expats stay fixed-term and never auto-convert.
    return { converts: false, approaching: false, reason: "Only Saudi contracts convert to unlimited (Art 37)." };
  }

  const byRenewals = input.renewalCount >= RENEWAL_THRESHOLD;
  const byYears = input.yearsOfService >= YEARS_THRESHOLD;
  if (byRenewals || byYears) {
    return {
      converts: true,
      approaching: false,
      reason: byRenewals
        ? `Converts to unlimited: ${input.renewalCount} renewals (≥ ${RENEWAL_THRESHOLD}).`
        : `Converts to unlimited: ${input.yearsOfService} years of service (≥ ${YEARS_THRESHOLD}).`,
    };
  }

  // Pre-conversion alert: one renewal away, or within a year of the 4-year mark.
  const approaching = input.renewalCount >= RENEWAL_THRESHOLD - 1 || input.yearsOfService >= YEARS_THRESHOLD - 1;
  return {
    converts: false,
    approaching,
    reason: approaching
      ? "Approaching conversion (3 renewals or 4 years) — review before the next renewal."
      : "Stays limited.",
  };
}

export interface ExpatContractInput {
  nationality: Nationality;
  contractKind: ContractKind;
  /** Stated duration in months, if any. */
  durationMonths?: number | null;
}

export interface ExpatContractResult {
  ok: boolean;
  /** Effective duration in months after applying the default. */
  effectiveDurationMonths: number | null;
  error?: string;
}

const DEFAULT_EXPAT_DURATION_MONTHS = 12;

export function validateExpatContract(input: ExpatContractInput): ExpatContractResult {
  if (input.nationality === "saudi") {
    return { ok: true, effectiveDurationMonths: input.durationMonths ?? null };
  }
  // Expat / GCC: unlimited is not permitted (Art 37).
  if (input.contractKind === "unlimited") {
    return {
      ok: false,
      effectiveDurationMonths: null,
      error: "Expatriate employees must be on a fixed-term contract; unlimited is not permitted (Article 37).",
    };
  }
  // No stated duration → default to 12 months.
  const effective = input.durationMonths && input.durationMonths > 0 ? input.durationMonths : DEFAULT_EXPAT_DURATION_MONTHS;
  return { ok: true, effectiveDurationMonths: effective };
}
