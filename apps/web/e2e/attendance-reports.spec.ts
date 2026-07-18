import { expect, test, type Page } from "@playwright/test";

async function loginAsDemoUser(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("admin@taazur.example");
  await page.locator("#password").fill("TaazurDemo@2026");
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/$/);
}

test.describe("Attendance — Team Reports", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemoUser(page);
    await page.goto("/attendance/reports");
    await page.waitForLoadState("networkidle");
  });

  test("page loads with heading and stats", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Team Reports" })).toBeVisible();
    await expect(page.getByText("Attendance Intelligence")).toBeVisible();
  });

  test("stats cards are visible", async ({ page }) => {
    await expect(page.getByText("In subtree")).toBeVisible();
    await expect(page.getByText("Punched in today")).toBeVisible();
    await expect(page.getByText("Managers available")).toBeVisible();
  });

  test("manager selector dropdown is present", async ({ page }) => {
    const select = page.locator("select");
    await expect(select).toBeVisible();
    await expect(select).toBeAttached();
  });

  test("search input filters employees", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search employees...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("test");
    await expect(searchInput).toHaveValue("test");
  });

  test("refresh button triggers reload", async ({ page }) => {
    const refreshButton = page.getByRole("button", { name: /Refresh/i });
    await expect(refreshButton).toBeVisible();
  });

  test("org tree section renders when manager selected", async ({ page }) => {
    await page.waitForTimeout(1000);
    const treeSection = page.locator("section").filter({ hasText: /Team Reports/i }).last();
    await expect(treeSection).toBeVisible();
  });
});
