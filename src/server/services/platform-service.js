import crypto from "node:crypto";
import { pool, withTransaction } from "../config/database.js";
import { HttpError } from "../views/problem-view.js";

const id = () => crypto.randomUUID();
const assertPlatform = (req) => {
  if (req.actor?.actor_kind !== "platform")
    throw new HttpError(403, "Forbidden", "A platform administrator context is required.");
};

const normalizeSettings = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new HttpError(422, "Invalid Settings", "Settings must be an object.");
  const settings = {};
  if (value.minimum_coverage !== undefined) {
    const coverage = Number(value.minimum_coverage);
    if (!Number.isInteger(coverage) || coverage < 0 || coverage > 100000)
      throw new HttpError(422, "Invalid Settings", "Minimum coverage must be a non-negative whole number.");
    settings.minimum_coverage = coverage;
  }
  if (value.overtime_warning_percent !== undefined) {
    const threshold = Number(value.overtime_warning_percent);
    if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100)
      throw new HttpError(422, "Invalid Settings", "Overtime warning percentage must be between 1 and 100.");
    settings.overtime_warning_percent = threshold;
  }
  if (!Object.keys(settings).length)
    throw new HttpError(422, "Invalid Settings", "At least one supported setting is required.");
  return settings;
};

export const listTenants = async (req) => {
  assertPlatform(req);
  const result = await pool.query(
    `SELECT t.tenant_id, t.name, t.timezone, t.locale, t.currency,
            COALESCE(s.status,'active') AS status, COALESCE(s.settings,'{}'::jsonb) AS platform_settings,
            (SELECT count(*)::integer FROM employees e WHERE e.tenant_id=t.tenant_id AND e.status='active') AS active_employees,
            (SELECT count(*)::integer FROM leave_requests l WHERE l.tenant_id=t.tenant_id AND l.status='pending') AS pending_requests
       FROM tenants t LEFT JOIN tenant_platform_state s ON s.tenant_id=t.tenant_id
      ORDER BY t.name ASC`,
  );
  return result.rows;
};

export const listAccess = async (req) => {
  assertPlatform(req);
  const result = await pool.query(
    `SELECT p.platform_user_id, p.display_name, p.email, m.tenant_id, m.tenant_user_id, m.roles, m.status
       FROM platform_users p JOIN platform_memberships m ON m.platform_user_id=p.platform_user_id
      ORDER BY p.display_name, m.tenant_id`,
  );
  return result.rows;
};

export const listSettings = async (req) => {
  assertPlatform(req);
  const result = await pool.query(
    `SELECT t.tenant_id, t.name, t.timezone,
            COALESCE(s.status, 'active') AS status,
            COALESCE(s.settings, t.settings, '{}'::jsonb) AS settings
       FROM tenants t
       LEFT JOIN tenant_platform_state s ON s.tenant_id = t.tenant_id
      ORDER BY t.name ASC`,
  );
  return result.rows;
};

export const updateSettings = async (req) => {
  assertPlatform(req);
  const tenantId = req.body?.tenant_id;
  if (!tenantId)
    throw new HttpError(422, "Invalid Request", "tenant_id is required.");
  const patch = normalizeSettings(req.body?.settings);
  return withTransaction(async (client) => {
    const tenant = await client.query("SELECT tenant_id FROM tenants WHERE tenant_id=$1", [tenantId]);
    if (!tenant.rowCount) throw new HttpError(404, "Not Found", "Tenant not found.");
    const row = await client.query(
      `INSERT INTO tenant_platform_state (tenant_id, status, settings)
       VALUES ($1, 'active', $2::jsonb)
       ON CONFLICT (tenant_id) DO UPDATE
       SET settings = tenant_platform_state.settings || EXCLUDED.settings
       RETURNING tenant_id, status, settings`,
      [tenantId, JSON.stringify(patch)],
    );
    await client.query(
      `INSERT INTO platform_audit_events
        (event_id, platform_user_id, action, target_type, target_id, occurred_at, reason, metadata)
       VALUES ($1,$2,'tenant_settings_updated','Tenant',$3,now(),$4,$5::jsonb)`,
      [id(), req.actor.platform_user_id, tenantId, req.body.reason || null, JSON.stringify(patch)],
    );
    return row.rows[0];
  });
};

export const listAudit = async (req) => {
  assertPlatform(req);
  const result = await pool.query(
    "SELECT event_id, platform_user_id, action, target_type, target_id, occurred_at, reason, metadata FROM platform_audit_events ORDER BY occurred_at DESC LIMIT 500",
  );
  return result.rows;
};

export const updateTenantStatus = async (req) => {
  assertPlatform(req);
  const status = req.body?.status;
  if (!['active', 'suspended'].includes(status))
    throw new HttpError(422, "Invalid Status", "Tenant status must be active or suspended.");
  return withTransaction(async (client) => {
    const tenant = await client.query("SELECT tenant_id FROM tenants WHERE tenant_id=$1", [req.params.tenant_id]);
    if (!tenant.rowCount) throw new HttpError(404, "Not Found", "Tenant not found.");
    await client.query(
      "INSERT INTO tenant_platform_state (tenant_id,status,settings) VALUES ($1,$2,'{}') ON CONFLICT (tenant_id) DO UPDATE SET status=EXCLUDED.status",
      [req.params.tenant_id, status],
    );
    const row = await client.query(
      "INSERT INTO platform_audit_events (event_id,platform_user_id,action,target_type,target_id,occurred_at,reason,metadata) VALUES ($1,$2,$3,$4,$5,now(),$6,$7) RETURNING *",
      [id(), req.actor.platform_user_id, status === 'suspended' ? 'tenant_suspended' : 'tenant_reactivated', 'Tenant', req.params.tenant_id, req.body.reason || null, {}],
    );
    return row.rows[0];
  });
};
