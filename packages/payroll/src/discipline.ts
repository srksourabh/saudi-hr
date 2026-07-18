/**
 * Saudi Discipline & Employee Relations Engine
 *
 * Implements the Saudi Labour Law disciplinary framework:
 *  - Verbal / Written Warning / Final Warning / Fine / Suspension / Dismissal
 *  - Article 57 investigation requirements
 *  - Article 80 / 81 grounds for termination with pay / without pay
 *  - Article 84: Disciplinary fines and deductions
 *  - Grievance and appeal rights (30-day window)
 *  - Nitaqat compliance guardrails
 *
 * Key principles:
 *  1. Progressive discipline — escalation ladder must be followed
 *  2. Proportionality — sanction must fit the offence
 *  3. Investigation before major sanction (Article 57)
 *  4. Written notice of sanction with grounds
 *  5. Right to defence before dismissal
 *
 * Usage:
 *   const dc = new DisciplineEngine(employee, asOfDate);
 *   dc.checkSanction("sick_no_show_3_days"); // → recommended sanction + reasoning
 *   dc.clockStatus(employee.id);              // → active clocks
 */

import { getActiveConfig } from "./regulatory-config";
import type { DisciplineConfig } from "./regulatory-config";
import type { NationalityCategory } from "./types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type OffenceCategory =
  | "absent_unauthorised"
  | "misconduct_violation"
  | "health_safety_breach"
  | "fraud_dishonesty"
  | "performance_failure"
  | "harassment_abuse"
  | "compliance_violation"
  | "data_breach"
  | "refusal_work"
  | "safety_violation";

export type SanctionLevel =
  | "verbal_warning"
  | "written_warning"
  | "final_warning"
  | "fine"
  | "suspension"
  | "dismissal_with_notice"
  | "dismissal_without_notice";

export interface Offence {
  category: OffenceCategory;
  description: string;
  date: string;      // ISO date when offence occurred
  evidence: string[]; // descriptions of supporting evidence
  witnessIds?: string[];
  /** Is a formal investigation (Article 57) required? */
  investigationRequired: boolean;
}

export interface DisciplinaryRecord {
  id: string;
  employeeId: string;
  offence: Offence;
  sanction: SanctionLevel;
  sanctionDetail: string;
  effectiveDate: string;
  /** HR manager who issued the sanction */
  issuedBy: string;
  /** Expiry date for warnings (warnings lapse after N days) */
  expiryDate?: string;
  /** Whether the employee acknowledged receipt */
  acknowledged: boolean;
  /** Appeal status */
  appealStatus?: "none" | "pending" | "upheld" | "overturned";
  appealDeadline?: string;
  createdAt: string;
}

export interface SanctionRecommendation {
  level: SanctionLevel;
  rationale: string;
  legalBasis: string;
  /** Fine amount if sanction is "fine" (SAR) */
  fineAmount?: number;
  /** Suspension days if sanction is "suspension" */
  suspensionDays?: number;
  /** Whether HR review / approval is required before issuing */
  requiresHrReview: boolean;
  /** Whether the employee must be given right to defence */
  requiresRightToDefence: boolean;
  /** Whether this dismissal requires Article 80 / 81 specific grounds */
  requiresArticle80_81Documentation: boolean;
  /** Warnings about Nitaqat / SLA status */
  nitaqatWarnings: string[];
}

export interface ClockStatus {
  /** Days since last sanction was issued */
  daysSinceLastSanction: number;
  /** Days until the final warning expires (if any) */
  daysUntilWarningExpiry: number | null;
  /** Whether there is an open investigation */
  investigationOpen: boolean;
  /** Whether 30-day appeal window is still open */
  appealWindowOpen: boolean;
  /** Cumulative sanctions in the current year */
  sanctionsThisYear: number;
}

// ─── Saudi Discipline Engine ───────────────────────────────────────────────────

export class DisciplineEngine {
  private employee: {
    id: string;
    nationality: NationalityCategory;
    employmentStatus: string;
    hireDate: string;
    salaryBasic: number;
    salaryHousing: number;
    salaryTransport: number;
  };
  private asOfDate: string;
  private disciplineConfig: DisciplineConfig;

  constructor(
    employee: DisciplineEngine["employee"],
    asOfDate: string = new Date().toISOString().split("T")[0] as string
  ) {
    this.employee = employee;
    this.asOfDate = asOfDate;
    const cfg = getActiveConfig("saudi", asOfDate);
    if (!cfg) throw new Error(`No Saudi regulatory config found for ${asOfDate}`);
    this.disciplineConfig = cfg.discipline;
  }

