INSERT INTO tenants (id, company_name, cr_number, nitaqat_activity, plan_tier, schema_name, created_at, updated_at)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Demo Company', 'CR123456', 'Technology', 'enterprise', 'demo_company', NOW(), NOW());

INSERT INTO users (id, tenant_id, email, password_hash, name, role, email_verified, created_at, updated_at)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'admin@demo.com',
  '$2a$12$pUhbB4t1u56S.Xe5/tt0p.3lpxYitcvytj7tTAhsWn8F18/Ib81im',
  'Admin User',
  'super_admin',
  NOW(),
  NOW(),
  NOW()
);
