const { chromium } = require("@playwright/test");
const ROOT = "c:/Users/soura/Dropbox/AI/Projects/Saudi-HR/hrms-app/docs/holistic-audit-2026-07-21";
const src = "file:///" + ROOT + "/hrms-app_Holistic_SaaS_Audit_Report_2026-07-21.html";
const out = ROOT + "/hrms-app_Holistic_SaaS_Audit_Report_2026-07-21.pdf";

(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  await p.goto(src, { waitUntil: "load", timeout: 120000 });
  // ensure every screenshot is decoded before printing
  await p.evaluate(() => Promise.all(Array.from(document.images).map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
  await p.waitForTimeout(1200);
  await p.pdf({
    path: out, format: "A4", printBackground: true, preferCSSPageSize: false,
    margin: { top: "12mm", bottom: "14mm", left: "11mm", right: "11mm" },
    displayHeaderFooter: true, headerTemplate: "<div></div>",
    footerTemplate: '<div style="width:100%;font-size:8px;color:#8a8f98;text-align:center;padding:0 10mm">Taazur HRMS — Holistic SaaS Audit (Confidential) — page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
  });
  await b.close();
  console.log("PDF written:", out);
})();
