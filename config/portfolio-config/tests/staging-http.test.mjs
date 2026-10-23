import assert from "node:assert/strict";
import test from "node:test";

const baseUrl = "http://127.0.0.1:3000";

test("staged app reports readiness over HTTP", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/json/);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("staged homepage returns a server-rendered document", async () => {
  const response = await fetch(`${baseUrl}/`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);

  const html = await response.text();
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.match(html, /<main(?:\s|>)/);
  assert.match(html, /<h1(?:\s|>)[\s\S]*?<\/h1>/);
});
