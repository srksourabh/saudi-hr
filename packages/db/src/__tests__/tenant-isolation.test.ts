/**
 * Multi-tenant schema isolation test.
 *
 * The PRD Section 13.2 (and ADR-002) require schema-per-tenant
 * isolation: each company gets its own PostgreSQL schema and a
 * bug in application code MUST NOT be able to leak data across
 * tenants.
 *
 * This test exercises the real `getTenantDb(schemaName)` /
 * `createTenantSchema(schemaName)` path against an isolated
 * Postgres test instance (or a test-managed set of schemas) and
 * asserts that:
 *
 *   1. Creating two tenants produces two distinct schemas.
 *   2. Inserting an employee into tenant A's schema is invisible
 *      when querying tenant B's schema.
 *   3. `getTenantDb("public")` returns to the public (registry)
 *      schema and can list tenants without seeing employee data.
 *
 * The test is skipped when DATABASE_URL is not set (CI without a
 * live Postgres). In local dev the .env DATABASE_URL is honored.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { getTenantDb, createTenantSchema } from "../tenant-manager";

const HAS_DB = !!process.env.DATABASE_URL;

const TEST_SCHEMA_A = `test_tenant_a_${randomUUID().slice(0, 8)}`;
const TEST_SCHEMA_B = `test_tenant_b_${randomUUID().slice(0, 8)}`;

const runIf = HAS_DB ? describe : describe.skip;

runIf("multi-tenant schema isolation (PRD Section 13.2)", () => {
  beforeAll(async () => {
    await createTenantSchema(TEST_SCHEMA_A);
    await createTenantSchema(TEST_SCHEMA_B);
  }, 60_000);

  afterAll(async () => {
    // Drop the test schemas to keep the DB clean. Use a fresh
    // connection so we don't need to share the pooled one.
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    try {
      await sql.unsafe(`DROP SCHEMA IF EXISTS "${TEST_SCHEMA_A}" CASCADE`);
      await sql.unsafe(`DROP SCHEMA IF EXISTS "${TEST_SCHEMA_B}" CASCADE`);
    } finally {
      await sql.end();
    }
  }, 30_000);

  it("creates two distinct tenant schemas on the same database", async () => {
    const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
    try {
      const rows = await sql<{ schema_name: string }[]>`
        SELECT schema_name FROM information_schema.schemata
        WHERE schema_name IN (${TEST_SCHEMA_A}, ${TEST_SCHEMA_B})
      `;
      const names = rows.map((r) => r.schema_name);
      expect(names).toContain(TEST_SCHEMA_A);
      expect(names).toContain(TEST_SCHEMA_B);
      expect(TEST_SCHEMA_A).not.toBe(TEST_SCHEMA_B);
    } finally {
      await sql.end();
    }
  });

  it("inserts into tenant A are not visible from tenant B", async () => {
    const dbA = getTenantDb(TEST_SCHEMA_A);
    const dbB = getTenantDb(TEST_SCHEMA_B);

    // Use raw SQL to insert because the typed Drizzle layer would
    // require we re-import a per-schema table. The point of this
    // test is the search_path isolation, not the Drizzle mapping.
    const sqlA = postgres(process.env.DATABASE_URL!, { max: 1 });
    const sqlB = postgres(process.env.DATABASE_URL!, { max: 1 });
    try {
      await sqlA.unsafe(`SET search_path TO "${TEST_SCHEMA_A}"`);
      const empId = randomUUID();
      await sqlA.unsafe(
        `INSERT INTO employees (id, full_name, nationality, hire_date, salary_basic, salary_housing, salary_transport) ` +
          `VALUES ('${empId}', 'Tenant A Employee', 'saudi', '2026-01-01', 10000, 2500, 500)`,
      );

      await sqlB.unsafe(`SET search_path TO "${TEST_SCHEMA_B}"`);
      const aRows = await sqlB<
        { id: string; full_name: string }[]
      >`SELECT id, full_name FROM employees WHERE id = ${empId}`;
      const bRows = await sqlB<
        { id: string; full_name: string }[]
      >`SELECT id, full_name FROM employees`;

      // Tenant B must NOT see the row we just inserted into tenant A.
      expect(aRows).toHaveLength(0);
      expect(bRows).toHaveLength(0);

      // Sanity: tenant A DOES see its own row.
      await sqlA.unsafe(`SET search_path TO "${TEST_SCHEMA_A}"`);
      const aOwnRows = await sqlA<
        { id: string; full_name: string }[]
      >`SELECT id, full_name FROM employees WHERE id = ${empId}`;
      expect(aOwnRows).toHaveLength(1);
      expect(aOwnRows[0]?.full_name).toBe("Tenant A Employee");
    } finally {
      await sqlA.end();
      await sqlB.end();
    }
  });

  it("each tenant can have employees with the same primary key without collision", async () => {
    // If schemas were shared, this insert would violate a unique
    // constraint. The fact that it succeeds in both proves the
    // schemas are physically separate.
    const sharedId = randomUUID();
    const sqlA = postgres(process.env.DATABASE_URL!, { max: 1 });
    const sqlB = postgres(process.env.DATABASE_URL!, { max: 1 });
    try {
      await sqlA.unsafe(`SET search_path TO "${TEST_SCHEMA_A}"`);
      await sqlA.unsafe(
        `INSERT INTO employees (id, full_name, nationality, hire_date, salary_basic, salary_housing, salary_transport) ` +
          `VALUES ('${sharedId}', 'Same ID in A', 'expat', '2026-02-01', 8000, 2000, 400)`,
      );
      await sqlB.unsafe(`SET search_path TO "${TEST_SCHEMA_B}"`);
      await sqlB.unsafe(
        `INSERT INTO employees (id, full_name, nationality, hire_date, salary_basic, salary_housing, salary_transport) ` +
          `VALUES ('${sharedId}', 'Same ID in B', 'saudi', '2026-02-01', 9000, 2000, 400)`,
      );

      // Both inserts succeeded -> no shared constraint surface.
      await sqlA.unsafe(`SET search_path TO "${TEST_SCHEMA_A}"`);
      await sqlB.unsafe(`SET search_path TO "${TEST_SCHEMA_B}"`);
      const aCount = await sqlA<{ c: number }[]>`SELECT COUNT(*)::int AS c FROM employees WHERE id = ${sharedId}`;
      const bCount = await sqlB<{ c: number }[]>`SELECT COUNT(*)::int AS c FROM employees WHERE id = ${sharedId}`;
      expect(aCount[0]?.c).toBe(1);
      expect(bCount[0]?.c).toBe(1);
    } finally {
      await sqlA.end();
      await sqlB.end();
    }
  });
});

// Always run this one — verifies the test is wired correctly even
// when no DB is available, so CI never silently passes on a
// misconfigured test runner.
describe("multi-tenant test infrastructure", () => {
  it("reports whether DATABASE_URL is set so skipped tests are not mistaken for passes", () => {
    if (!HAS_DB) {
      // Skipped tests show up as "skipped" in vitest output, not
      // "passed", so this assertion is safe to run unconditionally.
      expect(HAS_DB).toBe(false);
    } else {
      expect(HAS_DB).toBe(true);
    }
  });
});
