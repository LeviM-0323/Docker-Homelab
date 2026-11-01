import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import test from "node:test";

const baseUrl = "http://127.0.0.1:3000";
const accountId = 900000001;
const resetAccountId = 900000002;
const longPasswordAccountId = 900000003;
const username = "auth-fixture";
const email = "auth-fixture@example.test";
const password = "fixture-password-for-tests";
const longPassword = "a".repeat(80);

async function login(identifier, submittedPassword) {
  return fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier, password: submittedPassword }),
  });
}

function sessionCookie(response) {
  const cookie = response.headers.get("set-cookie");
  assert.ok(cookie, "successful login sets a session cookie");
  assert.match(cookie, /^__Host-portfolio_session=/);
  assert.match(cookie, /;\s*HttpOnly/i);
  assert.match(cookie, /;\s*Secure/i);
  assert.match(cookie, /;\s*SameSite=Lax/i);
  assert.match(cookie, /;\s*Path=\//i);
  return cookie.split(";", 1)[0];
}

test("an imported account can sign in by username or email and access its account", async () => {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const passwordHash = await bcrypt.hash(password, 10);
  const longPasswordHash = await bcrypt.hash(longPassword.slice(0, 72), 10);
  const sessionCookies = [];

  try {
    await connection.execute(
      `INSERT INTO legacy_import_accounts
        (legacy_id, username, email, password_hash, email_verified, password_reset_required)
       VALUES (?, ?, ?, ?, 1, 0)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         email = VALUES(email),
         password_hash = VALUES(password_hash),
         email_verified = 1,
         password_reset_required = 0`,
      [accountId, username, email, passwordHash],
    );
    await connection.execute(
      `INSERT INTO legacy_import_accounts
        (legacy_id, username, email, password_hash, email_verified, password_reset_required)
       VALUES (?, ?, ?, ?, 1, 0)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         email = VALUES(email),
         password_hash = VALUES(password_hash),
         email_verified = 1,
         password_reset_required = 0`,
      [
        longPasswordAccountId,
        "long-password-fixture",
        "long-password-fixture@example.test",
        longPasswordHash,
      ],
    );

    for (const identifier of [username, email]) {
      const response = await login(identifier, password);
      assert.equal(response.status, 200);
      sessionCookies.push(sessionCookie(response));

      const accountResponse = await fetch(`${baseUrl}/api/account`, {
        headers: { cookie: sessionCookies.at(-1) },
      });
      assert.equal(accountResponse.status, 200);
      assert.deepEqual(await accountResponse.json(), {
        id: accountId,
        username,
        email,
      });
    }

    const longPasswordResponse = await login(
      "long-password-fixture",
      longPassword,
    );
    assert.equal(longPasswordResponse.status, 200);
    sessionCookies.push(sessionCookie(longPasswordResponse));
    const longPasswordAccount = await fetch(`${baseUrl}/api/account`, {
      headers: { cookie: sessionCookies.at(-1) },
    });
    assert.equal(longPasswordAccount.status, 200);
    assert.equal((await longPasswordAccount.json()).id, longPasswordAccountId);

    const unauthenticated = await fetch(`${baseUrl}/api/account`);
    assert.equal(unauthenticated.status, 401);
  } finally {
    const sessionTable = await connection.query(
      "SHOW TABLES LIKE 'portfolio_sessions'",
    );
    if (sessionTable[0].length > 0) {
      const tokenHashes = sessionCookies.map((cookie) =>
        createHash("sha256").update(cookie.split("=")[1]).digest("hex"),
      );
      if (tokenHashes.length > 0) {
        await connection.query(
          "DELETE FROM portfolio_sessions WHERE token_hash IN (?)",
          [tokenHashes],
        );
      }
    }
    await connection.execute(
      "DELETE FROM legacy_import_accounts WHERE legacy_id IN (?, ?, ?)",
      [accountId, resetAccountId, longPasswordAccountId],
    );
    await connection.end();
  }
});

test("invalid and reset-required credentials fail without revealing which value was wrong", async () => {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await connection.execute(
      `INSERT INTO legacy_import_accounts
        (legacy_id, username, email, password_hash, email_verified, password_reset_required)
       VALUES (?, ?, ?, ?, 1, 1)
       ON DUPLICATE KEY UPDATE
         username = VALUES(username),
         email = VALUES(email),
         password_hash = VALUES(password_hash),
         email_verified = 1,
         password_reset_required = 1`,
      [resetAccountId, "reset-fixture", "reset-fixture@example.test", passwordHash],
    );

    const wrongPassword = await login(username, "not-the-password");
    const unknownUser = await login("not-an-account", password);
    const resetRequired = await login("reset-fixture", password);
    const responses = [wrongPassword, unknownUser, resetRequired];
    const bodies = [];

    for (const response of responses) {
      assert.equal(response.status, 401);
      assert.equal(response.headers.get("set-cookie"), null);
      bodies.push(await response.json());
    }

    assert.deepEqual(bodies[0], bodies[1]);
    assert.deepEqual(bodies[1], bodies[2]);
    const denied = await fetch(`${baseUrl}/api/account`);
    assert.equal(denied.status, 401);
  } finally {
    await connection.execute(
      "DELETE FROM legacy_import_accounts WHERE legacy_id IN (?, ?)",
      [accountId, resetAccountId],
    );
    await connection.end();
  }
});
