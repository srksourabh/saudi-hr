import { describe, it, expect } from "vitest";
import {
  gregorianToHijri,
  hijriToGregorian,
  formatHijri,
  formatGregorian,
  formatDual,
  parseDateString,
  todayHijri,
  daysInHijriMonth,
  isLeapHijriYear,
} from "../index";

describe("gregorianToHijri / hijriToGregorian", () => {
  it("converts known dates correctly", () => {
    // Use a date in the middle of a Hijri month for better approximation
    const hijri = gregorianToHijri({ year: 2024, month: 8, day: 15 });
    expect(hijri.year).toBe(1446);
    expect(hijri.month).toBeGreaterThanOrEqual(1);
    expect(hijri.month).toBeLessThanOrEqual(12);
    expect(hijri.day).toBeGreaterThanOrEqual(1);
    expect(hijri.day).toBeLessThanOrEqual(30);

    // Round trip - should be close to original date (allow 2 day variance due to approximation)
    const back = hijriToGregorian(hijri);
    expect(back.year).toBe(2024);
    expect(back.month).toBe(8);
    expect(Math.abs(back.day - 15)).toBeLessThanOrEqual(2);
  });

  it("handles year boundaries", () => {
    const hijri = gregorianToHijri({ year: 2024, month: 1, day: 1 });
    expect(hijri.year).toBe(1445);
  });
});

describe("formatHijri", () => {
  it("formats Arabic correctly", () => {
    const formatted = formatHijri({ year: 1446, month: 1, day: 1 }, "ar");
    expect(formatted).toContain("1446");
    expect(formatted).toContain("محرم");
  });

  it("formats English correctly", () => {
    const formatted = formatHijri({ year: 1446, month: 9, day: 15 }, "en");
    expect(formatted).toContain("1446");
    expect(formatted).toContain("Ramadan");
  });
});

describe("formatGregorian", () => {
  it("formats Arabic correctly", () => {
    const formatted = formatGregorian({ year: 2024, month: 7, day: 15 }, "ar");
    expect(formatted).toContain("2024");
    expect(formatted).toContain("يوليو");
  });

  it("formats English correctly", () => {
    const formatted = formatGregorian({ year: 2024, month: 7, day: 15 }, "en");
    expect(formatted).toContain("2024");
    expect(formatted).toContain("July");
  });
});

describe("formatDual", () => {
  it("returns both formats separated by pipe", () => {
    const dual = formatDual(
      { year: 2024, month: 7, day: 15 },
      { year: 1446, month: 1, day: 10 },
      "ar"
    );
    expect(dual).toContain("|");
    expect(dual).toContain("محرم");
    expect(dual).toContain("يوليو");
  });
});

describe("parseDateString", () => {
  it("parses valid ISO date", () => {
    const parsed = parseDateString("2024-07-15");
    expect(parsed).toEqual({ year: 2024, month: 7, day: 15 });
  });

  it("returns null for invalid format", () => {
    expect(parseDateString("15-07-2024")).toBeNull();
    expect(parseDateString("2024/07/15")).toBeNull();
    expect(parseDateString("invalid")).toBeNull();
  });
});

describe("todayHijri", () => {
  it("returns a valid Hijri date", () => {
    const today = todayHijri();
    expect(today.year).toBeGreaterThan(1400);
    expect(today.month).toBeGreaterThanOrEqual(1);
    expect(today.month).toBeLessThanOrEqual(12);
    expect(today.day).toBeGreaterThanOrEqual(1);
    expect(today.day).toBeLessThanOrEqual(30);
  });
});

describe("daysInHijriMonth", () => {
  it("returns 30 for odd months except 12", () => {
    expect(daysInHijriMonth(1446, 1)).toBe(30);
    expect(daysInHijriMonth(1446, 3)).toBe(30);
    expect(daysInHijriMonth(1446, 5)).toBe(30);
  });

  it("returns 29 for even months", () => {
    expect(daysInHijriMonth(1446, 2)).toBe(29);
    expect(daysInHijriMonth(1446, 4)).toBe(29);
  });

  it("handles leap year for month 12", () => {
    expect(daysInHijriMonth(1446, 12)).toBe(29); // 1446 is not leap
    expect(daysInHijriMonth(1447, 12)).toBe(30); // 1447 is leap
  });
});

describe("isLeapHijriYear", () => {
  it("identifies leap years correctly", () => {
    // 1447 AH is a leap year (355 days)
    expect(isLeapHijriYear(1447)).toBe(true);
    // 1446 is not leap
    expect(isLeapHijriYear(1446)).toBe(false);
  });
});