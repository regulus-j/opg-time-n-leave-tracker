import crypto from "node:crypto";
import { withTransaction } from "../config/database.js";
import { hashPassword } from "./auth-service.js";
import { HttpError } from "../views/problem-view.js";

const id = (prefix) => `${prefix}-${crypto.randomUUID()}`;
const now = () => new Date().toISOString();

const roleCapabilities = {
  Employee: ["attendance:write", "attendance-adjustments:write", "leave:write", "leave-requests:write"],
  "Reporting Manager": ["attendance:approve", "leave:approve", "alerts:write"],
  "HR Manager": [
    "users:write", "departments:write", "job-profiles:write", "leave-types:write",
    "job-leave-policies:write", "leave-balances:write", "leave-ledger-entries:write",
    "leave-requests:write", "leave:approve", "attendance:approve", "attendance-adjustments:write",
    "attachments:write", "alerts:write",
  ],
};

const assertString = (value, field, { nullable = false } = {}) => {
  if (nullable && value === null) return;
  if (typeof value !== "string" || !value.trim())
    throw new HttpError(422, "Invalid Request", `${field} is required.`);
};

const assertManager = async (client, tenantId, employeeId, managerId) => {
  if (!managerId) return;
  if (employeeId === managerId)
    throw new HttpError(422, "Invalid Hierarchy", "An employee cannot manage itself.");
  const cycle = await client.query(
    `WITH RECURSIVE chain(employee_id, manager_id) AS (
       SELECT employee_id, manager_id FROM employees WHERE tenant_id=$1 AND employee_id=$2
       UNION ALL
       SELECT e.employee_id, e.manager_id FROM employees e JOIN chain c ON e.employee_id=c.manager_id
       WHERE e.tenant_id=$1
     ) SELECT 1 FROM chain WHERE employee_id=$3 LIMIT 1`,
    [tenantId, managerId, employeeId],
  );
  if (cycle.rowCount)
    throw new HttpError(422, "Invalid Hierarchy", "The manager assignment would create a reporting cycle.");
};

const audit = async (client, req, action, targetType, targetId, reason = null, metadata = {}) => {
  await client.query(
    `INSERT INTO audit_events (event_id,tenant_id,actor_user_id,actor_role,action,target_type,target_id,occurred_at,reason,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [id("audit"), req.tenantId, req.actor.user_id, req.actor.actor_role || "hr_manager", action, targetType, targetId, now(), reason, metadata],
  );
};

const employeePayload = (body, tenantId, employeeId) => ({
  employee_id: employeeId,
  tenant_id: tenantId,
  employee_number: String(body.employee_number || "").trim(),
  name: String(body.name || "").trim(),
  job_id: body.job_id,
  manager_id: body.manager_id || null,
  department_id: body.department_id,
  location_id: body.location_id,
  holiday_calendar_id: body.holiday_calendar_id,
  work_schedule: body.work_schedule || {},
  start_date: body.start_date,
  status: body.status || "active",
});

const validateEmployee = (payload) => {
  for (const field of ["employee_number", "name", "job_id", "department_id", "location_id", "holiday_calendar_id", "start_date"])
    assertString(payload[field], field);
  if (!payload.manager_id && payload.manager_id !== null)
    throw new HttpError(422, "Invalid Request", "manager_id is required and may be null.");
  if (!payload.work_schedule || typeof payload.work_schedule !== "object")
    throw new HttpError(422, "Invalid Request", "work_schedule must be an object.");
  if (!["active", "inactive"].includes(payload.status))
    throw new HttpError(422, "Invalid Request", "status is invalid.");
};

const accountCapabilities = (roles = [], requested = []) => {
  const selected = Array.isArray(roles) && roles.length ? roles : ["Employee"];
  if (selected.some((role) => !roleCapabilities[role]))
    throw new HttpError(422, "Invalid Request", "One or more account roles are invalid.");
  const allowed = new Set(selected.flatMap((role) => roleCapabilities[role]));
  if (requested.length) {
    for (const capability of requested)
      if (!allowed.has(capability))
        throw new HttpError(403, "Forbidden", "Requested capabilities exceed the selected roles.");
    return [...new Set(requested)];
  }
  return [...allowed];
};

export const createDirectoryEntry = async (req) => withTransaction(async (client) => {
  const body = req.body || {};
  const employeeId = body.employee_id || id("employee");
  const employee = employeePayload(body, req.tenantId, employeeId);
  validateEmployee(employee);
  await assertManager(client, req.tenantId, employee.employee_id, employee.manager_id);
  const duplicateNumber = await client.query("SELECT 1 FROM employees WHERE tenant_id=$1 AND employee_number=$2 LIMIT 1", [req.tenantId, employee.employee_number]);
  if (duplicateNumber.rowCount) throw new HttpError(409, "Duplicate Employee Number", "Employee number is already in use.");
  await client.query(
    `INSERT INTO employees (employee_id,tenant_id,employee_number,name,job_id,manager_id,department_id,location_id,holiday_calendar_id,work_schedule,start_date,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [employee.employee_id, req.tenantId, employee.employee_number, employee.name, employee.job_id, employee.manager_id, employee.department_id, employee.location_id, employee.holiday_calendar_id, employee.work_schedule, employee.start_date, employee.status],
  );
  let account = null;
  if (body.account?.enabled) {
    assertString(body.account.email, "account.email");
    assertString(body.account.password, "account.password");
    if (body.account.password.length < 12) throw new HttpError(422, "Invalid Request", "Account password must be at least 12 characters.");
    const userId = body.account.user_id || id("user");
    const capabilities = accountCapabilities(body.account.roles, body.account.capabilities);
    const displayName = body.account.display_name || employee.name;
    await client.query("INSERT INTO users (user_id,tenant_id,employee_id,display_name,email,capabilities,status) VALUES ($1,$2,$3,$4,$5,$6,'active')", [userId, req.tenantId, employee.employee_id, displayName, body.account.email.trim(), capabilities]);
    await client.query("INSERT INTO auth_credentials (user_id,tenant_id,email,password_hash) VALUES ($1,$2,$3,$4)", [userId, req.tenantId, body.account.email.trim(), await hashPassword(body.account.password)]);
    account = { user_id: userId, display_name: displayName, email: body.account.email.trim(), roles: body.account.roles || ["Employee"], status: "active" };
  }
  await audit(client, req, "directory_create", "Employee", employee.employee_id, "HR directory entry created", { account_created: Boolean(account) });
  return { employee, account };
});

