# Time and Leave Tracker Frontend Requirements

**Document status:** Canonical frontend specification

**Audience:** Product, design, engineering, QA, and autonomous coding agents

**Applies to:** Responsive web prototype

**Last updated:** 2026-09-14

## 1. How to use this document

This file is the single source of truth for the complete Time and Leave Tracker frontend prototype. Implementations, tests, and reviews MUST trace behavior back to a requirement ID in this document.

The key words **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative:

- **MUST/MUST NOT**: required for acceptance.
- **SHOULD/SHOULD NOT**: expected unless a documented constraint justifies an exception.
- **MAY**: optional enhancement.

The prototype MUST model the described behavior with deterministic mock data and client-side state. References to APIs, database tables, real-time updates, email, authentication, or file storage define the frontend contract and simulated experience; they do not imply that a backend exists.

## 2. Product definition and boundaries

### 2.1 Product goals

- **SCP-001:** The product MUST let employees record time, understand attendance, request leave, and see request outcomes quickly.
- **SCP-002:** The product MUST let reporting managers review direct-report requests, monitor presence and limits, and evaluate team leave coverage.
- **SCP-003:** The product MUST let HR managers configure tenant policies, manage the directory, perform audited overrides, and inspect/export organization-wide reports.
- **SCP-004:** All supported workflows MUST work at viewport widths from 360 px through large desktop displays.
- **SCP-005:** The responsive website MUST be installable-quality and usable in a mobile browser. Native iOS and Android applications are out of scope.

### 2.2 Prototype boundaries

- **SCP-006:** The prototype MUST NOT claim to provide production authentication, database persistence, payroll calculation, legal compliance, email/SMS delivery, malware scanning, or secure document storage.
- **SCP-007:** Backend calls MUST be represented by a replaceable data-service boundary or mock repository rather than embedded independently in view components.
- **SCP-008:** Mock mutations MUST update every dependent view during the session so the experience is internally consistent.
- **SCP-009:** The prototype MUST clearly identify demo-only role switching and data-reset controls; these controls MUST NOT be presented as production authorization.
- **SCP-010:** Native applications, payroll execution, biometric time clocks, workforce scheduling, recruitment, performance management, and jurisdiction-specific legal advice are out of scope.

## 3. Personas, tenancy, and permissions

### 3.1 Personas

- **ROLE-001:** An **Employee** MAY access only their own attendance, leave, holiday, and profile information.
- **ROLE-002:** A **Reporting Manager** MUST inherit all employee capabilities and MAY access managerial features only for current direct reports.
- **ROLE-003:** An **HR Manager** MUST inherit employee capabilities and MAY access tenant-wide administration, approvals, overrides, reports, and directory data.
- **ROLE-004:** A user MAY hold both Reporting Manager and HR Manager capabilities. The UI MUST expose only capabilities granted by the effective role set.
- **ROLE-005:** Unauthorized routes, controls, data, counts, exports, and search results MUST be hidden or blocked, including direct URL navigation.

### 3.2 Tenant and hierarchy rules

- **TEN-001:** Every domain record MUST belong to exactly one `tenant_id`; frontend selectors and derived data MUST never combine tenants.
- **TEN-002:** Dates, attendance boundaries, holidays, and “today” MUST use the tenant time zone, not the browser time zone, unless both are explicitly shown.
- **TEN-003:** Reporting scope MUST be derived from active `manager_id` assignments. Direct-report workflows MUST NOT silently include indirect reports.
- **TEN-004:** Manager assignment MUST reject self-management and reporting cycles.
- **TEN-005:** Deactivated employees MUST disappear from active operational lists but remain visible in historical records and authorized reports.
- **TEN-006:** Employment, time, leave, attachment, carry-over, retention, and approval settings MUST be tenant-configurable. The prototype MUST NOT describe a configuration as universally legally compliant.

### 3.3 Capability matrix

| Capability | Employee | Reporting Manager | HR Manager |
|---|---:|---:|---:|
| Own clock, attendance, leave, holidays, profile | Yes | Yes | Yes |
| Direct-report presence, calendar, alerts | No | Yes | Yes, tenant-wide where applicable |
| Direct-report approvals | No | Yes | Yes |
| Tenant configuration and directory | No | No | Yes |
| Overrides and master reports | No | No | Yes |

## 4. Global application experience

### 4.1 Authentication and session surfaces

- **AUTH-001:** The frontend MUST include sign-in, forgot-password, reset-password, signed-out, and session-expired states, implemented as simulations.
- **AUTH-002:** Sign-in forms MUST validate required fields and email format without revealing whether an account exists.
- **AUTH-003:** Password fields MUST support show/hide, paste, password-manager input, and accessible requirement guidance.
- **AUTH-004:** A simulated password reset MUST end in a clear confirmation and a route back to sign-in.
- **AUTH-005:** Signing out or expiring the demo session MUST clear sensitive in-memory UI state and return to sign-in.

### 4.2 Navigation and shared behavior

