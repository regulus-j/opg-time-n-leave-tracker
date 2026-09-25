CREATE TABLE tenant_invitations (
  invite_id text PRIMARY KEY CHECK (length(invite_id) > 0),
  tenant_id text NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  user_id text NOT NULL,
  email text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by text NOT NULL REFERENCES platform_users(platform_user_id),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, user_id) ON DELETE CASCADE,
  CHECK (accepted_at IS NULL OR revoked_at IS NULL)
);

CREATE UNIQUE INDEX tenant_invitations_open_email_ci
  ON tenant_invitations (tenant_id, lower(email))
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

CREATE INDEX tenant_invitations_tenant_idx
  ON tenant_invitations (tenant_id, created_at DESC);