  // ─── Offence Catalogue ─────────────────────────────────────────────────────

  /**
   * Classify an offence and return the recommended sanction level.
   * Uses the progressive discipline ladder:
   *  verbal → written → final warning → fine → suspension → dismissal
   *
   * Escalation factors:
   *  - Multiple occurrences of same offence category within 12 months
   *  - Aggravating factors (harm, dishonesty, breach of trust)
   *  - Employee's prior disciplinary record
   */
  classifyOffence(
    offence: Offence,
    priorSanctions: SanctionLevel[] = []
  ): SanctionRecommendation {
    const base = this.recommendBaseSanction(offence.category);
    const priorCount = priorSanctions.filter(
      (s) => s === base.level
    ).length;

    let level = base.level;
    let rationale = base.rationale;

    // Escalate if repeated offence
    if (priorCount > 0) {
      level = this.escalate(level, priorCount);
      rationale = `Repeated ${offence.category} within 12 months (prior occurrence #${priorCount + 1}). ${rationale}`;
    }

    // Aggravating factors
    const isAggravated = offence.evidence.some(
      (e) => /fraud|dishonest| forged| misappropriation/i.test(e)
    );
    if (isAggravated) {
      if (level === "verbal_warning") level = "written_warning";
      else if (level === "written_warning") level = "final_warning";
      else if (level === "final_warning") level = "suspension";
      rationale += " Aggravating factor: evidence of fraud or dishonesty — escalation applied.";
    }

    // Article 80 / 81 mandatory dismissal documentation
    const article80_81 = this.checkArticle80_81(offence.category);
    if (article80_81.mandatory) {
      level = "dismissal_without_notice";
      rationale += ` ${article80_81.legalBasis} applies — dismissal without notice is mandatory.`;
    }

    const fineAmount = level === "fine"
      ? this.computeFine()
      : undefined;

    const suspensionDays = level === "suspension"
      ? this.computeSuspensionDays(offence)
      : undefined;

    return {
      level,
      rationale,
      legalBasis: article80_81.legalBasis || this.legalBasisFor(level, offence.category),
      fineAmount,
      suspensionDays,
      requiresHrReview: level !== "verbal_warning",
      requiresRightToDefence: ["final_warning", "suspension", "dismissal_with_notice", "dismissal_without_notice"].includes(level),
      requiresArticle80_81Documentation: article80_81.mandatory,
      nitaqatWarnings: this.nitaqatWarnings(level),
    };
  }

  // ─── Article 80 / 81 Termination ───────────────────────────────────────────

  /**
   * Check whether an offence category constitutes grounds for
   * Article 80 (termination with notice) or Article 81 (summary dismissal
   * without notice / salary in lieu).
   *
   * Article 80 — employer may terminate with notice and full EOSB:
   *  - Employee's conduct makes him unsuitable for continued employment
   *  - Article 80(1) through (7) enumerate specific grounds
   *
   * Article 81 — employer may dismiss without notice and without EOSB:
   *  - Assault or attempted assault on employer / manager
   *  - Wilful misconduct causing work stoppage > 10 days
   *  - Absence without valid excuse for > 30 consecutive days
   *  - Absence for > 15 non-consecutive days in a 12-month period
   *  - Conviction for theft / breach of trust / habitual drunkenness
   *  - Forgery / fraud
   *  - Wilful breach of work regulations
   *  - Disclosure of confidential information
   *
   * Article 84 — disciplinary fines (cannot exceed 5 days' wages per incident,
   *    cumulative cannot exceed 10% of monthly salary per month)
   */
  checkArticle80_81(category: OffenceCategory): {
    applies: boolean;
    article: "80" | "81";
    mandatory: boolean;
    legalBasis: string;
  } {
    const article81_offences: OffenceCategory[] = [
      "absent_unauthorised",   // 30 consecutive / 15 non-consecutive days
      "fraud_dishonesty",      // theft, forgery, breach of trust
      "misconduct_violation",  // assault, insubordination with violence
      "compliance_violation",  // disclosure of trade secrets
    ];

    if (article81_offences.includes(category)) {
      return {
        applies: true,
        article: "81",
        mandatory: true,
        legalBasis: "Article 81 of the Saudi Labour Law — gross misconduct",
      };
    }

    const article80_offences: OffenceCategory[] = [
      "performance_failure",
      "misconduct_violation",
      "health_safety_breach",
    ];

    if (article80_offences.includes(category)) {
      return {
        applies: true,
        article: "80",
        mandatory: false,
        legalBasis: "Article 80 of the Saudi Labour Law — termination for cause with notice",
      };
    }

    return { applies: false, article: "80", mandatory: false, legalBasis: "" };
  }

