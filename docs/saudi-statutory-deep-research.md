# Saudi statutory figures — deep-research reference

> **Authoritative scope.** This file is the working reference for the figures
> embedded into the Rukn Energy Services demo company (Tenants → `tenant_1ed8b6bd3743`).
> It cites the public statutes and government platforms that govern each figure.
> Whenever a rate or cap is mentioned, the source is given so an auditor can
> verify it; if the rate cannot be sourced to a statute, it is marked
> `TYPICAL` (industry-standard practice) rather than statutory.
>
> **Not legal advice.** Verify production rules with MHRSD, GOSI, Qiwa, Mudad,
> ZATCA, SDAIA, Jawazat / MOI, and qualified Saudi counsel before payroll or
> statutory submission.

---

## 1. GOSI (General Organization for Social Insurance)

Statutory authority: **Royal Decree M/33** (GOSI Law) and the Executive
Regulations; **Social Insurance Law amendments effective 1 July 2024** which
introduced a "new system" with escalating rates.

| Branch | Who pays | Rate (Jul 2026) | Statutory basis |
|---|---|---|---|
| GOSI pension — Saudi, old system (registered pre-Jul 2024) | Employee | 9.0% | GOSI Law pre-2024 amendments |
| GOSI pension — Saudi, old system | Employer | 10.0% | same |
| GOSI pension — Saudi, new system Jul 2024 | Employee | 11.0% | 2024 amendment, started at 9.5% in Mar 2024, +0.5% Jul 2024, +0.5% Jul 2025 |
| GOSI pension — Saudi, new system Jul 2025 | Employee | 11.5% | escalation step |
| GOSI pension — Saudi, new system Jul 2026 | Employee | 12.0% | escalation step |
| GOSI pension — Saudi, new system Jul 2026 | Employer | 12.0% | same |
| SANED (unemployment insurance) — Saudi only | Employer only | 1.0% | SANED regulations |
| Occupational hazards — Saudi only | Employer only | 2.0% | included in employer's new-system rate |
| Occupational hazards — Expatriates | Employer only | 2.0% | Royal Decree expanding occ.hazards coverage; standard office/light-industry rate |
| GOSI pension — Expatriates | — | 0% | expatriate pension is GOSI N/A |

**Calculation base.** Contributory base = `min(basic + housing, SAR 45,000)`.
Transport, bonuses, and allowances are **not** part of the base unless the
employer has registered them.

> **TYPICAL:** a large segment of Saudi employers round the contributory base
> to the nearest SAR 10. The orchestrator in this codebase rounds to 2 decimal
> places (`Math.round(x*100)/100`) per GOSI invoice convention.

### 1.1 What the seed uses

For each Saudi employee, the orchestrator reads the employee's
`gosiRegistrationDate`:

- registration date **< 2024-07-01** → "old system" rates (9%/10% pension + 1% SANED + 2% occ.haz)
- registration date **>= 2024-07-01** → "new system" rates (escalating from 11%/11%)
  - For our demo period (June 2026) the resolved rates are **11.5%/11.5%** (Jul 2025 step)
  - SANED 1% employer + occ.haz 2% employer always apply on top

For each expatriate, only the **occupational hazards** 2% employer applies.

This matches `packages/payroll/src/gosi.ts` exactly.

---

## 2. End-of-Service Benefits (EOSB / End-of-Service Award)

Statutory authority: **Saudi Labour Law** (Royal Decree M/51), Articles 84–90,
amended effective 1 July 2024. The 2024 amendments aligned expat and Saudi
EOSB and tightened resignation fractions.

| Branch | Tenure | Fraction of monthly wage |
|---|---|---|
| **Termination by employer (Article 80)** | < 2 years | 0 |
| Termination by employer | 2 – 5 years | half-month per year |
| Termination by employer | 5 – 10 years | two-thirds-month per year (was: full-month for Saudis pre-2024) |
| Termination by employer | > 10 years | full-month per year |
| **Resignation by employee** | < 2 years | 0 (probation rule also applies) |
| Resignation | 2 – 5 years | 1/3 of EOSB |
| Resignation | 5 – 10 years | 2/3 of EOSB |
| Resignation | > 10 years | full EOSB |
| **Force majeure / death / mutual termination** | any | full EOSB |
| **Article 80 dismissal for cause** | any | 0 (subject to investigation) |

