# Time & Leave Tracker

A responsive, frontend-only time tracking and leave management prototype. It includes simulated authentication and role-scoped employee, reporting-manager, and HR workflows. There is no production backend or real authentication.

The frontend is built with Vite, React, Tailwind CSS, and reusable UI components under `src/`.

## Running it

For local development, run the Vite development server:

```bash
npm install
npm run dev
# then visit the URL shown by Vite
```

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

These accounts are mock/frontend-only. Sign in at the root URL; the application stores only a demo session in browser local storage.

## Employee view

- **Action dashboard** — clock in/out, daily hard-limit progress, weekly totals, exceptions, and policy-derived balances
- **Attendance** — historical exception view with missing-punch flags and manager-reviewed adjustments
- **Leave** — balance cards, policy-aware requests, documentation uploads, request history, and tenant holidays

## Reporting Manager view

- **Team scope** — switch between personal and direct-report workspaces
- **Approvals** — unified leave and attendance queue with reason, balance, optional decision notes, and audit history
- **Operations** — Who’s In, approved team leave calendar, coverage context, and overtime/limit alerts

## HR Manager view

- **Configuration** — job profiles, work limits, overtime eligibility, and leave-policy mappings
- **Directory** — employee search, job assignment, reporting-manager hierarchy, and simulated password resets
- **Administration** — audited balance/attendance overrides, holiday management, and exportable master reports

## Notes

- Frontend only — no server, database, production authentication, or secure file storage.
- Password reset, sign-out, session state, and role-scoped navigation are simulated for the prototype.
- Color palette: `#E73F1E` `#FB6C00` `#F9B637` `#FFDD9C` (via [Color Hunt](https://colorhunt.co/palette/e73f1efb6c00f9b637ffdd9c))
