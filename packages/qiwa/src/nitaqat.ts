/**
 * Nitaqat (Saudization) band engine — 2024+ rules.
 *
 * Key differences from the legacy flat-threshold model:
 *  - Entity-based: the required Saudization ratio scales with company size via
 *    a logarithmic curve (larger entities require a higher ratio).
 *  - No "Yellow" tier (removed in the 2024 Developed Nitaqat).
 *  - Only Qiwa-documented Saudi contracts count toward the ratio.
 *
 * The exact per-sector constants are published by MHRSD/Qiwa and must be
 * supplied (see `NitaqatSectorParams`); this module implements the curve and
 * banding, not the proprietary sector tables.
 */

export type NitaqatBand = "red" | "low_green" | "mid_green" | "high_green" | "platinum";

export interface NitaqatSectorParams {
  /** Minimum required Saudization ratio for the smallest size band (fraction). */
  baseRequired: number;
  /** How steeply the requirement rises with size (log coefficient). */
  sizeCoefficient: number;
  /** Ratio at/above which the entity is Platinum (fraction). */
  platinumRatio: number;
}

/** Sensible default curve; replace with the Qiwa sector table for production. */
export const DEFAULT_NITAQAT_PARAMS: NitaqatSectorParams = {
  baseRequired: 0.05,
  sizeCoefficient: 0.06,
  platinumRatio: 0.4,
};

export interface NitaqatInput {
  /** Saudi employees whose contracts are DOCUMENTED in Qiwa (undocumented excluded). */
  documentedSaudis: number;
  /** Total workforce headcount. */
  totalWorkforce: number;
  params?: NitaqatSectorParams;
}

export interface NitaqatResult {
  ratio: number;
  requiredRatio: number;
  band: NitaqatBand;
  /** True when the entity meets or exceeds the required ratio (Green or better). */
  compliant: boolean;
}

/**
 * Required Saudization ratio for a given workforce size, using a logarithmic
 * curve: required = base + coefficient * ln(size). Capped below the platinum
 * ratio so the requirement is always achievable.
 */
export function requiredSaudizationRatio(totalWorkforce: number, params = DEFAULT_NITAQAT_PARAMS): number {
  if (totalWorkforce <= 0) return params.baseRequired;
  const raw = params.baseRequired + params.sizeCoefficient * Math.log(totalWorkforce);
  const capped = Math.min(raw, params.platinumRatio - 0.01);
  return Math.round(Math.max(params.baseRequired, capped) * 1000) / 1000;
}

export function computeNitaqatBand(input: NitaqatInput): NitaqatResult {
  const params = input.params ?? DEFAULT_NITAQAT_PARAMS;
  const total = Math.max(0, input.totalWorkforce);
  const ratio = total === 0 ? 0 : Math.round((input.documentedSaudis / total) * 1000) / 1000;
  const requiredRatio = requiredSaudizationRatio(total, params);

  let band: NitaqatBand;
  if (ratio >= params.platinumRatio) {
    band = "platinum";
  } else if (ratio < requiredRatio) {
    band = "red";
  } else {
    // Green sub-bands by how far above the requirement (no Yellow tier).
    const over = ratio - requiredRatio;
    const room = Math.max(0.0001, params.platinumRatio - requiredRatio);
    const frac = over / room;
    band = frac >= 0.66 ? "high_green" : frac >= 0.33 ? "mid_green" : "low_green";
  }

  return { ratio, requiredRatio, band, compliant: band !== "red" };
}
