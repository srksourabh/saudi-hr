/**
 * Seed the retention / performance / qiwa feature-module tables for a tenant.
 *
 * Many tenant-schema tables that back the newer feature UIs (goals, reviews,
 * skills, learning, rewards/recognition, engagement, succession, Qiwa, ...) are
 * either MISSING from the demo tenant schema or exist but hold zero rows, so
 * those screens render empty. This script:
 *
 *   PHASE 1 (DDL)  — creates any MISSING tenant tables (CREATE TABLE IF NOT
 *                    EXISTS), plus the enum types they need, schema-qualified to
 *                    the TARGET schema. DDL mirrors the Drizzle definitions in
 *                    packages/db/src/schema/tenant/*.ts.
 *   PHASE 2 (SEED) — inserts a handful of representative, Saudi-HR-flavoured
 *                    rows into each table, but ONLY when the table is currently
 *                    empty. Real employee / department ids from the TARGET schema
 *                    are used for foreign keys.
 *
 * It is idempotent: enum creation is guarded, tables use IF NOT EXISTS, and
 * every table is seeded only when its row count is 0. Safe to re-run.
 *
 * It NEVER touches any schema other than TARGET and never writes to
 * public.users / public.tenants (public.users is only READ, to pick valid
 * notification recipient ids).
 *
 * Run from repo root (does NOT run automatically — invoke explicitly):
 *   NODE_PATH=apps/web/node_modules \
 *     ./packages/db/node_modules/.bin/tsx --env-file=.env \
 *     scripts/seed-rukn-modules.ts
 *
 * Point it at a throwaway schema first:
 *   TARGET_SCHEMA=tenant_scratch_test ... scripts/seed-rukn-modules.ts
 */
import { randomUUID } from "node:crypto";
import { adminDb, getTenantDb, schema, users as publicUsers } from "@hrms-app/db";
import { closeAllPools } from "@hrms-app/db/tenant-manager";
import { count, eq } from "drizzle-orm";

const TARGET = process.env.TARGET_SCHEMA ?? "tenant_1ed8b6bd3743";

// Defence-in-depth: TARGET is interpolated into raw DDL below, so validate it
// against the same pattern tenant-manager uses before doing anything.
const SAFE_SCHEMA = /^[a-z_][a-z0-9_]{0,62}$/;
if (!SAFE_SCHEMA.test(TARGET)) {
  console.error(`Refusing to run: unsafe TARGET_SCHEMA "${TARGET}"`);
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run with --env-file=.env (see header).");
  process.exit(1);
}

const db = getTenantDb(TARGET);
// Drizzle's db.execute is monkey-patched in tenant-manager to run raw SQL via
// postgres.js inside a transaction with `SET LOCAL search_path`. We call it with
// a single SQL statement string per invocation.
const execRaw = (sqlText: string): Promise<any> => (db as any).execute(sqlText);

/** Schema-qualified `"TARGET"."name"` for tables and enum types. */
const qn = (name: string): string => `"${TARGET}"."${name}"`;

// ─── Reporting ──────────────────────────────────────────────────────────────
const ddlSummary: Array<{ table: string; status: "created" | "existed" }> = [];
const seedSummary: Array<{ table: string; result: string }> = [];

// ─── PHASE 1 data: enum types + table DDL ────────────────────────────────────

/** [enum type name, ordered values] — mirrors the pgEnum defs exactly. */
const ENUMS: Array<[string, string[]]> = [
  ["review_type", ["annual", "mid_year", "probation", "project", "360"]],
  ["review_cycle_status", ["planned", "open", "self_review", "manager_review", "calibration", "completed", "archived"]],
  ["review_status", ["pending", "in_progress", "submitted", "acknowledged", "completed"]],
  ["skill_category", ["technical", "soft", "leadership", "domain", "language", "certification"]],
  ["proficiency_level", ["beginner", "intermediate", "advanced", "expert"]],
  ["learning_type", ["course", "workshop", "certification", "mentoring", "coaching", "on_the_job", "conference", "webinar", "self_study"]],
  ["reward_type", ["monetary", "non_monetary", "time_off", "gift", "experience", "development", "public_recognition"]],
  ["engagement_survey_status", ["draft", "scheduled", "open", "closed", "analyzed", "action_planning", "completed"]],
  ["stay_interview_status", ["scheduled", "completed", "action_required", "closed"]],
  ["succession_status", ["identified", "developing", "ready", "promoted", "departed"]],
  ["qiwa_contract_status", ["draft", "submitted", "accepted", "rejected", "terminated"]],
  ["qiwa_contract_type", ["permanent", "contract", "probation"]],
];

function enumDDL([name, values]: [string, string[]]): string {
  const vals = values.map((v) => `'${v}'`).join(", ");
  // Guard so re-runs (or a pre-existing type) don't error.
  return `DO $$ BEGIN CREATE TYPE ${qn(name)} AS ENUM (${vals}); EXCEPTION WHEN duplicate_object THEN null; END $$;`;
}

/**
 * MISSING tables to create, in FK-dependency order (parents first). Each `body`
 * is the column list; enum types and FK targets are schema-qualified to TARGET.
 * FKs to employees/departments use ON DELETE SET NULL (nullable) or CASCADE
 * (required parents). Child rows (goal_key_results, review_responses, ...) use
 * CASCADE to their parent.
 *
 * NOTE: succession_plans.role_id references career_roles in Drizzle, but
 * career_roles is OUT OF SCOPE for this seed. The column is kept `uuid NOT NULL`
 * (type matches Drizzle so app reads work) but WITHOUT the FK constraint; seeded
 * rows use a synthetic role_id. See report notes.
 */
