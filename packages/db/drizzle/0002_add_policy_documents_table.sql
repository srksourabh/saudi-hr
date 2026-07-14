CREATE TABLE IF NOT EXISTS tenant_1ed8b6bd3743.policy_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('hr_policy','employee_handbook','code_of_conduct','anti_corruption','health_safety','other')),
  version text NOT NULL DEFAULT '1.0',
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size text,
  mime_type text,
  effective_date date NOT NULL,
  expiry_date date,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_policy_documents_category ON tenant_1ed8b6bd3743.policy_documents(category);
CREATE INDEX IF NOT EXISTS idx_policy_documents_expiry ON tenant_1ed8b6bd3743.policy_documents(expiry_date) WHERE expiry_date IS NOT NULL;
