-- 0007_audit_logs_append_only.sql
-- Make audit_logs immutable (append-only) in every tenant schema (PDPL-004 / B4).
-- Installs a BEFORE UPDATE/DELETE trigger that raises an exception, so no role —
-- including the application role — can edit or delete an audit entry.
-- Idempotent: safe to re-run. Covers all existing tenant_<hex> schemas.

DO $$
DECLARE
  s text;
BEGIN
  FOR s IN
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name LIKE 'tenant\_%' ESCAPE '\'
  LOOP
    -- Only act on schemas that actually have the audit_logs table.
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = s AND table_name = 'audit_logs'
    ) THEN
      EXECUTE format(
        'CREATE OR REPLACE FUNCTION %I.prevent_audit_mutation() RETURNS trigger '
        'LANGUAGE plpgsql AS $f$ BEGIN '
        'RAISE EXCEPTION ''audit_logs is append-only; % is not permitted'', TG_OP; '
        'END; $f$;', s);

      EXECUTE format('DROP TRIGGER IF EXISTS audit_logs_no_update ON %I.audit_logs;', s);
      EXECUTE format('DROP TRIGGER IF EXISTS audit_logs_no_delete ON %I.audit_logs;', s);

      EXECUTE format(
        'CREATE TRIGGER audit_logs_no_update BEFORE UPDATE ON %I.audit_logs '
        'FOR EACH ROW EXECUTE FUNCTION %I.prevent_audit_mutation();', s, s);
      EXECUTE format(
        'CREATE TRIGGER audit_logs_no_delete BEFORE DELETE ON %I.audit_logs '
        'FOR EACH ROW EXECUTE FUNCTION %I.prevent_audit_mutation();', s, s);
    END IF;
  END LOOP;
END $$;