const TABLES: Array<{ name: string; body: string }> = [
  {
    name: "goal_key_results",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      goal_id uuid NOT NULL REFERENCES ${qn("goals")}(id) ON DELETE CASCADE,
      title text NOT NULL,
      description text,
      target_value numeric(12,2),
      current_value numeric(12,2),
      unit text,
      weight integer DEFAULT 100,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "review_cycles",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      description text,
      type ${qn("review_type")} DEFAULT 'annual' NOT NULL,
      status ${qn("review_cycle_status")} DEFAULT 'planned' NOT NULL,
      start_date date NOT NULL,
      end_date date NOT NULL,
      self_review_start_date date,
      self_review_end_date date,
      manager_review_start_date date,
      manager_review_end_date date,
      calibration_start_date date,
      calibration_end_date date,
      is_archived boolean DEFAULT false,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "reviews",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      review_cycle_id uuid NOT NULL REFERENCES ${qn("review_cycles")}(id) ON DELETE CASCADE,
      employee_id uuid NOT NULL REFERENCES ${qn("employees")}(id) ON DELETE CASCADE,
      manager_id uuid REFERENCES ${qn("employees")}(id) ON DELETE SET NULL,
      status ${qn("review_status")} DEFAULT 'pending' NOT NULL,
      type ${qn("review_type")} DEFAULT 'annual' NOT NULL,
      self_review jsonb,
      manager_review jsonb,
      final_rating integer,
      calibration_notes text,
      acknowledged_at timestamp,
      completed_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "review_sections",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      review_cycle_id uuid NOT NULL REFERENCES ${qn("review_cycles")}(id) ON DELETE CASCADE,
      name text NOT NULL,
      description text,
      "order" integer DEFAULT 0,
      weight integer DEFAULT 100,
      is_required boolean DEFAULT true,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "review_responses",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      review_id uuid NOT NULL REFERENCES ${qn("reviews")}(id) ON DELETE CASCADE,
      section_id uuid NOT NULL REFERENCES ${qn("review_sections")}(id) ON DELETE CASCADE,
      reviewer_id uuid NOT NULL REFERENCES ${qn("employees")}(id) ON DELETE CASCADE,
      responses jsonb,
      rating integer,
      submitted_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "skills",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      description text,
      category ${qn("skill_category")} DEFAULT 'technical' NOT NULL,
      is_active boolean DEFAULT true,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "employee_skills",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      employee_id uuid NOT NULL REFERENCES ${qn("employees")}(id) ON DELETE CASCADE,
      skill_id uuid NOT NULL REFERENCES ${qn("skills")}(id) ON DELETE CASCADE,
      proficiency_level ${qn("proficiency_level")} DEFAULT 'beginner' NOT NULL,
      years_experience integer,
      last_used date,
      is_primary boolean DEFAULT false,
      verified_by_id uuid REFERENCES ${qn("employees")}(id) ON DELETE SET NULL,
      verified_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "learning_programs",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      title text NOT NULL,
      description text,
      type ${qn("learning_type")} DEFAULT 'course' NOT NULL,
      provider text,
      url text,
      duration_hours integer,
      cost numeric(12,2),
      currency text DEFAULT 'SAR',
      skills uuid[],
      prerequisites uuid[],
      is_active boolean DEFAULT true,
      max_participants integer,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "rewards",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      description text,
      type ${qn("reward_type")} DEFAULT 'non_monetary' NOT NULL,
      value numeric(12,2),
      currency text DEFAULT 'SAR',
      quantity integer DEFAULT 1,
      is_active boolean DEFAULT true,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "reward_redemptions",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      reward_id uuid NOT NULL REFERENCES ${qn("rewards")}(id) ON DELETE CASCADE,
      employee_id uuid NOT NULL REFERENCES ${qn("employees")}(id) ON DELETE CASCADE,
      redeemed_at timestamp DEFAULT now() NOT NULL,
      approved_by_id uuid REFERENCES ${qn("employees")}(id) ON DELETE SET NULL,
      approved_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "engagement_surveys",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      description text,
      status ${qn("engagement_survey_status")} DEFAULT 'draft' NOT NULL,
      start_date date,
      end_date date,
      questions jsonb,
      target_audience jsonb,
      is_anonymous boolean DEFAULT true,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "survey_responses",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      survey_id uuid NOT NULL REFERENCES ${qn("engagement_surveys")}(id) ON DELETE CASCADE,
      employee_id uuid REFERENCES ${qn("employees")}(id) ON DELETE SET NULL,
      responses jsonb,
      completed_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "stay_interviews",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      employee_id uuid NOT NULL REFERENCES ${qn("employees")}(id) ON DELETE CASCADE,
      interviewer_id uuid REFERENCES ${qn("employees")}(id) ON DELETE SET NULL,
      scheduled_at timestamp,
      completed_at timestamp,
      status ${qn("stay_interview_status")} DEFAULT 'scheduled' NOT NULL,
      responses jsonb,
      risk_factors jsonb,
      action_items jsonb,
      follow_up_date date,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "succession_plans",
    // role_id references career_roles in Drizzle (out of scope here) — kept
    // NOT NULL to match the column type, but the FK is intentionally omitted.
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      role_id uuid NOT NULL,
      department_id uuid REFERENCES ${qn("departments")}(id) ON DELETE SET NULL,
      incumbent_id uuid REFERENCES ${qn("employees")}(id) ON DELETE SET NULL,
      status ${qn("succession_status")} DEFAULT 'identified' NOT NULL,
      risk_level text,
      readiness_date date,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "talent_reviews",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      description text,
      review_date date NOT NULL,
      status text DEFAULT 'planned',
      participants uuid[],
      facilitator_id uuid REFERENCES ${qn("employees")}(id) ON DELETE SET NULL,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "compensation_plans",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      description text,
      type text NOT NULL,
      effective_date date NOT NULL,
      end_date date,
      eligibility_criteria jsonb,
      budget numeric(14,2),
      currency text DEFAULT 'SAR',
      status text DEFAULT 'draft',
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "qiwa_contracts",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      employee_id uuid NOT NULL REFERENCES ${qn("employees")}(id) ON DELETE CASCADE,
      qiwa_employee_id text,
      contract_type ${qn("qiwa_contract_type")} NOT NULL DEFAULT 'permanent',
      status ${qn("qiwa_contract_status")} NOT NULL DEFAULT 'draft',
      job_title text NOT NULL,
      department text,
      salary numeric(12,2) NOT NULL,
      currency text NOT NULL DEFAULT 'SAR',
      work_hours text NOT NULL DEFAULT '8',
      work_days text NOT NULL DEFAULT 'Sunday-Monday-Tuesday-Wednesday-Thursday',
      start_date date NOT NULL,
      end_date date,
      termination_date date,
      resignation_date date,
      notice_period_days integer DEFAULT 60,
      housing_allowance numeric(12,2) DEFAULT 0,
      transport_allowance numeric(12,2) DEFAULT 0,
      other_allowances jsonb,
      gosi_contribution numeric(12,2) DEFAULT 0,
      employer_contribution numeric(12,2) DEFAULT 0,
      qiwa_payload jsonb,
      qiwa_response jsonb,
      last_sync_at timestamp,
      sync_error text,
      is_saudization_priority boolean DEFAULT false,
      nationality text,
      iqama_expiry_date date,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL`,
  },
  {
    name: "qiwa_sync_logs",
    body: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      contract_id uuid NOT NULL REFERENCES ${qn("qiwa_contracts")}(id) ON DELETE CASCADE,
      action text NOT NULL,
      request_payload jsonb,
      response_payload jsonb,
      status text NOT NULL,
      error_message text,
      performed_at timestamp DEFAULT now() NOT NULL,
      duration_ms integer`,
  },
];

