-- 0010_add_designations_table.sql
-- Adds designations table and designation_id column to employees table across all tenant schemas.
-- Idempotent.

DO $$
DECLARE
  s text;
BEGIN
  FOR s IN
    SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant\_%' ESCAPE '\'
  LOOP
    -- Create designations table if it doesn't exist
    EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.designations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        code text,
        description text,
        created_at timestamp with time zone DEFAULT now() NOT NULL,
        updated_at timestamp with time zone DEFAULT now() NOT NULL
      );
    ', s);

    -- Add designation_id column to employees if missing
    IF EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_schema = s AND table_name = 'employees'
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns WHERE table_schema = s AND table_name = 'employees' AND column_name = 'designation_id'
    ) THEN
      EXECUTE format('
        ALTER TABLE %I.employees ADD COLUMN designation_id uuid REFERENCES %I.designations(id) ON DELETE SET NULL;
      ', s, s);
    END IF;
  END LOOP;
END $$;
