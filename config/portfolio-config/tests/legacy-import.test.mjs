import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mysql from "mysql2/promise";
import test from "node:test";

test("a copied legacy snapshot imports safely and repeatably", async () => {
  const supportedHash = `$2y$10$${"a".repeat(53)}`;
  const unsupportedHash = "legacy-hash-format-not-supported";
  const snapshot = {
    accounts: [
      {
        id: 41,
        username: "sample-member",
        email: "member@example.test",
        password: supportedHash,
      },
      {
        id: 42,
        username: "sample-legacy",
        email: "legacy@example.test",
        password: unsupportedHash,
      },
      {
        id: 43,
        username: "sample-empty-hash",
        email: "empty@example.test",
        password: "",
      },
    ],
    subscribers: ["reader@example.test", "updates@example.test"],
  };
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "portfolio-import-"));
  const snapshotPath = join(temporaryDirectory, "copied-data.json");
  writeFileSync(snapshotPath, JSON.stringify(snapshot));

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  function runImport() {
    const result = spawnSync(
      "npm",
      ["--silent", "run", "import:legacy", "--", snapshotPath],
      { encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    assert.doesNotMatch(result.stdout, /member@example\.test|legacy@example\.test/);
    assert.doesNotMatch(result.stdout, /reader@example\.test|updates@example\.test/);
    assert.doesNotMatch(result.stdout, /2y\$10|legacy-hash-format-not-supported/);
    return JSON.parse(result.stdout);
  }

  try {
    const firstRun = runImport();
    const secondRun = runImport();

    assert.deepEqual(firstRun, {
      accounts: { source: 3, imported: 3, supportedHashes: 1, resetRequired: 2 },
      subscribers: { source: 2, imported: 2, consentUnknown: 2 },
    });
    assert.deepEqual(secondRun, firstRun);

    const [accounts] = await connection.query(
      "SELECT legacy_id, username, email, password_hash, email_verified, password_reset_required FROM legacy_import_accounts ORDER BY legacy_id",
    );
    assert.deepEqual(
      accounts.map(
        ({
          legacy_id,
          username,
          email,
          email_verified,
          password_reset_required,
        }) => ({
          legacy_id,
          username,
          email,
          email_verified,
          password_reset_required,
        }),
      ),
      [
        {
          legacy_id: 41,
          username: "sample-member",
          email: "member@example.test",
          email_verified: 1,
          password_reset_required: 0,
        },
        {
          legacy_id: 42,
          username: "sample-legacy",
          email: "legacy@example.test",
          email_verified: 1,
          password_reset_required: 1,
        },
        {
          legacy_id: 43,
          username: "sample-empty-hash",
          email: "empty@example.test",
          email_verified: 1,
          password_reset_required: 1,
        },
      ],
    );
    assert.ok(
      accounts[0].password_hash === supportedHash,
      "supported legacy password hash is preserved",
    );
    assert.ok(
      accounts[1].password_hash === unsupportedHash,
      "unsupported legacy password hash is preserved for reset",
    );
    assert.ok(accounts[2].password_hash === "", "empty legacy hash requires reset");

    const [subscribers] = await connection.query(
      "SELECT source_line, email, consent_status, consent_at FROM legacy_import_subscribers ORDER BY source_line",
    );
    assert.deepEqual(subscribers, [
      {
        source_line: 1,
        email: "reader@example.test",
        consent_status: "unknown",
        consent_at: null,
      },
      {
        source_line: 2,
        email: "updates@example.test",
        consent_status: "unknown",
        consent_at: null,
      },
    ]);
  } finally {
    await connection.end();
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("a copied snapshot cannot be imported into a non-staging database", () => {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "portfolio-import-"));
  const snapshotPath = join(temporaryDirectory, "copied-data.json");
  const marker = "synthetic-secret-marker";
  writeFileSync(
    snapshotPath,
    JSON.stringify({
      accounts: [
        {
          id: 51,
          username: "sample-member",
          email: "member@example.test",
          password: marker,
        },
      ],
      subscribers: [],
    }),
  );

  try {
    const result = spawnSync(
      "npm",
      ["--silent", "run", "import:legacy", "--", snapshotPath],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          DATABASE_URL: "mysql://fixture:fixture@localhost:3306/production",
        },
      },
    );

    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Source fields and credentials were not logged/);
    assert.doesNotMatch(result.stderr, /member@example\.test|synthetic-secret-marker/);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});
