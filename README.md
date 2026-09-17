# Time & Leave Tracker

A responsive, frontend-only time tracking and leave management prototype. It includes simulated authentication, tenant-isolated browser storage, assigned tenant memberships, and role-scoped employee, reporting-manager, and HR workflows. There is no production backend or real authentication.

The frontend is built with Vite, React, Tailwind CSS, and reusable UI components under `src/`.

## Running it

For local development, run the Vite development server:

```bash
npm install
npm run dev
# then open the exact Local URL shown by Vite
```

For a static build served with Python on Windows:

```bash
npm run serve:dist
# then open http://127.0.0.1:4173/
```

Do not run `py -m http.server` from the project root: that serves the uncompiled JSX source. Use the `dist` directory after `npm run build`, or use `npm run serve:dist`.

Run the current browser smoke suite with `npm run test:e2e` while the Vite server is running. Domain invariants can be checked with `node scripts/domain-tests.mjs`, and the responsive/accessibility smoke audit with `node scripts/layout-audit.mjs` and `node scripts/a11y-audit.mjs`.

The repository includes a GitHub Actions workflow that builds and deploys the `dist` folder to GitHub Pages whenever `main` is updated. Enable GitHub Pages in the repository settings with **Source: GitHub Actions**. The project URL will be:

```text
https://regulus-j.github.io/opg-time-n-leave-tracker/
```

## Demo logins

| Role     | Email               | Password      |
|----------|----------------------|---------------|
| Employee | `employee@tracker.demo` | `employee2026` |
| Manager  | `manager@tracker.demo`  | `manager2026`  |
| HR       | `hr@tracker.demo`       | `hr2026`       |
| Harbor HR | `hr@harbor.demo`       | `harbor2026`       |
| Multi-tenant admin | `admin@platform.demo` | `platform2026` |

Sign in with your email and password first. If a regular account belongs to more than one organization, the organization picker appears immediately after successful authentication. Platform admins skip that picker, enter the app, and can switch organizations from the in-app organization control. These accounts are mock/frontend-only; the application stores only a demo session in browser local storage.

## Tenant isolation and access control

- Every session resolves to an explicit tenant membership containing an employee identity and assigned roles.
- The role selector only exposes roles assigned by the active membership; stored sessions are revalidated against the account directory on reload.
- Employee, reporting-manager, and HR permissions and page access are centralized in `src/domain/authorization.js`.
- Employees are scoped to themselves, managers to active direct reports, and HR admins to the active tenant.
- Each tenant has a separate `tlt-data-v1:<tenant-id>` storage namespace, and persisted entities are stamped with their tenant ID.
- Tenant switches reload the selected tenant's data and reset role, page, and team context.
- Platform Admin has a tenant-neutral global control plane with Organizations, Access & Roles, Audit Log, and System Settings pages.
- Platform Admin can create, suspend, reactivate, and enter active organizations; tenant HR changes require entering that organization.
- Global metrics and audit activity are read-only aggregate views across organizations.

This is defense-in-depth for a UI prototype, not a production security boundary. A production deployment must enforce the same tenant and role checks on a trusted server for every query and mutation, derive tenant/user identity from a verified server-side session or token, and use tenant-scoped database constraints or row-level security.

## Employee view

- **Action dashboard** — clock in/out, daily hard-limit progress, weekly totals, exceptions, and policy-derived balances
- **Attendance** — historical exception view with missing-punch flags and manager-reviewed adjustments
- **Leave** — balance cards, policy-aware requests, documentation uploads, request history, and tenant holidays

## Reporting Manager view

- **Team scope** — switch between personal and direct-report workspaces
- **Approvals** — unified leave and attendance queue with reason, balance, optional decision notes, and audit history
- **Operations** — Who’s In, approved team leave calendar, coverage context, and overtime/limit alerts

## HR Manager view

- **Combined workspace** — HR admins land on their personal clock-in dashboard and can switch into team and administration sections.

- **Configuration** — job profiles, work limits, overtime eligibility, and leave-policy mappings
- **Directory** — employee search, job assignment, reporting-manager hierarchy, and simulated password resets
- **Administration** — audited balance/attendance overrides, holiday management, and exportable master reports

## Platform Admin view

- **Global overview** — organization lifecycle, active-user totals, pending leave, and attention signals
- **Organizations** — create, suspend, reactivate, and enter tenant administration
- **Access & roles** — organization-level access summary
- **Audit Log** — platform administrative events across organizations

## Notes

- Frontend only — no server, database, production authentication, or secure file storage.
- Password reset, sign-out, session state, and role-scoped navigation are simulated for the prototype.
- Color palette: `#E73F1E` `#FB6C00` `#F9B637` `#FFDD9C` (via [Color Hunt](https://colorhunt.co/palette/e73f1efb6c00f9b637ffdd9c))
