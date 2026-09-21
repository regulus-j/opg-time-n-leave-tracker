import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const middleware = await readFile(
  "src/server/middleware/authentication.js",
  "utf8",
);
const controller = await readFile(
  "src/server/controllers/auth-controller.js",
  "utf8",
);
const app = await readFile("src/server/app.js", "utf8");
assert.match(
  controller,
  /httpOnly:\s*true/,
  "authentication must use HttpOnly cookies",
);
assert.match(
  middleware,
  /verifyCsrf/,
  "authentication must verify CSRF tokens",
);
assert.match(
  app,
  /application\/problem\+json|problem/,
  "app must register centralized problem handling",
);
assert.doesNotMatch(
  await readFile("database/seeders/seed.js", "utf8"),
  /password\s*[:=]\s*['"]/i,
  "seed passwords must come from environment variables",
);
console.log("Security configuration audit passed.");
