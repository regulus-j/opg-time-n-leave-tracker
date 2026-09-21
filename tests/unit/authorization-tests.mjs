import assert from "node:assert/strict";
import { launchAuditBrowser, appUrl } from "../support/audit-config.mjs";

const browser = await launchAuditBrowser();
const context = await browser.newContext();
const page = await context.newPage();
await page.goto(appUrl(), { waitUntil: "domcontentloaded" });
await page.getByLabel("Email").fill("readonly@dev.local");
await page
  .getByLabel("Password")
  .fill(process.env.SEED_READONLY_PASSWORD || "Readonly-dev-password-2026!");
await page.getByRole("button", { name: "Sign in" }).click();
await page.getByRole("heading", { name: "Make your time count." }).waitFor();

assert.equal(
  await page.getByRole("button", { name: "Approvals", exact: true }).count(),
  0,
);
assert.equal(
  await page.getByRole("button", { name: "Directory", exact: true }).count(),
  0,
);
const response = await page.evaluate(async () => {
  const csrf =
    document.cookie
      .split("; ")
      .find((item) => item.startsWith("tlt_csrf="))
      ?.split("=")[1] || "";
  const result = await fetch("/api/v1/attendance-sessions/clock-in", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json", "x-csrf-token": csrf },
    body: "{}",
  });
  return {
    status: result.status,
    type: result.headers.get("content-type"),
    body: await result.json(),
  };
});
assert.equal(response.status, 403);
assert.match(response.type, /application\/problem\+json/);
assert.equal(response.body.title, "Forbidden");
assert.ok(response.body.request_id);

console.log("Authorization audit passed.");
await context.close();
await browser.close();
