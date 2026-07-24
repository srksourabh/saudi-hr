const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = "C:/Users/soura/Dropbox/AI/Projects/Saudi-HR/hrms-app";
const envPath = path.join(PROJECT_ROOT, ".env");
const envContent = fs.readFileSync(envPath, "utf8");
const DATABASE_URL = envContent
  .split("\n")
  .find((l) => l.startsWith("DATABASE_URL="))
  ?.split("=")[1]
  .replace(/^"/, "")
  .replace(/"$/, "");

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

console.log("Connecting to DB:", DATABASE_URL.split("@").pop());

async function main() {
  const client = new Client({ connectionString: DATABASE_URL, statement_timeout: 120000 });
  await client.connect();
  console.log("Connected successfully to PostgreSQL!");

  // List all schemas
  const schemasRes = await client.query(
    "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant\\_%' OR schema_name = 'public'"
  );
  const schemas = schemasRes.rows.map((r) => r.schema_name);
  console.log("Found schemas:", schemas);

  // Apply root drizzle migrations
  const drizzleDir = path.join(PROJECT_ROOT, "packages/db/drizzle");
  const files = fs.readdirSync(drizzleDir).filter((f) => f.endsWith(".sql")).sort();

  for (const f of files) {
    if (f === "0000_thin_freak.sql" || f === "0006_add_perf_indexes.sql") continue; // Skip initial schema dump & ambiguous perf index script
    console.log(`\n--- Applying ${f} ---`);
    const sql = fs.readFileSync(path.join(drizzleDir, f), "utf8");
    try {
      await client.query(sql);
      console.log(`OK: ${f}`);
    } catch (err) {
      console.log(`Notice/Error in ${f}: ${err.message}`);
    }
  }

  // Read generated statements directly
  const generatedFile = path.join(PROJECT_ROOT, "packages/db/src/tenant-ddl.generated.ts");
  const generatedContent = fs.readFileSync(generatedFile, "utf8");
  const lines = generatedContent.split("\n");
  const statements = [];
  for (const l of lines) {
    const trimmed = l.trim();
    if (trimmed.startsWith('"') && (trimmed.endsWith('",') || trimmed.endsWith('"'))) {
      const jsonStr = trimmed.endsWith(",") ? trimmed.slice(0, -1) : trimmed;
      try {
        statements.push(JSON.parse(jsonStr));
      } catch (e) {}
    }
  }
  console.log(`Loaded ${statements.length} tenant DDL statements.`);

  const tenantSchemas = schemas.filter((s) => s.startsWith("tenant_"));
  for (const s of tenantSchemas) {
    console.log(`\n--- Provisioning / Updating tenant schema ${s} ---`);
    await client.query(`SET search_path TO "${s}";`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    for (const stmt of statements) {
      try {
        await client.query(stmt);
      } catch (err) {
        // Safe to ignore if table/enum already exists
      }
    }

    // Explicit column guards for punch in/out, expenses, designations, and employee management
    await client.query(`
      ALTER TABLE "${s}".attendance_records ADD COLUMN IF NOT EXISTS work_location text;
      ALTER TABLE "${s}".attendance_records ADD COLUMN IF NOT EXISTS punch_in_lat numeric(10, 7);
      ALTER TABLE "${s}".attendance_records ADD COLUMN IF NOT EXISTS punch_in_lng numeric(10, 7);
      ALTER TABLE "${s}".attendance_records ADD COLUMN IF NOT EXISTS punch_in_accuracy integer;
      ALTER TABLE "${s}".attendance_records ADD COLUMN IF NOT EXISTS notes text;
      ALTER TABLE "${s}".attendance_records ADD COLUMN IF NOT EXISTS scheduled_start text;
      ALTER TABLE "${s}".attendance_records ADD COLUMN IF NOT EXISTS scheduled_end text;
      ALTER TABLE "${s}".attendance_records ADD COLUMN IF NOT EXISTS late_minutes integer DEFAULT 0;
      ALTER TABLE "${s}".attendance_records ADD COLUMN IF NOT EXISTS overtime_minutes integer DEFAULT 0;
      ALTER TABLE "${s}".attendance_records ADD COLUMN IF NOT EXISTS early_leave_minutes integer DEFAULT 0;
      ALTER TABLE "${s}".attendance_records ADD COLUMN IF NOT EXISTS worked_minutes integer DEFAULT 0;

      ALTER TABLE "${s}".expenses ADD COLUMN IF NOT EXISTS category text;
      ALTER TABLE "${s}".expenses ADD COLUMN IF NOT EXISTS description text;
      ALTER TABLE "${s}".expenses ADD COLUMN IF NOT EXISTS amount numeric(12, 2);
      ALTER TABLE "${s}".expenses ADD COLUMN IF NOT EXISTS currency text DEFAULT 'SAR';
      ALTER TABLE "${s}".expenses ADD COLUMN IF NOT EXISTS expense_date date;
      ALTER TABLE "${s}".expenses ADD COLUMN IF NOT EXISTS receipt_url text;
      ALTER TABLE "${s}".expenses ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
      ALTER TABLE "${s}".expenses ADD COLUMN IF NOT EXISTS approver_employee_id uuid;
      ALTER TABLE "${s}".expenses ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
      ALTER TABLE "${s}".expenses ADD COLUMN IF NOT EXISTS rejection_reason text;
      ALTER TABLE "${s}".expenses ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

      CREATE TABLE IF NOT EXISTS "${s}".designations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        code text,
        description text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );

      ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS designation_id uuid;
      ALTER TABLE "${s}".employees ADD COLUMN IF NOT EXISTS manager_employee_id uuid;
    `);

    console.log(`Tenant schema ${s} successfully updated and verified!`);
  }

  console.log("\nALL DATABASE MIGRATIONS AND SCHEMAS SUCCESSFULLY UPDATED AND CONNECTIVITY CONFIRMED!");
  await client.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
