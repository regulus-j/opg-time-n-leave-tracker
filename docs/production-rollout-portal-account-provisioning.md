# Production rollout: existing-employee portal provisioning

## Problem and target behavior

The HR Directory showed employees without accounts as **Not provisioned**, but the Edit dialog only exposed employee-assignment fields. The existing “Create portal login” control was available only when adding a brand-new employee, so HR had no supported path to create a portal account for an employee already in the directory.

The fix makes the Edit flow provision an account when the employee is marked **Not provisioned**. The API validates the email, password length, duplicate email, active-account conflicts, and role capabilities inside the same database transaction as the employee update. Passwords are bcrypt-hashed and are never returned to the browser.

## Deployment topology

- Vercel serves the Vite build from `dist` and routes `/api/*` to the Express entry point at `api/index.js`.
- Supabase provides PostgreSQL only. The browser does not connect directly to Supabase Data API, Auth, or Storage.
- Keep separate Supabase projects for staging and production. Never point a preview deployment at the production database.

Public tenant registration is available at `/#/register` and `POST /api/v1/auth/register-tenant`. It activates the registering HR administrator immediately, uses the same tenant defaults as Platform Administrator provisioning, and is protected by the registration rate limit. Platform Administrator provisioning and invitation acceptance remain available for managed onboarding.

## Required Vercel configuration

Configure the following for the appropriate Vercel environment (Preview/Staging and Production separately):

- `DATABASE_URL`: Supabase pooled PostgreSQL connection string for that environment.
- `DB_SSL=true`
- `DB_SSL_REJECT_UNAUTHORIZED=true`
- `DB_POOL_MAX=1` (serverless-safe default)
- `JWT_SECRET`, `CSRF_SECRET`, and `COOKIE_SECRET`: independent high-entropy secrets per environment.
- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=lax`
- `INVITATION_BASE_URL`: the public origin used in invitation links.
- `INVITATION_DELIVERY_URL`: the approved delivery endpoint or provider configuration.

Set `npm run build` as the Vercel build command and `dist` as the output directory. Do not put database credentials or seed passwords in `VITE_*` variables; those are shipped to the browser.

## Supabase preparation

1. Create or select the production Supabase project and confirm point-in-time recovery/backups are enabled.
2. Apply migrations from the release commit with `npm run db:migrate` using the production `DATABASE_URL`. Confirm the migration ledger and the `users`, `auth_credentials`, and `platform_credentials` tables are present before deploying the application.
3. Do not run seed data against production. Use the isolated staging project for seeded HR smoke tests.
4. Restrict the database role used by Vercel to the application schema and keep direct SQL access limited to the deployment operator.

## Staged rollout

1. **Preview validation:** Deploy the release branch to a Vercel Preview connected only to staging Supabase.
2. **HR smoke test:** Sign in as an HR Manager, open Organization → Directory, choose an employee showing **Not provisioned**, click **Edit**, enable **Create portal login**, enter a test email and temporary password, and save. Confirm the row changes to **Enabled**.
3. **Authentication check:** Sign out and log in with the new test account. Confirm the selected role and tenant are correct. Do not record or display the temporary password in screenshots or logs.
4. **Negative checks:** Verify a short password, malformed email, duplicate email, and a second provisioning attempt produce actionable 4xx errors and leave the employee update/account state unchanged.
5. **Audit check:** Confirm the HR directory update audit event records `account_created: true` without password material.
6. **Production approval:** After preview checks pass, run the migration against production, deploy the Vercel Production build, and repeat the smoke test using a disposable production test employee/account. Remove or deactivate the test account according to the organization's retention policy.

## Rollback and recovery

- If the application deployment is faulty, promote the previous Vercel deployment. The change is additive and does not require a destructive rollback migration.
- If a provisioning attempt fails, the database transaction rolls back both the employee update and account inserts; retry after correcting the reported field.
- If an account was created accidentally, deactivate it through the approved HR/admin workflow rather than deleting authentication history.
- Rotate any secret that was exposed, and revoke active sessions if credential compromise is suspected.

## Acceptance criteria

- Existing “Not provisioned” employees have a visible, keyboard-reachable provisioning path in Edit.
- Valid provisioning creates one active `users` row and one credential row in the same tenant.
- Duplicate email, invalid password, unsupported role, and already-active-account cases return specific errors and do not partially commit.
- API responses, audit metadata, Vercel logs, and browser notifications never contain plaintext passwords.
- A newly provisioned user can log in after deployment and is restricted to the intended tenant and capabilities.
- Staging and production use separate Supabase projects, secrets, and test identities.