- **NAV-001:** The primary navigation MUST expose only destinations allowed by the current capabilities.
- **NAV-002:** Employee navigation MUST include Dashboard, My Attendance, Leave, Holiday Calendar, and Profile.
- **NAV-003:** A Reporting Manager MUST have an obvious **Myself / Team** toggle that preserves their employee identity while switching data scope and managerial navigation.
- **NAV-004:** Team navigation MUST include Team Dashboard, Approvals, Who’s In, Team Leave Calendar, and Team Reports/Alerts.
- **NAV-005:** HR navigation MUST include Organization Dashboard, Jobs & Policies, Directory, Overrides, Approvals, Reports, Holidays, and Profile.
- **NAV-006:** The current destination and current scope MUST be visibly and programmatically identifiable.
- **NAV-007:** Refreshing or deep-linking MUST restore a valid route and scope. Invalid or unauthorized routes MUST show a safe not-found/unauthorized state with recovery navigation.
- **NAV-008:** Destructive or high-impact actions MUST use a confirmation step describing the target and effect.
- **NAV-009:** Successful mutations MUST provide a non-blocking confirmation; failures MUST preserve entered data and explain how to recover.
- **NAV-010:** Search, filters, sort order, page position, tabs, and date ranges SHOULD persist while navigating within a workflow.

### 4.3 Common data views

- **UI-001:** Data collections MUST provide relevant search, filtering, sorting, and either pagination or virtualized/incremental rendering for large mock datasets.
- **UI-002:** Every data view MUST define loading, empty, no-results, error, stale, and populated states.
- **UI-003:** Filters MUST be removable individually and resettable together; active filters MUST be visible.
- **UI-004:** Dates MUST be displayed in a localized human-readable format while form values use unambiguous ISO dates.
- **UI-005:** Times MUST show the tenant time zone where ambiguity is possible.
- **UI-006:** Status MUST be communicated by text and semantics, never color alone.
- **UI-007:** Tables MUST retain usable headers, labels, and actions on small screens through responsive cards or deliberate horizontal scrolling.
- **UI-008:** Exports MUST respect the active tenant, capability scope, date range, and filters, and MUST state whether all matching rows or only visible rows are exported.
- **UI-009:** Print views and exported filenames MUST identify the report, tenant, and date or date range.

## 5. Employee portal requirements

### 5.1 Action dashboard

- **EMP-DASH-001:** The employee dashboard MUST feature one dominant button whose label and action reflect the current state: **Clock In** when clocked out and **Clock Out** when clocked in.
- **EMP-DASH-002:** The dashboard MUST display today’s accumulated time, the active clock-in time, and a live elapsed timer while clocked in.
- **EMP-DASH-003:** If the employee’s job has `max_daily_mins`, the dashboard MUST show an accessible progress ring comparing today’s worked minutes with that limit.
- **EMP-DASH-004:** The progress ring MUST display numeric minutes/hours and percentage text; warning and limit states MUST not rely on color alone.
- **EMP-DASH-005:** If `max_daily_mins` is absent, the daily-limit ring MUST be omitted rather than displaying a fabricated target.
- **EMP-DASH-006:** The dashboard MUST summarize the current week, leave remaining, pending requests, attendance exceptions, and the next relevant holiday or approved leave.
- **EMP-DASH-007:** Clock controls MUST prevent duplicate submissions while a simulated mutation is pending and MUST recover after failure.

### 5.2 My Attendance

- **EMP-ATT-001:** My Attendance MUST provide month and week calendar views plus an accessible tabular alternative.
- **EMP-ATT-002:** Each day MUST show worked duration and its status: complete, below standard, missing punch, absent, leave, holiday, non-working day, future, or pending adjustment.
- **EMP-ATT-003:** Missing punches and missed scheduled standard minutes MUST be visually emphasized in red and also identified by icon/text.
- **EMP-ATT-004:** Selecting a day MUST reveal punches, total worked minutes, scheduled minutes, exceptions, and adjustment history.
- **EMP-ATT-005:** Employees MUST be able to start an Attendance Adjustment from an eligible past or current date.
- **EMP-ATT-006:** An adjustment MUST capture date, corrected clock-in, corrected clock-out, required reason, and optional mock attachment.
- **EMP-ATT-007:** The form MUST show the original and proposed values and calculated duration before submission.
- **EMP-ATT-008:** Submitted adjustments MUST enter `pending`, appear in history, and MUST NOT change approved attendance until approved.
- **EMP-ATT-009:** Employees MUST be able to withdraw their own pending adjustments after confirmation.

### 5.3 Leave balances

- **EMP-BAL-001:** Leave balance cards MUST be generated only from active job leave policies for which the employee is eligible.
- **EMP-BAL-002:** Each card MUST show leave type, accrued, carried over, manually adjusted, used, pending, and remaining amounts with the correct unit.
- **EMP-BAL-003:** Balance values MUST be traceable to an expandable ledger or transaction history.
- **EMP-BAL-004:** Negative or exhausted balances MUST be explicitly labeled; policy rules MUST determine whether requests remain available.

