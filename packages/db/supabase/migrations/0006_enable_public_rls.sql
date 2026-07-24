-- Migration 0006: Lock down public registry/auth-support tables for Supabase API exposure.
--
-- The application uses backend-controlled PostgreSQL connections and tenant
-- schemas for HR data isolation. If Supabase Data API exposure is enabled for
-- the public schema, these tables must not be anonymously readable/writable.
-- Enabling RLS with no broad anon/authenticated policies makes access fail
-- closed while preserving backend owner/service-role access.

BEGIN;

ALTER TABLE IF EXISTS public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invite_token_index ENABLE ROW LEVEL SECURITY;

COMMIT;