export const updateDirectoryEntry = async (req) => withTransaction(async (client) => {
  const current = await client.query("SELECT * FROM employees WHERE tenant_id=$1 AND employee_id=$2 FOR UPDATE", [req.tenantId, req.params.employee_id]);
  if (!current.rowCount) throw new HttpError(404, "Not Found", "Employee was not found.");
  const employee = employeePayload({ ...current.rows[0], ...req.body }, req.tenantId, req.params.employee_id);
  validateEmployee(employee);
  await assertManager(client, req.tenantId, employee.employee_id, employee.manager_id);
  const duplicateNumber = await client.query("SELECT 1 FROM employees WHERE tenant_id=$1 AND employee_number=$2 AND employee_id<>$3 LIMIT 1", [req.tenantId, employee.employee_number, employee.employee_id]);
  if (duplicateNumber.rowCount) throw new HttpError(409, "Duplicate Employee Number", "Employee number is already in use.");
  const result = await client.query(
    `UPDATE employees SET employee_number=$1,name=$2,job_id=$3,manager_id=$4,department_id=$5,location_id=$6,holiday_calendar_id=$7,work_schedule=$8,start_date=$9,status=$10 WHERE tenant_id=$11 AND employee_id=$12 RETURNING *`,
    [employee.employee_number, employee.name, employee.job_id, employee.manager_id, employee.department_id, employee.location_id, employee.holiday_calendar_id, employee.work_schedule, employee.start_date, employee.status, req.tenantId, employee.employee_id],
  );
  const directReports = await client.query("SELECT employee_id FROM employees WHERE tenant_id=$1 AND manager_id=$2 AND status='active' ORDER BY employee_id", [req.tenantId, employee.employee_id]);
  await audit(client, req, "directory_update", "Employee", employee.employee_id, "HR directory assignment updated", { manager_id: employee.manager_id });
  return { employee: result.rows[0], reporting_scope: { direct_report_ids: directReports.rows.map((row) => row.employee_id), direct_report_count: directReports.rowCount } };
});

export const resetPassword = async (req) => withTransaction(async (client) => {
  const result = await client.query("SELECT u.user_id FROM users u WHERE u.tenant_id=$1 AND u.employee_id=$2 AND u.status='active' LIMIT 1", [req.tenantId, req.params.employee_id]);
  if (!result.rowCount) throw new HttpError(404, "Not Found", "No active portal account exists for this employee.");
  const userId = result.rows[0].user_id;
  const passwordHash = await hashPassword(crypto.randomBytes(32).toString("base64url"));
  await client.query("UPDATE auth_credentials SET password_hash=$1,updated_at=now() WHERE tenant_id=$2 AND user_id=$3", [passwordHash, req.tenantId, userId]);
  const resetAt = now();
  await audit(client, req, "directory_password_reset", "User", userId, "HR simulated a password reset");
  return { employee_id: req.params.employee_id, user_id: userId, reset: true, reset_at: resetAt };
});