### 5.4 Request and manage leave

- **EMP-LEAVE-001:** Employees MUST be able to choose an eligible leave type, start date, end date, full/half-day option where allowed, and provide a reason.
- **EMP-LEAVE-002:** The form MUST calculate chargeable days using the employee’s work schedule, tenant holidays, and policy rules, and show the projected remaining balance.
- **EMP-LEAVE-003:** Ineligible leave types MUST not be selectable. Eligibility explanations SHOULD be available without exposing unrelated policy data.
- **EMP-LEAVE-004:** When the selected policy’s documentation rule is met, an attachment field MUST appear and required documentation MUST block submission until provided.
- **EMP-LEAVE-005:** The default documentation example MUST model Sick Leave longer than two chargeable days, while allowing tenant configuration to change the type, threshold, comparison, and requirement.
- **EMP-LEAVE-006:** The UI MUST reject invalid ranges, disallowed retroactive requests, overlapping pending/approved requests, unsupported partial days, and requests exceeding available balance when negative balance is disallowed.
- **EMP-LEAVE-007:** Before submission, the UI MUST summarize dates, chargeable days, reason, attachments, balance effect, and approver.
- **EMP-LEAVE-008:** Employees MUST see request status, approval history, notes, and balance effect.
- **EMP-LEAVE-009:** Employees MUST be able to withdraw pending requests. Cancellation of approved leave MUST follow a separately configured cancellation flow.

### 5.5 Holiday calendar

- **EMP-HOL-001:** Employees MUST have a read-only month/list calendar of holidays assigned to their tenant and applicable location/calendar.
- **EMP-HOL-002:** Each holiday MUST show name, local date, observance type, and optional description.
- **EMP-HOL-003:** Users MUST be able to navigate months/years and filter by applicable holiday calendar, but MUST NOT edit holidays from the employee portal.

## 6. Reporting Manager portal requirements

### 6.1 Inheritance and scope

- **MGR-SCOPE-001:** Managers MUST retain all employee functionality under **Myself** and access direct-report functions under **Team**.
- **MGR-SCOPE-002:** Team counts, filters, calendars, alerts, approvals, and exports MUST contain only active direct reports plus retained historical records where relevant.
- **MGR-SCOPE-003:** Empty team states MUST explain that reporting relationships are managed by HR.

### 6.2 Unified approvals inbox

- **MGR-APR-001:** The inbox MUST combine pending Leave Requests and Attendance Adjustments in one queue with a visible request-type discriminator.
- **MGR-APR-002:** Managers MUST be able to filter by request type, employee, submitted date, affected date, urgency, and status, and sort oldest-first or newest-first.
- **MGR-APR-003:** Leave review MUST show employee, dates, chargeable amount, leave type, reason, attachments metadata, current balance, projected balance, overlapping team leave, and history.
- **MGR-APR-004:** Attendance review MUST show original punches/summary, proposed correction, reason, attachment metadata, calculated effect, and history.
- **MGR-APR-005:** Managers MUST be able to approve or reject an eligible pending item with an optional note.
- **MGR-APR-006:** The UI MUST confirm the target and effect, prevent repeated decisions, handle stale/already-decided items, and record the actor and tenant-local decision time.
- **MGR-APR-007:** Approved attendance adjustments MUST update attendance summaries; approved leave MUST update request status and balance views in the mock state.

### 6.3 Who’s In

- **MGR-IN-001:** Who’s In MUST show every active direct report as Clocked In, Clocked Out, or On Leave.
- **MGR-IN-002:** On Leave MUST take precedence when approved leave covers the current tenant-local time; otherwise an open clock session means Clocked In, and no open session means Clocked Out.
- **MGR-IN-003:** The roster MUST show last relevant time, scheduled status, and any stale/missing-punch warning.
- **MGR-IN-004:** Status changes MUST update immediately when deterministic mock events are triggered; simulated real-time mode MUST be clearly identified.
- **MGR-IN-005:** Managers MUST be able to search and filter the roster by status, employee, job, and department.

### 6.4 Team leave calendar and coverage

- **MGR-CAL-001:** The Team Leave Calendar MUST show approved upcoming leave for direct reports in timeline and month views.
- **MGR-CAL-002:** Pending requests MAY appear only when a clearly labeled **Include pending** control is enabled; rejected/cancelled requests MUST not appear as coverage.
- **MGR-CAL-003:** Entries MUST show employee, leave type visibility permitted by tenant privacy settings, duration, and affected working days.
- **MGR-CAL-004:** The calendar MUST highlight overlapping leave and days below the tenant’s configured minimum coverage.
- **MGR-CAL-005:** Approval review MUST link to the affected calendar period so the manager can evaluate coverage before deciding.

### 6.5 Overtime and limit alerts

