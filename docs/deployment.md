# Deployment

## Topology

- Vercel serves the Vite build from `dist` and invokes Express through `api/index.js`.
- Supabase supplies PostgreSQL. The browser never uses Supabase Auth, Storage, or the Data API.
- Local Docker remains the development and integration-test database.
- Preview uses a staging Supabase project; Production uses a separate production project.

## Supabase setup

1. Create separate staging and production Supabase projects.
2. Enable SSL enforcement and restrict database network access where practical.
3. Copy the Shared Pooler transaction URL to the runtime `DATABASE_URL`.
4. Copy a direct or session-pooler URL to the protected `MIGRATION_DATABASE_URL`.
5. Apply migrations from a trusted workstation or CI job with `npm run db:migrate`.
6. Verify `schema_migrations` checksums and run integration tests against staging.
7. Seed only local or explicitly approved staging databases. Never set `ALLOW_DEV_SEED` in Production.

The runtime uses `DB_SSL=true`, certificate verification, and `DB_POOL_MAX=1`. The migration connection is not used by the Vercel function.

## Vercel setup

Configure the project with:

- Build Command: `npm run build`
- Output Directory: `dist`
- Node runtime: the repository `package.json` and Vercel Node runtime
- Preview variables: staging Supabase and staging secrets
- Production variables: production Supabase and production secrets

Required server-side variables include `DATABASE_URL`, `DB_SSL=true`, `DB_SSL_REJECT_UNAUTHORIZED=true`, `DB_POOL_MAX=1`, `JWT_SECRET`, `CSRF_SECRET`, `COOKIE_SECRET`, `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=lax`, `INVITATION_BASE_URL`, `INVITATION_DELIVERY_URL`, and the configured timeout/rate-limit values. Do not prefix these with `VITE_`.

`INVITATION_DELIVERY_URL` is a server-side webhook used when a platform administrator provisions an organization. It receives a JSON payload containing `to`, `organization_name`, `invite_url`, and `expires_at`. The application stores only a SHA-256 token hash, so the webhook must deliver the link immediately. Invitation acceptance is available at `/#/accept-invitation`; there is no public organization signup flow.

If the Vercel function reports `SELF_SIGNED_CERT_IN_CHAIN`, download the Supabase root certificate from Database Settings → SSL Configuration. Add it to Vercel as `DB_SSL_CA` (preserving PEM newlines) or as `DB_SSL_CA_BASE64` using a base64-encoded PEM. Keep `DB_SSL_REJECT_UNAUTHORIZED=true`; do not bypass certificate verification in Production.

Deploy Preview first. Confirm SPA refreshes, `/api/v1/auth/me`, secure cookies, CSRF writes, reports, CSV downloads, and tenant context switching before promoting the deployment.

## Migration and rollback

Migrations are append-only and checksum verified. Apply them before deploying code that depends on them. To roll back an application deployment, promote the previous Vercel deployment; do not delete migration history or edit an applied migration. Data corrections require a new forward migration or a reviewed operational SQL change.