EOSB base = `basic + housing + transport` (monthly wage).

### 2.1 What the seed uses

For Priya Menon's notice period (last working day 2026-07-31, hire 2021-11-08):

- Tenure ≈ 4.7 years
- Resignation (her stated reason)
- Payable fraction = 1/3 (2–5 yr bracket)
- Monthly wage = 26,000 + 6,500 + 2,000 = 34,500
- Full EOSB = (34,500 / 2) × 4.7 ≈ **81,075 SAR**
- Payable (1/3) = **~27,025 SAR**

Our seed populates a higher illustrative amount (85,000) plus accrued leave
payout to cover other components. The exact figure must be confirmed by HR
before the final settlement is paid.

---

## 3. Mudad / WPS (Wage Protection System)

Statutory authority: **Mudad platform** (operated by SAMA via MHRSD).

- Every private-sector employer must disburse wages through a Saudi bank via
  the Mudad WPS file format.
- File is uploaded to **Mudad** at https://www.mudad.gov.sa.
- Submission deadline: **10th of each month** for prior-month wages (some
  sources say 5th; treat 10th as the safe date).
- Format: fixed-width or CSV depending on bank; bank signs the file.

The codebase ships a `MudadWageFile` generator in
`packages/payroll/src/mudad.ts` that produces an XML/CSV internal file marked
`INTERNAL_DEMO_ONLY — NOT FOR OFFICIAL SUBMISSION`. Each employee record has:

- `employeeId`, `fullName`, `iqamaNumber` (placeholder), `bankAccount` (placeholder)
- `basic`, `housing`, `transport`, `overtime`, `grossWage`
- `gosiEmployee`, `gosiEmployer`, `netPay`

### 3.1 What the seed does

For each completed payroll run, a Mudad file is generated with:

- Period = the run's `period_month`
- 12 employee records (or fewer if any are on notice)
- Totals matching the run's `total_amount`
- All IBANs / Iqama IDs marked `/* LIVE DATA REQUIRED */` — they must be
  pulled from the verified employee record before any real submission.

The `governmentIntegrations` panel in the dashboard shows the run as
"Mudad → file_validated → ready for bank signing" once the Mudad file is
generated.

---

## 4. Qiwa (MHRSD contract platform)

Statutory authority: **MHRSD Ministerial Resolution 766 of 1445H**.

- All employment contracts must be registered in Qiwa within 90 days of
  contract start.
- Contract changes (salary, role, location) must be updated within 10 working
  days.
- "Work-package" contracts are validated against MOL activity classification.
- Saudi employees require a **unified number** match across Qiwa, GOSI,
  Chamber of Commerce, and the Ministry of Interior.

The seed flags every employee with a synthetic Qiwa reference
(`QIW-MOCK-260713-01`) but never calls the live API.

---

## 5. Muqeem (residency)

Statutory authority: **Ministry of Interior / Jawazat**.

- Employer must sponsor every expatriate employee (Iqama).
- Iqama renewal: 90 / 60 / 30 / 7-day reminders; cannot renew an expired Iqama
  without an exit/re-entry or final-exit cycle.
- Final exit: cancels the Iqama and triggers GOSI / Muqeem deregistration.
- Exit/re-entry: 90-day maximum single trip, 180-day maximum within 12 months
  for some categories.
- Sponsor (employer) is liable for the expatriate's residency compliance.

The seed embeds iqamaExpiry / passportExpiry dates for every expatriate so the
document-renewal agent can raise alerts at 90/60/30 days.

---

## 6. Nitaqat band

Statutory authority: **MHRSD Nitaqat program** (re-launched in 2021 and
continuously updated).

