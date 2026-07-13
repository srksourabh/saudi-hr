import { chromium } from "@playwright/test";
import { resolve, dirname } from "node:path";
import { mkdir, readFile } from "node:fs/promises";

const HTML_PATH = "C:/Users/soura/Dropbox/AI/Projects/Saudi-HR/hrms-app/docs/customer-demo-manual/customer-demo-user-manual.html";
const OUT_PDF = "C:/Users/soura/Dropbox/AI/Projects/Saudi-HR/hrms-app/docs/customer-demo-manual/customer-demo-user-manual.pdf";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 1800 } });
const page = await context.newPage();

const html = await readFile(HTML_PATH, "utf-8");
const dataUrl = "data:text/html;charset=utf-8," + encodeURIComponent(html);

await page.goto(dataUrl, { waitUntil: "load", timeout: 60000 });
await page.waitForLoadState("networkidle").catch(() => {});

await page.pdf({
  path: OUT_PDF,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:8px; width:100%; padding: 6mm 16mm 0 16mm; color:#64748b; display:flex; justify-content:space-between;">
    <span>Taāzur · تآزر · Customer Demo User Manual</span>
    <span>Edition 1.0 · 13 July 2026</span>
  </div>`,
  footerTemplate: `<div style="font-size:8px; width:100%; padding: 0 16mm 6mm 16mm; color:#64748b; display:flex; justify-content:space-between;">
    <span>powered by UDS-Noon JV · مدعوم من UDS-Noon JV</span>
    <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`,
});

console.log("PDF_GENERATED", OUT_PDF);
await browser.close();