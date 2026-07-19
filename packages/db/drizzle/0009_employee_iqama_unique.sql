-- 0009_employee_iqama_unique.sql
-- Defense-in-depth: a partial unique index on employees.iqama_number_enc so the
-- database also rejects a duplicate national ID / iqama (EMP-006 / D1). The
-- primary check is application-level in employee.create; this backstops it.
-- Idempotent. Covers all tenant_<hex> schemas.
--
-- NOTE: assumes iqama_number_enc holds a deterministic value (plaintext or
-- deterministic encryption). If randomized encryption is later introduced, add
-- a separate iqama_hash column and index that instead.

DO $$
DECLARE
  s text;
BEGIN
  FOR s IN
    SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant\_%' ESCAPE '\'
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = s AND table_name = 'employees' AND column_name = 'iqama_number_enc'
    ) THEN
      EXECUTE format(
        'CREATE UNIQUE INDEX IF NOT EXISTS employees_iqama_unique ON %I.employees (iqama_number_enc) WHERE iqama_number_enc IS NOT NULL;',
        s);
    END IF;
  END LOOP;
END $$;