  // ─── Fine Calculation ────────────────────────────────────────────────────────

  /**
   * Article 84: Individual fine cannot exceed 5 days' wages.
   * Cumulative fines per month cannot exceed 10% of monthly salary.
   * Returns the maximum fine amount in SAR.
   */
  computeFine(): number {
    const monthlySalary = this.employee.salaryBasic + this.employee.salaryHousing + this.employee.salaryTransport;
    const dailyWage = monthlySalary / 30;
    const perIncident = dailyWage * 5;
    const monthlyCap = monthlySalary * this.disciplineConfig.maxFinePercentOfMonthly;
    return Math.min(perIncident, monthlyCap);
  }

  /**
   * Suspension cannot exceed 15 days per incident (Article 84).
   * Suspensions are unpaid unless contract states otherwise.
   */
  computeSuspensionDays(offence: Offence): number {
    // Serious offences (fraud, assault, data breach) → up to 15 days
    if (this.checkArticle80_81(offence.category).applies) {
      return Math.min(15, this.disciplineConfig.maxSuspensionDays);
    }
    // Standard misconduct → up to 5 days
    return Math.min(5, this.disciplineConfig.maxSuspensionDays);
  }

  // ─── Clock / Deadline Tracking ───────────────────────────────────────────────

  /**
   * Returns the status of active disciplinary clocks.
   * Used by the HR dashboard to highlight approaching deadlines.
   */
  clockStatus(
    lastSanctionDate: string | null,
    finalWarningExpiryDate: string | null,
    investigationOpen: boolean,
    sanctionsIssuedThisYear: number
  ): ClockStatus {
    const now = new Date(this.asOfDate);
    const daysSince = lastSanctionDate
      ? Math.round((now.getTime() - new Date(lastSanctionDate).getTime()) / (1000 * 60 * 60 * 24))
      : -1;

    const daysUntilExpiry = finalWarningExpiryDate
      ? Math.round((new Date(finalWarningExpiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const appealWindowOpen = lastSanctionDate
      ? Math.round((now.getTime() - new Date(lastSanctionDate).getTime()) / (1000 * 60 * 60 * 24)) <= this.disciplineConfig.appealWindowDays
      : false;

    return {
      daysSinceLastSanction: daysSince,
      daysUntilWarningExpiry: daysUntilExpiry,
      investigationOpen,
      appealWindowOpen,
      sanctionsThisYear: sanctionsIssuedThisYear,
    };
  }

  /**
   * Verify that a dismissal is legally defensible.
   * Returns an array of compliance gaps (empty = dismissal is clean).
   */
  validateDismissal(
    sanction: SanctionLevel,
    investigationConcluded: boolean,
    employeeHadRightToDefence: boolean,
    writtenNoticeProvided: boolean,
    article80_81_doc: boolean
  ): { valid: boolean; gaps: string[] } {
    const gaps: string[] = [];

    if (sanction === "dismissal_without_notice") {
      if (!article80_81_doc) {
        gaps.push("Dismissal without notice (Article 81) requires explicit documentation of gross misconduct grounds.");
      }
      if (!investigationConcluded) {
        gaps.push("Article 57 requires a formal investigation to be concluded before dismissal.");
      }
      if (!writtenNoticeProvided) {
        gaps.push("Written notice of dismissal and grounds must be provided to the employee.");
      }
    }

    if (sanction === "dismissal_with_notice") {
      if (!employeeHadRightToDefence) {
        gaps.push("Employee must be given the right to defend themselves before dismissal under Article 80.");
      }
      if (!writtenNoticeProvided) {
        gaps.push("Written notice of termination and grounds must be provided.");
      }
    }

    if (sanction === "suspension") {
      if (!investigationConcluded) {
        gaps.push("Suspension pending investigation requires Article 57 investigation to be concluded within 30 days.");
      }
    }

    if (!writtenNoticeProvided) {
      gaps.push("All sanctions require written notice to the employee.");
    }

    return { valid: gaps.length === 0, gaps };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private recommendBaseSanction(category: OffenceCategory): Omit<SanctionRecommendation, "requiresHrReview" | "requiresRightToDefence" | "requiresArticle80_81Documentation" | "nitaqatWarnings"> {
    switch (category) {
      case "absent_unauthorised":
        return {
          level: "written_warning",
          rationale: "Unauthorised absence from work. First instance: written warning with request for explanation.",
          legalBasis: "Article 80 / Saudi Labour Law — unsanctioned absence",
          fineAmount: undefined,
          suspensionDays: undefined,
        };

      case "misconduct_violation":
        return {
          level: "written_warning",
          rationale: "Workplace misconduct. Assess whether it is a first or repeat offence to determine escalation.",
          legalBasis: "Article 80(1) — conduct making employee unsuitable",
          fineAmount: undefined,
          suspensionDays: undefined,
        };

      case "health_safety_breach":
      case "safety_violation":
        return {
          level: "final_warning",
          rationale: "Health and safety breach — immediate escalation given potential liability. Article 84 / OSH regulations.",
          legalBasis: "Article 84 / OSH Law — endangering self or others",
          fineAmount: undefined,
          suspensionDays: undefined,
        };

      case "fraud_dishonesty":
        return {
          level: "dismissal_without_notice",
          rationale: "Fraud or dishonesty — summary dismissal without notice under Article 81.",
          legalBasis: "Article 81 — theft, forgery, breach of trust",
          fineAmount: undefined,
          suspensionDays: undefined,
        };

      case "performance_failure":
        return {
          level: "verbal_warning",
          rationale: "Performance failure: start with verbal warning, escalate only if PIP fails.",
          legalBasis: "Article 80 — unsuitability for continued employment",
          fineAmount: undefined,
          suspensionDays: undefined,
        };

      case "harassment_abuse":
        return {
          level: "suspension",
          rationale: "Harassment / abuse: suspend immediately pending investigation (Article 57). Dismissal if proven.",
          legalBasis: "Article 3 of the anti-harassment law / Article 80",
          fineAmount: undefined,
          suspensionDays: 5,
        };

      case "compliance_violation":
        return {
          level: "final_warning",
          rationale: "Compliance violation (regulatory/statutory). Escalate to final warning and HR review.",
          legalBasis: "Article 80 / applicable regulatory framework",
          fineAmount: undefined,
          suspensionDays: undefined,
        };

      case "data_breach":
        return {
          level: "suspension",
          rationale: "Data breach: immediate suspension pending investigation. Dismissal if gross negligence confirmed.",
          legalBasis: "Article 81 — breach of trust / confidentiality",
          fineAmount: undefined,
          suspensionDays: 5,
        };

      case "refusal_work":
        return {
          level: "written_warning",
          rationale: "Unjustified refusal to perform assigned work. Document the instruction and refusal.",
          legalBasis: "Article 80(2) — deliberate insubordination",
          fineAmount: undefined,
          suspensionDays: undefined,
        };

      default:
        return {
          level: "verbal_warning",
          rationale: "Standard misconduct: verbal warning as entry point.",
          legalBasis: "Article 80 — general disciplinary framework",
          fineAmount: undefined,
          suspensionDays: undefined,
        };
    }
  }

  private escalate(level: SanctionLevel, priorCount: number): SanctionLevel {
    if (priorCount >= 2) return "dismissal_with_notice";
    const ladder: SanctionLevel[] = [
      "verbal_warning",
      "written_warning",
      "final_warning",
      "fine",
      "suspension",
      "dismissal_with_notice",
      "dismissal_without_notice",
    ];
    const idx = ladder.indexOf(level);
    return ladder[Math.min(idx + 1, ladder.length - 1)] as SanctionLevel;
  }

  private legalBasisFor(level: SanctionLevel, _category: OffenceCategory): string {
    switch (level) {
      case "verbal_warning":    return "Article 80 / internal disciplinary policy";
      case "written_warning":   return "Article 80 — written notice of misconduct";
      case "final_warning":    return "Article 80 — final warning with consequences explained";
      case "fine":             return "Article 84 — fine not exceeding 5 days' wages per incident";
      case "suspension":       return "Article 84 — unpaid suspension up to 15 days pending investigation";
      case "dismissal_with_notice": return "Article 80 — termination for cause with notice and full EOSB";
      case "dismissal_without_notice": return "Article 81 — summary dismissal for gross misconduct";
      default: return "";
    }
  }

  private nitaqatWarnings(level: SanctionLevel): string[] {
    const warnings: string[] = [];
    // If employee is Saudi and about to be dismissed, Nitaqat ratio may be affected
    if (level === "dismissal_without_notice" || level === "dismissal_with_notice") {
      warnings.push(
        "Nitaqat ratio impact: dismissing a Saudi employee may reduce your green-zone buffer. " +
        "Recruit a replacement within 90 days to maintain compliance."
      );
    }
    if (level === "suspension") {
      warnings.push("Suspension period does not count toward Nitaqat working days.");
    }
    return warnings;
  }
}
