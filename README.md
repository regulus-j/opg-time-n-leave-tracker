# Pace — Time & Leave Tracker

A single-page, frontend-only time tracking and leave management tool, modeled after Zoho People. No backend — all data lives in memory for the session (nothing persists on refresh).

Everything is in one file: `index.html` (HTML, CSS, and JS inline — no build step, no dependencies to install).

## Running it

Just open `index.html` in a browser, or serve the folder with any static file server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

It's also ready to deploy as-is to GitHub Pages, Netlify, Vercel, etc.

## Demo logins

| Role     | Email               | Password      |
|----------|----------------------|---------------|
| Employee | `demo@pace.io`       | `pace2026`    |
| Manager  | `manager@pace.io`    | `manager2026` |

Both are mock/frontend-only — there is no real authentication or backend.

## Employee view

- **Time Tracking** — clock in/out with a live running timer, daily/weekly hour stats, weekly timesheet
- **Leave** — leave balances (Casual/Sick/Earned/Unpaid), apply for leave with live day-count preview, request history, upcoming holidays

## Manager view

- **Team** — roster with inline project reassignment, "add team member" form
- **Payroll** — full report per employee (rate, hours, gross pay, tax, benefits, leave-without-pay deduction, net pay) by pay period, with CSV export
- **Approvals** — pending leave requests queue with Approve/Reject, and a recently-decided history

## Notes

- Frontend only — no server, no database, no real auth. All state resets on page reload.
- Color palette: `#E73F1E` `#FB6C00` `#F9B637` `#FFDD9C` (via [Color Hunt](https://colorhunt.co/palette/e73f1efb6c00f9b637ffdd9c))
