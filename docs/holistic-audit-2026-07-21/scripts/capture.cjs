/* Live screenshot capture for the hrms-app holistic audit.
 * Drives the PUBLIC demo (real prod DB) with the code-defined demo identities.
 * Non-destructive: navigation + screenshots only, no mutations.
 * Run:  NODE_PATH=<apps/web/node_modules> node capture.cjs        (full)
 *       SMOKE=1 NODE_PATH=... node capture.cjs                     (smoke test)
 */
const { chromium } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const BASE = "https://hrms-app-chi.vercel.app";
const OUT = "c:/Users/soura/Dropbox/AI/Projects/Saudi-HR/hrms-app/docs/holistic-audit-2026-07-21/evidence/screenshots";
const PASS = "TaazurDemo@2026";
const SMOKE = process.env.SMOKE === "1";

const ROLES = {
  admin:      { label: "HR Manager",   email: "admin@taazur.example" },
  specialist: { label: "HR Specialist", email: "specialist@taazur.example" },
  manager:    { label: "Dept Manager", email: "manager@taazur.example" },
  employee:   { label: "Employee",     email: "employee@taazur.example" },
};

const manifest = [];
let n = 0;

function slug(s) { return String(s).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toUpperCase().slice(0, 44); }

async function shot(page, folder, id, severity, module, desc, role) {
  n++;
  const file = `${id}_${severity}_${slug(module)}_${slug(desc)}.png`;
  const dir = path.join(OUT, folder);
  const full = path.join(dir, file);
  try {
    await page.screenshot({ path: full, fullPage: true });
    manifest.push({ no: n, id, file, folder, url: page.url(), role, description: desc, ts: new Date().toISOString() });
    console.log(`OK   ${folder}/${file}`);
  } catch (e) {
    console.log(`FAIL ${file} :: ${e.message}`);
  }
}

async function login(context, email) {
  const page = await context.newPage();
  async function attempt() {
    await page.goto(BASE + "/login", { waitUntil: "networkidle" }).catch(() => {});
    // Wait for React hydration so the onSubmit preventDefault is attached;
    // otherwise the native form submits as a GET and creds leak into the URL.
    await page.waitForTimeout(2500);
    await page.fill("#email", email);
    await page.fill("#password", PASS);
    await page.waitForTimeout(300);
    await page.click("button[type=submit]");
    await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 20000 }).catch(() => {});
  }
  await attempt();
  if (new URL(page.url()).pathname.startsWith("/login")) {
    await page.waitForTimeout(1500);
    await attempt(); // hydration lost the race — retry once
  }
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  const ok = !new URL(page.url()).pathname.startsWith("/login");
  console.log(`LOGIN ${email} -> ${page.url()} :: ${ok ? "SUCCESS" : "FAILED"}`);
  return { page, ok };
}