- **MGR-OT-001:** The manager dashboard MUST identify direct reports approaching or exceeding `standard_weekly_mins` and those with overtime alerts enabled by `is_ot_eligible`.
- **MGR-OT-002:** Tenant-configurable warning thresholds MUST default in mock data to 80% approaching and 100% reached/exceeded.
- **MGR-OT-003:** Alerts MUST show employee, job, worked minutes, relevant threshold, variance, period, and alert severity.
- **MGR-OT-004:** Employees who are not overtime eligible MUST be labeled as limit exceptions rather than credited with overtime.
- **MGR-OT-005:** Managers MUST be able to filter alerts and navigate to the employee’s scoped attendance details.

## 7. HR Manager portal requirements

### 7.1 Job profiles

- **HR-JOB-001:** HR MUST be able to list, search, create, view, edit, activate, and deactivate tenant job profiles.
- **HR-JOB-002:** A job profile MUST capture title, optional code/department, `standard_daily_mins`, `standard_weekly_mins`, `is_ot_eligible`, and optional `max_daily_mins`.
- **HR-JOB-003:** Minute values MUST be whole non-negative numbers; when supplied, `max_daily_mins` MUST be greater than or equal to `standard_daily_mins`.
- **HR-JOB-004:** Deactivating an assigned job MUST warn about affected employees and MUST preserve historical references.
- **HR-JOB-005:** Job changes MUST take effect from a selected effective date so historical summaries retain their original policy context.

### 7.2 Leave types and job policy mapping

- **HR-POL-001:** HR MUST be able to create and manage tenant leave types, including name, code, unit, paid/unpaid indicator, color, description, and active state.
- **HR-POL-002:** HR MUST be able to map leave types to jobs through effective-dated `job_leave_policies`.
- **HR-POL-003:** A mapping MUST define annual allotment/accrual, carry-over limit, negative-balance permission, partial-day permission, applicable work/holiday counting, retroactive/future limits, approval requirement, and documentation rules.
- **HR-POL-004:** Duplicate active mappings for the same job, leave type, and overlapping effective period MUST be rejected.
- **HR-POL-005:** Policy forms MUST preview employee-facing eligibility, balance, and documentation behavior before saving.

### 7.3 Global directory

- **HR-DIR-001:** HR MUST have a searchable, sortable, filterable master list of all active employees, with an explicit option to include inactive employees.
- **HR-DIR-002:** The directory MUST show identity, employee number, job, department, manager, status, work location/calendar, and start date subject to privacy rules.
- **HR-DIR-003:** HR MUST be able to update an employee’s job, department, reporting manager, location/calendar, active state, and effective date.
- **HR-DIR-004:** Assignment changes MUST prevent self-management and cycles and MUST preview the affected reporting scope.
- **HR-DIR-005:** HR MUST be able to trigger a simulated password reset with confirmation and a success/failure result without exposing a password.

### 7.4 Override controls

- **HR-OVR-001:** HR MUST be able to add a manual leave-ledger adjustment with employee, leave type, signed amount, effective date, and required reason.
- **HR-OVR-002:** The UI MUST preview the before/after balance and require confirmation; ledger history MUST remain append-only in the mock model.
- **HR-OVR-003:** HR MUST be able to force-approve an eligible pending leave request when the normal manager is unavailable.
- **HR-OVR-004:** Force approval MUST require a reason, identify it as an HR override, apply standard balance/overlap validations, and record an audit event.
- **HR-OVR-005:** HR MUST be able to bulk-regularize attendance for a tenant event by selecting affected employees, date, corrected schedule/punches, and required reason.
- **HR-OVR-006:** Bulk regularization MUST provide a dry-run preview with eligible, conflicting, and invalid rows before confirmation.
- **HR-OVR-007:** The result MUST report success or failure per employee and MUST not silently overwrite an approved manual adjustment.

### 7.5 Master reports

- **HR-RPT-001:** HR MUST have exportable tabular reports modeled from `attendance_summaries`, scoped to the current tenant.
- **HR-RPT-002:** Required report presets are organization absenteeism, overtime by department, and end-of-year leave balance liability.
- **HR-RPT-003:** Reports MUST support relevant date range, employee, manager, department, job, location, attendance status, and leave-type filters.
- **HR-RPT-004:** Each report MUST show its calculation basis, active filters, generated tenant-local timestamp, totals, and row count.
- **HR-RPT-005:** Absenteeism MUST distinguish absence, approved leave, holiday, non-working day, and incomplete attendance.
- **HR-RPT-006:** Overtime MUST use minutes above the effective job’s standard threshold and clearly distinguish overtime-eligible and non-eligible exceptions.
- **HR-RPT-007:** Leave liability MUST expose balance units and a mock valuation rate; it MUST be labeled an estimate and MUST NOT claim to execute payroll/accounting.
- **HR-RPT-008:** CSV export MUST escape values safely, use stable machine-readable columns, and export all filtered rows. Print/PDF presentation MAY use a print stylesheet because actual PDF generation is out of scope.

### 7.6 Holiday administration

