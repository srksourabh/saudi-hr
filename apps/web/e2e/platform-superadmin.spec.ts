import { expect, test } from "@playwright/test";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const platformEmail = "srksourabh@gmail.com";
const platformPassword = "taazur123";
const companyAdminPassword = "Taazur2026!";

function loadLocalEnv() {
  const candidates = [
    resolve(process.cwd(), "../../.env"),
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "apps/web/.env"),
  ];
  for (const envPath of candidates) {
    if (!existsSync(envPath)) continue;
    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      if (!key || process.env[key]) continue;
      process.env[key] = valueParts.join("=").replace(/^['"]|['"]$/g, "");
    }
  }
}

async function dbKit() {
  loadLocalEnv();
  return await import("@hrms-app/db");
}

async function ensurePlatformSuperAdmin() {
  const { adminDb, createTenantSchema, tenants, users } = await dbKit();
  let tenant =
    (await adminDb.query.tenants.findFirst({
      where: eq(tenants.schemaName, "platform_admin"),
    })) ??
    (await adminDb.query.tenants.findFirst({
      where: eq(tenants.crNumber, "0000000000"),
    }));

  if (!tenant) {
    await createTenantSchema("platform_admin");
    const [createdTenant] = await adminDb
      .insert(tenants)
      .values({
        companyName: "Taazur Platform Administration",
        crNumber: "0000000000",
        nitaqatActivity: "platform",
        schemaName: "platform_admin",
        regulatoryContext: "saudi",
        onboardingCompleted: "true",
      })
      .returning();
    tenant = createdTenant;
  }

  if (!tenant) throw new Error("Could not prepare platform tenant.");
  await createTenantSchema(tenant.schemaName);

  const passwordHash = await bcrypt.hash(platformPassword, 12);
  const existingUser = await adminDb.query.users.findFirst({
    where: eq(users.email, platformEmail),
  });

  if (existingUser) {
    await adminDb
      .update(users)
      .set({
        tenantId: tenant.id,
        name: "Sourabh Platform Superadmin",
        passwordHash,
        role: "super_admin",
      })
      .where(eq(users.email, platformEmail));
    return;
  }

  await adminDb.insert(users).values({
    tenantId: tenant.id,
    email: platformEmail,
    name: "Sourabh Platform Superadmin",
    passwordHash,
    role: "super_admin",
  });
}

async function cleanupTenant(email: string, crNumber: string) {
  const { adminDb, dropTenantSchema, tenants, users } = await dbKit();
  const tenant = await adminDb.query.tenants.findFirst({
    where: eq(tenants.crNumber, crNumber),
  });
  await adminDb.delete(users).where(eq(users.email, email)).catch(() => undefined);
  if (tenant) {
    await adminDb.delete(tenants).where(eq(tenants.id, tenant.id)).catch(() => undefined);
    await dropTenantSchema(tenant.schemaName).catch(() => undefined);
  }
}

test("platform superadmin provisions a blank Saudi company and company admin imports employees by CSV", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const crNumber = suffix.slice(-10).padStart(10, "8");
  const companyName = `Codex Platform Company ${suffix.slice(-6)}`;
  const logoUrl = "https://example.com/taazur-logo.png";
  const companyAdminEmail = `codex.platform.admin.${suffix}@example.com`;

  await ensurePlatformSuperAdmin();
  await cleanupTenant(companyAdminEmail, crNumber);

  try {
    await page.goto("/login");
    await page.getByLabel("Email").fill(platformEmail);
    await page.locator('input[name="password"]').fill(platformPassword);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/super-admin$/);
    await expect(page.getByRole("heading", { name: "Company provisioning" })).toBeVisible();

    await page.goto("/employees");
    await expect(page).toHaveURL(/\/super-admin$/);

    await page.getByLabel("Company name").fill(companyName);
    await page.getByLabel("Company logo URL").fill(logoUrl);
    await page.getByLabel("Commercial registration").fill(crNumber);
    await page.getByLabel("Nitaqat activity").fill("construction");
    await page.getByLabel("Industry").selectOption("construction");
    await page.getByLabel("Company size").selectOption("51-200");
    await page.getByLabel("Website").fill("https://codex-platform.example");
    await page.getByLabel("Company admin name").fill("Codex Company Admin");
    await page.getByLabel("Company admin email").fill(companyAdminEmail);
    await page.getByLabel("Company admin password").fill(companyAdminPassword);
    await page.getByRole("button", { name: "Create company" }).click();

    await expect(page.getByText(`Company created. Admin login: ${companyAdminEmail}`)).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(companyName).first()).toBeVisible();

    const { adminDb, getTenantDb, tenants } = await dbKit();
    const tenant = await adminDb.query.tenants.findFirst({
      where: eq(tenants.crNumber, crNumber),
    });
    expect(tenant?.companyName).toBe(companyName);
    expect(tenant?.logoUrl).toBe(logoUrl);
    expect(tenant?.industry).toBe("construction");
    expect(tenant?.companySize).toBe("51-200");

    if (!tenant) throw new Error("Created tenant was not found.");
    const tenantDb = getTenantDb(tenant.schemaName);
    const tenantQuery = tenantDb.query as any;
    expect(await tenantQuery.employees.findMany()).toHaveLength(0);
    expect(await tenantQuery.departments.findMany()).toHaveLength(0);
    expect(await tenantQuery.designations.findMany()).toHaveLength(0);

    await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email").fill(companyAdminEmail);
    await page.locator('input[name="password"]').fill(companyAdminPassword);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL(/\/settings\/company$/);
    await page.getByRole("button", { name: "Departments" }).click();
    await page.locator('input[placeholder^="Department name"]').fill("Initial Setup");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("Initial Setup")).toBeVisible();
    await page.getByRole("button", { name: "Finish setup" }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto("/employees");
    await expect(page.getByRole("button", { name: "Sample CSV" })).toBeVisible();
    await expect(page.getByText("Upload CSV")).toBeVisible();

    const csv = [
      "fullName,nationality,hireDate,departmentName,designationTitle,managerFullName,jobTitle,gosiSystem,iqamaNumberEnc,salaryBasic,salaryHousing,salaryTransport",
      "CSV Operations Manager,saudi,2026-03-01,People Operations,HR Manager,,HR Manager,new,1000000003,18000,4500,1500",
      "CSV Field Technician,expat,2026-03-02,Field Operations,Technician,CSV Operations Manager,Field Technician,,2000000003,9000,2500,900",
    ].join("\n");

    await page.locator('input[type="file"]').setInputFiles({
      name: "employees.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(csv),
    });

    await expect(page.getByText("Imported 2 employees successfully.")).toBeVisible();
    await expect(page.getByText("CSV Operations Manager")).toBeVisible();
    await expect(page.getByText("CSV Field Technician")).toBeVisible();
  } finally {
    await cleanupTenant(companyAdminEmail, crNumber);
  }
});