/** UNIQUE indexes that carry data-integrity meaning (used by app upserts). */
const UNIQUE_INDEXES: string[] = [
  `CREATE UNIQUE INDEX IF NOT EXISTS "skills_name_idx" ON ${qn("skills")} (name)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "employee_skills_unique_idx" ON ${qn("employee_skills")} (employee_id, skill_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "reviews_unique_idx" ON ${qn("reviews")} (review_cycle_id, employee_id)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "review_responses_unique_idx" ON ${qn("review_responses")} (review_id, section_id, reviewer_id)`,
];

// ─── PHASE 1: DDL ────────────────────────────────────────────────────────────

async function tableExists(name: string): Promise<boolean> {
  const res: any = await execRaw(`SELECT to_regclass('${qn(name)}') IS NOT NULL AS present`);
  return res?.[0]?.present === true;
}

async function runDDL(): Promise<void> {
  console.log(`\n=== PHASE 1: DDL on schema "${TARGET}" ===`);
  await execRaw(`CREATE SCHEMA IF NOT EXISTS "${TARGET}"`);

  for (const spec of ENUMS) {
    await execRaw(enumDDL(spec));
  }
  console.log(`  ✓ ensured ${ENUMS.length} enum types`);

  for (const t of TABLES) {
    const existed = await tableExists(t.name);
    await execRaw(`CREATE TABLE IF NOT EXISTS ${qn(t.name)} (${t.body}\n    )`);
    ddlSummary.push({ table: t.name, status: existed ? "existed" : "created" });
  }
  for (const idx of UNIQUE_INDEXES) {
    await execRaw(idx);
  }
  console.log(`  ✓ ensured ${TABLES.length} tables + ${UNIQUE_INDEXES.length} unique indexes`);
}

