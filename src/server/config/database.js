import pg from "pg";
import "dotenv/config";

const { Pool } = pg;
const sslCa = process.env.DB_SSL_CA_BASE64
  ? Buffer.from(process.env.DB_SSL_CA_BASE64, "base64").toString("utf8")
  : process.env.DB_SSL_CA?.replaceAll("\\n", "\n");
pg.types.setTypeParser(1700, (value) => Number(value));
pg.types.setTypeParser(1082, (value) => value);
pg.types.setTypeParser(1114, (value) => `${value.replace(" ", "T")}Z`);
pg.types.setTypeParser(1184, (value) => new Date(value).toISOString());
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX || 10),
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
  statement_timeout: Number(process.env.DB_STATEMENT_TIMEOUT_MS || 15000),
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
          ...(sslCa ? { ca: sslCa } : {}),
        }
      : undefined,
});

export const withTransaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const closePool = () => pool.end();
