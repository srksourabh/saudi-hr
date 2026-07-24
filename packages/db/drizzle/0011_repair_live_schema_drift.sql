CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "public"."invite_token_index" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "token" text NOT NULL,
  "tenant_schema" text NOT NULL,
  "invitation_id" uuid NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "invite_token_index_token_idx"
  ON "public"."invite_token_index" ("token");

CREATE INDEX IF NOT EXISTS "invite_token_index_status_idx"
  ON "public"."invite_token_index" ("status", "expires_at");

DO $$
DECLARE
  tenant_schema text;
  duplicate_attendance_sequences integer;
BEGIN
  FOR tenant_schema IN
    SELECT DISTINCT schema_name
    FROM public.tenants
    WHERE schema_name ~ '^[a-z_][a-z0-9_]{0,62}$'
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type typ
      JOIN pg_namespace ns ON ns.oid = typ.typnamespace
      WHERE ns.nspname = tenant_schema AND typ.typname = 'visa_type'
    ) THEN
      EXECUTE format(
        'CREATE TYPE %I.visa_type AS ENUM (''work'', ''visit'', ''dependent'', ''exit_reentry'', ''final_exit'')',
        tenant_schema
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_type typ
      JOIN pg_namespace ns ON ns.oid = typ.typnamespace
      WHERE ns.nspname = tenant_schema AND typ.typname = 'immigration_status'
    ) THEN
      EXECUTE format(
        'CREATE TYPE %I.immigration_status AS ENUM (''valid'', ''expiring_soon'', ''expired'', ''renewal_pending'', ''cancelled'')',
        tenant_schema
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_type typ
      JOIN pg_namespace ns ON ns.oid = typ.typnamespace
      WHERE ns.nspname = tenant_schema AND typ.typname = 'application_status'
    ) THEN
      EXECUTE format(
        'CREATE TYPE %I.application_status AS ENUM (''applied'', ''screening'', ''phone_screen'', ''technical_interview'', ''final_interview'', ''offer_extended'', ''offer_accepted'', ''offer_declined'', ''hired'', ''rejected'', ''withdrawn'')',
        tenant_schema
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_type typ
      JOIN pg_namespace ns ON ns.oid = typ.typnamespace
      WHERE ns.nspname = tenant_schema AND typ.typname = 'interview_type'
    ) THEN
      EXECUTE format(
        'CREATE TYPE %I.interview_type AS ENUM (''phone_screen'', ''video'', ''in_person'', ''technical'', ''panel'', ''cultural_fit'', ''final'')',
        tenant_schema
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_type typ
      JOIN pg_namespace ns ON ns.oid = typ.typnamespace
      WHERE ns.nspname = tenant_schema AND typ.typname = 'interview_status'
    ) THEN
      EXECUTE format(
        'CREATE TYPE %I.interview_status AS ENUM (''scheduled'', ''completed'', ''cancelled'', ''no_show'', ''rescheduled'')',
        tenant_schema
      );
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_type typ
      JOIN pg_namespace ns ON ns.oid = typ.typnamespace
      WHERE ns.nspname = tenant_schema AND typ.typname = 'offer_status'
    ) THEN
      EXECUTE format(
        'CREATE TYPE %I.offer_status AS ENUM (''draft'', ''sent'', ''accepted'', ''declined'', ''expired'', ''withdrawn'')',
        tenant_schema
      );
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = tenant_schema AND table_name = 'employees'
    ) THEN
      EXECUTE format('ALTER TABLE %I.employees ADD COLUMN IF NOT EXISTS gcc_status text DEFAULT ''false''', tenant_schema);
      EXECUTE format('ALTER TABLE %I.employees ADD COLUMN IF NOT EXISTS passport_expiry date', tenant_schema);
      EXECUTE format('ALTER TABLE %I.employees ADD COLUMN IF NOT EXISTS iqama_expiry date', tenant_schema);
      EXECUTE format('ALTER TABLE %I.employees ADD COLUMN IF NOT EXISTS exit_reentry_expiry date', tenant_schema);
      EXECUTE format('ALTER TABLE %I.employees ADD COLUMN IF NOT EXISTS visa_type %I.visa_type', tenant_schema, tenant_schema);
      EXECUTE format('ALTER TABLE %I.employees ADD COLUMN IF NOT EXISTS occupation_code text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.employees ADD COLUMN IF NOT EXISTS skill_level text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.employees ADD COLUMN IF NOT EXISTS immigration_status %I.immigration_status DEFAULT ''valid''', tenant_schema, tenant_schema);
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = tenant_schema AND table_name = 'attendance_records'
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.attendance_records
           ADD COLUMN IF NOT EXISTS punch_sequence integer NOT NULL DEFAULT 1,
           ADD COLUMN IF NOT EXISTS punch_in_lat double precision,
           ADD COLUMN IF NOT EXISTS punch_in_lng double precision,
           ADD COLUMN IF NOT EXISTS punch_in_accuracy integer',
        tenant_schema
      );
      EXECUTE format(
        'ALTER TABLE %I.attendance_records
           ALTER COLUMN id SET DEFAULT gen_random_uuid(),
           ALTER COLUMN worked_minutes SET DEFAULT 0,
           ALTER COLUMN overtime_minutes SET DEFAULT 0,
           ALTER COLUMN late_minutes SET DEFAULT 0,
           ALTER COLUMN early_leave_minutes SET DEFAULT 0,
           ALTER COLUMN created_at SET DEFAULT now(),
           ALTER COLUMN updated_at SET DEFAULT now()',
        tenant_schema
      );

      EXECUTE format(
        'SELECT count(*)::integer
           FROM (
             SELECT employee_id, work_date, punch_sequence
             FROM %I.attendance_records
             GROUP BY employee_id, work_date, punch_sequence
             HAVING count(*) > 1
           ) duplicates',
        tenant_schema
      ) INTO duplicate_attendance_sequences;

      IF duplicate_attendance_sequences = 0 THEN
        EXECUTE format(
          'CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_emp_date_seq_uq
             ON %I.attendance_records (employee_id, work_date, punch_sequence)',
          tenant_schema
        );
      ELSE
        RAISE NOTICE 'Skipped attendance unique index for %, duplicate sequences: %',
          tenant_schema,
          duplicate_attendance_sequences;
      END IF;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = tenant_schema AND table_name = 'attendance_exceptions'
    ) THEN
      EXECUTE format('ALTER TABLE %I.attendance_exceptions ALTER COLUMN id SET DEFAULT gen_random_uuid()', tenant_schema);
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = tenant_schema AND table_name = 'leave_types'
    ) THEN
      EXECUTE format('ALTER TABLE %I.leave_types ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT true', tenant_schema);
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = tenant_schema AND table_name = 'notifications'
    ) THEN
      EXECUTE format('ALTER TABLE %I.notifications ADD COLUMN IF NOT EXISTS type text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.notifications ADD COLUMN IF NOT EXISTS severity text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.notifications ADD COLUMN IF NOT EXISTS metadata jsonb', tenant_schema);
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = tenant_schema AND table_name = 'payslips'
    ) THEN
      EXECUTE format('ALTER TABLE %I.payslips ADD COLUMN IF NOT EXISTS gross numeric(12, 2) NOT NULL DEFAULT 0', tenant_schema);
      EXECUTE format('ALTER TABLE %I.payslips ADD COLUMN IF NOT EXISTS gosi_pension_employee numeric(12, 2) NOT NULL DEFAULT 0', tenant_schema);
      EXECUTE format('ALTER TABLE %I.payslips ADD COLUMN IF NOT EXISTS gosi_pension_employer numeric(12, 2) NOT NULL DEFAULT 0', tenant_schema);
      EXECUTE format('ALTER TABLE %I.payslips ADD COLUMN IF NOT EXISTS gosi_occ_hazards_employer numeric(12, 2) NOT NULL DEFAULT 0', tenant_schema);
      EXECUTE format('ALTER TABLE %I.payslips ADD COLUMN IF NOT EXISTS gosi_saned_employer numeric(12, 2) NOT NULL DEFAULT 0', tenant_schema);
      EXECUTE format('ALTER TABLE %I.payslips ADD COLUMN IF NOT EXISTS gosi_contributory_base numeric(12, 2) NOT NULL DEFAULT 0', tenant_schema);
      EXECUTE format('ALTER TABLE %I.payslips ADD COLUMN IF NOT EXISTS gosi_rate_employee numeric(6, 4) NOT NULL DEFAULT 0', tenant_schema);
      EXECUTE format('ALTER TABLE %I.payslips ADD COLUMN IF NOT EXISTS gosi_rate_employer numeric(6, 4) NOT NULL DEFAULT 0', tenant_schema);
      EXECUTE format('ALTER TABLE %I.payslips ADD COLUMN IF NOT EXISTS gosi_system text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.payslips ADD COLUMN IF NOT EXISTS eosb_accrued numeric(12, 2) NOT NULL DEFAULT 0', tenant_schema);
      EXECUTE format('ALTER TABLE %I.payslips ADD COLUMN IF NOT EXISTS eosb_years_of_service numeric(6, 3) NOT NULL DEFAULT 0', tenant_schema);
      EXECUTE format('ALTER TABLE %I.payslips ADD COLUMN IF NOT EXISTS breakdown text', tenant_schema);
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = tenant_schema AND table_name = 'expenses'
    ) THEN
      EXECUTE format('ALTER TABLE %I.expenses ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now()', tenant_schema);
      EXECUTE format('ALTER TABLE %I.expenses ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now()', tenant_schema);
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = tenant_schema AND table_name = 'job_requisitions'
    ) THEN
      EXECUTE format('ALTER TABLE %I.job_requisitions ADD COLUMN IF NOT EXISTS posted_at timestamp with time zone', tenant_schema);
      EXECUTE format('ALTER TABLE %I.job_requisitions ADD COLUMN IF NOT EXISTS closed_at timestamp with time zone', tenant_schema);
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = tenant_schema AND table_name = 'candidates'
    ) THEN
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS first_name text NOT NULL DEFAULT ''''', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS last_name text NOT NULL DEFAULT ''''', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS linkedin_url text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS portfolio_url text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS resume_url text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS resume_text text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS source_details jsonb', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS current_location text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS notice_period_days integer', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS expected_salary numeric(12, 2)', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS current_salary numeric(12, 2)', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS availability_date date', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS tags text[]', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS notes text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS gdpr_consent boolean DEFAULT false', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS gdpr_consent_at timestamp with time zone', tenant_schema);
      EXECUTE format('ALTER TABLE %I.candidates ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now()', tenant_schema);
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = tenant_schema AND table_name = 'applications'
    ) THEN
      EXECUTE format('ALTER TABLE %I.applications ADD COLUMN IF NOT EXISTS status %I.application_status NOT NULL DEFAULT ''applied''', tenant_schema, tenant_schema);
      EXECUTE format('ALTER TABLE %I.applications ADD COLUMN IF NOT EXISTS applied_at timestamp with time zone NOT NULL DEFAULT now()', tenant_schema);
      EXECUTE format('ALTER TABLE %I.applications ADD COLUMN IF NOT EXISTS screened_at timestamp with time zone', tenant_schema);
      EXECUTE format('ALTER TABLE %I.applications ADD COLUMN IF NOT EXISTS screened_by_id uuid', tenant_schema);
      EXECUTE format('ALTER TABLE %I.applications ADD COLUMN IF NOT EXISTS screening_notes text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.applications ADD COLUMN IF NOT EXISTS current_stage text DEFAULT ''applied''', tenant_schema);
      EXECUTE format('ALTER TABLE %I.applications ADD COLUMN IF NOT EXISTS stage_entered_at timestamp with time zone DEFAULT now()', tenant_schema);
      EXECUTE format('ALTER TABLE %I.applications ADD COLUMN IF NOT EXISTS disqualification_reason text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.applications ADD COLUMN IF NOT EXISTS referrer_employee_id uuid', tenant_schema);
      EXECUTE format('ALTER TABLE %I.applications ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now()', tenant_schema);
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = tenant_schema AND table_name = 'interviews'
    ) THEN
      EXECUTE format('ALTER TABLE %I.interviews ADD COLUMN IF NOT EXISTS type %I.interview_type NOT NULL DEFAULT ''phone_screen''', tenant_schema, tenant_schema);
      EXECUTE format('ALTER TABLE %I.interviews ADD COLUMN IF NOT EXISTS status %I.interview_status NOT NULL DEFAULT ''scheduled''', tenant_schema, tenant_schema);
      EXECUTE format('ALTER TABLE %I.interviews ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 60', tenant_schema);
      EXECUTE format('ALTER TABLE %I.interviews ADD COLUMN IF NOT EXISTS meeting_url text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.interviews ADD COLUMN IF NOT EXISTS interviewer_ids uuid[] NOT NULL DEFAULT ''{}''::uuid[]', tenant_schema);
      EXECUTE format('ALTER TABLE %I.interviews ADD COLUMN IF NOT EXISTS feedback jsonb', tenant_schema);
      EXECUTE format('ALTER TABLE %I.interviews ADD COLUMN IF NOT EXISTS score integer', tenant_schema);
      EXECUTE format('ALTER TABLE %I.interviews ADD COLUMN IF NOT EXISTS recommendation text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.interviews ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone', tenant_schema);
      EXECUTE format('ALTER TABLE %I.interviews ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone', tenant_schema);
      EXECUTE format('ALTER TABLE %I.interviews ADD COLUMN IF NOT EXISTS cancellation_reason text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.interviews ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now()', tenant_schema);
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = tenant_schema AND table_name = 'offers'
    ) THEN
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS application_id uuid', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS base_salary numeric(12, 2) NOT NULL DEFAULT 0', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS housing_allowance numeric(12, 2) DEFAULT 0', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS transport_allowance numeric(12, 2) DEFAULT 0', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS other_allowances numeric(12, 2) DEFAULT 0', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS bonus_structure text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS benefits jsonb', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS probation_months integer DEFAULT 3', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS offer_letter_url text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS accepted_at timestamp with time zone', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS declined_at timestamp with time zone', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS decline_reason text', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS created_by_id uuid', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS approved_by_id uuid', tenant_schema);
      EXECUTE format('ALTER TABLE %I.offers ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now()', tenant_schema);
    END IF;
  END LOOP;
END $$;
