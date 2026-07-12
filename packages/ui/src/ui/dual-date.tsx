"use client";

import { formatDual, formatGregorian, formatHijri, parseDateString, gregorianToHijri } from "@hrms-app/date";

interface DualDateProps {
  date: string | Date;
  locale?: "ar" | "en";
  className?: string;
}

export function DualDate({ date, locale = "ar", className = "" }: DualDateProps) {
  const dateObj = typeof date === "string" ? parseDateString(date) : {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };

  if (!dateObj) return <span className={className}>Invalid date</span>;

  const hijri = gregorianToHijri(dateObj);
  const formatted = formatDual(dateObj, hijri, locale);

  return <span className={className}>{formatted}</span>;
}

interface HijriDateOnlyProps {
  date: string | Date;
  locale?: "ar" | "en";
  className?: string;
}

export function HijriDateOnly({ date, locale = "ar", className = "" }: HijriDateOnlyProps) {
  const dateObj = typeof date === "string" ? parseDateString(date) : {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };

  if (!dateObj) return <span className={className}>Invalid date</span>;

  const hijri = gregorianToHijri(dateObj);
  const formatted = formatHijri(hijri, locale);

  return <span className={className}>{formatted}</span>;
}

interface GregorianDateOnlyProps {
  date: string | Date;
  locale?: "ar" | "en";
  className?: string;
}

export function GregorianDateOnly({ date, locale = "ar", className = "" }: GregorianDateOnlyProps) {
  const dateObj = typeof date === "string" ? parseDateString(date) : {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };

  if (!dateObj) return <span className={className}>Invalid date</span>;

  const formatted = formatGregorian(dateObj, locale);

  return <span className={className}>{formatted}</span>;
}