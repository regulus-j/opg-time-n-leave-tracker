CREATE TABLE user_invitations (
  invite_id text PRIMARY KEY CHECK (length(invite_id) > 0),
  tenant_id text NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  user_id text NOT NULL,
  employee_id text NOT NULL,
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL,
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, user_id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, employee_id) REFERENCES employees(tenant_id, employee_id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id, created_by) REFERENCES users(tenant_id, user_id),
  CHECK (accepted_at IS NULL OR revoked_at IS NULL)
);

CREATE UNIQUE INDEX user_invitations_open_email_ci
  ON user_invitations (tenant_id, lower(email))
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

CREATE INDEX user_invitations_tenant_idx
  ON user_invitations (tenant_id, created_at DESC);
