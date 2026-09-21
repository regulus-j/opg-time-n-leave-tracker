import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../../src/server/app.js";

test("protected API fails closed when authentication is not configured", async () => {
  const previous = process.env.AUTH_ADAPTER_MODULE;
  const previousDatabase = process.env.DATABASE_URL;
  delete process.env.AUTH_ADAPTER_MODULE;
  delete process.env.DATABASE_URL;
  const server = createApp().listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/employees`);
    assert.equal(response.status, 503);
    assert.equal(
      response.headers.get("content-type")?.split(";")[0],
      "application/problem+json",
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
    if (previous === undefined) delete process.env.AUTH_ADAPTER_MODULE;
    else process.env.AUTH_ADAPTER_MODULE = previous;
    if (previousDatabase === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabase;
  }
});
