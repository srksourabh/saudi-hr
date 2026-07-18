import { expect, test, type Page } from "@playwright/test";

async function loginAsDemoUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@taazur.example");
  await page.locator("#password").fill("TaazurDemo@2026");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/$/);
}

test.describe("Attendance — Guide Map", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
    await page.goto("/attendance/guide-map");
    await page.waitForLoadState("networkidle");
  });

  test("page loads with heading and sidebar sections", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Guide Map" })).toBeVisible();
    await expect(page.getByText("employees with location data")).toBeVisible();
  });

  test("sidebar shows all expected sections", async ({ page }) => {
    await expect(page.getByText("Current View")).toBeVisible();
    await expect(page.getByText("Saved Maps")).toBeVisible();
    await expect(page.getByText("Status Legend")).toBeVisible();
    await expect(page.getByText("Located Employees")).toBeVisible();
  });

  test("status legend shows all attendance statuses", async ({ page }) => {
    await expect(page.getByText("Present")).toBeVisible();
    await expect(page.getByText("Late")).toBeVisible();
    await expect(page.getByText("Absent")).toBeVisible();
    await expect(page.getByText("Remote")).toBeVisible();
    await expect(page.getByText("On Leave")).toBeVisible();
  });

  test("save view button opens dialog", async ({ page }) => {
    await page.getByRole("button", { name: /Save This View/i }).click();
    await expect(page.getByText("Save Map View")).toBeVisible();
    await expect(page.getByPlaceholder("e.g. Riyadh HQ Morning Shift")).toBeVisible();
  });

  test("save dialog has cancel button", async ({ page }) => {
    await page.getByRole("button", { name: /Save This View/i }).click();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Save Map View")).not.toBeVisible();
  });

  test("map container renders", async ({ page }) => {
    const mapContainer = page.locator(".maplibregl-map, [class*='maplibre']");
    await page.waitForTimeout(3000);
    const mapExists = await page.evaluate(() => {
      return !!document.querySelector(".maplibregl-map") || !!document.querySelector("[class*='maplibre']");
    });
    expect(mapExists).toBeTruthy();
  });
});
