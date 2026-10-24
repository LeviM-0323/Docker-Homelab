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

test("staged homepage preserves Levi's identity in a usable portfolio", async () => {
  const response = await fetch(`${baseUrl}/`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);

  const html = await response.text();
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>Levi McLean — Projects &amp; Experiments<\/title>/);
  assert.match(
    html,
    /<meta name="description" content="A personal corner of the internet for Levi McLean: projects, tinkering, and notes\."\s*\/?>/,
  );
  assert.match(html, /<main(?:\s|>)/);
  assert.match(
    html,
    /<h1[^>]*>Curious by nature\. Building things to find out\.<\/h1>/,
  );
  assert.match(html, /<img[^>]+alt="McLean V1 logo"/);
  assert.match(html, /<nav[^>]+aria-label="Main navigation"/);
  assert.match(html, /href="#about"/);
  assert.match(html, /href="#toolbox"/);
  assert.match(html, /href="#workbench"/);
  assert.match(html, /id="about"/);
  assert.match(html, /id="toolbox"/);
  assert.match(html, /id="workbench"/);
  assert.match(html, /Fanshawe/);
  assert.match(html, /Python/);
  assert.match(html, /Docker/);
  assert.match(html, /href="mailto:levi@levimclean\.tech"/);
  assert.match(html, /href="https:\/\/github\.com\/LeviM-0323"/);
  assert.match(html, /href="\/contact\.php"/);
  assert.match(html, /href="\/resume\.php"/);
  assert.match(html, /href="\/resume\/Levi_McLean_Resume\.docx"/);
  assert.match(html, /download=""/);
});

test("the public resume download is served over HTTP", async () => {
  const response = await fetch(
    `${baseUrl}/resume/Levi_McLean_Resume.docx`,
    { method: "HEAD" },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document/,
  );
});

test("the established contact page is available over HTTP", async () => {
  const response = await fetch(`${baseUrl}/contact.php`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);

  const html = await response.text();
  assert.match(html, /<title>Contact Levi McLean<\/title>/);
  assert.match(html, /<h1[^>]*>Contact Information<\/h1>/);
  assert.match(html, /<nav[^>]+aria-label="Page navigation"/);
  assert.match(html, /href="tel:\+15195351398"/);
  assert.match(html, /href="mailto:levi@levimclean\.tech"/);
  assert.match(html, /href="https:\/\/github\.com\/LeviM-0323"/);
});

test("the established resume page is available over HTTP", async () => {
  const response = await fetch(`${baseUrl}/resume.php`);

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);

  const html = await response.text();
  assert.match(html, /<title>Resume — Levi McLean<\/title>/);
  assert.match(html, /<h1[^>]*>Resume<\/h1>/);
  assert.match(html, /Software Developer \/ Internet Applications Developer/);
  assert.match(html, /Why hire me\?/);
  assert.match(html, /References available upon request\./);
  assert.match(html, /href="\/resume\/Levi_McLean_Resume\.docx"/);
  assert.match(html, /href="\/contact\.php"/);
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
