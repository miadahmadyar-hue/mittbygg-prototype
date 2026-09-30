import { test } from "node:test";
import assert from "node:assert/strict";

test("parallel AI requests share one anonymous session", async () => {
  const original = globalThis.fetch;
  let sessions = 0;
  const headers = [];
  try {
    globalThis.fetch = async (url, init) => {
      if (String(url).endsWith("/auth/session")) {
        sessions++;
        await new Promise((resolve) => setTimeout(resolve, 5));
        return Response.json({ token: "shared", expires_in: 3600 });
      }
      headers.push(init.headers.get("X-Session-Token"));
      return Response.json({ ok: true });
    };
    const { sessionFetch } = await import("../src/lib/api/session.ts?parallel");
    await Promise.all([sessionFetch("http://example.test/architect", { method: "POST" }), sessionFetch("http://example.test/engineer", { method: "POST" })]);
    assert.equal(sessions, 1);
    assert.deepEqual(headers, ["shared", "shared"]);
  } finally { globalThis.fetch = original; }
});

test("a server restart renews the session and retries only once", async () => {
  const original = globalThis.fetch;
  let sessions = 0, calls = 0;
  try {
    globalThis.fetch = async (url, init) => {
      if (String(url).endsWith("/auth/session")) return Response.json({ token: `token-${++sessions}`, expires_in: 3600 });
      calls++;
      return init.headers.get("X-Session-Token") === "token-1" ? new Response(null, { status: 401 }) : Response.json({ ok: true });
    };
    const { sessionFetch } = await import("../src/lib/api/session.ts?restart");
    const response = await sessionFetch("http://example.test/pdf", { method: "POST", body: "answers" });
    assert.equal(response.status, 200);
    assert.equal(calls, 2);
    assert.equal(sessions, 2);
  } finally { globalThis.fetch = original; }
});

test("a failed session request can be retried", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  try {
    globalThis.fetch = async (url) => {
      if (String(url).endsWith("/auth/session")) {
        if (++calls === 1) throw new Error("offline");
        return Response.json({ token: "recovered", expires_in: 3600 });
      }
      return Response.json({ ok: true });
    };
    const { sessionFetch } = await import("../src/lib/api/session.ts?offline");
    await assert.rejects(sessionFetch("http://example.test/pdf", { method: "POST" }));
    assert.equal((await sessionFetch("http://example.test/pdf", { method: "POST" })).status, 200);
  } finally { globalThis.fetch = original; }
});
