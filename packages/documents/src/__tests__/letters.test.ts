import { describe, it, expect } from "vitest";
import {
  generateSalaryCertificate,
  generateExperienceLetter,
  generateFinalSettlementStatement,
} from "../letters";

const company = { nameEn: "Rukn Energy", nameAr: "شركة ركن الطاقة", crNumber: "1010000000" };
const emp = {
  fullName: "Omar Al-Dossary",
  nationalId: "1234567890",
  position: "Engineer",
  department: "Operations",
  joinDate: "2020-03-15",
  basicSalary: 10000,
  housingAllowance: 3000,
  transportAllowance: 1000,
};

function assertNoPlaceholders(html: string) {
  expect(html).not.toMatch(/\{\{|\}\}|PLACEHOLDER|TODO|undefined|NaN/);
}

describe("HR document generation (DOC-001..003)", () => {
  it("salary certificate merges data, is bilingual, marks Arabic prevailing, no placeholders", () => {
    const html = generateSalaryCertificate(company, emp);
    expect(html).toContain("Omar Al-Dossary");
    expect(html).toContain("شركة ركن الطاقة"); // Arabic company name present
    expect(html).toContain("SAR 14,000.00"); // total = 10000+3000+1000
    expect(html).toMatch(/prevail|المعتمدة/); // Arabic-prevails clause
    expect(html).toContain('dir'.length ? 'class="ar"' : ''); // has an RTL section
    assertNoPlaceholders(html);
  });

  it("experience letter includes the employment period and Article 64", () => {
    const html = generateExperienceLetter(company, emp, "2026-01-31");
    expect(html).toContain("2020-03-15");
    expect(html).toContain("2026-01-31");
    expect(html).toContain("Article 64");
    assertNoPlaceholders(html);
  });

  it("final settlement line items reconcile to the net payable (DOC-003)", () => {
    const { html, netPayable } = generateFinalSettlementStatement(
      company,
      emp,
      { eosbAmount: 51000, unpaidSalary: 7000, leaveEncashment: 22500, otherDues: 0, deductions: 1000 },
      "2026-01-31",
    );
    // 51000 + 7000 + 22500 + 0 - 1000 = 79500
    expect(netPayable).toBe(79500);
    expect(html).toContain("SAR 79,500.00");
    assertNoPlaceholders(html);
  });
});
