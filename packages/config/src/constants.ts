export const APP_NAME = "HRMS App";
export const APP_NAME_SLUG = "hrms-app";

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const RATE_LIMIT = {
  AUTH: { points: 10, duration: 1 },
  API: { points: 100, duration: 1 },
} as const;

export const BRUTE_FORCE = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_MINUTES: 15,
} as const;

export const SESSION = {
  MAX_AGE_DAYS: 30,
} as const;

export const COOKIE_NAMES = {
  SESSION: "hrms-app.session-token",
  CSRF: "hrms-app.csrf-token",
} as const;
