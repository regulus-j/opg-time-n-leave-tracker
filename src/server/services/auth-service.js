import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { HttpError } from "../views/problem-view.js";

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
