CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  checksum text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tenants (
  tenant_id text PRIMARY KEY CHECK (length(tenant_id) > 0), name text NOT NULL, timezone text NOT NULL, locale text NOT NULL,
  week_start integer NOT NULL, currency text NOT NULL, settings jsonb NOT NULL, UNIQUE (tenant_id)
);
CREATE TABLE departments (
  department_id text PRIMARY KEY CHECK (length(department_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), name text NOT NULL, code text NOT NULL, status text NOT NULL CHECK (status IN ('active','inactive')), UNIQUE (tenant_id, department_id)
);
CREATE TABLE holiday_calendars (
  holiday_calendar_id text PRIMARY KEY CHECK (length(holiday_calendar_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), name text NOT NULL, location_ids text[] NOT NULL, status text NOT NULL CHECK (status IN ('active','inactive')), UNIQUE (tenant_id, holiday_calendar_id)
);
CREATE TABLE locations (
  location_id text PRIMARY KEY CHECK (length(location_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), name text NOT NULL, timezone text NOT NULL, holiday_calendar_id text NOT NULL, status text NOT NULL CHECK (status IN ('active','inactive')), UNIQUE (tenant_id, location_id), FOREIGN KEY (tenant_id, holiday_calendar_id) REFERENCES holiday_calendars(tenant_id, holiday_calendar_id)
);
CREATE TABLE work_schedules (
  schedule_id text PRIMARY KEY CHECK (length(schedule_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), name text NOT NULL, weekday_rules jsonb NOT NULL, effective_from date NOT NULL, effective_to date, status text NOT NULL CHECK (status IN ('active','inactive')), CHECK (effective_to IS NULL OR effective_to >= effective_from), UNIQUE (tenant_id, schedule_id)
);
CREATE TABLE job_profiles (
  job_id text PRIMARY KEY CHECK (length(job_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), title text NOT NULL, department_id text NOT NULL, standard_daily_mins integer NOT NULL CHECK (standard_daily_mins >= 0), standard_weekly_mins integer NOT NULL CHECK (standard_weekly_mins >= 0), is_ot_eligible boolean NOT NULL, max_daily_mins integer CHECK (max_daily_mins IS NULL OR max_daily_mins >= 0), effective_from date NOT NULL, effective_to date, status text NOT NULL CHECK (status IN ('active','inactive')), CHECK (effective_to IS NULL OR effective_to >= effective_from), CHECK (max_daily_mins IS NULL OR max_daily_mins >= standard_daily_mins), UNIQUE (tenant_id, job_id), FOREIGN KEY (tenant_id, department_id) REFERENCES departments(tenant_id, department_id)
);
CREATE TABLE employees (
  employee_id text PRIMARY KEY CHECK (length(employee_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), employee_number text NOT NULL, name text NOT NULL, job_id text NOT NULL, manager_id text, department_id text NOT NULL, location_id text NOT NULL, holiday_calendar_id text NOT NULL, work_schedule jsonb NOT NULL, start_date date NOT NULL, status text NOT NULL CHECK (status IN ('active','inactive')), UNIQUE (tenant_id, employee_id), FOREIGN KEY (tenant_id, job_id) REFERENCES job_profiles(tenant_id, job_id), FOREIGN KEY (tenant_id, manager_id) REFERENCES employees(tenant_id, employee_id), FOREIGN KEY (tenant_id, department_id) REFERENCES departments(tenant_id, department_id), FOREIGN KEY (tenant_id, location_id) REFERENCES locations(tenant_id, location_id), FOREIGN KEY (tenant_id, holiday_calendar_id) REFERENCES holiday_calendars(tenant_id, holiday_calendar_id)
);
CREATE TABLE users (
  user_id text PRIMARY KEY CHECK (length(user_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), employee_id text NOT NULL, display_name text NOT NULL, email text NOT NULL, capabilities text[] NOT NULL, status text NOT NULL CHECK (status IN ('active','inactive')), UNIQUE (tenant_id, user_id), FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, employee_id)
);
CREATE TABLE attendance_sessions (
  session_id text PRIMARY KEY CHECK (length(session_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), employee_id text NOT NULL, clock_in_at timestamptz NOT NULL, clock_out_at timestamptz, source text NOT NULL CHECK (source IN ('responsive_web','attendance_adjustment','hr_bulk_override')), status text NOT NULL CHECK (status IN ('open','closed','voided')), version integer NOT NULL CHECK (version >= 0), UNIQUE (tenant_id, session_id), FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, employee_id), CHECK (clock_out_at IS NULL OR clock_out_at > clock_in_at)
);
CREATE UNIQUE INDEX attendance_one_open_per_employee ON attendance_sessions(tenant_id, employee_id) WHERE status = 'open';
CREATE TABLE attendance_summaries (
  summary_id text PRIMARY KEY CHECK (length(summary_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), employee_id text NOT NULL, local_date date NOT NULL, worked_mins integer NOT NULL CHECK (worked_mins >= 0), scheduled_mins integer NOT NULL CHECK (scheduled_mins >= 0), overtime_mins integer NOT NULL CHECK (overtime_mins >= 0), status text NOT NULL CHECK (status IN ('complete','below_standard','missing_punch','absent','leave','holiday','non_working','future','pending_adjustment')), exception_codes text[] NOT NULL, effective_job_id text NOT NULL, UNIQUE (tenant_id, summary_id), FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, employee_id), FOREIGN KEY (tenant_id, effective_job_id) REFERENCES job_profiles(tenant_id, job_id)
);
CREATE TABLE attachments (
  attachment_id text PRIMARY KEY CHECK (length(attachment_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), owner_type text NOT NULL, owner_id text NOT NULL, file_name text NOT NULL, mime_type text NOT NULL, size_bytes integer NOT NULL CHECK (size_bytes >= 0), mock_url text NOT NULL, validation_status text NOT NULL CHECK (validation_status IN ('pending','accepted','rejected')), UNIQUE (tenant_id, attachment_id)
);
CREATE TABLE attendance_adjustments (
  adjustment_id text PRIMARY KEY CHECK (length(adjustment_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), employee_id text NOT NULL, local_date date NOT NULL, original jsonb NOT NULL, proposed jsonb NOT NULL, reason text NOT NULL, attachment_ids text[] NOT NULL, status text NOT NULL CHECK (status IN ('draft','pending','approved','rejected','withdrawn','cancelled')), submitted_at timestamptz NOT NULL, decided_by text, decided_at timestamptz, decision_note text, version integer NOT NULL CHECK (version >= 0), UNIQUE (tenant_id, adjustment_id), FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, employee_id)
);
CREATE TABLE leave_types (
  leave_type_id text PRIMARY KEY CHECK (length(leave_type_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), name text NOT NULL, code text NOT NULL, unit text NOT NULL CHECK (unit IN ('days','hours')), is_paid boolean NOT NULL, color text NOT NULL, description text, status text NOT NULL CHECK (status IN ('active','inactive')), UNIQUE (tenant_id, leave_type_id)
);
CREATE TABLE job_leave_policies (
  policy_id text PRIMARY KEY CHECK (length(policy_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), job_id text NOT NULL, leave_type_id text NOT NULL, annual_allotment numeric NOT NULL, accrual_rule jsonb NOT NULL, carry_over_limit numeric NOT NULL, allow_negative boolean NOT NULL, allow_partial_day boolean NOT NULL, counting_rule jsonb NOT NULL, request_window jsonb NOT NULL, documentation_rule jsonb NOT NULL, effective_from date NOT NULL, effective_to date, status text NOT NULL CHECK (status IN ('active','inactive')), CHECK (effective_to IS NULL OR effective_to >= effective_from), UNIQUE (tenant_id, policy_id), FOREIGN KEY (tenant_id, job_id) REFERENCES job_profiles(tenant_id, job_id), FOREIGN KEY (tenant_id, leave_type_id) REFERENCES leave_types(tenant_id, leave_type_id)
);
CREATE TABLE leave_balances (
  balance_id text PRIMARY KEY CHECK (length(balance_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), employee_id text NOT NULL, leave_type_id text NOT NULL, period text NOT NULL, accrued numeric NOT NULL, carried_over numeric NOT NULL, manual_adjustments numeric NOT NULL, used numeric NOT NULL, pending numeric NOT NULL, remaining numeric NOT NULL, unit text NOT NULL CHECK (unit IN ('days','hours')), as_of date NOT NULL, UNIQUE (tenant_id, balance_id), FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, employee_id), FOREIGN KEY (tenant_id, leave_type_id) REFERENCES leave_types(tenant_id, leave_type_id)
);
CREATE TABLE leave_ledger_entries (
  entry_id text PRIMARY KEY CHECK (length(entry_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), employee_id text NOT NULL, leave_type_id text NOT NULL, effective_date date NOT NULL, amount numeric NOT NULL, entry_type text NOT NULL CHECK (entry_type IN ('accrual','carry_over','usage','reversal','manual_adjustment','expiry')), source_id text NOT NULL, reason text NOT NULL, created_by text NOT NULL, created_at timestamptz NOT NULL, UNIQUE (tenant_id, entry_id), FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, employee_id), FOREIGN KEY (tenant_id, leave_type_id) REFERENCES leave_types(tenant_id, leave_type_id)
);
CREATE TABLE leave_requests (
  request_id text PRIMARY KEY CHECK (length(request_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), employee_id text NOT NULL, leave_type_id text NOT NULL, start_date date NOT NULL, end_date date NOT NULL, partial_day text NOT NULL CHECK (partial_day IN ('none','start_half','end_half','custom_hours')), chargeable_amount numeric NOT NULL, reason text NOT NULL, attachment_ids text[] NOT NULL, status text NOT NULL CHECK (status IN ('draft','pending','approved','rejected','withdrawn','cancelled')), approver_id text, submitted_at timestamptz, decided_at timestamptz, decision_note text, version integer NOT NULL CHECK (version >= 0), CHECK (end_date >= start_date), UNIQUE (tenant_id, request_id), FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, employee_id), FOREIGN KEY (tenant_id, leave_type_id) REFERENCES leave_types(tenant_id, leave_type_id)
);
CREATE TABLE holidays (
  holiday_id text PRIMARY KEY CHECK (length(holiday_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), holiday_calendar_id text NOT NULL, name text NOT NULL, local_date date NOT NULL, observance_type text NOT NULL CHECK (observance_type IN ('public','company','optional')), description text, status text NOT NULL CHECK (status IN ('active','inactive')), UNIQUE (tenant_id, holiday_id), FOREIGN KEY (tenant_id, holiday_calendar_id) REFERENCES holiday_calendars(tenant_id, holiday_calendar_id)
);
CREATE TABLE alerts (
  alert_id text PRIMARY KEY CHECK (length(alert_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), employee_id text NOT NULL, type text NOT NULL, severity text NOT NULL CHECK (severity IN ('info','warning','critical')), period_start date NOT NULL, period_end date NOT NULL, current_mins integer NOT NULL, threshold_mins integer NOT NULL, created_at timestamptz NOT NULL, status text NOT NULL CHECK (status IN ('open','acknowledged','resolved')), UNIQUE (tenant_id, alert_id), FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, employee_id), CHECK (period_end >= period_start)
);
CREATE TABLE audit_events (
  event_id text PRIMARY KEY CHECK (length(event_id) > 0), tenant_id text NOT NULL REFERENCES tenants(tenant_id), actor_user_id text NOT NULL, actor_role text NOT NULL, action text NOT NULL, target_type text NOT NULL, target_id text NOT NULL, occurred_at timestamptz NOT NULL, reason text, metadata jsonb NOT NULL, UNIQUE (tenant_id, event_id), FOREIGN KEY (tenant_id, actor_user_id) REFERENCES users(tenant_id, user_id)
);
