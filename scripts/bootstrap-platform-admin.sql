-- Bootstrap one Platform Administrator without resetting tenant data.
--
-- Before running:
--   1. Replace the three values in the DO block below.
--   2. Use a unique email and a password of at least 12 characters.
--   3. Run this only in the intended Supabase project.
--   4. Do not commit this file after putting a real password in it.
--
-- The password is bcrypt-hashed in PostgreSQL. The account is granted the
-- platform capabilities and is assigned to every existing tenant. Where an
-- active HR user exists, the membership points at that user so the platform
-- administrator can enter the tenant with HR permissions. No tenant rows are
-- deleted or modified.

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
SET search_path TO public, extensions;

DO $$
DECLARE
  -- Replace these three values before running the script.
  v_display_name text := 'Platform Administrator';
  v_email text := 'REPLACE_WITH_ADMIN_EMAIL';
  v_password text := 'REPLACE_WITH_A_RANDOM_PASSWORD_12_CHARS_OR_MORE';
  v_platform_user_id text := 'platform-admin-' || replace(gen_random_uuid()::text, '-', '');
BEGIN
  IF v_email LIKE 'REPLACE_%' OR v_password LIKE 'REPLACE_%' THEN
    RAISE EXCEPTION 'Replace the bootstrap placeholders before running this script.';
  END IF;

  IF v_display_name IS NULL OR length(btrim(v_display_name)) < 2 THEN
    RAISE EXCEPTION 'The platform administrator display name is required.';
  END IF;

  IF v_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RAISE EXCEPTION 'The platform administrator email is invalid.';
  END IF;

  IF length(v_password) < 12 THEN
    RAISE EXCEPTION 'The platform administrator password must be at least 12 characters.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM platform_users WHERE lower(email) = lower(v_email)
    UNION ALL
    SELECT 1 FROM platform_credentials WHERE lower(email) = lower(v_email)
    UNION ALL
    SELECT 1 FROM users WHERE lower(email) = lower(v_email)
    UNION ALL
    SELECT 1 FROM auth_credentials WHERE lower(email) = lower(v_email)
  ) THEN
    RAISE EXCEPTION 'That email is already used by an existing account.';
  END IF;

  INSERT INTO platform_users
    (platform_user_id, display_name, email, capabilities, status)
  VALUES
    (
      v_platform_user_id,
      btrim(v_display_name),
      lower(btrim(v_email)),
      ARRAY[
        'platform:read',
        'platform:write',
        'organizations:write',
        'access:write',
        'platform-audit:read'
      ]::text[],
      'active'
    );

  INSERT INTO platform_credentials
    (platform_user_id, email, password_hash)
  VALUES
    (v_platform_user_id, lower(btrim(v_email)), crypt(v_password, gen_salt('bf', 12)));

  INSERT INTO platform_memberships
    (platform_user_id, tenant_id, tenant_user_id, roles, status)
  SELECT
    v_platform_user_id,
    t.tenant_id,
    hr.user_id,
    CASE
      WHEN hr.user_id IS NULL THEN ARRAY['Platform Administrator']::text[]
      ELSE ARRAY['Employee', 'HR Manager']::text[]
    END,
    'active'
  FROM tenants t
  LEFT JOIN LATERAL (
    SELECT u.user_id
    FROM users u
    WHERE u.tenant_id = t.tenant_id
      AND u.status = 'active'
      AND 'users:write' = ANY(u.capabilities)
    ORDER BY u.user_id
    LIMIT 1
  ) hr ON true
  ON CONFLICT (platform_user_id, tenant_id) DO NOTHING;

  RAISE NOTICE 'Created Platform Administrator % (%).', v_display_name, lower(btrim(v_email));
END
$$;
