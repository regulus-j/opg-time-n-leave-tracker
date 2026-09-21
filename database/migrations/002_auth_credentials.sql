CREATE TABLE auth_credentials (
  user_id text PRIMARY KEY,
  tenant_id text NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, user_id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX auth_credentials_email_ci ON auth_credentials (lower(email));
