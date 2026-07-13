import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "https://hrms-app-chi.vercel.app";
const OUT_DIR = "C:/Users/soura/Dropbox/AI/Projects/Saudi-HR/hrms-app/docs/customer-demo-manual/screenshots";
await mkdir(OUT_DIR, { recursive: true });

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const ROLE_BUTTONS = {
  admin: "HR Manager demo",
  hrSpecialist: "HR Specialist demo",
  departmentManager: "Department Manager demo",
  employee: "Employee demo",
};

const MODULES = [
  "people-organization",
  "company-onboarding",
  "payroll-settlement",
  "time-leave-attendance",
  "documents-certificates",
  "notifications-reports",
  "recruitment",
  "onboarding",
  "offboarding",
  "learning-skills",
  "benefits-rewards",
  "government-integrations",
  "nitaqat-compliance",
  "ai-intelligence",
  "performance-goals",
  "engagement-retention",
  "travel-expenses",
  "employee-relations",
  "mobile-self-service",
  "workflow-automation",
  "people-analytics",
  "integration-marketplace",
];

const ADMIN_DETAIL_ROUTES = [
  "/employees",
  "/employees/emp-reem",
  "/employees/new",
  "/departments",
  "/departments/dept-people",
  "/departments/new",
  "/payroll",
  "/payroll/new",
  "/leave",
  "/leave/new",
  "/documents",
  "/documents/upload",
  "/compliance",
  "/compliance/new",
  "/recruitment",
  "/recruitment/jobs",
  "/recruitment/candidates",
  "/recruitment/applications",
  "/recruitment/offers",
  "/recruitment/onboarding",
  "/recruitment/interviews",
  "/retention",
  "/retention/goals",
  "/retention/skills",
  "/retention/reviews",
  "/retention/rewards",
  "/retention/engagement",
  "/retention/career",
  "/retention/talent",
  "/qiwa",
  "/settings",
];

function slugify(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function loginAs(page: any, role: keyof typeof ROLE_BUTTONS) {
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: new RegExp(ROLE_BUTTONS[role], "i") }).click();
  await page.waitForURL(/\/$/, { timeout: 15000 });
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function shot(page: any, file: string) {
  const path = resolve(OUT_DIR, file);
  const buffer = await page.screenshot({ fullPage: true });
  await writeFile(path, buffer);
  console.log(`captured ${file}`);
}

const browser = await chromium.launch();

try {
  // 1) Public login page (no auth)
  {
    const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await shot(page, "00-public-login.png");

    await page.setViewportSize(VIEWPORTS.mobile);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await shot(page, "00-public-login-mobile.png");
    await context.close();
  }

  // 2) Administrator journey
  {
    const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
    const page = await context.newPage();
    await loginAs(page, "admin");
    await shot(page, "01-admin-command-center.png");

    await page.goto(`${BASE_URL}/modules`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await shot(page, "02-admin-modules-catalog.png");

    for (const slug of MODULES) {
      await page.goto(`${BASE_URL}/modules/${slug}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await shot(page, `03-admin-module-${slug}.png`);
    }

    for (const route of ADMIN_DETAIL_ROUTES) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await shot(page, `04-admin-page-${slugify(route)}.png`);
    }

    // Onboarding wizard (7 steps)
    await page.goto(`${BASE_URL}/modules/company-onboarding`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await shot(page, "05-onboarding-step-1-company.png");
    for (let i = 1; i < 7; i++) {
      const next = page.locator('button:has-text("Continue")').first();
      if (await next.isVisible().catch(() => false)) {
        await next.click();
        await page.waitForLoadState("networkidle").catch(() => {});
        await shot(page, `05-onboarding-step-${i + 1}.png`);
      }
    }

    await page.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await shot(page, "06-admin-profile.png");

    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await shot(page, "01-admin-command-center-mobile.png");
    await context.close();
  }

  // 3) HR Specialist journey
  {
    const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
    const page = await context.newPage();
    await loginAs(page, "hrSpecialist");
    await shot(page, "07-hr-specialist-landing.png");
    for (const slug of ["people-organization", "payroll-settlement", "time-leave-attendance", "documents-certificates"]) {
      await page.goto(`${BASE_URL}/modules/${slug}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await shot(page, `08-hr-specialist-${slug}.png`);
    }
    await context.close();
  }

  // 4) Department Manager journey
  {
    const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
    const page = await context.newPage();
    await loginAs(page, "departmentManager");
    await shot(page, "09-department-manager-landing.png");
    for (const slug of ["people-organization", "time-leave-attendance", "performance-goals", "engagement-retention"]) {
      await page.goto(`${BASE_URL}/modules/${slug}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await shot(page, `10-department-manager-${slug}.png`);
    }
    await context.close();
  }

  // 5) Employee journey
  {
    const context = await browser.newContext({ viewport: VIEWPORTS.desktop });
    const page = await context.newPage();
    await loginAs(page, "employee");
    await shot(page, "11-employee-landing.png");

    await page.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await shot(page, "12-employee-profile.png");

    for (const slug of ["time-leave-attendance", "travel-expenses", "documents-certificates", "learning-skills"]) {
      await page.goto(`${BASE_URL}/modules/${slug}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await shot(page, `13-employee-${slug}.png`);
    }

    await page.goto(`${BASE_URL}/payroll`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await shot(page, "14-employee-payroll-denied.png");

    await page.setViewportSize(VIEWPORTS.mobile);
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await shot(page, "11-employee-landing-mobile.png");
    await context.close();
  }
} finally {
  await browser.close();
}

console.log("ALL_SCREENSHOTS_DONE");