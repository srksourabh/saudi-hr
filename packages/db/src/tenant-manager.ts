import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as tenantSchema from "./schema/tenant";
import * as publicSchema from "./schema/public";

const ADMIN_DB_URL = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/hrms-app";

const adminSql = postgres(ADMIN_DB_URL, { max: 5 });
export const adminDb = drizzle(adminSql, { schema: publicSchema });

const tenantPools = new Map<string, ReturnType<typeof drizzle>>();

export function getTenantDb(schemaName: string) {
  const existing = tenantPools.get(schemaName);
  if (existing) return existing;

  const sql = postgres(ADMIN_DB_URL, { max: 5 });
  // Set search_path via raw query
  sql`SET search_path TO ${sql(schemaName)}`.catch(() => {});
  
  const db = drizzle(sql, { schema: tenantSchema });
  tenantPools.set(schemaName, db);
  return db;
}

export async function createTenantSchema(schemaName: string) {
  const sql = postgres(ADMIN_DB_URL, { max: 1 });
  try {
    await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    await sql.unsafe(`SET search_path TO "${schemaName}"`);

    await sql.unsafe(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await sql.unsafe(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    await sql.unsafe(generateTenantDDL());
    return true;
  } finally {
    await sql.end();
  }
}

function generateTenantDDL(): string {
  return `
    CREATE TABLE IF NOT EXISTS "departments" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      parent_department_id UUID,
      head_employee_id UUID,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "employees" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
      manager_employee_id UUID,
      iqama_number_enc TEXT,
      passport_number_enc TEXT,
      bank_iban_enc TEXT,
      nationality TEXT NOT NULL CHECK (nationality IN ('saudi', 'expat')),
      full_name TEXT NOT NULL,
      employment_status TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('active','terminated','suspended','on_leave')),
      hire_date DATE NOT NULL,
      termination_date DATE,
      gosi_registration_date DATE,
      gosi_system TEXT CHECK (gosi_system IN ('old', 'new')),
      salary_basic NUMERIC(12,2) NOT NULL,
      salary_housing NUMERIC(12,2) NOT NULL DEFAULT 0,
      salary_transport NUMERIC(12,2) NOT NULL DEFAULT 0,
      rehire_eligible TEXT,
      rehire_reason TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "employment_history" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL CHECK (event_type IN ('promotion','transfer','salary_change','termination','rehire')),
      effective_date DATE NOT NULL,
      details JSONB,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "documents" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK (type IN ('iqama','passport','work_permit','contract','certificate','other')),
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      expiry_date DATE,
      version TEXT NOT NULL DEFAULT '1',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "leave_types" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      days_allowed INTEGER NOT NULL,
      rules JSONB,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "leave_requests" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
      approved_by_user_id UUID,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "leave_balances" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
      balance NUMERIC(5,1) NOT NULL,
      year INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "payroll_runs" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      period_month DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pre_check','ready','completed','cancelled')),
      total_amount NUMERIC(14,2),
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "payslips" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      basic NUMERIC(12,2) NOT NULL,
      housing NUMERIC(12,2) NOT NULL,
      transport NUMERIC(12,2) NOT NULL,
      overtime NUMERIC(12,2) NOT NULL DEFAULT 0,
      gosi_employee NUMERIC(12,2) NOT NULL DEFAULT 0,
      gosi_employer NUMERIC(12,2) NOT NULL DEFAULT 0,
      deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
      net_pay NUMERIC(12,2) NOT NULL,
      pdf_url TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "wage_files" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
      format TEXT NOT NULL DEFAULT 'mudad',
      file_url TEXT,
      submitted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "compliance_checks" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
      check_type TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('passed','flagged','blocked')),
      flagged_issues JSONB,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "final_settlements" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      esb_amount NUMERIC(12,2),
      unpaid_salary NUMERIC(12,2),
      accrued_leave_payout NUMERIC(12,2),
      exit_reason TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "audit_logs" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      old_value JSONB,
      new_value JSONB,
      ip_address TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "notifications" (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL,
      channel TEXT NOT NULL CHECK (channel IN ('email','sms','in_app')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;
}

export async function createTenantRegistry(
  companyName: string,
  crNumber: string,
  nitaqatActivity: string,
  regulatoryContext?: "saudi" | "india",
) {
  const schemaName = `tenant_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

  const [tenant] = await adminDb
    .insert(publicSchema.tenants)
    .values({
      companyName,
      crNumber,
      nitaqatActivity,
      schemaName,
      ...(regulatoryContext ? { regulatoryContext } : {}),
    })
    .returning();

  await createTenantSchema(schemaName);

  return tenant;
}
