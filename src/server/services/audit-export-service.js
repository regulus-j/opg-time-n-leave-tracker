import { pool } from "../config/database.js";

export const exportAudit = async (req) => {
  const values = [req.tenantId];
  const where = ["a.tenant_id=$1"];
  const add = (sql, value) => { values.push(value); where.push(sql.replace("$VALUE", `$${values.length}`)); };
  if (req.query.q) add("concat_ws(' ',a.action,a.target_type,a.target_id,a.reason) ILIKE $VALUE", `%${String(req.query.q).slice(0, 120)}%`);
  if (req.query.actor_user_id) add("a.actor_user_id=$VALUE", req.query.actor_user_id);
  if (req.query.action) add("a.action=$VALUE", req.query.action);
  if (req.query.target_type) add("a.target_type=$VALUE", req.query.target_type);
  if (req.query.from) add("a.occurred_at >= $VALUE::date", req.query.from);
  if (req.query.to) add("a.occurred_at < ($VALUE::date + interval '1 day')", req.query.to);
  const direction = String(req.query.direction).toLowerCase() === "asc" ? "ASC" : "DESC";
  const result = await pool.query(`SELECT a.event_id,a.occurred_at,a.actor_user_id,u.display_name AS actor,a.action,a.target_type,a.target_id,a.reason,a.metadata FROM audit_events a LEFT JOIN users u ON u.tenant_id=a.tenant_id AND u.user_id=a.actor_user_id WHERE ${where.join(" AND ")} ORDER BY a.occurred_at ${direction},a.event_id ASC`, values);
  return result.rows;
};