- Each establishment is assigned a Nitaqat activity category (e.g. "Oil &
  gas field services") and a band: Platinum, Green High, Green Mid, Green
  Low, Yellow, Red.
- The band is based on the **Saudization ratio** of the establishment vs its
  activity target, weighted by occupation category.

For Rukn Energy Services:

- Activity = "Oil & gas field services and energy operations"
- Total workforce = 12 (10 Saudis + 2 expats)
- Saudi ratio = 10 / 12 = **83.3 %**
- Activities of this size / category typically target around 30 – 40 %
  Saudization.
- Effective band = **Platinum** (way above target).

This is rendered in the dashboard under "Nitaqat workspace" with a synthetic
Qiwa ref.

---

## 7. ZATCA (ZATCA e-invoicing for payroll)

Statutory authority: **ZATCA e-invoicing regulation** (effective 4 Dec 2021
phase 1, 1 Jan 2025 phase 2).

- Salary payslips themselves are **not** in scope of ZATCA e-invoicing
  (ZATCA targets goods and services invoices).
- However, **expense reimbursements** that trigger a VAT-able supplier invoice
  (e.g. client entertainment, hotel stays) are in scope and must carry the
  supplier's ZATCA-compliant QR code and counter-invoice hash.
- The seed records expense categories that may carry VAT implications
  (e.g. "Client workshop").

---

## 8. Worked hours and overtime

Saudi Labour Law Article 98–115:

- Ordinary workweek: **48 hours**, 8 hours / day.
- Maximum overtime: **720 hours / year** (60 / week ceiling), 12 / day
  ceiling.
- Friday is the weekly rest day (Muslim employees may swap to Saturday).
- Ramadan: **6 hours / day** ordinary hours (Article 163).

### 8.1 What the seed uses

| Shift | Hours/day | Days | Use |
|---|---|---|---|
| Corporate day | 8 (08:00–17:00, 1h break) | Sun–Thu | Riyadh HQ, Jubail office |
| Field rotation A | 12 (06:00–18:00, 1h break) | rolling 14 on / 7 off | Field Ops |
| Field rotation B | 12 (18:00–06:00, 1h break) | rolling 14 on / 7 off | Field Ops (Yousef) |
| Maintenance early | 8.5 (05:30–14:30, 0.75h break) | rotating | HSE / Dhahran |

---

## 9. Annual leave (Article 109)

- 21 days / year, plus **+9 additional days** for Saudis (total 30 days).
- Expatriates: 21 days / year.
- Accrues after the first 6 months; can be carried over per company policy
  (PRD caps at 0 days unless contractually agreed).
- Unused leave is **paid out** on EOSB at the final wage rate.

---

## 10. Statutory compliance score (workplace dashboard)

The dashboard composes a "Compliance Score" tile that combines:

- Qiwa contract sync status
- GOSI registration current
- Iqama / passport expiries
- Document-renewal alerts open
- Last Mudad submission acceptance

For Rukn Energy the score is rendered as **94 / 100** with notes:

- Qiwa sync: ✓ all 12 contracts in "in_force"
- GOSI: ✓ all Saudis registered, expats occ.hazards-only
- Iqamas: ⚠ 1 expiring in 60 days (Priya — but on notice, will exit)
- Documents: ⚠ 1 expiring in 30 days (HSE leadership cert for Fahad)
- Mudad: ✓ June file validated, awaiting bank acknowledgement

---

## Summary table for the demo period (June 2026)

| Item | Figure |
|---|---|
| Saudi GOSI rate (new system, Jul 2025 step) | 11.5% employee / 11.5% employer pension + 1% SANED + 2% occ.haz = **14.5% total employer** |
| Expat GOSI rate | 2% employer occ.haz only |
| GOSI contributory cap | SAR 45,000 / month |
| Mudad submission deadline | 10th of following month |
| EOSB base | basic + housing + transport |
| EOSB resignation 2–5 yrs | 1/3 of full |
| Annual leave — Saudi | 30 days |
| Annual leave — Expat | 21 days |
| Ordinary workweek | 48 hours |
| Ramadan ordinary hours | 6 hours / day |
| Nitaqat band (Rukn) | Platinum (83.3% Saudi vs ~30% target) |

These are the figures the demo dashboard should quote and that the seed
populates.
