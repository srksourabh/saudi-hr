import type { HijriDate, GregorianDate } from "./format";

const JULIAN_EPOCH = 1948439.5; // Julian day number for 1 Muharram 1 AH

function toJulianDay(gregorian: GregorianDate): number {
  const { year, month, day } = gregorian;
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function fromJulianDay(jdn: number): GregorianDate {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return { year, month, day };
}

function hijriToJulianDay(hijri: HijriDate): number {
  const { year, month, day } = hijri;
  return (
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    JULIAN_EPOCH -
    1
  );
}

function julianDayToHijri(jdn: number): HijriDate {
  const daysSinceEpoch = jdn - JULIAN_EPOCH + 1;
  const year = Math.floor((30 * daysSinceEpoch + 10646) / 10631);
  const dayOfYear = daysSinceEpoch - Math.floor((29 + 11 * year) / 30) - 354 * (year - 1);
  let month = Math.ceil(dayOfYear / 29.5);
  if (month < 1) month = 1;
  if (month > 12) month = 12;
  const day = dayOfYear - Math.floor(29.5 * (month - 1));
  return { year, month, day };
}

export function gregorianToHijri(gregorian: GregorianDate): HijriDate {
  const jdn = toJulianDay(gregorian);
  return julianDayToHijri(jdn);
}

export function hijriToGregorian(hijri: HijriDate): GregorianDate {
  const jdn = hijriToJulianDay(hijri);
  return fromJulianDay(jdn);
}

export function todayHijri(): HijriDate {
  const today = new Date();
  return gregorianToHijri({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  });
}

export function isLeapHijriYear(year: number): boolean {
  return (11 * year + 14) % 30 < 11;
}

export function daysInHijriMonth(year: number, month: number): number {
  if (month === 12) {
    return isLeapHijriYear(year) ? 30 : 29;
  }
  return month % 2 === 1 ? 30 : 29;
}