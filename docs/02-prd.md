# UDS-HR
## Product Requirements Document v5.0
### AI-Native Saudi HR & Payroll Platform for MSMEs

Date: 11 July 2026
Classification: Confidential
Status: Enhanced for engineering handoff (Claude Code ready)

---

## Document Control

| Version | Date | Change | Source |
|---|---|---|---|
| 2.0 | 11 Jul 2026 | Original 13-section PRD | Founding team |
| 3.0 | 11 Jul 2026 | Added 7 new sections (NFR, Accessibility, Pricing, SLA, RACI, Migration, Legal Docs), enhanced 5 existing sections (AI risk tiering, API failure playbook, security verification levels, data retention/RTO-RPO, go-live ownership) | Gap analysis against ISO 29148, ISO 27001, OWASP ASVS, WCAG 2.1 AA, PDPL, NIST AI RMF |
| 4.0 | 11 Jul 2026 | Added 13 new features closing HR generalist coverage gaps across all phases of recruitment, retention, and release (workforce planning, referrals, background/reference checks, 30/60/90 onboarding, succession planning, internal mobility, total rewards, recognition, stay interviews, employee relations, career pathing, alumni/boomerang tracking), plus new Section 21 | Research against SHRM Body of Applied Skills and Knowledge, full-cycle recruitment life cycle research, retention framework research (5 C's, total rewards), offboarding/alumni best-practice research |
| 4.1 | 11 Jul 2026 | Renamed product from NoonHR to UDS-HR throughout the document: title, body references, portal wireframe headers, career page domain (company.noonhr.com to company.uds-hr.com), and all table references. No functional or scope changes | Rename request |
| 5.0 | 11 Jul 2026 | Added Section 13.5, Data Structure & Entity Model: 45 entities across 12 domains, a core ERD, domain-grouped entity reference tables, a representative Prisma schema pattern, and indexing notes. Every entity traces back to a feature already defined in Sections 5-20; none are speculative | Brainstorm pass across every feature in the document, cross-checked against the tech stack (Section 4) and multi-tenancy model (Section 13.2) |

---

## Table of Contents

1. Product Overview
2. Non-Functional Requirements
3. Portal & Login System
4. Tech Stack (adapted: tRPC + Drizzle per implementation stack)
5. Feature Plan, Five Phases
6. AI-Native Intelligence Layer
7. Autonomous HR Workflows
8. Compliance Plan
9. Application Security Plan
10. Data Security Plan
11. Accessibility Requirements (WCAG 2.1 AA)
12. UI/UX Plan, All Portals
13. Backend Architecture
14. Scale-Up Plan
15. Pricing & Packaging
16. SLA & Support Model
17. RACI & Ownership Matrix
18. Onboarding & Data Migration Plan
19. Legal Documents Reference
20. Go-Live Checklist
21. HR Generalist Practice Alignment

---

[Full PRD content follows the original document provided...]
