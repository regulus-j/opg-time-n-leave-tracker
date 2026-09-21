import { createApp } from "./app.js";
import { pool } from "./config/database.js";

const port = Number(process.env.PORT || 3000);
const app = createApp();
const server = app.listen(port, () =>
  console.log(`Backend listening on ${port}`),
);

const shutdown = async () => {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