- **HR-HOL-001:** HR MUST be able to list, create, edit, and deactivate tenant holidays and location-specific holiday calendars.
- **HR-HOL-002:** Duplicate active holidays on the same calendar/date MUST be rejected or explicitly confirmed as separate observances.
- **HR-HOL-003:** Holiday changes MUST show which future leave calculations or attendance expectations are affected.

## 8. Cross-cutting business rules

### 8.1 Attendance calculations

- **BR-ATT-001:** A person MUST have at most one open clock session. Clock In while open and Clock Out while closed MUST be rejected with recovery guidance.
- **BR-ATT-002:** Worked minutes MUST be derived from paired timestamps before display rounding. Display rounding MUST NOT change stored mock minutes.
- **BR-ATT-003:** Sessions spanning tenant-local midnight MUST be split between local dates for summaries while retaining a link to the original session.
- **BR-ATT-004:** A missing clock-out or clock-in MUST create a missing-punch exception and MUST NOT invent worked minutes.
- **BR-ATT-005:** Below-standard and absence flags apply only to scheduled working days after subtracting approved leave and applicable holidays.
- **BR-ATT-006:** Future days, non-working days, and holidays MUST NOT be flagged for missing standard time.
- **BR-ATT-007:** `standard_daily_mins` and `standard_weekly_mins` are expected-work thresholds. `max_daily_mins`, when set, is a hard clocking limit.
- **BR-ATT-008:** At the hard daily limit, the UI MUST block a new clock-in, warn an already clocked-in employee, and demonstrate the tenant-configured escalation behavior without fabricating a clock-out.
- **BR-ATT-009:** Attendance adjustments follow `pending → approved`, `pending → rejected`, or `pending → withdrawn`; terminal states MUST not be decided again.
- **BR-ATT-010:** Proposed adjusted intervals MUST have an end after the start and MUST not create overlapping approved intervals.

### 8.2 Leave calculations

- **BR-LVE-001:** A leave request is eligible only when an active job policy covers the employee and every requested date.
- **BR-LVE-002:** Chargeable days MUST exclude scheduled non-working days and applicable holidays unless the selected policy explicitly includes them.
- **BR-LVE-003:** `accrued` is entitlement earned through the as-of date; `carried_over` is prior-period entitlement retained within policy limits; `manual_adjustments` is the signed ledger sum; `used` is approved/consumed leave; `pending` is chargeable leave in pending requests.
- **BR-LVE-004:** `remaining = accrued + carried_over + manual_adjustments − used`. `available_to_request = remaining − pending` unless the policy allows negative balances.
- **BR-LVE-005:** Pending leave reserves request capacity but MUST NOT be counted as used. Approval converts the reservation to used without double deduction; rejection/withdrawal releases it.
- **BR-LVE-006:** Approved leave MUST be reversed through a cancellation or compensating ledger event, never by silently deleting history.
- **BR-LVE-007:** Carry-over MUST be capped by the effective policy and shown separately from current-period accrual.
- **BR-LVE-008:** Leave states are `draft`, `pending`, `approved`, `rejected`, `withdrawn`, and `cancelled`. Only transitions explicitly described in this document are permitted.
- **BR-LVE-009:** Documentation requirements MUST be calculated from chargeable duration, not raw calendar span, unless the policy explicitly says otherwise.
- **BR-LVE-010:** Attachment validation MUST default to PDF, JPEG, or PNG, no more than 10 MB per file and five files per request; tenant mock configuration MAY narrow or change these limits.

### 8.3 Approvals, overrides, and audit

- **BR-APR-001:** The current reporting manager may decide only pending direct-report requests; HR may act tenant-wide within HR capabilities.
- **BR-APR-002:** Approve and reject notes are optional for normal manager decisions. Required reasons for HR overrides and ledger adjustments MUST be meaningful non-whitespace text.
- **BR-APR-003:** Every decision and administrative mutation MUST produce an immutable mock `audit_event` with actor, action, target, tenant, timestamp, and reason/note where applicable.
- **BR-APR-004:** History MUST show actor display name and role without exposing private authentication identifiers.
- **BR-APR-005:** Stale data conflicts MUST preserve the latest authoritative mock state, explain that the record changed, and offer refresh/review rather than overwriting it.

## 9. Frontend data contracts

All IDs are opaque non-empty strings. All timestamps are ISO 8601 strings with an offset or `Z`; all date-only values are `YYYY-MM-DD`; minute and day amounts are numeric. Optional values MUST be represented consistently as omitted or `null`, never ambiguous empty strings.

