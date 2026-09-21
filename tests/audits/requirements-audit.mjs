import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const required = [
  ".agent/instructions/schema.json",
  "database/migrations/001_initial_schema.sql",
  "database/migrations/002_auth_credentials.sql",
  "database/seeders/seed.js",
  "src/client/lib/api.ts",
  "src/server/controllers/auth-controller.js",
  "src/server/models/resource-model.js",
  "src/server/services/resource-service.js",
];
await Promise.all(required.map((file) => access(file)));
const sources = await Promise.all(
  [
    "README.md",
    "BACKEND_REQUIREMENTS.md",
    "src/server/app.js",
    "src/server/validation/schema-validator.js",
    "src/client/app.jsx",
  ].map((file) => readFile(file, "utf8")),
);
const requirementDocument = await readFile(".agents/requirements.md", "utf8");
const requirementIds = new Set(
  [...requirementDocument.matchAll(/\b[A-Z]+(?:-[A-Z]+)*-\d{3}\b/g)].map(
    (match) => match[0],
  ),
);
assert.ok(
  requirementIds.size >= 150,
  `expected the complete requirements catalog, found ${requirementIds.size} IDs`,
);
assert.doesNotMatch(
  sources.join("\n"),
  /src\/(app\.jsx|components\/|domain\/|lib\/)/,
  "legacy root src paths remain",
);
assert.doesNotMatch(
  sources.join("\n"),
  /serviceWorker|navigator\.serviceWorker/,
  "stale service-worker behavior remains",
);
assert.doesNotMatch(
  sources.join("\n"),
  /TODO|FIXME/,
  "unfinished stubs remain",
);
assert.doesNotMatch(
  sources[3],
  /fieldSets|permissive|fallback/,
  "schema validator contains a fallback schema",
);
assert.doesNotMatch(
  sources[4],
  /tlt-session-v1|mockData|localStorage.*(leave|attendance|employee)/i,
  "client domain data is persisted locally",
);
console.log("Requirements and stale-reference audit passed.");
