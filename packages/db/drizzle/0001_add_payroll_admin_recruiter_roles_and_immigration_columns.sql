-- Migration: 0001_add_payroll_admin_recruiter_roles_and_immigration_columns
-- DB uses text columns + CHECK constraints (no PostgreSQL enums).
-- Run users part in public schema; employees part in tenant schema.

-- ============================================================
-- PART 1: users table (public schema)
-- ============================================================

ALTER TABLE users ALTER COLUMN role SET DEFAULT 'employee';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_role_check' AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check
      CHECK (role IN (
        'super_admin','hr_manager','department_manager','hr_specialist',
        'payroll_admin','recruiter','employee','candidate'
      ));
  END IF;
END $$;

UPDATE users SET role = 'employee' WHERE role = 'user';

-- ============================================================
-- PART 2: employees table (tenant_1ed8b6bd3743 schema)
-- Run the employees DDL against the tenant schema explicitly
-- ============================================================

ALTER TABLE tenant_1ed8b6bd3743.employees ADD COLUMN IF NOT EXISTS gcc_status text DEFAULT 'false'
  CHECK (gcc_status IS NULL OR gcc_status IN ('true','false'));

ALTER TABLE tenant_1ed8b6bd3743.employees ADD COLUMN IF NOT EXISTS passport_expiry text;
ALTER TABLE tenant_1ed8b6bd3743.employees ADD COLUMN IF NOT EXISTS iqama_expiry text;
ALTER TABLE tenant_1ed8b6bd3743.employees ADD COLUMN IF NOT EXISTS exit_reentry_expiry text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'employees'
      AND tc.constraint_name LIKE '%visa_type%'
  ) THEN
    ALTER TABLE tenant_1ed8b6bd3743.employees ADD COLUMN IF NOT EXISTS visa_type text
      CHECK (visa_type IS NULL OR visa_type IN ('work','visit','dependent','exit_reentry','final_exit'));
  END IF;
END $$;

ALTER TABLE tenant_1ed8b6bd3743.employees ADD COLUMN IF NOT EXISTS occupation_code text;
ALTER TABLE tenant_1ed8b6bd3743.employees ADD COLUMN IF NOT EXISTS skill_level text
  CHECK (skill_level IS NULL OR skill_level IN ('1','2','3','4','5'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'employees_immigration_status_check'
      AND table_name = 'employees'
  ) THEN
    ALTER TABLE tenant_1ed8b6bd3743.employees ADD COLUMN IF NOT EXISTS immigration_status text DEFAULT 'valid'
      CHECK (immigration_status IS NULL OR immigration_status IN ('valid','expiring_soon','expired','renewal_pending','cancelled'));
  END IF;
END $$;