// ─── PHASE 1b: ALIGN pre-existing drifted tables ─────────────────────────────
// Several pre-existing tenant tables (built by older seed scripts) carry an
// OLDER, simpler shape than the current Drizzle schema, so the app's full-model
// reads break and Drizzle inserts fail. Bring them up to the current schema with
// additive, idempotent ALTERs: missing columns added; two legacy NOT NULL columns
// loosened so Drizzle inserts that omit them succeed; the old malformed
// recognitions rows removed so the seed can repopulate them. Enum-typed columns
// are added as `text` — Drizzle round-trips enum values as plain strings, so the
// app reads/writes them unchanged without the enum type existing in this schema.
const ALIGN: string[] = [
  // Legacy tables were created without a DB default on `id`, so Drizzle inserts
  // (which omit id and rely on the column default for `.defaultRandom()`) write a
  // NULL id and fail. Restore the default — this also fixes the app's own inserts.
  `ALTER TABLE ${qn("goals")} ALTER COLUMN id SET DEFAULT gen_random_uuid()`,
  `ALTER TABLE ${qn("recognitions")} ALTER COLUMN id SET DEFAULT gen_random_uuid()`,
  `ALTER TABLE ${qn("learning_enrollments")} ALTER COLUMN id SET DEFAULT gen_random_uuid()`,
  `ALTER TABLE ${qn("notifications")} ALTER COLUMN id SET DEFAULT gen_random_uuid()`,
  `ALTER TABLE ${qn("employment_history")} ALTER COLUMN id SET DEFAULT gen_random_uuid()`,
  // goals: add the 9 columns the current model has beyond the legacy shape.
  `ALTER TABLE ${qn("goals")} ADD COLUMN IF NOT EXISTS description text`,
  `ALTER TABLE ${qn("goals")} ADD COLUMN IF NOT EXISTS type text DEFAULT 'okr'`,
  `ALTER TABLE ${qn("goals")} ADD COLUMN IF NOT EXISTS weight integer DEFAULT 100`,
  `ALTER TABLE ${qn("goals")} ADD COLUMN IF NOT EXISTS start_date date`,
  `ALTER TABLE ${qn("goals")} ADD COLUMN IF NOT EXISTS end_date date`,
  `ALTER TABLE ${qn("goals")} ADD COLUMN IF NOT EXISTS metrics jsonb`,
  `ALTER TABLE ${qn("goals")} ADD COLUMN IF NOT EXISTS parent_goal_id uuid`,
  `ALTER TABLE ${qn("goals")} ADD COLUMN IF NOT EXISTS review_cycle_id uuid`,
  `ALTER TABLE ${qn("goals")} ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`,
  // learning_enrollments: legacy `title` NOT NULL blocks Drizzle inserts; add the
  // 12 model columns (incl. program_id + created_at which the legacy shape lacks).
  `ALTER TABLE ${qn("learning_enrollments")} ALTER COLUMN title DROP NOT NULL`,
  `ALTER TABLE ${qn("learning_enrollments")} ADD COLUMN IF NOT EXISTS program_id uuid`,
  `ALTER TABLE ${qn("learning_enrollments")} ADD COLUMN IF NOT EXISTS enrolled_at timestamp DEFAULT now()`,
  `ALTER TABLE ${qn("learning_enrollments")} ADD COLUMN IF NOT EXISTS started_at timestamp`,
  `ALTER TABLE ${qn("learning_enrollments")} ADD COLUMN IF NOT EXISTS completed_at timestamp`,
  `ALTER TABLE ${qn("learning_enrollments")} ADD COLUMN IF NOT EXISTS due_date date`,
  `ALTER TABLE ${qn("learning_enrollments")} ADD COLUMN IF NOT EXISTS score numeric(5,2)`,
  `ALTER TABLE ${qn("learning_enrollments")} ADD COLUMN IF NOT EXISTS certificate_url text`,
  `ALTER TABLE ${qn("learning_enrollments")} ADD COLUMN IF NOT EXISTS feedback jsonb`,
  `ALTER TABLE ${qn("learning_enrollments")} ADD COLUMN IF NOT EXISTS approved_by_id uuid`,
  `ALTER TABLE ${qn("learning_enrollments")} ADD COLUMN IF NOT EXISTS approved_at timestamp`,
  `ALTER TABLE ${qn("learning_enrollments")} ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now()`,
  `ALTER TABLE ${qn("learning_enrollments")} ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`,
  // notifications: add the 3 model columns beyond the legacy shape.
  `ALTER TABLE ${qn("notifications")} ADD COLUMN IF NOT EXISTS type text`,
  `ALTER TABLE ${qn("notifications")} ADD COLUMN IF NOT EXISTS severity text`,
  `ALTER TABLE ${qn("notifications")} ADD COLUMN IF NOT EXISTS metadata jsonb`,
  // recognitions: loosen legacy `employee_id` NOT NULL, add model columns, then
  // delete the old malformed rows (guarded by the new to_employee_id being null,
  // so re-runs never touch freshly-seeded rows).
  `ALTER TABLE ${qn("recognitions")} ALTER COLUMN employee_id DROP NOT NULL`,
  `ALTER TABLE ${qn("recognitions")} ADD COLUMN IF NOT EXISTS to_employee_id uuid`,
  `ALTER TABLE ${qn("recognitions")} ADD COLUMN IF NOT EXISTS type text DEFAULT 'peer'`,
  `ALTER TABLE ${qn("recognitions")} ADD COLUMN IF NOT EXISTS "values" text[]`,
  `ALTER TABLE ${qn("recognitions")} ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true`,
  `ALTER TABLE ${qn("recognitions")} ADD COLUMN IF NOT EXISTS reward_id uuid`,
  `DELETE FROM ${qn("recognitions")} WHERE to_employee_id IS NULL`,
];

async function runAlign(): Promise<void> {
  console.log(`\n=== PHASE 1b: ALIGN pre-existing drifted tables ===`);
  let ok = 0;
  let skipped = 0;
  for (const stmt of ALIGN) {
    try {
      await execRaw(stmt);
      ok++;
    } catch (e) {
      skipped++;
      console.warn(`  ! align skipped: ${(e as Error).message}`);
    }
  }
  console.log(`  ✓ ${ok} align statements applied${skipped ? `, ${skipped} skipped` : ""}`);
}

// ─── PHASE 2: SEED ───────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

/** Insert `rows` into `table` only when the table is currently empty. */
async function seedIfEmpty(
  label: string,
  table: any,
  build: () => Row[],
): Promise<string[]> {
  const [{ n }] = await db.select({ n: count() }).from(table);
  const existing = Number(n);
  if (existing > 0) {
    seedSummary.push({ table: label, result: `skipped (${existing} existing)` });
    return [];
  }
  const rows = build();
  if (rows.length === 0) {
    seedSummary.push({ table: label, result: "skipped (no rows — missing FK deps)" });
    return [];
  }
  await db.insert(table).values(rows as any);
  seedSummary.push({ table: label, result: `seeded ${rows.length} rows` });
  return [];
}

/** Current ids from a table (used to wire children to freshly-seeded parents). */
async function idsOf(table: any, limit = 50): Promise<string[]> {
  const rows: Array<{ id: string }> = await db.select({ id: table.id }).from(table).limit(limit);
  return rows.map((r) => r.id);
}

const T = schema.tenant;

