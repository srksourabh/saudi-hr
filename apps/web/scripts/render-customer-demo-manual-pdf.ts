import { chromium } from "@playwright/test";
import { pathToFileURL } from "node:url";

const HTML_PATH = "C:/Users/soura/Dropbox/AI/Projects/Saudi-HR/hrms-app/docs/customer-demo-manual/customer-demo-user-manual.html";
const OUT_PDF = "C:/Users/soura/Dropbox/AI/Projects/Saudi-HR/hrms-app/docs/customer-demo-manual/customer-demo-user-manual.pdf";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 1800 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

const url = pathToFileURL(HTML_PATH).href;
console.log("Loading", url);

const response = await page.goto(url, { waitUntil: "load", timeout: 60000 });
console.log("Loaded", response?.status());

// Wait for all images to be present
const imageCount = await page.evaluate(() => document.images.length);
console.log("Found", imageCount, "images in DOM");

// Wait for each image to fully load
await page.evaluate(async () => {
  const imgs = Array.from(document.images);
  await Promise.all(imgs.map(img => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      img.addEventListener("load", () => resolve());
      img.addEventListener("error", () => resolve()); // don't block on missing
      setTimeout(() => resolve(), 30000); // hard cap
    });
  }));
});
console.log("All images loaded or timed out");

await page.waitForLoadState("networkidle").catch(() => { /* noop */ });

// Inject CSS to constrain any oversized screenshots and ensure they fit
await page.addStyleTag({
  content: `
    body { background: #fff !important; }
    .screenshot { page-break-inside: avoid; break-inside: avoid; max-height: 70vh; }
    .screenshot img { max-width: 100%; height: auto !important; max-height: 65vh; object-fit: contain; }
  `,
});

await page.pdf({
  path: OUT_PDF,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: "14mm", right: "14mm", bottom: "14mm", left: "14mm" },
  displayHeaderFooter: true,
  headerTemplate: `<div style="font-size:8px; width:100%; padding: 4mm 14mm 0 14mm; color:#64748b; display:flex; justify-content:space-between;">
    <span>Taāzur · تآزر · Customer Demo User Manual</span>
    <span>Edition 1.0 · 13 July 2026</span>
  </div>`,
  footerTemplate: `<div style="font-size:8px; width:100%; padding: 0 14mm 4mm 14mm; color:#64748b; display:flex; justify-content:space-between;">
    <span>powered by UDS-Noon JV · مدعوم من UDS-Noon JV</span>
    <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`,
});

console.log("PDF_GENERATED", OUT_PDF);
await browser.close();