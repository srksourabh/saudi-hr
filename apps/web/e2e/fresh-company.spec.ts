import { expect, test } from "@playwright/test";
import { adminDb, dropTenantSchema, tenants, users } from "@hrms-app/db";
import { eq } from "drizzle-orm";

const password = "Taazur2026!";

async function cleanupTenant(email: string, crNumber: string) {
  const tenant = await adminDb.query.tenants.findFirst({
    where: eq(tenants.crNumber, crNumber),
  });
  await adminDb.delete(users).where(eq(users.email, email)).catch(() => undefined);
  if (tenant) {
    await adminDb.delete(tenants).where(eq(tenants.id, tenant.id)).catch(() => undefined);
    await dropTenantSchema(tenant.schemaName).catch(() => undefined);
  }
}

test("fresh Saudi company admin can sign up, log in, complete setup, and reach the dashboard", async ({
  page,
  request,
}) => {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `codex.fresh.company.${suffix}@example.com`;
  const crNumber = suffix.slice(-10).padStart(10, "7");
  const companyName = `Codex Fresh Saudi ${suffix.slice(-6)}`;
  const logoUrl = "https://example.com/logo.png";

  await cleanupTenant(email, crNumber);

  try {
    const signup = await request.post("/api/auth/signup", {
      headers: { "x-forwarded-for": `10.44.${suffix.slice(-3)}.${suffix.slice(-2)}` },
      data: {
        email,
        password,
        name: "Codex Demo Admin",
        companyName,
        crNumber,
        nitaqatActivity: "oil_and_gas",
        regulatoryContext: "saudi",
      },
    });
    expect(signup.status()).toBe(201);

    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/settings\/company$/);
    await expect(page.getByRole("heading", { name: "Company Settings" })).toBeVisible();

    await page.locator("select").nth(0).selectOption("oil_and_gas");
    await page.locator("select").nth(1).selectOption("51-200");
    await page.locator('input[placeholder="https://yourcompany.com"]').fill("https://codex-demo.example");
    await page.locator('input[placeholder="https://yourcompany.com/logo.png"]').fill(logoUrl);
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Company profile saved")).toBeVisible();

    await page.getByRole("button", { name: "Departments" }).click();
    await page.locator('input[placeholder^="Department name"]').fill("People Operations");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("People Operations")).toBeVisible();

    await page.getByRole("button", { name: "Finish setup" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("Add employee")).toBeVisible();

    await page.goto("/employees/new");
    await page.getByRole("button", { name: "HR direct entry" }).click();
    await page.getByPlaceholder("Employee full name").fill("Codex Operations Manager");
    await page.locator('input[type="date"]').fill("2026-01-10");
    await page.locator("select").nth(1).selectOption({ label: "People Operations" });
    await page.getByPlaceholder("0.00").nth(0).fill("18000");
    await page.getByPlaceholder("0.00").nth(1).fill("4500");
    await page.getByPlaceholder("0.00").nth(2).fill("1500");
    await page.locator("select").nth(3).selectOption("new");
    await page.getByRole("button", { name: "Create employee" }).click();
    await expect(page.getByRole("heading", { name: "Submission received" })).toBeVisible();

    await page.goto("/employees/new");
    await page.getByRole("button", { name: "HR direct entry" }).click();
    await page.getByPlaceholder("Employee full name").fill("Codex Field Technician");
    await page.locator("select").nth(0).selectOption("expat");
    await page.locator('input[type="date"]').fill("2026-02-01");
    await page.locator("select").nth(1).selectOption({ label: "People Operations" });
    const managerSelect = page.locator("select").nth(2);
    const managerValue = await managerSelect
      .locator("option", { hasText: "Codex Operations Manager" })
      .getAttribute("value");
    expect(managerValue).toBeTruthy();
    await managerSelect.selectOption(managerValue ?? "");
    await page.getByPlaceholder("0.00").nth(0).fill("9000");
    await page.getByPlaceholder("0.00").nth(1).fill("2500");
    await page.getByPlaceholder("0.00").nth(2).fill("900");
    await page.getByRole("button", { name: "Create employee" }).click();
    await expect(page.getByRole("heading", { name: "Submission received" })).toBeVisible();

    await page.goto("/departments/organogram");
    await expect(page.getByRole("heading", { name: "Organogram" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Codex Operations Manager" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Codex Field Technician" })).toBeVisible();
    await expect(page.getByText("People Operations").first()).toBeVisible();

    const tenant = await adminDb.query.tenants.findFirst({
      where: eq(tenants.crNumber, crNumber),
    });
    expect(tenant?.companyName).toBe(companyName);
    expect(tenant?.logoUrl).toBe(logoUrl);
    expect(tenant?.onboardingCompleted).toBe("true");
  } finally {
    await cleanupTenant(email, crNumber);
  }
});