async function runSeed(): Promise<void> {
  console.log(`\n=== PHASE 2: SEED (empty tables only) ===`);

  // Real ids from the TARGET schema.
  const emps: Array<{ id: string; fullName: string; departmentId: string | null; employmentStatus: string }> =
    await db
      .select({
        id: T.employees.id,
        fullName: T.employees.fullName,
        departmentId: T.employees.departmentId,
        employmentStatus: T.employees.employmentStatus,
      })
      .from(T.employees);
  const depts: Array<{ id: string; name: string }> = await db
    .select({ id: T.departments.id, name: T.departments.name })
    .from(T.departments);

  const empIds = emps.map((e) => e.id);
  const deptNameById = new Map(depts.map((d) => [d.id, d.name]));
  console.log(`  found ${emps.length} employee(s), ${depts.length} department(s)`);

  const hasEmp = empIds.length > 0;
  const at = (i: number) => empIds[i % empIds.length];

  // Notification recipients must be public.users ids (matched against ctx.user.id
  // in the app). Read-only lookup via adminDb; fall back to employee ids so the
  // table is at least non-empty on a throwaway schema with no tenant users.
  let recipientUserIds: string[] = [];
  try {
    const tenantRows: Array<{ id: string; schemaName: string }> =
      await adminDb.query.tenants.findMany({ columns: { id: true, schemaName: true } });
    const tenantRow = tenantRows.find((r) => r.schemaName === TARGET);
    if (tenantRow) {
      const us: Array<{ id: string }> = await adminDb.query.users.findMany({
        where: eq(publicUsers.tenantId, tenantRow.id),
        columns: { id: true },
      });
      recipientUserIds = us.map((u) => u.id);
    }
  } catch (err) {
    console.warn(`  ! could not read public.users for notifications: ${(err as Error).message}`);
  }

  // ── skills (create+seed) ────────────────────────────────────────────────
  await seedIfEmpty("skills", T.skills, () => [
    { name: "Drilling Safety (IWCF)", description: "Well control and drilling safety to IWCF standards", category: "technical", isActive: true },
    { name: "AutoCAD", description: "2D/3D drafting and engineering design", category: "technical", isActive: true },
    { name: "IFRS Accounting", description: "International Financial Reporting Standards", category: "domain", isActive: true },
    { name: "HSE Compliance", description: "Health, Safety & Environment regulatory compliance", category: "certification", isActive: true },
    { name: "Team Leadership", description: "Leading and developing high-performing teams", category: "leadership", isActive: true },
    { name: "Arabic-English Translation", description: "Bilingual business communication", category: "language", isActive: true },
  ]);
  const skillIds = await idsOf(T.skills);

  // ── employee_skills (needs employees + skills) ──────────────────────────
  await seedIfEmpty("employee_skills", T.employeeSkills, () => {
    if (!hasEmp || skillIds.length === 0) return [];
    const rows: Row[] = [];
    const cnt = Math.min(6, empIds.length);
    const levels = ["expert", "advanced", "intermediate", "beginner"];
    for (let i = 0; i < cnt; i++) {
      rows.push({
        employeeId: empIds[i],
        skillId: skillIds[i % skillIds.length],
        proficiencyLevel: levels[i % levels.length],
        yearsExperience: 2 + (i % 8),
        isPrimary: i === 0,
      });
    }
    return rows;
  });

  // ── review_cycles (create+seed) ─────────────────────────────────────────
  await seedIfEmpty("review_cycles", T.reviewCycles, () => [
    {
      name: "H1 2026 Performance Review",
      description: "Mid-year performance and goal review cycle",
      type: "mid_year",
      status: "self_review",
      startDate: "2026-01-01",
      endDate: "2026-06-30",
      selfReviewStartDate: "2026-06-01",
      selfReviewEndDate: "2026-06-15",
      managerReviewStartDate: "2026-06-16",
      managerReviewEndDate: "2026-06-25",
    },
    {
      name: "Annual 2025 Review",
      description: "Completed annual review cycle for 2025",
      type: "annual",
      status: "completed",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      isArchived: false,
    },
  ]);
  const cycleIds = await idsOf(T.reviewCycles);

  // ── reviews (needs review_cycles + employees) ───────────────────────────
  await seedIfEmpty("reviews", T.reviews, () => {
    if (!hasEmp || cycleIds.length === 0) return [];
    const cycle = cycleIds[0];
    const rows: Row[] = [];
    const cnt = Math.min(5, empIds.length);
    const statuses = ["in_progress", "submitted", "in_progress", "pending", "submitted"];
    for (let i = 0; i < cnt; i++) {
      rows.push({
        reviewCycleId: cycle,
        employeeId: empIds[i],
        managerId: empIds[0],
        status: statuses[i % statuses.length],
        type: "mid_year",
        selfReview: { summary: "Met most objectives; strong collaboration.", rating: 4 },
      });
    }
    return rows;
  });

  // ── goals (seed-only; table pre-exists) ─────────────────────────────────
  await seedIfEmpty("goals", T.goals, () => {
    if (!hasEmp) return [];
    const specs = [
      { title: "Complete IWCF Level 3 drilling safety certification", type: "development", status: "on_track", progress: 60 },
      { title: "Reduce monthly payroll processing time by 20%", type: "kpi", status: "active", progress: 35 },
      { title: "Launch Nitaqat compliance dashboard for Q2", type: "project", status: "on_track", progress: 50 },
      { title: "Mentor two junior field engineers", type: "development", status: "active", progress: 40 },
      { title: "Achieve zero lost-time incidents in H1 2026", type: "okr", status: "at_risk", progress: 70 },
    ];
    return specs.map((s, i) => ({
      employeeId: at(i),
      managerId: empIds[0],
      title: s.title,
      description: `${s.title} — tracked for the current review cycle.`,
      type: s.type,
      status: s.status,
      weight: 100,
      startDate: "2026-01-01",
      endDate: "2026-06-30",
      progress: s.progress,
    }));
  });
  const goalIds = await idsOf(T.goals);

  // ── goal_key_results (needs goals) ──────────────────────────────────────
  await seedIfEmpty("goal_key_results", T.goalKeyResults, () => {
    if (goalIds.length === 0) return [];
    const rows: Row[] = [];
    const krs = [
      { title: "Pass certification exam", target: "100", current: "60", unit: "%" },
      { title: "Cut average run time", target: "48", current: "62", unit: "hours" },
      { title: "Ship dashboard v1", target: "1", current: "0", unit: "release" },
      { title: "Mentoring sessions held", target: "12", current: "5", unit: "sessions" },
      { title: "Lost-time incidents", target: "0", current: "1", unit: "incidents" },
    ];
    const cnt = Math.min(goalIds.length, krs.length);
    for (let i = 0; i < cnt; i++) {
      rows.push({
        goalId: goalIds[i],
        title: krs[i].title,
        description: "Key result for the linked goal.",
        targetValue: krs[i].target,
        currentValue: krs[i].current,
        unit: krs[i].unit,
        weight: 100,
      });
    }
    return rows;
  });

  // ── rewards (create+seed) ───────────────────────────────────────────────
  await seedIfEmpty("rewards", T.rewards, () => [
    { name: "Employee of the Month Bonus", description: "Cash bonus for outstanding monthly performance", type: "monetary", value: "2000.00", currency: "SAR", quantity: 1, isActive: true },
    { name: "Extra Annual Leave Day", description: "One additional paid leave day", type: "time_off", currency: "SAR", quantity: 12, isActive: true },
    { name: "Team Dinner Voucher", description: "Dinner voucher for the team", type: "gift", value: "500.00", currency: "SAR", quantity: 5, isActive: true },
    { name: "Professional Development Fund", description: "Sponsored training / conference budget", type: "development", value: "5000.00", currency: "SAR", quantity: 3, isActive: true },
  ]);
  const rewardIds = await idsOf(T.rewards);

  // ── reward_redemptions (needs rewards + employees) ──────────────────────
  await seedIfEmpty("reward_redemptions", T.rewardRedemptions, () => {
    if (!hasEmp || rewardIds.length === 0) return [];
    const rows: Row[] = [];
    const cnt = Math.min(3, empIds.length, rewardIds.length);
    for (let i = 0; i < cnt; i++) {
      rows.push({
        rewardId: rewardIds[i],
        employeeId: empIds[i],
        approvedById: empIds[0],
        approvedAt: new Date("2026-06-10T09:00:00Z"),
      });
    }
    return rows;
  });

  // ── recognitions (seed-only; table pre-exists) ──────────────────────────
  await seedIfEmpty("recognitions", T.recognitions, () => {
    if (empIds.length < 2) return [];
    const msgs = [
      { type: "peer", message: "Thank you for covering the night shift on short notice!", values: ["teamwork", "reliability"] },
      { type: "manager", message: "Excellent handling of the Q1 GOSI reconciliation.", values: ["excellence"] },
      { type: "achievement", message: "Congrats on closing the Dhahran project ahead of schedule.", values: ["ownership"] },
      { type: "values", message: "You embody our safety-first culture every day.", values: ["safety", "integrity"] },
    ];
    return msgs.map((m, i) => ({
      fromEmployeeId: empIds[i % empIds.length],
      toEmployeeId: empIds[(i + 1) % empIds.length],
      type: m.type,
      message: m.message,
      values: m.values,
      isPublic: true,
    }));
  });

  // ── learning_programs (create+seed) ─────────────────────────────────────
  await seedIfEmpty("learning_programs", T.learningPrograms, () => {
    const specs = [
      { title: "Advanced Drilling Safety (IWCF Level 3)", type: "certification", provider: "IWCF", hours: 40, cost: "8000.00" },
      { title: "AutoCAD for Engineers", type: "course", provider: "Autodesk", hours: 24, cost: "3000.00" },
      { title: "IFRS for Finance & HR", type: "workshop", provider: "SOCPA", hours: 16, cost: "2500.00" },
      { title: "Leadership Essentials", type: "course", provider: "LinkedIn Learning", hours: 12, cost: "1200.00" },
    ];
    return specs.map((s, i) => ({
      title: s.title,
      description: `${s.title} training program.`,
      type: s.type,
      provider: s.provider,
      durationHours: s.hours,
      cost: s.cost,
      currency: "SAR",
      skills: skillIds.length ? [skillIds[i % skillIds.length]] : [],
      isActive: true,
      maxParticipants: 20,
    }));
  });
  const programIds = await idsOf(T.learningPrograms);

  // ── learning_enrollments (seed-only; needs programs + employees) ────────
  await seedIfEmpty("learning_enrollments", T.learningEnrollments, () => {
    if (!hasEmp || programIds.length === 0) return [];
    const rows: Row[] = [];
    const cnt = Math.min(4, empIds.length);
    const statuses = ["enrolled", "in_progress", "completed", "in_progress"];
    for (let i = 0; i < cnt; i++) {
      const status = statuses[i % statuses.length];
      rows.push({
        employeeId: empIds[i],
        programId: programIds[i % programIds.length],
        status,
        progress: status === "completed" ? 100 : status === "in_progress" ? 45 : 0,
        completedAt: status === "completed" ? new Date("2026-05-20T10:00:00Z") : null,
        score: status === "completed" ? "88.00" : null,
      });
    }
    return rows;
  });

  // ── engagement_surveys (create+seed) ────────────────────────────────────
  await seedIfEmpty("engagement_surveys", T.engagementSurveys, () => {
    const questions = [
      { id: "q1", text: "I feel valued at work.", type: "scale_1_5" },
      { id: "q2", text: "I have the tools I need to do my job.", type: "scale_1_5" },
      { id: "q3", text: "I would recommend this company as a place to work.", type: "scale_1_5" },
    ];
    return [
      { name: "Q1 2026 Employee Pulse Survey", description: "Quarterly engagement pulse", status: "open", startDate: "2026-01-15", endDate: "2026-01-31", questions, isAnonymous: true },
      { name: "2025 Annual Engagement Survey", description: "Annual engagement survey", status: "completed", startDate: "2025-11-01", endDate: "2025-11-15", questions, isAnonymous: true },
    ];
  });
  const surveyIds = await idsOf(T.engagementSurveys);

  // ── survey_responses (needs surveys; employee optional/anonymous) ───────
  await seedIfEmpty("survey_responses", T.surveyResponses, () => {
    if (surveyIds.length === 0) return [];
    const survey = surveyIds[0];
    const rows: Row[] = [];
    for (let i = 0; i < 4; i++) {
      rows.push({
        surveyId: survey,
        employeeId: null, // anonymous survey
        responses: { q1: 4 + (i % 2), q2: 3 + (i % 3), q3: 5 - (i % 2) },
        completedAt: new Date("2026-01-20T12:00:00Z"),
      });
    }
    return rows;
  });

  // ── stay_interviews (needs employees) ───────────────────────────────────
  await seedIfEmpty("stay_interviews", T.stayInterviews, () => {
    if (!hasEmp) return [];
    const rows: Row[] = [];
    const specs = [
      { status: "completed", done: true },
      { status: "scheduled", done: false },
      { status: "action_required", done: true },
    ];
    const cnt = Math.min(specs.length, empIds.length);
    for (let i = 0; i < cnt; i++) {
      rows.push({
        employeeId: empIds[i],
        interviewerId: empIds[0],
        scheduledAt: new Date("2026-06-05T09:00:00Z"),
        completedAt: specs[i].done ? new Date("2026-06-05T09:45:00Z") : null,
        status: specs[i].status,
        responses: { motivation: "Career growth", concerns: "Workload during peak season" },
        riskFactors: { flightRisk: i === 2 ? "medium" : "low" },
      });
    }
    return rows;
  });

  // ── succession_plans (needs employees; role_id synthetic) ───────────────
  await seedIfEmpty("succession_plans", T.successionPlans, () => {
    if (!hasEmp) return [];
    const rows: Row[] = [];
    const specs = [
      { status: "identified", risk: "high" },
      { status: "developing", risk: "medium" },
      { status: "ready", risk: "low" },
    ];
    const cnt = Math.min(specs.length, empIds.length);
    for (let i = 0; i < cnt; i++) {
      rows.push({
        roleId: randomUUID(), // NOTE: unlinked — career_roles is out of scope
        departmentId: depts.length ? depts[i % depts.length].id : null,
        incumbentId: empIds[i],
        status: specs[i].status,
        riskLevel: specs[i].risk,
        readinessDate: "2026-12-31",
      });
    }
    return rows;
  });

  // ── talent_reviews (facilitator/participants optional) ──────────────────
  await seedIfEmpty("talent_reviews", T.talentReviews, () => [
    {
      name: "H1 2026 Talent Review",
      description: "Nine-box talent calibration for H1 2026",
      reviewDate: "2026-06-20",
      status: "in_progress",
      participants: empIds.slice(0, 4),
      facilitatorId: hasEmp ? empIds[0] : null,
    },
    {
      name: "Leadership Succession Review",
      description: "Review of leadership pipeline and successors",
      reviewDate: "2026-03-15",
      status: "completed",
      participants: empIds.slice(0, 3),
      facilitatorId: hasEmp ? empIds[0] : null,
    },
  ]);

  // ── compensation_plans (no FK) ──────────────────────────────────────────
  await seedIfEmpty("compensation_plans", T.compensationPlans, () => [
    { name: "2026 Annual Merit Increase", description: "Annual merit-based salary increases", type: "merit", effectiveDate: "2026-01-01", budget: "500000.00", currency: "SAR", status: "active", eligibilityCriteria: { minTenureMonths: 12, statuses: ["active"] } },
    { name: "2026 Performance Bonus Pool", description: "Performance-linked bonus pool", type: "bonus", effectiveDate: "2026-07-01", budget: "300000.00", currency: "SAR", status: "draft", eligibilityCriteria: { minRating: 3 } },
  ]);

  // ── qiwa_contracts (create+seed; needs employees) ───────────────────────
  await seedIfEmpty("qiwa_contracts", T.qiwaContracts, () => {
    if (!hasEmp) return [];
    const rows: Row[] = [];
    const cnt = Math.min(5, emps.length);
    const statuses = ["accepted", "submitted", "draft", "accepted", "submitted"];
    const salaries = ["18000.00", "22000.00", "14000.00", "31000.00", "25500.00"];
    for (let i = 0; i < cnt; i++) {
      const e = emps[i];
      rows.push({
        employeeId: e.id,
        qiwaEmployeeId: `QIWA-${1000 + i}`,
        contractType: i % 4 === 2 ? "contract" : "permanent",
        status: statuses[i % statuses.length],
        jobTitle: "Employee",
        department: e.departmentId ? deptNameById.get(e.departmentId) ?? "General" : "General",
        salary: salaries[i % salaries.length],
        currency: "SAR",
        workHours: "8",
        workDays: "Sunday-Monday-Tuesday-Wednesday-Thursday",
        startDate: "2022-01-01",
        noticePeriodDays: 60,
        housingAllowance: "3000.00",
        transportAllowance: "1000.00",
        gosiContribution: "1800.00",
        employerContribution: "2400.00",
        nationality: "saudi",
        isSaudizationPriority: false,
      });
    }
    return rows;
  });
  const contractIds = await idsOf(T.qiwaContracts);

  // ── qiwa_sync_logs (needs contracts) ────────────────────────────────────
  await seedIfEmpty("qiwa_sync_logs", T.qiwaSyncLogs, () => {
    if (contractIds.length === 0) return [];
    const rows: Row[] = [];
    const specs = [
      { action: "create", status: "success" },
      { action: "update", status: "success" },
      { action: "status_check", status: "failed" },
    ];
    const cnt = Math.min(specs.length, contractIds.length);
    for (let i = 0; i < cnt; i++) {
      rows.push({
        contractId: contractIds[i % contractIds.length],
        action: specs[i].action,
        status: specs[i].status,
        requestPayload: { contractId: contractIds[i % contractIds.length], action: specs[i].action },
        responsePayload: specs[i].status === "success" ? { ok: true } : { ok: false, error: "Qiwa timeout" },
        errorMessage: specs[i].status === "failed" ? "Qiwa API timeout" : null,
        durationMs: 120 + i * 40,
      });
    }
    return rows;
  });

  // ── notifications (seed-only; needs public.users ids) ───────────────────
  await seedIfEmpty("notifications", T.notifications, () => {
    const recipients = recipientUserIds.length ? recipientUserIds : empIds;
    if (recipients.length === 0) return [];
    const templates = [
      { type: "leave_request", title: "Leave request pending", message: "A leave request is awaiting your approval.", severity: "info" },
      { type: "document_expiry", title: "Iqama expiring soon", message: "An employee's Iqama expires within 60 days.", severity: "warning" },
      { type: "payroll", title: "Payroll run ready", message: "The June 2026 payroll run is ready for review.", severity: "info" },
    ];
    const rows: Row[] = [];
    const recipCount = Math.min(3, recipients.length);
    for (let r = 0; r < recipCount; r++) {
      for (let j = 0; j < 2; j++) {
        const tpl = templates[(r + j) % templates.length];
        rows.push({
          userId: recipients[r],
          channel: "in_app",
          type: tpl.type,
          title: tpl.title,
          message: tpl.message,
          severity: tpl.severity,
          read: false,
        });
      }
    }
    return rows;
  });

  // ── employment_history (seed-only; needs employees) ─────────────────────
  await seedIfEmpty("employment_history", T.employmentHistory, () => {
    if (!hasEmp) return [];
    const rows: Row[] = [];
    const specs = [
      { eventType: "promotion", date: "2024-01-01", details: { from: "Engineer", to: "Senior Engineer" } },
      { eventType: "salary_change", date: "2024-07-01", details: { reason: "Annual merit increase", pct: 5 } },
      { eventType: "transfer", date: "2025-02-15", details: { fromDept: "Field Operations", toDept: "Projects & PMO" } },
      { eventType: "rehire", date: "2025-09-01", details: { note: "Rejoined after sabbatical" } },
    ];
    const cnt = Math.min(specs.length, empIds.length);
    for (let i = 0; i < cnt; i++) {
      rows.push({
        employeeId: empIds[i],
        eventType: specs[i].eventType,
        effectiveDate: specs[i].date,
        details: specs[i].details,
      });
    }
    return rows;
  });
}