| Entity | Required frontend fields |
|---|---|
| `Tenant` | `tenant_id`, `name`, `timezone`, `locale`, `week_start`, `currency`, `settings` |
| `User` | `user_id`, `tenant_id`, `employee_id`, `display_name`, `email`, `capabilities[]`, `status` |
| `Employee` | `employee_id`, `tenant_id`, `employee_number`, `name`, `job_id`, `manager_id`, `department_id`, `location_id`, `holiday_calendar_id`, `work_schedule`, `start_date`, `status` |
| `Department` | `department_id`, `tenant_id`, `name`, `code`, `status` |
| `Location` | `location_id`, `tenant_id`, `name`, `timezone`, `holiday_calendar_id`, `status` |
| `WorkSchedule` | `schedule_id`, `tenant_id`, `name`, `weekday_rules`, `effective_from`, `effective_to`, `status` |
| `JobProfile` | `job_id`, `tenant_id`, `title`, `department_id`, `standard_daily_mins`, `standard_weekly_mins`, `is_ot_eligible`, `max_daily_mins`, `effective_from`, `effective_to`, `status` |
| `AttendanceSession` | `session_id`, `tenant_id`, `employee_id`, `clock_in_at`, `clock_out_at`, `source`, `status`, `version` |
| `AttendanceSummary` | `summary_id`, `tenant_id`, `employee_id`, `local_date`, `worked_mins`, `scheduled_mins`, `overtime_mins`, `status`, `exception_codes[]`, `effective_job_id` |
| `AttendanceAdjustment` | `adjustment_id`, `tenant_id`, `employee_id`, `local_date`, `original`, `proposed`, `reason`, `attachment_ids[]`, `status`, `submitted_at`, `decided_by`, `decided_at`, `decision_note`, `version` |
| `LeaveType` | `leave_type_id`, `tenant_id`, `name`, `code`, `unit`, `is_paid`, `color`, `status` |
| `JobLeavePolicy` | `policy_id`, `tenant_id`, `job_id`, `leave_type_id`, `annual_allotment`, `accrual_rule`, `carry_over_limit`, `allow_negative`, `allow_partial_day`, `counting_rule`, `request_window`, `documentation_rule`, `effective_from`, `effective_to`, `status` |
| `LeaveBalance` | `balance_id`, `tenant_id`, `employee_id`, `leave_type_id`, `period`, `accrued`, `carried_over`, `manual_adjustments`, `used`, `pending`, `remaining`, `unit`, `as_of` |
| `LeaveLedgerEntry` | `entry_id`, `tenant_id`, `employee_id`, `leave_type_id`, `effective_date`, `amount`, `entry_type`, `source_id`, `reason`, `created_by`, `created_at` |
| `LeaveRequest` | `request_id`, `tenant_id`, `employee_id`, `leave_type_id`, `start_date`, `end_date`, `partial_day`, `chargeable_amount`, `reason`, `attachment_ids[]`, `status`, `approver_id`, `submitted_at`, `decided_at`, `decision_note`, `version` |
| `Attachment` | `attachment_id`, `tenant_id`, `owner_type`, `owner_id`, `file_name`, `mime_type`, `size_bytes`, `mock_url`, `validation_status` |
| `HolidayCalendar` | `holiday_calendar_id`, `tenant_id`, `name`, `location_ids[]`, `status` |
| `Holiday` | `holiday_id`, `tenant_id`, `holiday_calendar_id`, `name`, `local_date`, `observance_type`, `description`, `status` |
| `Alert` | `alert_id`, `tenant_id`, `employee_id`, `type`, `severity`, `period_start`, `period_end`, `current_mins`, `threshold_mins`, `created_at`, `status` |
| `AuditEvent` | `event_id`, `tenant_id`, `actor_user_id`, `actor_role`, `action`, `target_type`, `target_id`, `occurred_at`, `reason`, `metadata` |

### 9.1 Required enums

- `user/employee/job/policy/holiday status`: `active`, `inactive`.
- `attendance session status`: `open`, `closed`, `voided`.
- `attendance session source`: `responsive_web`, `attendance_adjustment`, `hr_bulk_override`.
- `attendance day status`: `complete`, `below_standard`, `missing_punch`, `absent`, `leave`, `holiday`, `non_working`, `future`, `pending_adjustment`.
- `request status`: `draft`, `pending`, `approved`, `rejected`, `withdrawn`, `cancelled`.
- `partial day`: `none`, `start_half`, `end_half`, `custom_hours`.
- `leave unit`: `days`, `hours`.
- `leave ledger entry type`: `accrual`, `carry_over`, `usage`, `reversal`, `manual_adjustment`, `expiry`.
- `observance type`: `public`, `company`, `optional`.
- `alert severity`: `info`, `warning`, `critical`.
- `alert status`: `open`, `acknowledged`, `resolved`.
- `attachment validation status`: `pending`, `accepted`, `rejected`.

## 10. Accessibility, responsive design, and content

