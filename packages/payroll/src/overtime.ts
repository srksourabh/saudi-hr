/**
 * Saudi Overtime Calculation Engine
 *
 * Legal basis: Saudi Labour Law Article 107 / Executive Regulations
 *
 * ⚠️  INTERNAL CALCULATION ENGINE
 *    Overtime must be approved in writing by the employee and employer.
 *    Compensatory leave (time off in lieu) may be agreed instead of overtime pay.
 *    This engine calculates the payroll amounts; leave balance management is
 *    handled by the attendance module.
 *
 * Saudi overtime rules (Article 107):
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ Ordinary hours  : max 8 h/day + 1 h/day overtime = 9 h effective  │
 * │ Daily ceiling   : 12 hours total (including overtime)              │
 * │ Weekly ceiling  : 60 hours overtime max                            │
 * │ Ordinary day OT: basic_hourly × 1.5                              │
 * │ Rest day OT    : basic_hourly × 1.5 (plus substitute day off)    │
 * │ Holiday OT     : basic_hourly × 1.5 (plus substitute day off)    │
 * │ Ramadan daytime: same rate as ordinary OT but night hours differ   │
 * │ Night work     : 10pm–6am additional premium (handled here)       │
 * └────────────────────────────────────────────────────────────────┘
 *
 * The ordinary daily working hours are 8.
 * Overtime = hours worked beyond 8 per day, capped at 4 (so max 12 total).
 * Weekly OT = total weekly hours beyond 48 (8h × 6 days), capped at 12.
 *
 * Ramadan note: daytime OT in Ramadan is at the same premium rate but
 * the working day is reduced by 1 hour (Article 163). Night hours
 * (10pm–6am) attract an additional premium per the Executive Reg.
 */

import type {
  OvertimeCalculation,
  OvertimeViolation,
} from "./types";

import {
  SAUDI_OVERTIME_RATES,
  OVERTIME_DAILY_CEIL,
  OVERTIME_WEEKLY_CEIL,
} from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDINARY_DAY_HOURS   = 8;
const DAYS_PER_WEEK        = 6; // Saudi work week (Sun–Thu or Sat–Thu depending on company)
const NIGHT_PREMIUM        = 0.50; // additional 50% on top of base overtime rate

// ─── Core Calculation ─────────────────────────────────────────────────────────

export interface OvertimeInput {
  /** Daily breakdown of overtime hours */
  dailyHours: {
    ordinary:    number; // hours worked beyond 8 on a normal working day
    restDay:     number; // hours worked on the designated weekly rest day
    holiday:     number; // hours worked on an official public holiday
    ramadanDay:  number; // hours worked on a Ramadan daytime (reduced 1hr ordinary shift)
  };
  /** Whether any hours were worked between 10pm and 6am */
  nightHoursWorked?: number;
  /** Employee's monthly basic salary (used to derive hourly rate) */
  basicSalary: number;
  /** Housing allowance — NOT included in OT base */
  housingAllowance?: number;
  /** Transport allowance — NOT included in OT base */
  transportAllowance?: number;
}

export function calculateOvertime(input: OvertimeInput): OvertimeCalculation {
  const { dailyHours, nightHoursWorked = 0, basicSalary } = input;

  const hourlyWage = deriveHourlyWage(basicSalary);
  const rates     = SAUDI_OVERTIME_RATES;

  const violations: OvertimeViolation[] = [];

  // ── Per-day overtime cap checks ──────────────────────────────────────
  for (const [dayType, hours] of Object.entries(dailyHours) as [string, number][]) {
    if (dayType === "ordinary" && hours > OVERTIME_DAILY_CEIL - ORDINARY_DAY_HOURS) {
      violations.push({
        type:    "daily_exceeded",
        message: `Daily overtime ceiling exceeded: ${hours}h claimed (max ${OVERTIME_DAILY_CEIL - ORDINARY_DAY_HOURS}h)`,
        detail:  "Ceiling is 12 hours/day total. Any excess must be compensated as compensatory leave.",
      });
    }
  }

  // ── Weekly ceiling ────────────────────────────────────────────────────
  const totalWeeklyOt = Object.values(dailyHours).reduce((a, b) => a + b, 0);
  if (totalWeeklyOt > OVERTIME_WEEKLY_CEIL) {
    violations.push({
      type:    "weekly_exceeded",
      message: `Weekly overtime ceiling exceeded: ${totalWeeklyOt}h total (max ${OVERTIME_WEEKLY_CEIL}h)`,
      detail:  "Ceiling is 60 hours/week. Any excess must be compensated as compensatory leave.",
    });
  }

  // ── Ordinary day overtime amount ──────────────────────────────────────
  const ordinaryAmount = round(
    hourlyWage * rates.ordinary * dailyHours.ordinary
  );

  // ── Rest day overtime amount ───────────────────────────────────────────
  // Article 107: overtime on rest day is 50% premium (same as ordinary OT rate)
  // plus the employee is entitled to a substitute rest day
  const restDayAmount = round(
    hourlyWage * rates.restDay * dailyHours.restDay
  );
  if (dailyHours.restDay > 0) {
    violations.push({
      type:    "rest_day_overtime_unpaid",
      message: "Rest day overtime worked — employee is entitled to a substitute rest day in addition to the OT pay.",
      detail:  "Document the substitute rest day in the attendance record.",
    });
  }

  // ── Public holiday overtime amount ────────────────────────────────────
  // Same rate as ordinary (1.5×) PLUS a substitute rest day
  const holidayAmount = round(
    hourlyWage * rates.holiday * dailyHours.holiday
  );

  // ── Ramadan day overtime ───────────────────────────────────────────────
  // In Ramadan, ordinary working hours are reduced by 1 hour (Article 163).
  // So OT threshold is 7 hours instead of 8.
  // The premium rate is the same (1.5×).
  const ramadanAmount = round(
    hourlyWage * rates.ramadanDay * dailyHours.ramadanDay
  );

  // ── Night work premium ────────────────────────────────────────────────
  // 10pm–6am gets an additional 50% on top of the base hourly wage.
  // This is separate from the overtime premium and applies to ALL night hours,
  // not just overtime hours.
  const nightPremiumPerHour = hourlyWage * NIGHT_PREMIUM;
  const nightAmount = round(nightPremiumPerHour * nightHoursWorked);

  // ── Total ─────────────────────────────────────────────────────────────
  const totalAmount = round(
    ordinaryAmount + restDayAmount + holidayAmount + ramadanAmount + nightAmount
  );

  return {
    hours: {
      ordinary:   dailyHours.ordinary,
      restDay:   dailyHours.restDay,
      holiday:   dailyHours.holiday,
      ramadanDay: dailyHours.ramadanDay,
    },
    amounts: {
      ordinary:   ordinaryAmount,
      restDay:   restDayAmount,
      holiday:   holidayAmount,
      ramadanDay: ramadanAmount,
    },
    violations,
    totalAmount,
    nightAmount,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derives the hourly wage from the monthly basic salary.
 * Note: housing and transport are EXCLUDED from the OT base per Saudi law.
 * (GOSI base includes housing, but OT base does NOT.)
 */
function deriveHourlyWage(basicMonthlySalary: number): number {
  // Saudi working week: 6 days × 8 hours = 48 hours
  // Monthly working hours = 48 × 52 weeks / 12 months ≈ 208 hours
  const MONTHLY_HOURS = (DAYS_PER_WEEK * ORDINARY_DAY_HOURS * 52) / 12; // ≈ 208
  return round(basicMonthlySalary / MONTHLY_HOURS, 4);
}

function round(value: number, decimals = 2): number {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}
