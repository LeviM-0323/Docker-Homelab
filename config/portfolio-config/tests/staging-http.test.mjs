import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createConnection } from "node:net";
import { createInterface } from "node:readline";
import test from "node:test";

const baseUrl = "http://127.0.0.1:3000";

test("staged app reports readiness over HTTP", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /application\/json/);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("staged homepage returns meaningful rendered content and metadata", async () => {
  const response = await fetch(`${baseUrl}/`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);

  const html = await response.text();
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>Levi McLean<\/title>/);
  assert.match(
    html,
    /<meta name="description" content="The personal website of Levi McLean\."\s*\/?>/,
  );
  assert.match(html, /<main(?:\s|>)/);
  assert.match(
    html,
    /<h1(?:\s|>)A new home for my projects\.<\/h1>/,
  );
});

test("staging SMTP delivers only to the isolated Mailpit sink", async () => {
  const subject = `portfolio-test-${randomUUID()}`;
  const socket = createConnection({ host: "portfolio-mailpit", port: 1025 });
  const lines = createInterface({ input: socket });
  const replies = lines[Symbol.asyncIterator]();
  socket.setTimeout(10_000, () => {
    socket.destroy(new Error("Timed out talking to the staging mail sink"));
  });

  async function readReply(expectedCode) {
    let replyCode;

    while (true) {
      const { value, done } = await replies.next();
      assert.equal(done, false, "Mailpit closed the SMTP connection");
      const match = value.match(/^(\d{3})([- ])(.*)$/);
      assert.ok(match, `Unexpected SMTP response: ${value}`);
      replyCode ??= match[1];
      assert.equal(match[1], replyCode);

      if (match[2] === " ") {
        assert.equal(replyCode, String(expectedCode), value);
        return;
      }
    }
  }

  try {
    await new Promise((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
    });
    await readReply(220);
    socket.write("EHLO portfolio-test.local\r\n");
    await readReply(250);
    socket.write("MAIL FROM:<sender@portfolio.invalid>\r\n");
    await readReply(250);
    socket.write("RCPT TO:<recipient@example.test>\r\n");
    await readReply(250);
    socket.write("DATA\r\n");
    await readReply(354);
    socket.write(
      `From: sender@portfolio.invalid\r\nTo: recipient@example.test\r\nSubject: ${subject}\r\n\r\nIsolated test message.\r\n.\r\n`,
    );
    await readReply(250);
    socket.write("QUIT\r\n");
    await readReply(221);
  } finally {
    lines.close();
    socket.destroy();
  }

  const response = await fetch("http://portfolio-mailpit:8025/api/v1/messages");
  assert.equal(response.status, 200);
  assert.match(await response.text(), new RegExp(subject));
});
