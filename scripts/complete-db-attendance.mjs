/**
 * Completes the database for the attendance/timesheet module (2026-07-21).
 * Idempotent — safe to run more than once.
 *
 *   1. Adds punch-in GPS columns (punch_in_lat / _lng / _accuracy) to every
 *      tenant schema that has an attendance_records table.
 *   2. Re-points the four Taazur demo logins to real employee rows in the Rukn
 *      Energy tenant so punch-in / timesheet / profile work with live data.
 *
 * Run once per environment:
 *   node --env-file=.env scripts/complete-db-attendance.mjs
 */
import postgres from "../packages/db/node_modules/postgres/src/index.js";

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is not set"); process.exit(2); }
const sql = postgres(url, { prepare: false, connect_timeout: 15, max: 2, ssl: "require" });

const DEMO_LINK = [
  ["admin@taazur.example",      "70c6e56a-6f3c-57e1-88e8-b6aa81f44941"], // Reem Al-Harbi (hr_manager)
  ["specialist@taazur.example", "ea1c81d1-7231-52de-8c35-feb24ba88fd5"], // Aisha Al-Otaibi (hr_specialist)
  ["manager@taazur.example",    "0c3b4817-a265-5d61-87e9-abcc6518ff4a"], // Fahad Al-Qahtani (department_manager)
  ["employee@taazur.example",   "41f58f2a-f94f-5bf3-8b05-76aaf4b89190"], // Omar Al-Dossary (employee)
];

async function main() {
  const schemas = await sql`
    SELECT DISTINCT table_schema FROM information_schema.tables
    WHERE table_name = 'attendance_records'`;
  for (const { table_schema } of schemas) {
    // Reconcile the legacy "status" column name to the schema's "attendance_status".
    await sql.unsafe(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = '${table_schema}' AND table_name = 'attendance_records' AND column_name = 'status')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                        WHERE table_schema = '${table_schema}' AND table_name = 'attendance_records' AND column_name = 'attendance_status') THEN
          ALTER TABLE "${table_schema}"."attendance_records" RENAME COLUMN "status" TO "attendance_status";
        END IF;
      END $$;`);
    await sql.unsafe(`
      ALTER TABLE "${table_schema}"."attendance_records"
        ADD COLUMN IF NOT EXISTS "punch_sequence" integer NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS "punch_in_lat" double precision,
        ADD COLUMN IF NOT EXISTS "punch_in_lng" double precision,
        ADD COLUMN IF NOT EXISTS "punch_in_accuracy" integer;`);
    // Align column defaults with the Drizzle schema so inserts that omit these
    // columns (relying on DB defaults) succeed. Idempotent.
    await sql.unsafe(`
      ALTER TABLE "${table_schema}"."attendance_records"
        ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
        ALTER COLUMN "worked_minutes" SET DEFAULT 0,
        ALTER COLUMN "overtime_minutes" SET DEFAULT 0,
        ALTER COLUMN "late_minutes" SET DEFAULT 0,
        ALTER COLUMN "early_leave_minutes" SET DEFAULT 0,
        ALTER COLUMN "created_at" SET DEFAULT now(),
        ALTER COLUMN "updated_at" SET DEFAULT now();`);
    console.log(`attendance columns + defaults ensured on ${table_schema}.attendance_records`);

    // Reconcile attendance_exceptions legacy column names to the schema so the
    // `today` / `myHistory` joins (with: { exceptions }) resolve.
    const renameExc = async (from, to) => {
      await sql.unsafe(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM information_schema.columns
                     WHERE table_schema = '${table_schema}' AND table_name = 'attendance_exceptions' AND column_name = '${from}')
          AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                          WHERE table_schema = '${table_schema}' AND table_name = 'attendance_exceptions' AND column_name = '${to}') THEN
            ALTER TABLE "${table_schema}"."attendance_exceptions" RENAME COLUMN "${from}" TO "${to}";
          END IF;
        END $$;`);
    };
    const hasExc = await sql`SELECT 1 FROM information_schema.tables WHERE table_schema = ${table_schema} AND table_name = 'attendance_exceptions'`;
    if (hasExc.length) {
      await renameExc("exception_type", "attendance_exception_type");
      await renameExc("status", "attendance_exception_status");
      await sql.unsafe(`ALTER TABLE "${table_schema}"."attendance_exceptions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();`);
      console.log(`attendance_exceptions reconciled on ${table_schema}`);
    }
  }

  for (const [email, empId] of DEMO_LINK) {
    const r = await sql`UPDATE public.users SET employee_id = ${empId} WHERE email = ${email} RETURNING email`;
    console.log(`linked ${email} -> ${empId} (${r.length} row updated)`);
  }

  console.log("Done.");
}

main().then(() => sql.end()).then(() => process.exit(0)).catch((e) => { console.error("ERR", e.message); process.exit(1); });
