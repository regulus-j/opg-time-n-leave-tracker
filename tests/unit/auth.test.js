import test from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  issueSession,
  verifySession,
  issueCsrf,
  signCsrf,
  verifyCsrf,
} from "../../src/server/services/auth-service.js";
import { requireCapability } from "../../src/server/middleware/index.js";
import {
  clearLoginRateLimit,
  loginRateLimit,
} from "../../src/server/middleware/login-rate-limit.js";

test("password hashing, JWT sessions, and CSRF signatures reject invalid values", async () => {
  process.env.BCRYPT_ROUNDS = "4";
  process.env.JWT_SECRET = "unit-jwt-secret-that-is-long-enough";
  process.env.CSRF_SECRET = "unit-csrf-secret-that-is-long-enough";
  const hash = await hashPassword("correct horse battery staple");
  assert.notEqual(hash, "correct horse battery staple");
  assert.equal(
    await verifyPassword("correct horse battery staple", hash),
    true,
  );
  assert.equal(await verifyPassword("incorrect", hash), false);
  const token = issueSession({ user_id: "usr-1", tenant_id: "tenant-1" });
  assert.deepEqual(
    {
      sub: verifySession(token).sub,
      tenant_id: verifySession(token).tenant_id,
    },
    { sub: "usr-1", tenant_id: "tenant-1" },
  );
  const csrf = issueCsrf();
  assert.equal(verifyCsrf(signCsrf(csrf), csrf), true);
  assert.equal(verifyCsrf(signCsrf(csrf), `${csrf}x`), false);
});

test("capability middleware fails closed", () => {
  const middleware = requireCapability("leave:approve");
  let failure;
  middleware({ actor: { capabilities: ["leave:write"] } }, {}, (error) => {
    failure = error;
  });
  assert.equal(failure.status, 403);
  failure = undefined;
  middleware({ actor: { capabilities: ["leave:approve"] } }, {}, (error) => {
    failure = error;
  });
  assert.equal(failure, undefined);
});

test("login rate limiter returns 429 after the configured threshold", () => {
  process.env.LOGIN_RATE_MAX = "2";
  const req = { ip: "unit-rate-limit" };
  const res = { set() {} };
  const errors = [];
  loginRateLimit(req, res, (error) => errors.push(error));
  loginRateLimit(req, res, (error) => errors.push(error));
  loginRateLimit(req, res, (error) => errors.push(error));
  assert.equal(errors[0], undefined);
  assert.equal(errors[1], undefined);
  assert.equal(errors[2].status, 429);
  clearLoginRateLimit(req);
  delete process.env.LOGIN_RATE_MAX;
});
