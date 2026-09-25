# Time & Leave Tracker

## Ten-minute live stakeholder demo guide

Audience: leadership and operations stakeholders
Format: live demonstration, no slides
Demo environment: [opgtime-test.vercel.app](https://opgtime-test.vercel.app/)

This guide explains what to show, what the audience should notice, and how to describe the business value in plain language.

## Before the demo

Use the prepared demo accounts in this order. Do not display or read passwords aloud:

1. Operational employee — `user@dev.local`
2. Reporting manager — `manager@dev.local`
3. HR manager — `hr@dev.local`
4. Platform administrator — `admin@dev.local`

Keep a second browser tab or a password manager ready so changing personas is quick. Use seeded records for the leave and approval examples. If you create a live attendance record, explain that it is demonstration data.

## 0:00–0:45 — Opening

Say:

> “This system gives employees, managers, and HR one shared place to record time, manage leave, approve requests, and produce reliable workforce information.”

Explain the problem it addresses:

> “It replaces scattered spreadsheets, email approvals, manual leave calculations, and uncertainty about who changed an attendance or leave record.”

Set the structure:

> “I’ll show the employee experience first, then the manager and HR views, and finish with the controls that keep the information trustworthy.”

## 0:45–3:00 — Employee experience

### Sign in and dashboard

Click:

1. Sign in as the operational employee.
2. Leave the Dashboard open.

Point out:

- Today’s work timer and current local date/time.
- Recorded hours, leave remaining, pending requests, and attendance exceptions.
- Recent attendance showing the employee’s latest recorded workdays.

Say:

> “The employee can immediately see their own work status and outstanding actions without asking HR for a manual update.”

### Record attendance

Click:

1. `Clock in`.
2. Point to the active timer and the `Clock out` action.
3. Click `Clock out`.
4. Return to or refresh the Dashboard.

Point out:

- The active session changes into a recorded workday.
- The completed day appears under Recent attendance.
- The Attendance page provides the daily record and status.

Say:

> “The system records the work session as it happens, then turns it into a daily attendance record when the employee clocks out.”

If the demo session is too short to show meaningful minutes, use an existing seeded attendance record and explain that the live action is demonstrating the workflow, not a full working day.

### Review attendance and leave

Click:

1. `Attendance`.
2. Switch to the table view if a list is easier to read.
3. Show the daily summaries and any correction requests.
4. Click `Leave`.
5. Show the allowance cards and request history.
6. Open `Request leave` only far enough to show the request fields; submit only if demonstration data is approved.

Point out:

- Attendance exceptions and correction requests are visible in one place.
- Leave balances show remaining, used, pending, accrued, and carried-over amounts.
- A request contains dates, leave type, duration, and reason.

Say:

> “Employees can manage routine requests themselves, while the organization retains a clear record of balances, approvals, and exceptions.”

Transition:

> “The employee view is intentionally personal. Next, I’ll show how a manager gets the team-level information needed to make decisions.”

## 3:00–5:00 — Manager experience

Sign out and sign in as the reporting manager.

Click:

1. `Team` in the scope switcher.
2. `Team dashboard`.
3. `Who’s in`.
4. `Approvals`.
5. `Team leave calendar`.

Point out:

- Active direct-report count and recent team activity.
- Who is clocked in, clocked out, or on approved leave.
- Pending leave and attendance corrections awaiting a decision.
- Team leave coverage and overlapping requests.

Say:

> “Managers get the information needed to approve requests and plan coverage, but their view is limited to their authorized reporting scope.”

When showing Approvals, explain the decision boundary:

> “A manager can act on requests in their team scope; they do not receive unrestricted organization-wide employee data.”

Transition:

> “HR needs a wider operational view, but that wider access should not make every personal screen show everyone’s information.”

## 5:00–7:45 — HR experience

Sign out and sign in as the HR manager.

### Demonstrate the three scopes

Show the scope switcher:

1. `Myself` — open `Leave` or `Attendance`.
2. `Team` — open `Team dashboard` or `Approvals`.
3. `Organization` — open `Overview`.

Point out:

- `Myself` shows the HR user’s own balances, requests, and attendance.
- `Team` provides operational oversight and approvals.
- `Organization` provides HR administration and tenant-wide views.

Say:

> “HR has organization-wide oversight, but personal employee screens remain personal. The scope selector makes that distinction visible.”

### Show HR administration

Briefly open:

- `Directory` — employees, assignments, status, and account access.
- `Jobs & policies` — job configuration and leave-policy setup.
- `Reports` — organization-level workforce and payroll-preparation views.
- `Audit` — recorded activity and filtered export.

Do not spend time editing records unless the stakeholder specifically asks. The purpose is to show the operating model, not to perform administration during the demo.

Say:

> “HR can maintain the workforce structure and policies, investigate exceptions, and prepare reports from the same controlled data set.”

Transition:

> “The final point is how the system protects trust as access becomes broader.”

## 7:45–9:15 — Trust and controls

If time allows, sign in as the platform administrator and show:

1. The platform overview before entering an organization.
2. Enter organization.
3. Exit organization back to the platform overview.

Explain:

- Each organization’s information is kept separate.
- Users see features according to their role and authorized scope.
- Attendance and leave changes are recorded in an audit trail.
- Dates and times are displayed in the user or organization’s applicable local context.
- The interface works on desktop, tablet, and mobile layouts.

Say:

> “The system is designed so access follows responsibility: employees see their own records, managers see their teams, HR sees the organization, and platform administrators explicitly enter an organization before working with its data.”

Avoid showing passwords, raw API responses, database tables, code, browser developer tools, or internal deployment configuration.

## 9:15–10:00 — Close and next steps

Close with:

> “The value is a clearer chain from time recorded, to leave requested, to approval, to reporting—while keeping personal information within the right access boundary.”

Recommended next steps:

1. Confirm the organization’s attendance, leave, approval, and reporting policies.
2. Confirm the employee directory, job assignments, schedules, holidays, and leave balances.
3. Agree the production rollout, training, and support process.
4. Identify any required payroll, identity, or storage integrations.
5. Run a controlled pilot with a small employee group before wider adoption.

## Questions stakeholders may ask

### Who creates a new organization?

The platform administrator provisions the organization, sets its basic defaults, and invites the first HR administrator. Companies do not self-register in the current operating model. Suspension is reversible so historical attendance, leave, and audit records remain available.

### Who can see employee attendance and leave?

Employees see their own records. Reporting managers see their authorized team scope. HR can access organization-level workforce information through the HR workspace. Platform administrators must enter an organization before viewing its tenant data.

### How are leave balances calculated?

Balances are based on the configured leave policy and the employee’s ledger activity, including accruals, carry-over, manual adjustments, approved usage, and pending requests. The cards show the resulting remaining amount and supporting details.

### What happens if someone forgets to clock in or out?

The employee can submit an attendance correction with the date, proposed times, and reason. The request can then be reviewed and approved within the manager workflow.

### Can managers approve requests for anyone in the organization?

No. Manager approval is restricted to the manager’s authorized reporting scope. HR has broader organization-level capabilities.

### How are changes audited?

Important workflow and administrative actions are recorded in the audit area with the actor, action, target, time, and supporting reason or metadata where applicable.

### How does the system handle time zones?

Stored timestamps are interpreted using the organization’s configured timezone for attendance calculations, while the navigation bar also shows the current local date and time for the person using the screen.

### Can HR report across the organization?

Yes. HR reports can summarize attendance, overtime, leave, absenteeism, department workload, and leave liability, with filtering and CSV export for payroll preparation.

### What remains before production rollout?

The organization still needs production configuration: employee and policy validation, identity and account setup, production database and secrets, migration verification, operational monitoring, training, and an agreed support process.

### Does the system execute payroll or provide integrations?

The current reporting capability prepares payroll-oriented CSV data; it does not execute payroll. Payroll, identity, storage, or other integrations should be confirmed and configured separately as part of rollout planning.

## Presenter reminders

- Keep the demo moving; explain business value after each screen rather than describing every control.
- Use the seeded records to show realistic results, but label any live clock or request created during the demo as test data.
- If a screen is empty, explain that an empty state is expected when there are no matching records; do not invent data during the meeting.
- Never expose demo passwords or production credentials.
- End on the operating outcome: accurate time, clearer approvals, better workforce visibility, and controlled access to employee information.