async function visitAndShot(page, route, folder, id, module, role) {
  await page.goto(BASE + route, { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, folder, id, "INFO", module, `${role}-${route}`, role);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const desktop = { width: 1440, height: 900 };
  try {
    // --- Discovery: login page across viewports ---
    const anon = await browser.newContext({ viewport: desktop });
    const lp = await anon.newPage();
    for (const vp of [
      { w: 1440, h: 900, t: "desktop-1440" },
      { w: 1920, h: 1080, t: "wide-1920" },
      { w: 768, h: 1024, t: "tablet-768" },
      { w: 375, h: 667, t: "mobile-375" },
    ]) {
      await lp.setViewportSize({ width: vp.w, height: vp.h });
      await lp.goto(BASE + "/login", { waitUntil: "networkidle" }).catch(() => {});
      await lp.waitForTimeout(500);
      await shot(lp, "01_Discovery", `DISC-${vp.t}`, "INFO", "login", `login-page-${vp.t}`, "anon");
    }
    // Auth gate: anonymous access to a protected route should redirect to /login
    await lp.setViewportSize(desktop);
    await lp.goto(BASE + "/employees", { waitUntil: "networkidle" }).catch(() => {});
    await shot(lp, "02_Authentication", "AUTH-EV-anon-redirect", "INFO", "employees", "anon-protected-route-redirect", "anon");
    // 404 / error state
    await lp.goto(BASE + "/__audit_missing_route__", { waitUntil: "networkidle" }).catch(() => {});
    await shot(lp, "10_Errors", "ERR-EV-404", "INFO", "notfound", "unknown-route-404", "anon");
    await anon.close();

    if (SMOKE) {
      const ctx = await browser.newContext({ viewport: desktop });
      const { page, ok } = await login(ctx, ROLES.admin.email);
      if (ok) await shot(page, "01_Discovery", "DISC-smoke", "INFO", "dashboard", "admin-dashboard-smoke", "admin");
      await ctx.close();
      fs.writeFileSync(path.join(OUT, "..", "screenshot-index.smoke.json"), JSON.stringify(manifest, null, 2));
      console.log(`SMOKE done, ${n} shots`);
      await browser.close();
      return;
    }

    const PAGES = {
      admin: ["/", "/employees", "/employees/new", "/departments", "/departments/organogram",
              "/attendance/reports", "/payroll", "/leave", "/recruitment/jobs", "/retention/reviews",
              "/compliance", "/qiwa", "/documents", "/settings/company", "/settings/team", "/profile"],
      specialist: ["/", "/employees", "/recruitment/candidates", "/attendance/reports"],
      manager: ["/", "/employees", "/attendance/reports", "/leave"],
      employee: ["/", "/profile", "/leave", "/leave/new", "/attendance/me", "/documents"],
    };

    // --- Per-role functional captures ---
    let fc = 0;
    for (const key of Object.keys(ROLES)) {
      const ctx = await browser.newContext({ viewport: desktop });
      const { page, ok } = await login(ctx, ROLES[key].email);
      if (ok) {
        for (const route of PAGES[key]) {
          fc++;
          await visitAndShot(page, route, "04_Functional", `FUNC-${String(fc).padStart(3, "0")}`, route.replace(/\//g, "_") || "dashboard", key);
        }
      } else {
        await shot(page, "12_Other", `LOGINFAIL-${key}`, "INFO", "login", `login-failed-${key}`, key);
      }

      // Responsive shots for admin dashboard
      if (key === "admin" && ok) {
        for (const vp of [{ w: 375, h: 667, t: "mobile-375" }, { w: 768, h: 1024, t: "tablet-768" }, { w: 1920, h: 1080, t: "wide-1920" }]) {
          await page.setViewportSize({ width: vp.w, height: vp.h });
          await page.goto(BASE + "/", { waitUntil: "networkidle" }).catch(() => {});
          await page.waitForTimeout(700);
          await shot(page, "05_UI_UX", `UX-EV-dash-${vp.t}`, "INFO", "dashboard", `admin-dashboard-${vp.t}`, "admin");
        }
        await page.setViewportSize(desktop);
      }

      // RBAC evidence: employee attempting restricted routes
      if (key === "employee" && ok) {
        for (const route of ["/employees", "/payroll", "/super-admin", "/settings/team", "/compliance", "/qiwa"]) {
          await page.goto(BASE + route, { waitUntil: "networkidle" }).catch(() => {});
          await page.waitForTimeout(600);
          await shot(page, "03_RBAC", `RBAC-EV-${slug(route)}`, "INFO", route.replace(/\//g, "_"), `employee-attempts-${route}`, "employee");
        }
      }

      await ctx.close();
    }

    fs.writeFileSync(path.join(OUT, "..", "screenshot-index.json"), JSON.stringify(manifest, null, 2));
    console.log(`DONE, ${n} shots captured`);
  } catch (e) {
    console.log("FATAL", e.message);
    fs.writeFileSync(path.join(OUT, "..", "screenshot-index.partial.json"), JSON.stringify(manifest, null, 2));
  } finally {
    await browser.close();
  }
})();
