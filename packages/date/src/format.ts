export interface HijriDate {
  year: number;
  month: number;
  day: number;
}

export interface GregorianDate {
  year: number;
  month: number;
  day: number;
}

export const HIJRI_MONTH_NAMES_AR = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الثاني",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
];

export const HIJRI_MONTH_NAMES_EN = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qi'dah",
  "Dhu al-Hijjah",
];

export const GREGORIAN_MONTH_NAMES_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export const GREGORIAN_MONTH_NAMES_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatHijri(date: HijriDate, locale: "ar" | "en" = "ar"): string {
  const monthNames = locale === "ar" ? HIJRI_MONTH_NAMES_AR : HIJRI_MONTH_NAMES_EN;
  return `${date.day} ${monthNames[date.month - 1]} ${date.year} هـ`;
}

export function formatGregorian(date: GregorianDate, locale: "ar" | "en" = "ar"): string {
  const monthNames = locale === "ar" ? GREGORIAN_MONTH_NAMES_AR : GREGORIAN_MONTH_NAMES_EN;
  return `${date.day} ${monthNames[date.month - 1]} ${date.year} م`;
}

export function formatDual(date: GregorianDate, hijriDate: HijriDate, locale: "ar" | "en" = "ar"): string {
  return `${formatGregorian(date, locale)} | ${formatHijri(hijriDate, locale)}`;
}

export function parseDateString(dateStr: string): GregorianDate | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}