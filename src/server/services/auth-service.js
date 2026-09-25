import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { HttpError } from "../views/problem-view.js";

const withTransaction = async (fn) => {
  const database = await import("../config/database.js");
  return database.withTransaction(fn);
};

const secret = () => {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production")
    throw new Error("JWT_SECRET is required in production.");
  return process.env.JWT_SECRET || "development-only-jwt-secret-change-me";
};
const csrfSecret = () => process.env.CSRF_SECRET || secret();

export const hashPassword = (password) =>
  bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 12));
export const verifyPassword = (password, hash) =>
  bcrypt.compare(password, hash);
export const issueSession = (actor) =>
  jwt.sign(
    {
      sub: actor.user_id,
      tenant_id: actor.active_tenant_id ?? actor.tenant_id ?? null,
      active_tenant_id: actor.active_tenant_id ?? actor.tenant_id ?? null,
      actor_kind: actor.actor_kind || "tenant",
    },
    secret(),
    {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    issuer: "time-leave-tracker",
    },
  );
export const verifySession = (token) =>
  jwt.verify(token, secret(), { issuer: "time-leave-tracker" });
export const issueCsrf = () => crypto.randomBytes(32).toString("hex");
export const signCsrf = (value) =>
  jwt.sign({ csrf: value }, csrfSecret(), { expiresIn: "8h" });
export const verifyCsrf = (token, value) => {
  try {
    return jwt.verify(token, csrfSecret()).csrf === value;
  } catch {
    return false;
  }
};

const invitationHash = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const acceptInvitation = async (token, password) => {
  if (typeof token !== "string" || token.length < 32)
    throw new HttpError(422, "Invalid Invitation", "The invitation token is invalid.");
  if (typeof password !== "string" || password.length < 12)
    throw new HttpError(422, "Invalid Password", "The password must be at least 12 characters.");
  return withTransaction(async (client) => {
    const result = await client.query(
      `SELECT i.invite_id, i.tenant_id, i.email, i.expires_at, i.accepted_at, i.revoked_at,
              u.user_id, u.employee_id, u.status AS user_status
         FROM tenant_invitations i
         JOIN users u ON u.tenant_id=i.tenant_id AND u.user_id=i.user_id
        WHERE i.token_hash=$1
        FOR UPDATE`,
      [invitationHash(token)],
    );
    const invitation = result.rows[0];
    if (!invitation)
      throw new HttpError(400, "Invalid Invitation", "The invitation link is invalid or has expired.");
    if (invitation.accepted_at || invitation.revoked_at || new Date(invitation.expires_at).getTime() <= Date.now())
      throw new HttpError(400, "Invalid Invitation", "The invitation link is invalid or has expired.");
    const passwordHash = await hashPassword(password);
    try {
      await client.query(
        "INSERT INTO auth_credentials (user_id,tenant_id,email,password_hash) VALUES ($1,$2,$3,$4)",
        [invitation.user_id, invitation.tenant_id, invitation.email, passwordHash],
      );
    } catch (error) {
      if (error.code === "23505")
        throw new HttpError(409, "Account Already Active", "This invitation can no longer be accepted.");
      throw error;
    }
    await client.query(
      "UPDATE users SET status='active' WHERE tenant_id=$1 AND user_id=$2",
      [invitation.tenant_id, invitation.user_id],
    );
    await client.query(
      "UPDATE employees SET status='active' WHERE tenant_id=$1 AND employee_id=$2",
      [invitation.tenant_id, invitation.employee_id],
    );
    await client.query(
      "UPDATE tenant_invitations SET accepted_at=now() WHERE invite_id=$1",
      [invitation.invite_id],
    );
    await client.query(
      `INSERT INTO audit_events
        (event_id,tenant_id,actor_user_id,actor_role,action,target_type,target_id,occurred_at,reason,metadata)
       VALUES ($1,$2,$3,'tenant_admin','invitation_accepted','User',$3,now(),'Initial HR administrator invitation accepted',$4::jsonb)`,
      [crypto.randomUUID(), invitation.tenant_id, invitation.user_id, JSON.stringify({ invite_id: invitation.invite_id })],
    );
    return { email: invitation.email };
  });
};

export const authenticate = async (client, email, password) => {
  const result = await client.query(
    `SELECT u.user_id, u.tenant_id, u.employee_id, u.display_name, u.email, u.capabilities, u.status, c.password_hash FROM users u JOIN auth_credentials c ON c.user_id = u.user_id AND c.tenant_id = u.tenant_id WHERE lower(u.email) = lower($1) LIMIT 1`,
    [email],
  );
  const record = result.rows[0];
  const platformResult = await client.query(
    `SELECT p.platform_user_id AS user_id, p.display_name, p.email, p.capabilities,
            p.status, c.password_hash,
            COALESCE(json_agg(json_build_object(
              'tenant_id', m.tenant_id,
              'tenant_user_id', m.tenant_user_id,
              'roles', m.roles,
              'status', m.status
            ) ORDER BY m.tenant_id) FILTER (WHERE m.tenant_id IS NOT NULL), '[]') AS memberships
       FROM platform_users p
       JOIN platform_credentials c ON c.platform_user_id = p.platform_user_id
       LEFT JOIN platform_memberships m ON m.platform_user_id = p.platform_user_id
      WHERE lower(p.email) = lower($1)
      GROUP BY p.platform_user_id, p.display_name, p.email, p.capabilities, p.status, c.password_hash
      LIMIT 1`,
    [email],
  );
  const platform = platformResult.rows[0];
  const valid = await verifyPassword(
    password || "",
    record?.password_hash || platform?.password_hash ||
      "$2b$12$a6ITSX1l6hICIPCpWD.O1.0nJHM0zQc76LU0RzM424ml6nIx6RGTS",
  );
  if (platform && valid && platform.status === "active") {
    const { password_hash: _hash, memberships, ...actor } = platform;
    return {
      ...actor,
      actor_kind: "platform",
      tenant_id: null,
      active_tenant_id: null,
      roles: ["Platform Administrator"],
      memberships,
    };
  }
  if (!record || !valid || record.status !== "active")
    throw new HttpError(
      401,
      "Unauthenticated",
      "Email or password is incorrect.",
    );
  const { password_hash: _hash, ...actor } = record;
  return {
    ...actor,
    actor_kind: "tenant",
    roles: [
      "Employee",
      ...(actor.capabilities.includes("leave:approve")
        ? ["Reporting Manager"]
        : []),
      ...(actor.capabilities.includes("users:write") ? ["HR Manager"] : []),
    ],
    memberships: [
      {
        tenant_id: actor.tenant_id,
        tenant_user_id: actor.user_id,
        employee_id: actor.employee_id,
        roles: [
          "Employee",
          ...(actor.capabilities.includes("leave:approve")
            ? ["Reporting Manager"]
            : []),
          ...(actor.capabilities.includes("users:write") ? ["HR Manager"] : []),
        ],
        status: actor.status,
      },
    ],
    active_tenant_id: actor.tenant_id,
  };
};
