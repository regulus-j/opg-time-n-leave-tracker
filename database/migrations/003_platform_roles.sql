CREATE TABLE platform_users (
  platform_user_id text PRIMARY KEY CHECK (length(platform_user_id) > 0),
  display_name text NOT NULL,
  email text NOT NULL,
  capabilities text[] NOT NULL,
  status text NOT NULL CHECK (status IN ('active','inactive')),
  UNIQUE (platform_user_id)
);

CREATE UNIQUE INDEX platform_users_email_ci ON platform_users (lower(email));

CREATE TABLE platform_credentials (
  platform_user_id text PRIMARY KEY REFERENCES platform_users(platform_user_id) ON DELETE CASCADE,
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX platform_credentials_email_ci ON platform_credentials (lower(email));

CREATE TABLE platform_memberships (
  platform_user_id text NOT NULL REFERENCES platform_users(platform_user_id) ON DELETE CASCADE,
  tenant_id text NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  tenant_user_id text,
  roles text[] NOT NULL,
  status text NOT NULL CHECK (status IN ('active','inactive')),
  PRIMARY KEY (platform_user_id, tenant_id),
  FOREIGN KEY (tenant_id, tenant_user_id) REFERENCES users(tenant_id, user_id)
);

CREATE TABLE platform_audit_events (
  event_id text PRIMARY KEY CHECK (length(event_id) > 0),
  platform_user_id text NOT NULL REFERENCES platform_users(platform_user_id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  occurred_at timestamptz NOT NULL,
  reason text,
  metadata jsonb NOT NULL
);

CREATE TABLE tenant_platform_state (
  tenant_id text PRIMARY KEY REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('active','suspended')) DEFAULT 'active',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb
);
