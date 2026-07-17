/**
 * Seed Rukn Energy Services — the working showcase company.
 *
 * Treats the tenant as a real client company (Rukn Energy Services), not as
 * "demo data". All identities, salaries, branches, attendance, payroll, and
 * compliance records are populated so every dashboard view has something to
 * render.
 *
 * Run from repo root:
 *   node node_modules/.pnpm/tsx@4.23.0/node_modules/tsx/dist/cli.mjs \
 *     scripts/seed-rukn-energy.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

for (const file of [".env", "apps/web/.env"]) {
  const path = resolve(ROOT, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}

const TENANT = "tenant_1ed8b6bd3743";
const TENANT_ID = "1ed8b6bd-3743-5000-8000-000000000001";
const S = (table: string) => `"${TENANT}"."${table}"`;

const id = (slug: string): string => {
  // Deterministic UUIDv5-shaped string. Hash the slug with sha256 and lay
  // out 32 hex chars into the 8-4-4-4-12 format with version=5 and a safe
  // variant nibble. Stable across runs.
  const hex = createHash("sha256").update(`rukn-energy|${slug}`).digest("hex").slice(0, 32);
  // Pick the variant nibble (hex[16]) — it must be one of 8-b for v4/v5.
  const variantHex = "89ab".includes(hex[16] ?? "0") ? hex[16] : "8";
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(12, 15)}-${variantHex}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

let _uuidCounter = 0;
const idSeq = (label: string): string => {
  _uuidCounter++;
  const hex = Array.from(label).reduce((a, c) => a + c.charCodeAt(0).toString(16).padStart(2, "0"), "");
  const prefix = (hex + "0".repeat(8)).slice(0, 8);
  return `${prefix}-0000-5000-8000-${String(_uuidCounter).padStart(12, "0")}`;
};

// bcrypt hash for "Rukn2026!" — pre-computed so the seed is deterministic.
const PRECOMPUTED_BCRYPT_HASH =
  "$2a$10$YtBHTW62qd3c1zpfG2Dt8OQ5T0qExRK1BJfV3jj4jcTAbL0PDtcCu";

async function hashPassword(plain: string): Promise<string> {
  try {
    const bcryptPath = pathToFileURL(
      resolve(ROOT, "apps/web/node_modules/bcryptjs/index.js"),
    ).href;
    const bcryptMod = await import(bcryptPath);
    const bcrypt = (bcryptMod as any).default ?? bcryptMod;
    if (typeof bcrypt.hash === "function") {
      return await bcrypt.hash(plain, 10);
    }
  } catch {
    // fall through to precomputed hash
  }
  return PRECOMPUTED_BCRYPT_HASH;
}

const EMPLOYEES = [
  { slug: "emp-reem",   name: "Reem Al-Harbi",      email: "reem.alharbi@rukn-energy.example",      role: "hr_manager",         dept: "dept-people",  status: "active",    hire: "2021-03-14", nat: "saudi", sal: [32000, 8000, 2500], job: "People & Culture Director" },
  { slug: "emp-fahad",  name: "Fahad Al-Qahtani",    email: "fahad.alqahtani@rukn-energy.example",    role: "department_manager", dept: "dept-field",   status: "active",    hire: "2020-09-01", nat: "saudi", sal: [28500, 7125, 2000], job: "Eastern Operations Manager" },
  { slug: "emp-aisha",  name: "Aisha Al-Otaibi",     email: "aisha.alotaibi@rukn-energy.example",     role: "hr_specialist",      dept: "dept-people",  status: "active",    hire: "2022-01-10", nat: "saudi", sal: [22500, 5625, 1500], job: "Payroll & GOSI Specialist" },
  { slug: "emp-omar",   name: "Omar Al-Dossary",     email: "omar.aldossary@rukn-energy.example",     role: "employee",           dept: "dept-field",   status: "active",    hire: "2026-05-03", nat: "saudi", sal: [14000, 3500, 1000], job: "Field Engineer" },
  { slug: "emp-priya",  name: "Priya Menon",         email: "priya.menon@rukn-energy.example",         role: "employee",           dept: "dept-projects",status: "on_leave",  hire: "2021-11-08", nat: "expat", sal: [26000, 6500, 2000], job: "Senior Project Coordinator" },
  { slug: "emp-noura",  name: "Noura Al-Subaie",     email: "noura.alsubaie@rukn-energy.example",     role: "hr_specialist",      dept: "dept-people",  status: "active",    hire: "2022-06-15", nat: "saudi", sal: [20000, 5000, 1500], job: "Talent Acquisition Lead" },
  { slug: "emp-khalid", name: "Khalid Al-Mutairi",   email: "khalid.almutairi@rukn-energy.example",   role: "department_manager", dept: "dept-projects",status: "active",    hire: "2019-04-22", nat: "saudi", sal: [31000, 7750, 2250], job: "Projects Director" },
  { slug: "emp-mariam", name: "Mariam Al-Dosari",    email: "mariam.aldosari@rukn-energy.example",    role: "payroll_admin",      dept: "dept-finance", status: "active",    hire: "2023-02-20", nat: "saudi", sal: [18000, 4500, 1250], job: "Procurement Analyst" },
  { slug: "emp-yousef", name: "Yousef Al-Harbi",     email: "yousef.alharbi@rukn-energy.example",     role: "employee",           dept: "dept-field",   status: "active",    hire: "2018-08-12", nat: "saudi", sal: [22000, 5500, 1500], job: "Senior Field Supervisor" },
  { slug: "emp-ahmed",  name: "Ahmed Al-Shehri",     email: "ahmed.alshehri@rukn-energy.example",     role: "department_manager", dept: "dept-hse",     status: "active",    hire: "2017-03-05", nat: "saudi", sal: [24500, 6125, 1750], job: "HSE Manager" },
  { slug: "emp-lina",   name: "Lina Khalil",         email: "lina.khalil@rukn-energy.example",         role: "employee",           dept: "dept-projects",status: "active",    hire: "2025-11-02", nat: "expat", sal: [19000, 4750, 1250], job: "Project Coordinator" },
  { slug: "emp-salman", name: "Salman Al-Ghamdi",    email: "salman.alghamdi@rukn-energy.example",    role: "department_manager", dept: "dept-hse",     status: "active",    hire: "2016-11-14", nat: "saudi", sal: [25500, 6375, 1750], job: "HSE Lead" },
];

const SHIFT_KEYS = ["shift-corporate", "shift-field-a", "shift-field-b", "shift-maintenance"] as const;

const SHIFTS = [
  { key: "shift-corporate",   id: id("shift-corporate"),   name: "Corporate day",       nameAr: "دوام مكتبي",      start: "08:00", end: "17:00", grace: 10, days: "sun,mon,tue,wed,thu", break: 60 },
  { key: "shift-field-a",     id: id("shift-field-a"),     name: "Field rotation A",    nameAr: "وردية ميدانية أ", start: "06:00", end: "18:00", grace: 15, days: "sun,mon,tue,wed,thu,fri,sat", break: 60 },
  { key: "shift-field-b",     id: id("shift-field-b"),     name: "Field rotation B",    nameAr: "وردية ميدانية ب", start: "18:00", end: "06:00", grace: 15, days: "sun,mon,tue,wed,thu,fri,sat", break: 60 },
  { key: "shift-maintenance", id: id("shift-maintenance"), name: "Maintenance early",   nameAr: "صيانة مبكرة",     start: "05:30", end: "14:30", grace: 10, days: "sun,mon,tue,wed,thu", break: 45 },
];

const SHIFT_KEY_TO_ID = new Map<string, string>(SHIFTS.map((s) => [s.key, s.id]));

const SHIFT_BY_EMP: Record<string, string> = {
  "emp-reem":   "shift-corporate",
  "emp-fahad":  "shift-corporate",
  "emp-aisha":  "shift-corporate",
  "emp-omar":   "shift-field-a",
  "emp-priya":  "shift-corporate",
  "emp-noura":  "shift-corporate",
  "emp-khalid": "shift-corporate",
  "emp-mariam": "shift-corporate",
  "emp-yousef": "shift-field-b",
  "emp-ahmed":  "shift-maintenance",
  "emp-lina":   "shift-corporate",
  "emp-salman": "shift-corporate",
};

const PASSWORD = "Rukn2026!";

async function main() {
  const postgresPath = pathToFileURL(resolve(ROOT, "packages/db/node_modules/postgres/src/index.js")).href;
  const postgres = await import(postgresPath);
  const sql = (postgres as any).default(url, { ssl: { rejectUnauthorized: false }, max: 5 });
  console.log("✓ Connected to", url.replace(/:[^:@]+@/, ":***@"));

  // ─── STEP 1: Tenant + public users ────────────────────────────────
  console.log("\n=== STEP 1: Tenant + user accounts ===");
  await sql.unsafe(`
    INSERT INTO public.tenants (id, company_name, cr_number, nitaqat_activity, industry, company_size, website, plan_tier, regulatory_context, schema_name, onboarding_completed)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'enterprise', 'saudi', $8, 'true')
    ON CONFLICT (id) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      cr_number = EXCLUDED.cr_number,
      industry = EXCLUDED.industry,
      company_size = EXCLUDED.company_size,
      website = EXCLUDED.website,
      plan_tier = EXCLUDED.plan_tier,
      regulatory_context = EXCLUDED.regulatory_context,
      schema_name = EXCLUDED.schema_name,
      onboarding_completed = EXCLUDED.onboarding_completed
  `, [
    TENANT_ID,
    "Rukn Energy Services",
    "1010987654",
    "Oil & gas field services",
    "Oilfield services and energy operations",
    "50-100",
    "https://www.rukn-energy.example",
    TENANT,
  ]);

  const passwordHash = await hashPassword(PASSWORD);

  for (const e of EMPLOYEES) {
    await sql.unsafe(`
      INSERT INTO public.users (id, tenant_id, email, password_hash, name, role, email_verified, preferred_language, employee_id)
      VALUES ($1, $2, $3, $4, $5, $6, now(), 'en', $7)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        employee_id = EXCLUDED.employee_id
    `, [idSeq(`user-${e.slug}`), TENANT_ID, e.email, passwordHash, e.name, e.role, id(e.slug)]);
  }
  console.log(`  ✓ Tenant + ${EMPLOYEES.length} user accounts (password: ${PASSWORD})`);

  // ─── STEP 2: Schema + tables ──────────────────────────────────────
  console.log("\n=== STEP 2: Schema + tables ===");
  await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS "${TENANT}"`);

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("departments")} (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      parent_department_id uuid,
      head_employee_id uuid,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("employees")} (
      id uuid PRIMARY KEY,
      department_id uuid,
      manager_employee_id uuid,
      iqama_number_enc text,
      passport_number_enc text,
      bank_iban_enc text,
      nationality text NOT NULL CHECK (nationality = ANY (ARRAY['saudi'::text, 'expat'::text])),
      full_name text NOT NULL,
      employment_status text NOT NULL,
      hire_date date NOT NULL,
      termination_date date,
      gosi_registration_date date,
      gosi_system text,
      salary_basic numeric NOT NULL DEFAULT 0,
      salary_housing numeric NOT NULL DEFAULT 0,
      salary_transport numeric NOT NULL DEFAULT 0,
      job_title text,
      photo_url text,
      rehire_eligible text,
      rehire_reason text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  // Tolerate an older table that pre-dates the manager/job_title columns.
  await sql.unsafe(`ALTER TABLE ${S("employees")} ADD COLUMN IF NOT EXISTS manager_employee_id uuid`).catch(() => undefined);
  await sql.unsafe(`ALTER TABLE ${S("employees")} ADD COLUMN IF NOT EXISTS job_title text`).catch(() => undefined);
  await sql.unsafe(`ALTER TABLE ${S("employees")} ADD COLUMN IF NOT EXISTS photo_url text`).catch(() => undefined);
  await sql.unsafe(`ALTER TABLE ${S("employees")} ADD COLUMN IF NOT EXISTS gosi_registration_date date`).catch(() => undefined);
  await sql.unsafe(`ALTER TABLE ${S("employees")} ADD COLUMN IF NOT EXISTS gosi_system text`).catch(() => undefined);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("shifts")} (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      name_ar text,
      start_time time NOT NULL,
      end_time time NOT NULL,
      grace_minutes integer NOT NULL DEFAULT 10,
      work_days text NOT NULL DEFAULT 'sun,mon,tue,wed,thu',
      break_minutes integer NOT NULL DEFAULT 60,
      is_active integer NOT NULL DEFAULT 1,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("shift_assignments")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL,
      shift_id uuid NOT NULL REFERENCES ${S("shifts")}(id) ON DELETE RESTRICT,
      effective_from date NOT NULL,
      effective_to date,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("attendance_records")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL REFERENCES ${S("employees")}(id) ON DELETE CASCADE,
      work_date date NOT NULL,
      shift_id uuid REFERENCES ${S("shifts")}(id) ON DELETE SET NULL,
      punch_in_at timestamp,
      punch_out_at timestamp,
      scheduled_start time,
      scheduled_end time,
      worked_minutes integer NOT NULL DEFAULT 0,
      overtime_minutes integer NOT NULL DEFAULT 0,
      late_minutes integer NOT NULL DEFAULT 0,
      early_leave_minutes integer NOT NULL DEFAULT 0,
      status text NOT NULL DEFAULT 'present',
      work_location text,
      notes text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("attendance_exceptions")} (
      id uuid PRIMARY KEY,
      attendance_record_id uuid NOT NULL REFERENCES ${S("attendance_records")}(id) ON DELETE CASCADE,
      employee_id uuid NOT NULL REFERENCES ${S("employees")}(id) ON DELETE CASCADE,
      exception_type text NOT NULL,
      status text NOT NULL DEFAULT 'open',
      minutes integer,
      description text,
      resolved_by_user_id uuid,
      resolved_at timestamp,
      resolution_notes text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("documents")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL REFERENCES ${S("employees")}(id) ON DELETE CASCADE,
      type text NOT NULL,
      file_name text NOT NULL,
      file_url text,
      expiry_date date,
      version text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("payroll_runs")} (
      id uuid PRIMARY KEY,
      period_month date NOT NULL,
      status text NOT NULL,
      total_amount numeric NOT NULL DEFAULT 0,
      completed_at timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("payslips")} (
      id uuid PRIMARY KEY,
      payroll_run_id uuid NOT NULL,
      employee_id uuid NOT NULL,
      basic numeric NOT NULL DEFAULT 0,
      housing numeric NOT NULL DEFAULT 0,
      transport numeric NOT NULL DEFAULT 0,
      overtime numeric NOT NULL DEFAULT 0,
      gosi_employee numeric NOT NULL DEFAULT 0,
      gosi_employer numeric NOT NULL DEFAULT 0,
      deductions numeric NOT NULL DEFAULT 0,
      net_pay numeric NOT NULL DEFAULT 0,
      pdf_url text,
      currency text NOT NULL DEFAULT 'SAR',
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  // Rename old `net` → `net_pay` if the previous seed left it under that name.
  await sql.unsafe(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${TENANT}' AND table_name = 'payslips' AND column_name = 'net')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = '${TENANT}' AND table_name = 'payslips' AND column_name = 'net_pay') THEN
        ALTER TABLE ${S("payslips")} RENAME COLUMN "net" TO "net_pay";
      END IF;
    END $$;
  `).catch(() => undefined);
  await sql.unsafe(`ALTER TABLE ${S("payslips")} ADD COLUMN IF NOT EXISTS pdf_url text`).catch(() => undefined);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("leave_types")} (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      default_days integer NOT NULL DEFAULT 0,
      paid boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("leave_requests")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL REFERENCES ${S("employees")}(id) ON DELETE CASCADE,
      leave_type_id uuid NOT NULL REFERENCES ${S("leave_types")}(id) ON DELETE RESTRICT,
      start_date date NOT NULL,
      end_date date NOT NULL,
      status text NOT NULL,
      approved_by_user_id uuid,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("leave_balances")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL REFERENCES ${S("employees")}(id) ON DELETE CASCADE,
      leave_type_id uuid REFERENCES ${S("leave_types")}(id) ON DELETE SET NULL,
      balance numeric NOT NULL DEFAULT 0,
      year integer NOT NULL
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("job_requisitions")} (
      id uuid PRIMARY KEY,
      department_id uuid,
      title text NOT NULL,
      description text,
      requirements text,
      responsibilities text,
      status text NOT NULL,
      type text NOT NULL,
      location text,
      is_remote boolean NOT NULL DEFAULT false,
      openings integer NOT NULL DEFAULT 1,
      min_salary numeric,
      max_salary numeric,
      currency text,
      hiring_manager_id uuid,
      recruiter_id uuid,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("candidates")} (
      id uuid PRIMARY KEY,
      full_name text NOT NULL,
      email text NOT NULL,
      phone text,
      nationality text,
      stage text NOT NULL,
      score integer,
      source text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("applications")} (
      id uuid PRIMARY KEY,
      candidate_id uuid NOT NULL REFERENCES ${S("candidates")}(id) ON DELETE CASCADE,
      job_requisition_id uuid NOT NULL REFERENCES ${S("job_requisitions")}(id) ON DELETE CASCADE,
      stage text NOT NULL,
      next_action text,
      notes text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("offers")} (
      id uuid PRIMARY KEY,
      candidate_id uuid NOT NULL REFERENCES ${S("candidates")}(id) ON DELETE CASCADE,
      job_requisition_id uuid NOT NULL REFERENCES ${S("job_requisitions")}(id) ON DELETE CASCADE,
      status text NOT NULL,
      basic_salary numeric NOT NULL,
      start_date date NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("interviews")} (
      id uuid PRIMARY KEY,
      application_id uuid NOT NULL REFERENCES ${S("applications")}(id) ON DELETE CASCADE,
      scheduled_at timestamp NOT NULL,
      location text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("expenses")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL REFERENCES ${S("employees")}(id) ON DELETE CASCADE,
      approver_employee_id uuid,
      category text NOT NULL,
      description text NOT NULL,
      amount numeric NOT NULL,
      currency text NOT NULL DEFAULT 'SAR',
      expense_date date NOT NULL,
      receipt_url text,
      status text NOT NULL,
      rejection_reason text,
      approved_at timestamp,
      paid_at timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `);
  // Tolerate older tables that pre-date the description / expense_date columns.
  await sql.unsafe(`ALTER TABLE ${S("expenses")} ADD COLUMN IF NOT EXISTS description text`).catch(() => undefined);
  await sql.unsafe(`ALTER TABLE ${S("expenses")} ADD COLUMN IF NOT EXISTS expense_date date`).catch(() => undefined);
  await sql.unsafe(`ALTER TABLE ${S("expenses")} ADD COLUMN IF NOT EXISTS receipt_url text`).catch(() => undefined);
  await sql.unsafe(`ALTER TABLE ${S("expenses")} ADD COLUMN IF NOT EXISTS approver_employee_id uuid`).catch(() => undefined);
  await sql.unsafe(`ALTER TABLE ${S("expenses")} ADD COLUMN IF NOT EXISTS rejection_reason text`).catch(() => undefined);
  await sql.unsafe(`ALTER TABLE ${S("expenses")} ADD COLUMN IF NOT EXISTS approved_at timestamp`).catch(() => undefined);
  await sql.unsafe(`ALTER TABLE ${S("expenses")} ADD COLUMN IF NOT EXISTS paid_at timestamp`).catch(() => undefined);
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS ${S("final_settlements")} (
      id uuid PRIMARY KEY,
      employee_id uuid NOT NULL REFERENCES ${S("employees")}(id) ON DELETE CASCADE,
      esb_amount numeric,
      unpaid_salary numeric,
      accrued_leave_payout numeric,
      exit_reason text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  console.log(`  ✓ Created schema ${TENANT} with all tables`);

  // ─── STEP 3: Clear and seed ───────────────────────────────────────
  console.log("\n=== STEP 3: Clear existing seed data ===");
  const tables = [
    "attendance_exceptions", "attendance_records", "shift_assignments", "shifts",
    "recognitions_legacy_skip", "learning_enrollments", "assets", "benefits_enrollments",
    "benefits_plans", "goals", "engagement_pulse", "onboarding_cohorts",
    "expenses", "applications", "offers", "interviews", "candidates",
    "job_requisitions", "documents", "leave_balances", "leave_requests",
    "payslips", "payroll_runs", "employees", "departments",
  ];
  for (const t of tables) {
    if (t === "recognitions_legacy_skip") continue;
    try { await sql.unsafe(`DELETE FROM ${S(t)}`); } catch { /* table may not exist yet */ }
  }
  console.log("  ✓ Cleared tables");

  // ─── STEP 4: Departments ───────────────────────────────────────────
  console.log("\n=== STEP 4: Departments + employees ===");
  const departments = [
    { id: id("dept-people"),   name: "People & Culture" },
    { id: id("dept-field"),    name: "Field Operations" },
    { id: id("dept-projects"), name: "Projects & PMO" },
    { id: id("dept-finance"),  name: "Finance & Procurement" },
    { id: id("dept-hse"),      name: "HSE & Quality" },
  ];
  for (const d of departments) {
    await sql.unsafe(`INSERT INTO ${S("departments")} (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`, [d.id, d.name]);
  }
  for (const e of EMPLOYEES) {
    await sql.unsafe(`
      INSERT INTO ${S("employees")}
        (id, full_name, nationality, department_id, employment_status, hire_date,
         salary_basic, salary_housing, salary_transport, manager_employee_id, job_title,
         gosi_registration_date, gosi_system)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      id(e.slug),
      e.name,
      e.nat,
      id(e.dept),
      e.status,
      e.hire,
      e.sal[0], e.sal[1], e.sal[2],
      null,
      e.job,
      e.hire,
      e.nat === "saudi" ? "old" : null,
    ]);
  }
  console.log(`  ✓ Inserted ${departments.length} departments + ${EMPLOYEES.length} employees`);

  // ─── STEP 5: Shifts + shift assignments ───────────────────────────
  console.log("\n=== STEP 5: Shifts + assignments ===");
  for (const s of SHIFTS) {
    await sql.unsafe(`
      INSERT INTO ${S("shifts")} (id, name, name_ar, start_time, end_time, grace_minutes, work_days, break_minutes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [s.id, s.name, s.nameAr, s.start, s.end, s.grace, s.days, s.break]);
  }
  for (const e of EMPLOYEES) {
    const shiftId = SHIFT_KEY_TO_ID.get(SHIFT_BY_EMP[e.slug])!;
    await sql.unsafe(`
      INSERT INTO ${S("shift_assignments")} (id, employee_id, shift_id, effective_from)
      VALUES ($1, $2, $3, '2026-07-01')
    `, [idSeq(`sa-${e.slug}`), id(e.slug), shiftId]);
  }
  console.log(`  ✓ Inserted ${SHIFTS.length} shifts + ${EMPLOYEES.length} assignments`);

  // ─── STEP 6: Attendance records (last 30 days) ────────────────────
  console.log("\n=== STEP 6: 30 days of attendance records ===");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function hashSeed(s: string): number {
    const h = createHash("sha256").update(s).digest();
    return h.readUInt32BE(0);
  }
  function rngFromSeed(s: string) {
    let seed = hashSeed(s);
    return () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
  }

  let attendanceCount = 0;
  let exceptionCount = 0;

  for (const e of EMPLOYEES) {
    if (e.status === "terminated") continue;
    const rng = rngFromSeed(`${e.slug}-attendance`);
    const shift = SHIFTS.find((s) => s.key === SHIFT_BY_EMP[e.slug])!;
    const [sh, sm] = shift.start.split(":").map(Number);
    const [eh, em] = shift.end.split(":").map(Number);

    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      const dayOfWeek = date.getDay(); // 0=Sun
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Fri/Sat
      const workDays = shift.days.split(",");
      const dayKey = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dayOfWeek];
      if (!workDays.includes(dayKey)) continue;

      // 6% chance of full-day absence
      const skipDay = rng() < 0.06;
      // 4% chance of forgetting punch-out (records punch in only)
      const forgotPunchOut = rng() < 0.04;

      // Skip 2026-07-13 to 2026-07-14 for priya (matches leave)
      if (e.slug === "emp-priya" && dayOffset <= 30 && dayOffset >= 29) continue;

      const workDate = date.toISOString().slice(0, 10);

      if (skipDay) {
        await sql.unsafe(`
          INSERT INTO ${S("attendance_records")}
            (id, employee_id, work_date, shift_id, scheduled_start, scheduled_end, status)
          VALUES ($1, $2, $3, $4, $5, $6, 'absent')
        `, [idSeq(`att-${e.slug}`), id(e.slug), workDate, shift.id, shift.start, shift.end]);
        attendanceCount++;
        continue;
      }

      // Random late arrival: 0–25 minutes
      const lateMinutes = Math.floor(rng() * 25);
      // Work location: 80% Riyadh HQ / Dhahran, 20% Remote
      const workLocation =
        e.dept === "dept-field"
          ? "Dhahran Operations Base"
          : e.dept === "dept-hse"
            ? "HSE Workshop"
            : rng() < 0.2
              ? "Remote (home office)"
              : "Riyadh HQ";

      const punchInHour = (sh + (lateMinutes >= 10 ? 1 : 0)) + (sm / 60);
      const punchInDate = new Date(date);
      punchInDate.setHours(Math.floor(punchInHour), Math.floor((punchInHour % 1) * 60) + lateMinutes, 0, 0);

      const punchOutHour = eh + (em / 60);
      const punchOutDate = new Date(date);
      punchOutDate.setHours(Math.floor(punchOutHour), Math.floor((punchOutHour % 1) * 60), 0, 0);

      const workedMinutes = Math.max(
        0,
        Math.floor((punchOutDate.getTime() - punchInDate.getTime()) / 60_000) - shift.break,
      );

      const status =
        lateMinutes > 10 ? "late" : workedMinutes < 240 ? "half_day" : "present";

      const attId = idSeq(`att-${e.slug}`);
      if (forgotPunchOut) {
        await sql.unsafe(`
          INSERT INTO ${S("attendance_records")}
            (id, employee_id, work_date, shift_id, scheduled_start, scheduled_end,
             punch_in_at, late_minutes, status, work_location, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Forgot to punch out')
        `, [
          attId, id(e.slug), workDate, shift.id, shift.start, shift.end,
          punchInDate, lateMinutes, status, workLocation,
        ]);
        await sql.unsafe(`
          INSERT INTO ${S("attendance_exceptions")}
            (id, attendance_record_id, employee_id, exception_type, status, description)
          VALUES ($1, $2, $3, 'missing_punch_out', 'open', 'Employee left without punching out')
        `, [idSeq(`exc-${e.slug}`), attId, id(e.slug)]);
        exceptionCount++;
      } else {
        await sql.unsafe(`
          INSERT INTO ${S("attendance_records")}
            (id, employee_id, work_date, shift_id, scheduled_start, scheduled_end,
             punch_in_at, punch_out_at, worked_minutes, late_minutes, status, work_location)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          attId, id(e.slug), workDate, shift.id, shift.start, shift.end,
          punchInDate, punchOutDate, workedMinutes, lateMinutes, status, workLocation,
        ]);
        if (lateMinutes > 10) {
          await sql.unsafe(`
            INSERT INTO ${S("attendance_exceptions")}
              (id, attendance_record_id, employee_id, exception_type, status, minutes, description)
            VALUES ($1, $2, $3, 'late_arrival', $4, $5, $6)
          `, [
            idSeq(`exc-${e.slug}`),
            attId,
            id(e.slug),
            rng() < 0.3 ? "acknowledged" : "open",
            lateMinutes,
            `Arrived ${lateMinutes} minutes after scheduled start`,
          ]);
          exceptionCount++;
        }
      }
      attendanceCount++;
    }
  }
  console.log(`  ✓ Inserted ${attendanceCount} attendance records + ${exceptionCount} exceptions`);

  // ─── STEP 7: Leave types + balances + requests ────────────────────
  console.log("\n=== STEP 7: Leave management ===");
  const annualTypeId = id("leave-type-annual");
  const sickTypeId = id("leave-type-sick");
  const personalTypeId = id("leave-type-personal");
  const examTypeId = id("leave-type-exam");
  await sql.unsafe(`INSERT INTO ${S("leave_types")} (id, name, default_days, paid) VALUES ($1, 'Annual leave', 21, true) ON CONFLICT DO NOTHING`, [annualTypeId]);
  await sql.unsafe(`INSERT INTO ${S("leave_types")} (id, name, default_days, paid) VALUES ($1, 'Sick leave', 30, true) ON CONFLICT DO NOTHING`, [sickTypeId]);
  await sql.unsafe(`INSERT INTO ${S("leave_types")} (id, name, default_days, paid) VALUES ($1, 'Personal leave', 5, false) ON CONFLICT DO NOTHING`, [personalTypeId]);
  await sql.unsafe(`INSERT INTO ${S("leave_types")} (id, name, default_days, paid) VALUES ($1, 'Examination leave', 10, true) ON CONFLICT DO NOTHING`, [examTypeId]);

  const leaveRequests = [
    { emp: "emp-priya",  type: annualTypeId,   from: "2026-07-13", to: "2026-07-14", status: "approved" },
    { emp: "emp-omar",   type: personalTypeId, from: "2026-07-20", to: "2026-07-20", status: "pending" },
    { emp: "emp-noura",  type: annualTypeId,   from: "2026-08-02", to: "2026-08-06", status: "approved" },
    { emp: "emp-ahmed",  type: sickTypeId,     from: "2026-06-21", to: "2026-06-23", status: "approved" },
    { emp: "emp-lina",   type: examTypeId,     from: "2026-07-27", to: "2026-07-27", status: "pending" },
    { emp: "emp-yousef", type: annualTypeId,   from: "2026-09-06", to: "2026-09-17", status: "pending" },
  ];
  for (const l of leaveRequests) {
    await sql.unsafe(`
      INSERT INTO ${S("leave_requests")} (id, employee_id, leave_type_id, start_date, end_date, status)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [idSeq("leave"), id(l.emp), l.type, l.from, l.to, l.status]);
  }
  for (const e of EMPLOYEES) {
    const annualRemaining = e.slug === "emp-priya" ? 4 : e.slug === "emp-omar" ? 18 : 14;
    await sql.unsafe(`
      INSERT INTO ${S("leave_balances")} (id, employee_id, leave_type_id, balance, year)
      VALUES ($1, $2, $3, $4, 2026)
    `, [idSeq("leavebal"), id(e.slug), annualTypeId, annualRemaining]);
  }
  console.log(`  ✓ Inserted ${leaveRequests.length} leave requests + ${EMPLOYEES.length} balances`);

  // ─── STEP 8: Payroll runs + payslips ──────────────────────────────
  console.log("\n=== STEP 8: Payroll runs + payslips (3 months) ===");
  const payrollRuns = [
    { id: id("payroll-apr-2026"), period: "2026-04-01", status: "completed", total: 278000 },
    { id: id("payroll-may-2026"), period: "2026-05-01", status: "completed", total: 296000 },
    { id: id("payroll-jun-2026"), period: "2026-06-01", status: "ready", total: 325440 },
  ];
  for (const r of payrollRuns) {
    await sql.unsafe(`INSERT INTO ${S("payroll_runs")} (id, period_month, status, total_amount, completed_at) VALUES ($1, $2, $3, $4, $5)`,
      [r.id, r.period, r.status, r.total, r.status === "completed" ? `${r.period.slice(0, 7)}-27 18:00:00` : null]);
  }
  let payslipCount = 0;
  for (const run of payrollRuns) {
    for (const e of EMPLOYEES) {
      const basic = Number(e.sal[0]);
      const housing = Number(e.sal[1]);
      const transport = Number(e.sal[2]);
      const gosiEmployee = e.nat === "saudi" ? Math.round(basic * 0.0975) : 0;
      const gosiEmployer = e.nat === "saudi" ? Math.round(basic * 0.1175) : Math.round(basic * 0.02);
      const net = basic + housing + transport - gosiEmployee;
      await sql.unsafe(`
        INSERT INTO ${S("payslips")}
          (id, payroll_run_id, employee_id, basic, housing, transport, gosi_employee, gosi_employer, net_pay, pdf_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [idSeq("payslip"), run.id, id(e.slug), basic, housing, transport, gosiEmployee, gosiEmployer, net, `/payslips/${idSeq("payslip")}.pdf`]);
      payslipCount++;
    }
  }
  console.log(`  ✓ Inserted ${payrollRuns.length} runs + ${payslipCount} payslips`);

  // ─── STEP 9: Documents ───────────────────────────────────────────
  console.log("\n=== STEP 9: Documents ===");
  const documents = [
    { emp: "emp-reem",   type: "contract",   name: "Employment contract 2021" },
    { emp: "emp-fahad",  type: "certificate", name: "Operational safety leadership",        expiry: "2026-08-22" },
    { emp: "emp-aisha",  type: "other",       name: "GOSI enrollment confirmation" },
    { emp: "emp-priya",  type: "iqama",       name: "Resident identity",                  expiry: "2026-09-10" },
    { emp: "emp-priya",  type: "passport",    name: "Passport copy",                      expiry: "2028-02-18" },
    { emp: "emp-ahmed",  type: "iqama",       name: "Resident identity (Ahmed)",         expiry: "2027-03-11" },
    { emp: "emp-khalid", type: "certificate", name: "Project management certification",  expiry: "2028-05-30" },
    { emp: "emp-salman", type: "certificate", name: "NEBOSH International General Certificate" },
  ];
  for (const d of documents) {
    await sql.unsafe(`
      INSERT INTO ${S("documents")} (id, employee_id, type, file_name, file_url, version, expiry_date)
      VALUES ($1, $2, $3, $4, $5, '1', $6)
    `, [idSeq("doc"), id(d.emp), d.type, d.name, `/docs/${idSeq("doc")}.pdf`, d.expiry ?? null]);
  }
  console.log(`  ✓ Inserted ${documents.length} documents`);

  // ─── STEP 10: Recruitment ────────────────────────────────────────
  console.log("\n=== STEP 10: Recruitment pipeline ===");
  const jobs = [
    { id: id("req-01"), title: "Drilling Engineer",   dept: id("dept-field"),   status: "interviewing", hiringMgr: "emp-fahad",  recruiter: "emp-noura" },
    { id: id("req-02"), title: "Project Planner",     dept: id("dept-projects"), status: "offer",       hiringMgr: "emp-khalid", recruiter: "emp-noura" },
    { id: id("req-03"), title: "Payroll Officer",     dept: id("dept-people"),  status: "sourcing",    hiringMgr: "emp-reem",   recruiter: "emp-noura" },
  ];
  for (const j of jobs) {
    await sql.unsafe(`
      INSERT INTO ${S("job_requisitions")} (id, title, department_id, status, type, openings, location, hiring_manager_id, recruiter_id, currency)
      VALUES ($1, $2, $3, $4, 'full_time', 1, 'Riyadh, Saudi Arabia', $5, $6, 'SAR')
    `, [j.id, j.title, j.dept, j.status, id(j.hiringMgr), id(j.recruiter)]);
  }
  const candidates = [
    { id: id("candidate-sara"),      name: "Sara Al-Mutairi",    email: "sara.almutairi@candidate.example",    stage: "technical_interview", score: 88 },
    { id: id("candidate-abdullah"),  name: "Abdullah Al-Salem",  email: "abdullah.alsalem@candidate.example",  stage: "offer",             score: 91 },
    { id: id("candidate-fatima"),    name: "Fatima Al-Dosari",   email: "fatima.aldosari@candidate.example",   stage: "screening",         score: 82 },
    { id: id("candidate-jose"),      name: "Jose Dela Cruz",     email: "jose.delacruz@candidate.example",     stage: "rejected",          score: 71 },
  ];
  for (const c of candidates) {
    await sql.unsafe(`INSERT INTO ${S("candidates")} (id, full_name, email, stage, score, source) VALUES ($1, $2, $3, $4, $5, 'careers_page')`,
      [c.id, c.name, c.email, c.stage, c.score]);
  }
  const applications = [
    { id: id("app-01"), cand: id("candidate-sara"),     job: id("req-01"), stage: "technical_interview", next: "Panel interview · 15 Jul" },
    { id: id("app-02"), cand: id("candidate-abdullah"), job: id("req-02"), stage: "offer",             next: "Approve bilingual offer" },
    { id: id("app-03"), cand: id("candidate-fatima"),   job: id("req-03"), stage: "screening",         next: "Payroll assessment" },
    { id: id("app-04"), cand: id("candidate-jose"),     job: id("req-01"), stage: "rejected",          next: "Archive after notice" },
  ];
  for (const a of applications) {
    await sql.unsafe(`INSERT INTO ${S("applications")} (id, candidate_id, job_requisition_id, stage, next_action) VALUES ($1, $2, $3, $4, $5)`,
      [a.id, a.cand, a.job, a.stage, a.next]);
  }
  const interviews = [
    { id: id("int-01"), app: id("app-01"), when: "2026-07-15T10:00:00+03:00", loc: "Teams" },
    { id: id("int-02"), app: id("app-02"), when: "2026-07-12T13:30:00+03:00", loc: "Jubail Office" },
    { id: id("int-03"), app: id("app-03"), when: "2026-07-18T11:00:00+03:00", loc: "Riyadh HQ" },
  ];
  for (const i of interviews) {
    await sql.unsafe(`INSERT INTO ${S("interviews")} (id, application_id, scheduled_at, location) VALUES ($1, $2, $3, $4)`,
      [i.id, i.app, i.when, i.loc]);
  }
  const offers = [
    { id: id("offer-01"), cand: id("candidate-sara"),     job: id("req-01"), status: "draft",             salary: 21000, start: "2026-08-16" },
    { id: id("offer-02"), cand: id("candidate-abdullah"), job: id("req-02"), status: "approval_pending", salary: 18500, start: "2026-09-01" },
  ];
  for (const o of offers) {
    await sql.unsafe(`INSERT INTO ${S("offers")} (id, candidate_id, job_requisition_id, status, basic_salary, start_date) VALUES ($1, $2, $3, $4, $5, $6)`,
      [o.id, o.cand, o.job, o.status, o.salary, o.start]);
  }
  console.log(`  ✓ Inserted ${jobs.length} jobs + ${candidates.length} candidates + ${applications.length} applications + ${interviews.length} interviews + ${offers.length} offers`);

  // ─── STEP 11: Expenses ────────────────────────────────────────────
  console.log("\n=== STEP 11: Expenses ===");
  const expenses = [
    { emp: "emp-fahad",  cat: "Dhahran–Riyadh travel",    amount: 1840, status: "approved" },
    { emp: "emp-omar",   cat: "Field per diem",            amount: 620,  status: "pending" },
    { emp: "emp-khalid", cat: "Client workshop",           amount: 2450, status: "approved" },
    { emp: "emp-lina",   cat: "Project supplies",          amount: 380,  status: "approved" },
    { emp: "emp-salman", cat: "HSE inspection travel",     amount: 910,  status: "pending" },
    { emp: "emp-noura",  cat: "Recruitment event",         amount: 1200, status: "draft" },
  ];
  for (const e of expenses) {
    await sql.unsafe(`INSERT INTO ${S("expenses")} (id, employee_id, category, description, amount, currency, expense_date, status) VALUES ($1, $2, $3, $4, $5, 'SAR', '2026-07-10', $6)`,
      [idSeq("exp"), id(e.emp), e.cat, e.cat, e.amount, e.status]);
  }
  console.log(`  ✓ Inserted ${expenses.length} expenses`);

  // ─── STEP 12: Final settlement for Priya ──────────────────────────
  console.log("\n=== STEP 12: Priya's final settlement ===");
  await sql.unsafe(`
    INSERT INTO ${S("final_settlements")} (id, employee_id, esb_amount, unpaid_salary, accrued_leave_payout, exit_reason)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [id("fs-priya"), id("emp-priya"), 85000, 26000, 12000, "resignation :: " + JSON.stringify({
    offboarding: {
      initiatedBy: "Reem Al-Harbi",
      initiatedAt: "2026-07-01T09:00:00Z",
      lastWorkingDay: "2026-07-31",
      primaryReason: "resignation",
      ktItems: [
        { task: "Hand over Jafurah project plan", successor: "Khalid Al-Mutairi", dueDate: "2026-07-20", status: "in_progress" },
        { task: "Document Dhahran vendor relationships", successor: "Fahad Al-Qahtani", dueDate: "2026-07-25", status: "pending" },
      ],
      assetReturns: [
        { asset: "laptop", serial: "RUKN-LT-2026-007", status: "pending" },
        { asset: "id_card", status: "pending" },
      ],
      itRevocations: [
        { system: "Email & SSO", scheduledFor: "2026-07-31", status: "scheduled" },
        { system: "VPN & network access", scheduledFor: "2026-07-31", status: "scheduled" },
      ],
    }
  })]);
  console.log("  ✓ Final settlement + offboarding payload seeded");

  // ─── STEP 13: Verify ──────────────────────────────────────────────
  console.log("\n=== VERIFICATION ===");
  const counts = [
    "departments", "employees", "shifts", "shift_assignments",
    "attendance_records", "attendance_exceptions",
    "leave_types", "leave_requests", "leave_balances",
    "payroll_runs", "payslips", "documents",
    "job_requisitions", "candidates", "applications", "offers", "interviews",
    "expenses", "final_settlements",
  ];
  for (const t of counts) {
    try {
      const r = await sql.unsafe(`SELECT COUNT(*)::int as c FROM ${S(t)}`);
      console.log(`  ${t.padEnd(25)} ${r[0].c}`);
    } catch {
      console.log(`  ${t.padEnd(25)} skipped`);
    }
  }

  await sql.end();
  console.log("\n✓ Seed complete.");
  console.log(`\nLogin credentials for all 12 employees:`);
  console.log(`  Password: ${PASSWORD}`);
  console.log(`  Domain:   @rukn-energy.example`);
}

main().catch((e) => {
  console.error("✗ FAILED:", e.message);
  if ((e as { code?: string }).code) console.error("  code:", (e as { code?: string }).code);
  process.exit(1);
});