// ─── Entry point ─────────────────────────────────────────────────────────────

function printSummary(): void {
  console.log(`\n=== SUMMARY (schema "${TARGET}") ===`);
  console.log("\nTables (DDL):");
  for (const d of ddlSummary) {
    console.log(`  ${d.table.padEnd(24)} ${d.status}`);
  }
  console.log("\nSeeding:");
  for (const s of seedSummary) {
    console.log(`  ${s.table.padEnd(24)} ${s.result}`);
  }
}

// ─── PHASE 3: VALIDATE app-model reads ───────────────────────────────────────
// `db.select().from(table)` selects exactly the columns the app's Drizzle model
// defines — the same read the running app issues. If any created/aligned table is
// missing a model column, this throws, so a schema mismatch fails loudly here
// (on the scratch schema) instead of silently breaking a module in the demo.
async function validateReads(): Promise<void> {
  console.log(`\n=== PHASE 3: VALIDATE app-model reads ===`);
  const checks: Array<[string, any]> = [
    ["goals", T.goals],
    ["goal_key_results", T.goalKeyResults],
    ["review_cycles", T.reviewCycles],
    ["reviews", T.reviews],
    ["skills", T.skills],
    ["employee_skills", T.employeeSkills],
    ["learning_programs", T.learningPrograms],
    ["learning_enrollments", T.learningEnrollments],
    ["rewards", T.rewards],
    ["reward_redemptions", T.rewardRedemptions],
    ["recognitions", T.recognitions],
    ["engagement_surveys", T.engagementSurveys],
    ["survey_responses", T.surveyResponses],
    ["stay_interviews", T.stayInterviews],
    ["succession_plans", T.successionPlans],
    ["talent_reviews", T.talentReviews],
    ["compensation_plans", T.compensationPlans],
    ["qiwa_contracts", T.qiwaContracts],
    ["qiwa_sync_logs", T.qiwaSyncLogs],
    ["notifications", T.notifications],
    ["employment_history", T.employmentHistory],
  ];
  let bad = 0;
  for (const [label, tbl] of checks) {
    if (!tbl) {
      bad++;
      console.error(`  ✗ ${label}: no Drizzle table object (schema.tenant export missing)`);
      continue;
    }
    try {
      await db.select().from(tbl).limit(1);
      console.log(`  ✓ ${label}`);
    } catch (e) {
      bad++;
      console.error(`  ✗ ${label}: ${(e as Error).message}`);
    }
  }
  if (bad > 0) throw new Error(`${bad} table(s) failed app-model read validation`);
  console.log(`  ✓ all ${checks.length} tables read cleanly with the app's Drizzle model`);
}

async function main(): Promise<void> {
  try {
    await runDDL();
    await runAlign();
    await runSeed();
    await validateReads();
    printSummary();
  } finally {
    await closeAllPools().catch(() => undefined);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\nseed-rukn-modules failed:", err);
    process.exit(1);
  });
