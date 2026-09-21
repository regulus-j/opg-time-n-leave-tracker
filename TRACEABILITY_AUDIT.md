# Traceability and Audit Report

## Backend and architecture

| Requirement                   | Implementation                                                                                                                                                                  | Verification                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Express MVC separation        | Routes in `src/server/routes`, HTTP adaptation in controllers, transactions/rules in services, and parameterized SQL in models                                                  | Requirements audit and PostgreSQL integration suite                     |
| Canonical typed schema        | `.agent/instructions/schema.json` is mandatory; no fallback schema is generated at runtime                                                                                      | Schema parity unit tests and `npm run typecheck`                        |
| Tenant and employee isolation | Every query is tenant-scoped; employee, manager/direct-report, and administrator scopes are enforced on reads, writes, and transitions                                          | Cross-tenant and read-only integration/E2E tests                        |
| Resource lifecycle            | Collection/get/create/replace/delete routes, validated entities, exact pagination headers, optimistic versions, and audit events                                                | Integration tests for pagination, stale versions, workflows, and audits |
| Attendance                    | Clock in/out uniqueness, correction submit/decision flow, approved-session materialization, and daily-summary reconciliation                                                    | Browser clock/correction flow and database constraints                  |
| Leave                         | Policy eligibility, working-day/holiday charges, overlap locks, attachment rules, balance/pending reconciliation, ledger usage/reversal, and manager decisions                  | PostgreSQL workflow, balance, ledger, and browser approval tests        |
| Authentication                | Database bcrypt credentials, constant-work verification, signed JWT HttpOnly cookies, CSRF context/validation, login throttling, configurable expiry, and external-adapter hook | Auth unit tests, authorization audit, and persona E2E tests             |
| Error contract                | RFC 7807 responses with request IDs for validation, authorization, conflict, rate limit, and database constraint failures                                                       | Unit, integration, and browser error assertions                         |
| Production safety             | Required 32-character secrets, database TLS verification, secure cookies, CSP/HSTS, pool limits, and timeouts                                                                   | Security audit and production static-server smoke test                  |

## Database and development environment

- `001_initial_schema.sql` remains unchanged; `002_auth_credentials.sql` adds case-insensitive credential identity.
- `database/seeders/seed.js` transactionally produces a deterministic two-tenant dataset and refuses production/unauthorized execution.
- Seeded personas: tenant administrator, reporting manager, operational employee, and read-only employee.
- Docker Compose exposes isolated development/test PostgreSQL services on Windows-friendly ports `55432` and `55433`.
- Database migrate, seed, test preparation, reset, type-check, full verification, and production commands are documented.

## Client and API wiring

The React shell authenticates through `/api/v1/auth/*` and loads capability-scoped resources from:

- `/employees`, `/tenants`, `/attendance-sessions`, `/attendance-summaries`, `/attendance-adjustments`
- `/leave-types`, `/job-leave-policies`, `/leave-balances`, `/leave-requests`
- `/holidays`, `/alerts`, and `/audit-events`
- `/users`, `/departments`, `/locations`, `/work-schedules`, `/job-profiles`, `/leave-ledger-entries`, `/attachments`, and `/holiday-calendars` for authorized administrative or employee-ledger views

Mutations use CSRF headers and real API workflow endpoints for clocking, correction submission/decisions, leave submission/decisions, job and policy management, balance overrides, holiday administration, and logout. Managers have distinct Myself/Team navigation for direct-report presence, coverage, approvals, and alerts. Sensitive credentials, tokens, hashes, and database strings are never stored in client persistence or returned from resource APIs.

## UI states and responsive audit

- Loading: workspace skeleton cards and secure-session restoration indicator.
- Empty: contextual attendance, correction, leave, holiday, policy, approval, and audit empty states.
- Error: RFC 7807 message banner with retry action and authentication recovery.
- Success: refreshed server entities, status badges, and accessible live toast feedback.
- Responsive checks passed at 360×800, 390×844, 768×1024, 1280×800, and 1440×900 with no horizontal overflow.
- Axe audits passed on Dashboard, Attendance, Leave, Holidays, and Profile at every supported viewport, plus all manager and administrator destinations at desktop size, with zero violations and zero unlabeled controls across 36 combinations.

## HR administration and payroll reporting

- Departments now have tenant-scoped create, edit, activate, deactivate, search, status filtering, reference counts, and pagination.
- HR directory creation is atomic across employee, user, and bcrypt credential records; assignment edits reject cycles and password reset never exposes a credential.
- Shared filter toolbars are used by departments, directory, organization reports, and audit; active filters and page state are visible and clearable.
- Organization reports provide payroll preparation, absenteeism, overtime-by-department, and leave-liability presets with tenant/date filters and full-result CSV exports.
- Payroll summaries expose worked minutes, overtime minutes, approved paid leave, and approved unpaid leave; no payroll execution is performed.
- Tenant audit events support filtered CSV export with safe formula-neutralized cells.

## Final verification

The recorded baseline passed TypeScript, unit, requirements, security, production build, and the available authorization checks. PostgreSQL integration coverage was partially skipped when the test database was unavailable, and the responsive audit can be blocked by the local Chrome launch environment. These are verification limitations, not completion claims.

The current rewrite has added the Vercel entry point, Supabase migration connection separation, browser-role privilege hardening, platform settings API/UI, and server-backed manager dashboard/calendar/report loading. Remaining work is tracked in the implementation plan: complete server pagination across all legacy collections, finish platform access/audit filtering, complete all calendar modes, remove the retained legacy client implementations, and run genuine Platform Administrator E2E coverage against staging PostgreSQL.
