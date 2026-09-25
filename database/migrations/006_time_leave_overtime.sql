ALTER TABLE leave_requests
  ADD COLUMN IF NOT EXISTS partial_start_time time,
  ADD COLUMN IF NOT EXISTS partial_end_time time,
  ADD COLUMN IF NOT EXISTS partial_minutes integer;

ALTER TABLE leave_requests
  DROP CONSTRAINT IF EXISTS leave_requests_partial_interval_check;
ALTER TABLE leave_requests
  ADD CONSTRAINT leave_requests_partial_interval_check CHECK (
    (partial_day <> 'custom_hours' AND partial_start_time IS NULL AND partial_end_time IS NULL AND partial_minutes IS NULL)
    OR
    (partial_day = 'custom_hours' AND start_date = end_date AND partial_start_time IS NOT NULL AND partial_end_time IS NOT NULL AND partial_end_time > partial_start_time AND partial_minutes > 0)
  ) NOT VALID;

CREATE TABLE IF NOT EXISTS overtime_requests (
  overtime_request_id text PRIMARY KEY CHECK (length(overtime_request_id) > 0),
  tenant_id text NOT NULL REFERENCES tenants(tenant_id),
  employee_id text NOT NULL,
  local_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  requested_mins integer NOT NULL CHECK (requested_mins > 0),
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  status text NOT NULL CHECK (status IN ('draft','pending','approved','rejected','withdrawn','cancelled')),
  approver_id text,
  submitted_at timestamptz,
  decided_at timestamptz,
  decision_note text,
  version integer NOT NULL CHECK (version >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, overtime_request_id),
  FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, employee_id),
  CHECK (end_time > start_time),
  CHECK (requested_mins = floor(extract(epoch FROM (end_time - start_time)) / 60)::integer)
);
CREATE INDEX IF NOT EXISTS overtime_requests_scope_idx ON overtime_requests(tenant_id, employee_id, local_date, status);

CREATE TABLE IF NOT EXISTS overtime_ledger_entries (
  entry_id text PRIMARY KEY CHECK (length(entry_id) > 0),
  tenant_id text NOT NULL REFERENCES tenants(tenant_id),
  overtime_request_id text NOT NULL,
  employee_id text NOT NULL,
  local_date date NOT NULL,
  minutes integer NOT NULL CHECK (minutes > 0),
  entry_type text NOT NULL CHECK (entry_type IN ('approved')),
  reason text NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, entry_id),
  UNIQUE (tenant_id, overtime_request_id, entry_type),
  FOREIGN KEY (tenant_id, overtime_request_id) REFERENCES overtime_requests(tenant_id, overtime_request_id),
  FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, employee_id)
);
CREATE INDEX IF NOT EXISTS overtime_ledger_scope_idx ON overtime_ledger_entries(tenant_id, employee_id, local_date);

-- Existing seeded users predate the capability additions. Backfill only the
-- capabilities needed by these workflows without changing other grants.
UPDATE users
SET capabilities = ARRAY(SELECT DISTINCT unnest(capabilities || ARRAY['overtime-requests:write']))
WHERE 'leave:write' = ANY(capabilities)
  AND NOT 'overtime-requests:write' = ANY(capabilities);

UPDATE users
SET capabilities = ARRAY(SELECT DISTINCT unnest(capabilities || ARRAY['overtime:approve']))
WHERE 'leave:approve' = ANY(capabilities)
  AND NOT 'overtime:approve' = ANY(capabilities);

UPDATE users
SET capabilities = ARRAY(SELECT DISTINCT unnest(capabilities || ARRAY['attendance:override']))
WHERE 'users:write' = ANY(capabilities)
  AND NOT 'attendance:override' = ANY(capabilities);
