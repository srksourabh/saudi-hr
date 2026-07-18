-- Migration: 0006_add_perf_indexes
-- Adds indexes for hot query paths identified in the perf audit (July 2026).
-- Uses dynamic SQL to apply indexes to every tenant_<hex> schema.

DO $$
DECLARE
  schema_rec RECORD;
  schema_name text;
BEGIN
  FOR schema_rec IN
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name ~ '^tenant_[a-f0-9]{12}$'
  LOOP
    schema_name := schema_rec.schema_name;

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON %I.notifications(user_id, created_at DESC)',
      schema_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON %I.notifications(user_id, read)',
      schema_name
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS employees_department_idx ON %I.employees(department_id) WHERE department_id IS NOT NULL',
      schema_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS employees_status_idx ON %I.employees(employment_status)',
      schema_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS employees_manager_idx ON %I.employees(manager_employee_id) WHERE manager_employee_id IS NOT NULL',
      schema_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS employees_fullname_trgm_idx ON %I.employees(full_name)',
      schema_name
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS leave_requests_employee_created_idx ON %I.leave_requests(employee_id, created_at DESC)',
      schema_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS leave_requests_status_idx ON %I.leave_requests(status)',
      schema_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS leave_balances_employee_year_idx ON %I.leave_balances(employee_id, year)',
      schema_name
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS documents_employee_type_idx ON %I.documents(employee_id, type)',
      schema_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS documents_expiry_idx ON %I.documents(expiry_date) WHERE expiry_date IS NOT NULL',
      schema_name
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS payroll_runs_period_status_idx ON %I.payroll_runs(period_month, status)',
      schema_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS payslips_run_created_idx ON %I.payslips(payroll_run_id, created_at DESC)',
      schema_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS payslips_employee_idx ON %I.payslips(employee_id)',
      schema_name
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS expenses_employee_status_idx ON %I.expenses(employee_id, status)',
      schema_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS expenses_approver_status_idx ON %I.expenses(approver_employee_id, status) WHERE approver_employee_id IS NOT NULL',
      schema_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS expenses_category_date_idx ON %I.expenses(category, expense_date)',
      schema_name
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS final_settlements_employee_idx ON %I.final_settlements(employee_id)',
      schema_name
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS compliance_checks_status_type_idx ON %I.compliance_checks(status, check_type)',
      schema_name
    );
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS compliance_checks_run_idx ON %I.compliance_checks(payroll_run_id) WHERE payroll_run_id IS NOT NULL',
      schema_name
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS departments_parent_idx ON %I.departments(parent_department_id) WHERE parent_department_id IS NOT NULL',
      schema_name
    );

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS attendance_exceptions_record_idx ON %I.attendance_exceptions(attendance_record_id)',
      schema_name
    );

    RAISE NOTICE 'Applied perf indexes to schema %', schema_name;
  END LOOP;
END $$;