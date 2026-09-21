/*
 * The browser never talks to Supabase's Data API; all access goes through the
 * Express application. Remove the default browser roles' direct privileges
 * when this migration is applied to Supabase. The conditional role lookup
 * keeps the migration replayable against local PostgreSQL.
 */
DO $$
DECLARE
  role_name text;
BEGIN
  FOR role_name IN
    SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated')
  LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM %I', role_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM %I', role_name);
    EXECUTE format('REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM %I', role_name);
  END LOOP;
END $$;
