import crypto from "node:crypto";
import { withTransaction } from "../config/database.js";
import { hashPassword } from "./auth-service.js";
import { hrCapabilities, normalizeEmail, normalizeOrganization, normalizeTenantId, provisionTenantDefaults } from "./platform-service.js";
import { HttpError } from "../views/problem-view.js";

const requiredString = (value, field) => {
  if (typeof value !== "string" || !value.trim())
    throw new HttpError(422, "Invalid Request", `${field} is required.`);
  return value.trim();
};

export const registerTenant = async (body) => {
  const tenantId = normalizeTenantId(body?.tenant_id);
  const organization = normalizeOrganization(body);
  const adminName = requiredString(body?.admin?.display_name, "admin.display_name");
  const adminEmail = normalizeEmail(body?.admin?.email, "admin.email");
  const password = body?.admin?.password;
  if (typeof password !== "string" || password.length < 12)
    throw new HttpError(422, "Invalid Password", "admin.password must be at least 12 characters.");

  return withTransaction(async (client) => {
    const ids = await provisionTenantDefaults(client, {
      tenantId,
      organization,
      adminName,
      adminEmail,
      active: true,
    });
    await client.query(
      "INSERT INTO auth_credentials (user_id,tenant_id,email,password_hash) VALUES ($1,$2,$3,$4)",
      [ids.user, tenantId, adminEmail, await hashPassword(password)],
    );
    await client.query(
      `INSERT INTO audit_events
        (event_id,tenant_id,actor_user_id,actor_role,action,target_type,target_id,occurred_at,reason,metadata)
       VALUES ($1,$2,$3,'HR Manager','tenant_registered','Tenant',$2,now(),$4,$5::jsonb)`,
      [crypto.randomUUID(), tenantId, ids.user, "Public organization registration", JSON.stringify({ initial_admin_email: adminEmail })],
    );
    return { tenant_id: tenantId, user_id: ids.user, email: adminEmail };
  });
};