- **A11Y-001:** The product MUST conform to WCAG 2.2 Level AA for all required flows.
- **A11Y-002:** All functionality MUST be operable with keyboard alone with logical focus order, visible focus, no keyboard traps, and focus restoration after dialogs.
- **A11Y-003:** Pages MUST use semantic landmarks and headings; forms MUST have programmatic labels, instructions, grouped controls, and field-linked errors.
- **A11Y-004:** Dialogs MUST announce their title, trap focus while open, close with Escape when safe, and return focus to the invoking control.
- **A11Y-005:** Toasts and asynchronous results MUST use suitable live regions without interrupting unrelated work.
- **A11Y-006:** Text and meaningful graphics MUST meet AA contrast; focus indicators and non-text controls MUST meet non-text contrast requirements.
- **A11Y-007:** Touch targets SHOULD be at least 44 by 44 CSS pixels. The UI MUST remain usable at 200% zoom and with text spacing overrides.
- **A11Y-008:** Charts, progress rings, calendars, icons, and color-coded states MUST have equivalent text or tabular information.
- **A11Y-009:** Motion MUST respect `prefers-reduced-motion`; no required meaning may depend on animation.
- **RESP-001:** Required layouts MUST be tested at 360×800, 390×844, 768×1024, 1280×800, and 1440×900.
- **RESP-002:** The application MUST have no unintended page-level horizontal overflow at supported sizes.
- **RESP-003:** Primary actions MUST remain reachable without hover, and hover-only information MUST have focus/touch alternatives.
- **CONTENT-001:** Labels and messages MUST use plain language, consistent role names, and explicit units.
- **CONTENT-002:** Error messages MUST identify the problem and recovery action without exposing stack traces, secrets, or unrelated personal data.

## 11. Privacy and frontend security

- **SEC-001:** UI authorization MUST default to deny and MUST be applied to navigation, routes, actions, data queries, counts, and exports.
- **SEC-002:** The prototype MUST escape or safely render all user-provided text and MUST NOT use unsanitized HTML injection.
- **SEC-003:** Sensitive personal data MUST not be placed in URLs, browser logs, analytics examples, filenames, or generic error messages.
- **SEC-004:** Mock attachments MUST display metadata/previews without uploading to a real external service. Object URLs MUST be revoked when no longer needed.
- **SEC-005:** Local persistence MUST be namespaced by tenant and demo user, versioned, resettable, and documented as non-secure demo storage.
- **SEC-006:** Sign-out, tenant switch, role switch, and reset MUST prevent prior-scope records from remaining visible in cached UI state.
- **SEC-007:** CSV values that begin with spreadsheet formula characters MUST be neutralized, and all values MUST be correctly quoted.
- **SEC-008:** External links, if any, MUST identify their destination and use safe opener behavior.

## 12. Performance, reliability, and compatibility

### 12.1 Core Web Vitals and performance

- **PERF-001:** At the 75th percentile in a representative production-like build, Largest Contentful Paint SHOULD be ≤2.5 seconds, Interaction to Next Paint SHOULD be ≤200 ms, and Cumulative Layout Shift SHOULD be ≤0.1.
- **PERF-002:** Initial routes SHOULD achieve Lighthouse scores of at least 90 for Accessibility, Best Practices, and SEO, and SHOULD target 90 for Performance using the agreed test environment.
- **PERF-003:** Route-level code splitting and deferred loading SHOULD keep features not needed for the initial employee dashboard out of its critical bundle.
- **PERF-004:** Lists and calendars with 1,000 mock records MUST remain interactive and MUST not render an unbounded number of DOM rows.

### 12.2 Reliability and compatibility

- **REL-001:** Every simulated mutation MUST support success, validation failure, authorization failure, stale conflict, and generic retryable error states.
- **REL-002:** Double-clicking or repeated submission MUST not create duplicate clock sessions, requests, adjustments, ledger entries, or decisions.
- **REL-003:** Seed data MUST be deterministic, cover every role and important status, and use dates relative to a configurable demo “today” rather than becoming stale.
- **REL-004:** A visible demo reset MUST restore seed data, route, role, and date consistently after confirmation.
- **REL-005:** Supported browsers are the latest two stable major versions of Chrome, Edge, Firefox, and Safari. Mobile browser coverage MUST include current Chrome on Android and Safari on iOS.
- **PWA-001:** The responsive prototype SHOULD include valid install metadata, icons, theme color, and a standalone-safe layout.
- **PWA-002:** If an offline shell is implemented, it MUST clearly identify stale/demo data and MUST NOT imply that mutations synchronized to a server.

## 13. Testing and acceptance

### 13.1 Test requirements

- **TEST-001:** Unit tests MUST cover duration, midnight splitting, attendance flags, overtime thresholds, chargeable leave, balance equations, documentation thresholds, hierarchy cycles, and permission predicates.
- **TEST-002:** Component tests MUST cover validation, loading/empty/error states, keyboard behavior, responsive state changes, and status text.
- **TEST-003:** End-to-end tests MUST cover the happy path and at least one failure/recovery path for every workflow in the traceability table.
- **TEST-004:** Role/tenant tests MUST prove that unauthorized records, actions, counts, and exports are inaccessible after navigation, refresh, and role/tenant changes.
- **TEST-005:** Automated accessibility checks MUST run on every primary route; critical flows MUST also receive keyboard and screen-reader-oriented manual review.
- **TEST-006:** Visual/responsive checks MUST cover all viewports in `RESP-001`, long names, translated-length text, empty data, dense data, and 200% zoom.
- **TEST-007:** Export tests MUST verify filter scope, stable headers, Unicode, commas/quotes/newlines, formula neutralization, and expected row counts.

