import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

const databaseUrl = process.env.TEST_DATABASE_URL;

test(
  "PostgreSQL API enforces tenancy, workflows, concurrency, balances, and audits",
  { skip: !databaseUrl },
  async () => {
    process.env.DATABASE_URL = databaseUrl;
    process.env.JWT_SECRET ||= "integration-jwt-secret-that-is-long-enough";
    process.env.CSRF_SECRET ||= "integration-csrf-secret-that-is-long-enough";
    const [{ createApp }, { pool }] = await Promise.all([
      import("../../src/server/app.js"),
      import("../../src/server/config/database.js"),
    ]);
    const app = createApp();
    const user = request.agent(app);
    const userLogin = await user.post("/api/v1/auth/login").send({
      email: "user@dev.local",
      password: process.env.SEED_USER_PASSWORD,
    });
    assert.equal(userLogin.status, 200);
    const userCsrf = userLogin.body.csrf_token;

    const employees = await user.get("/api/v1/employees?limit=1");
    assert.equal(employees.status, 200);
    assert.equal(employees.body.length, 1);
    assert.equal(employees.body[0].employee_id, "ns-morgan");
  assert.equal(employees.headers["x-total-count"], "1");
  assert.equal((await user.get("/api/v1/audit-events")).status, 403);
    assert.equal(
      (await user.get("/api/v1/employees").set("x-tenant-id", "harbor")).status,
      403,
    );

    const created = await user
      .post("/api/v1/leave-requests")
      .set("x-csrf-token", userCsrf)
      .send({
        employee_id: "ns-morgan",
        leave_type_id: "ns-annual",
        start_date: "2027-12-06",
        end_date: "2027-12-07",
        partial_day: "none",
        chargeable_amount: 2,
        reason: "Integration verification leave",
        attachment_ids: [],
        status: "draft",
        approver_id: null,
        submitted_at: null,
        decided_at: null,
        decision_note: null,
        version: 0,
      });
    assert.equal(created.status, 201);
    const submitWithoutVersion = await user
      .post(`/api/v1/leave-requests/${created.body.request_id}/submit`)
      .set("x-csrf-token", userCsrf)
      .send({});
    assert.equal(submitWithoutVersion.status, 428);
    const submitted = await user
      .post(`/api/v1/leave-requests/${created.body.request_id}/submit`)
      .set("x-csrf-token", userCsrf)
      .set("if-match", "0")
      .send({});
    assert.equal(submitted.status, 200);
    assert.equal(submitted.body.status, "pending");

    const manager = request.agent(app);
    const managerLogin = await manager.post("/api/v1/auth/login").send({
      email: "manager@dev.local",
      password: process.env.SEED_USER_PASSWORD,
    });
    assert.equal(managerLogin.status, 200);
    const approved = await manager
      .post(`/api/v1/leave-requests/${created.body.request_id}/approve`)
      .set("x-csrf-token", managerLogin.body.csrf_token)
      .set("if-match", "1")
      .send({});
    assert.equal(approved.status, 200);
    assert.equal(approved.body.status, "approved");
    const ledger = await pool.query(
      "SELECT amount, entry_type FROM leave_ledger_entries WHERE tenant_id = $1 AND source_id = $2",
      ["northstar", created.body.request_id],
    );
    assert.equal(ledger.rowCount, 1);
    assert.equal(ledger.rows[0].entry_type, "usage");
  assert.equal(Number(ledger.rows[0].amount), -2);
  const adjustment = await user.post("/api/v1/attendance-adjustments").set("x-csrf-token", userCsrf).send({
    employee_id: "ns-morgan", local_date: "2027-12-01", original: { clock_in: "09:00", clock_out: null }, proposed: { clock_in: "09:00", clock_out: "17:00" },
    reason: "Integration punch correction", attachment_ids: [], status: "draft", submitted_at: new Date().toISOString(), decided_by: null, decided_at: null, decision_note: null, version: 0,
  });
  assert.equal(adjustment.status, 201);
  const adjustmentSubmitted = await user.post(`/api/v1/attendance-adjustments/${adjustment.body.adjustment_id}/submit`).set("x-csrf-token", userCsrf).set("if-match", "0").send({});
  assert.equal(adjustmentSubmitted.status, 200);
  const adjustmentApproved = await manager.post(`/api/v1/attendance-adjustments/${adjustment.body.adjustment_id}/approve`).set("x-csrf-token", managerLogin.body.csrf_token).set("if-match", "1").send({});
  assert.equal(adjustmentApproved.status, 200);
  const correctedSession = await pool.query("SELECT source FROM attendance_sessions WHERE tenant_id=$1 AND employee_id=$2 AND clock_in_at::date=$3", ["northstar", "ns-morgan", "2027-12-01"]);
  assert.equal(correctedSession.rows[0].source, "attendance_adjustment");
  const correctedSummary = await pool.query("SELECT worked_mins,status FROM attendance_summaries WHERE tenant_id=$1 AND employee_id=$2 AND local_date=$3", ["northstar", "ns-morgan", "2027-12-01"]);
  assert.deepEqual(correctedSummary.rows[0], { worked_mins: 480, status: "complete" });
  const audit = await pool.query(
      "SELECT action FROM audit_events WHERE tenant_id = $1 AND target_id = $2 ORDER BY occurred_at",
      ["northstar", created.body.request_id],
    );
    assert.deepEqual(
      audit.rows.map(({ action }) => action),
      ["resource_create", "leave_submit", "leave_approve"],
    );

    const readonly = request.agent(app);
    const readonlyLogin = await readonly.post("/api/v1/auth/login").send({
      email: "readonly@dev.local",
      password: process.env.SEED_READONLY_PASSWORD,
    });
    assert.equal(readonlyLogin.status, 200);
    const forbidden = await readonly
      .post("/api/v1/attendance-sessions/clock-in")
      .set("x-csrf-token", readonlyLogin.body.csrf_token)
      .send({});
    assert.equal(forbidden.status, 403);
    assert.equal(forbidden.type, "application/problem+json");
    assert.ok(forbidden.body.request_id);

    const admin = request.agent(app);
    const adminLogin = await admin.post("/api/v1/auth/login").send({
      email: "admin@dev.local",
      password: process.env.SEED_ADMIN_PASSWORD,
    });
    const context = await admin
      .post("/api/v1/auth/context")
      .set("x-csrf-token", adminLogin.body.csrf_token)
      .send({ tenant_id: "northstar" });
    assert.equal(context.status, 200);
    const alex = await admin.get("/api/v1/employees/ns-alex");
    const invalidHierarchy = await admin
      .put("/api/v1/employees/ns-alex")
      .set("x-csrf-token", context.body.csrf_token)
      .send({ ...alex.body, manager_id: "ns-alex" });
    assert.equal(invalidHierarchy.status, 422);
    const payroll = await admin.get("/api/v1/reports/payroll-timesheet?from=2026-09-01&to=2026-09-30&page_size=2");
    assert.equal(payroll.status, 200);
    assert.equal(payroll.body.preset, "payroll-timesheet");
    assert.ok(payroll.body.items.length <= 2);
    const payrollCsv = await admin.get("/api/v1/reports/payroll-timesheet.csv?from=2026-09-01&to=2026-09-30");
    assert.equal(payrollCsv.status, 200);
    assert.match(payrollCsv.headers["content-type"], /text\/csv/);
    assert.match(payrollCsv.text, /paid_leave_units/);
    const auditCsv = await admin.get("/api/v1/audit-events/export.csv?q=seed");
    assert.equal(auditCsv.status, 200);
    assert.match(auditCsv.text, /event_id/);
    const directory = await admin
      .post("/api/v1/hr/directory")
      .set("x-csrf-token", context.body.csrf_token)
      .send({
        employee_number: `NS-${Date.now()}`,
        name: "Integration Directory User",
        job_id: "ns-coordinator",
        manager_id: "ns-alex",
        department_id: "ns-ops",
        location_id: "ns-manila",
        holiday_calendar_id: "ns-ph",
        work_schedule: { schedule_id: "ns-standard" },
        start_date: "2026-09-18",
        status: "active",
        account: { enabled: true, email: `directory-${Date.now()}@dev.local`, password: "Temporary-Password-2026!", roles: ["Employee"] },
      });
    assert.equal(directory.status, 201);
    assert.equal(Object.prototype.hasOwnProperty.call(directory.body, "password"), false);

    process.env.NODE_ENV = "test";
    process.env.INVITATION_TEST_TOKEN = "test-invitation-token-12345678901234567890";
    const tenantId = `browser-${Date.now()}`;
    const provisioned = await admin
      .post("/api/v1/auth/context")
      .set("x-csrf-token", context.body.csrf_token)
      .send({ tenant_id: null });
    assert.equal(provisioned.status, 200);
    const provision = await admin
      .post("/api/v1/platform/tenants")
      .set("x-csrf-token", provisioned.body.csrf_token)
      .send({
        tenant_id: tenantId,
        name: "Browser Provisioned Organization",
        timezone: "Asia/Manila",
        locale: "en-PH",
        week_start: 1,
        currency: "PHP",
        initial_admin: { display_name: "Invited HR Admin", email: `invite-${Date.now()}@dev.local` },
      });
    assert.equal(provision.status, 201);
    assert.equal(provision.body.tenant_id, tenantId);
    assert.equal(provision.body.invitation.status, "pending");
    assert.equal(Object.prototype.hasOwnProperty.call(provision.body, "invite_token"), false);

    const duplicate = await admin
      .post("/api/v1/platform/tenants")
      .set("x-csrf-token", provisioned.body.csrf_token)
      .send({
        tenant_id: tenantId,
        name: "Duplicate Organization",
        timezone: "Asia/Manila",
        locale: "en-PH",
        week_start: 1,
        currency: "PHP",
        initial_admin: { display_name: "Another Admin", email: `another-${Date.now()}@dev.local` },
      });
    assert.equal(duplicate.status, 409);

    const edited = await admin
      .put(`/api/v1/platform/tenants/${tenantId}`)
      .set("x-csrf-token", provisioned.body.csrf_token)
      .send({ name: "Edited Browser Organization", reason: "Integration edit" });
    assert.equal(edited.status, 200);
    assert.equal(edited.body.name, "Edited Browser Organization");

    const suspended = await admin
      .put(`/api/v1/platform/tenants/${tenantId}/status`)
      .set("x-csrf-token", provisioned.body.csrf_token)
      .send({ status: "suspended", reason: "Integration status test" });
    assert.equal(suspended.status, 200);
    const reactivated = await admin
      .put(`/api/v1/platform/tenants/${tenantId}/status`)
      .set("x-csrf-token", provisioned.body.csrf_token)
      .send({ status: "active", reason: "Integration status restore" });
    assert.equal(reactivated.status, 200);

    const invitationAgent = request.agent(app);
    const accepted = await invitationAgent
      .post("/api/v1/auth/invitations/accept")
      .send({ token: process.env.INVITATION_TEST_TOKEN, password: "Invited-HR-password-2026!" });
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.tenant_id, tenantId);
    assert.ok(accepted.body.roles.includes("HR Manager"));
    const invitedEmployees = await invitationAgent.get("/api/v1/employees");
    assert.equal(invitedEmployees.status, 200);
    assert.ok(invitedEmployees.body.every((row) => row.tenant_id === tenantId));
    const tenantUserPlatformAccess = await invitationAgent.get("/api/v1/platform/tenants");
    assert.equal(tenantUserPlatformAccess.status, 403);
    const platformAudit = await pool.query(
      "SELECT action FROM platform_audit_events WHERE target_id=$1 ORDER BY occurred_at",
      [tenantId],
    );
    assert.deepEqual(
      platformAudit.rows.map(({ action }) => action),
      ["tenant_created", "tenant_invitation_created", "tenant_updated", "tenant_suspended", "tenant_reactivated"],
    );
    delete process.env.INVITATION_TEST_TOKEN;
    await pool.end();
  },
);