### 13.2 Requirement traceability and acceptance scenarios

| User outcome | Requirement IDs | Minimum acceptance evidence |
|---|---|---|
| Employee clocks in/out and sees job limit | EMP-DASH-001–007, BR-ATT-001–008 | State changes once, timer/total update, conditional ring is accurate, limit and failure states are accessible |
| Employee reviews attendance exceptions | EMP-ATT-001–004, BR-ATT-002–006 | Calendar/table totals agree; missing and below-standard days are red plus text; exempt days are not flagged |
| Employee submits an adjustment | EMP-ATT-005–009, BR-ATT-009–010 | Before/after preview is valid, reason is required, pending does not rewrite approved attendance, withdrawal works |
| Employee understands leave balances | EMP-BAL-001–004, BR-LVE-001–007 | Only eligible cards display and every figure reconciles to the ledger equation |
| Employee requests documented leave | EMP-LEAVE-001–009, BR-LVE-008–010 | Duration/balance preview is accurate, configured attachment appears, invalid/overlap/excess cases are blocked |
| Employee views tenant holidays | EMP-HOL-001–003, TEN-001–002 | Only applicable holidays appear with readable date/type and no employee edit controls |
| Manager switches between self and team | NAV-003–004, MGR-SCOPE-001–003 | Identity remains stable, direct-report scope is enforced, navigation and empty states are correct |
| Manager reviews unified approvals | MGR-APR-001–007, BR-APR-001–005 | Both request types show required context; approve/reject updates related mock views once and records history |
| Manager sees current presence | MGR-IN-001–005 | Every direct report has one correctly prioritized status and deterministic updates are immediate |
| Manager evaluates leave coverage | MGR-CAL-001–005 | Approved upcoming leave is default, optional pending is labeled, overlap/coverage warnings link to review |
| Manager reviews overtime/limits | MGR-OT-001–005 | Approaching/exceeded calculations and eligibility labels match effective job thresholds |
| HR manages job profiles | HR-JOB-001–005 | CRUD/activation, validation, effective dating, and assigned-job warnings work in mock state |
| HR maps leave policies | HR-POL-001–005 | Policy preview matches employee eligibility, balances, and attachment behavior; overlaps are rejected |
| HR manages the directory | HR-DIR-001–005, TEN-003–005 | Filters and edits work, cycles are rejected, scope updates, and reset is simulated safely |
| HR performs audited overrides | HR-OVR-001–007, BR-APR-003–005 | Reason and confirmation are mandatory; previews reconcile; history/audit remains append-only; bulk results are per-row |
| HR generates master reports | HR-RPT-001–008 | Three presets calculate and explain scoped mock data; active filters and safe full-result CSV exports agree |
| HR manages holidays | HR-HOL-001–003 | Tenant/location scoping, duplicate handling, deactivation, and impact preview are demonstrated |
| Website meets modern quality baseline | UI-001–009, A11Y-001–009, RESP-001–003, SEC-001–008, PERF-001–004, REL-001–005 | Automated and manual evidence meets the defined responsive, accessibility, privacy, performance, and reliability thresholds |

### 13.3 Agent completion checklist

An implementation or review is not complete until the responsible agent can answer **yes** to every applicable item:

- [ ] Each changed behavior cites one or more stable requirement IDs.
- [ ] Employee, manager, and HR inheritance and data scopes are enforced in routes, controls, derived values, and exports.
- [ ] Tenant time zone, effective job, schedule, holidays, and policies drive calculations; no business-critical target is hardcoded in a component.
- [ ] Mutations update all dependent mock views and create the required history/audit entry exactly once.
- [ ] Validation and all loading, empty, no-results, error, stale, success, and confirmation states are present.
- [ ] The feature is keyboard-operable, screen-reader understandable, color-independent, zoom-safe, and responsive at the required viewports.
- [ ] Privacy-safe rendering, local-state isolation, safe exports, and role/tenant switching have been tested.
- [ ] Unit, component, end-to-end, accessibility, responsive, and export tests have been added or updated as applicable.
- [ ] Demo-only behavior is labeled and does not imply a backend, secure persistence, legal compliance, or real message/file delivery.
- [ ] The canonical requirements document remains internally consistent and is updated when an intentional product decision changes.

## 14. Explicit assumptions

- The system is a complete responsive frontend prototype backed by mock services/client state, not a production full-stack application.
- “Mobile app” means an installable-quality responsive web experience; native app requirements are excluded.
- Tenant-configurable rules take precedence over jurisdiction-specific assumptions.
- A tenant supplies its time zone, work schedules, holidays, effective jobs, leave policies, warning thresholds, privacy settings, and coverage minimums.
- “Real-time” means immediate deterministic mock-state updates or an explicitly labeled simulation.
- Currency values in leave-liability reports are estimates for presentation testing only.
- Backend APIs, database migrations, secure authentication, document storage/scanning, infrastructure, payroll/accounting execution, statutory formulas, and legal interpretations remain out of scope.
