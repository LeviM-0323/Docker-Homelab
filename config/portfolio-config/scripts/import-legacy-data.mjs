import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";

class ImportError extends Error {}

const accountTable = `
  CREATE TABLE IF NOT EXISTS legacy_import_accounts (
    legacy_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    username VARCHAR(191) NOT NULL,
    email VARCHAR(320) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified TINYINT UNSIGNED NOT NULL,
    password_reset_required TINYINT UNSIGNED NOT NULL
  )
`;

const subscriberTable = `
  CREATE TABLE IF NOT EXISTS legacy_import_subscribers (
    source_line INT UNSIGNED NOT NULL PRIMARY KEY,
    email VARCHAR(320) NOT NULL,
    consent_status VARCHAR(16) NOT NULL,
    consent_at DATETIME NULL
  )
`;

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateSnapshot(snapshot) {
  if (
    !snapshot ||
    !Array.isArray(snapshot.accounts) ||
    !Array.isArray(snapshot.subscribers)
  ) {
    throw new ImportError("Snapshot must contain accounts and subscribers arrays.");
  }

  const accountIds = new Set();
  for (const [index, account] of snapshot.accounts.entries()) {
    if (
      !Number.isSafeInteger(account?.id) ||
      account.id < 1 ||
      typeof account.username !== "string" ||
      account.username.length === 0 ||
      typeof account.email !== "string" ||
      !isValidEmail(account.email) ||
      typeof account.password !== "string"
    ) {
      throw new ImportError(`Account record ${index + 1} is invalid.`);
    }
    if (accountIds.has(account.id)) {
      throw new ImportError(
        `Account record ${index + 1} duplicates an account ID.`,
      );
    }
    accountIds.add(account.id);
  }

  for (const [index, email] of snapshot.subscribers.entries()) {
    if (typeof email !== "string" || !isValidEmail(email)) {
      throw new ImportError(`Subscriber record ${index + 1} is invalid.`);
    }
  }
}

function supportsLegacyPasswordHash(passwordHash) {
  return /^\$2[aby]\$(?:0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/.test(
    passwordHash,
  );
}

function validateStagingDatabase(databaseUrl) {
  let parsedUrl;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new ImportError("DATABASE_URL is not a valid MySQL URL.");
  }

  if (
    parsedUrl.protocol !== "mysql:" ||
    parsedUrl.hostname !== "portfolio-test-db" ||
    parsedUrl.port !== "3306" ||
    parsedUrl.pathname !== "/portfolio_test"
  ) {
    throw new ImportError(
      "Legacy imports are restricted to the disposable staging database.",
    );
  }
}

async function readSnapshot(snapshotPath) {
  const contents = await readFile(snapshotPath, "utf8");
  const snapshot = JSON.parse(contents);
  validateSnapshot(snapshot);
  return snapshot;
}

async function replaceImportedData(connection, snapshot) {
  await connection.execute(accountTable);
  await connection.execute(subscriberTable);
  await connection.beginTransaction();

  try {
    await connection.execute("DELETE FROM legacy_import_accounts");
    await connection.execute("DELETE FROM legacy_import_subscribers");

    if (snapshot.accounts.length > 0) {
      await connection.query(
        `INSERT INTO legacy_import_accounts
          (legacy_id, username, email, password_hash, email_verified, password_reset_required)
         VALUES ?`,
        [
          snapshot.accounts.map((account) => [
            account.id,
            account.username,
            account.email,
            account.password,
            1,
            supportsLegacyPasswordHash(account.password) ? 0 : 1,
          ]),
        ],
      );
    }

    if (snapshot.subscribers.length > 0) {
      await connection.query(
        `INSERT INTO legacy_import_subscribers
          (source_line, email, consent_status, consent_at)
         VALUES ?`,
        [
          snapshot.subscribers.map((email, index) => [
            index + 1,
            email,
            "unknown",
            null,
          ]),
        ],
      );
    }

    const [[{ accountCount }]] = await connection.query(
      "SELECT COUNT(*) AS accountCount FROM legacy_import_accounts",
    );
    const [[{ subscriberCount }]] = await connection.query(
      "SELECT COUNT(*) AS subscriberCount FROM legacy_import_subscribers",
    );

    if (
      Number(accountCount) !== snapshot.accounts.length ||
      Number(subscriberCount) !== snapshot.subscribers.length
    ) {
      throw new ImportError("Imported row counts do not match the snapshot.");
    }

    await connection.commit();
    return {
      accounts: {
        source: snapshot.accounts.length,
        imported: Number(accountCount),
        supportedHashes: snapshot.accounts.filter((account) =>
          supportsLegacyPasswordHash(account.password),
        ).length,
        resetRequired: snapshot.accounts.filter(
          (account) => !supportsLegacyPasswordHash(account.password),
        ).length,
      },
      subscribers: {
        source: snapshot.subscribers.length,
        imported: Number(subscriberCount),
        consentUnknown: snapshot.subscribers.length,
      },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

async function main() {
  const snapshotPath = process.argv[2];
  if (!snapshotPath || process.argv.length !== 3) {
    throw new ImportError("Provide one copied snapshot JSON file.");
  }

  if (!process.env.DATABASE_URL) {
    throw new ImportError("DATABASE_URL is required.");
  }

  validateStagingDatabase(process.env.DATABASE_URL);
  const snapshot = await readSnapshot(snapshotPath);
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    const report = await replaceImportedData(connection, snapshot);
    process.stdout.write(`${JSON.stringify(report)}\n`);
  } finally {
    await connection.end();
  }
}

function describeSafeFailure(error) {
  if (error instanceof ImportError) {
    return error.message;
  }
  if (error instanceof SyntaxError) {
    return "Snapshot JSON could not be parsed.";
  }
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return `File or database operation failed (${error.code}).`;
  }
  return "An unexpected file or database error occurred.";
}

main().catch((error) => {
  console.error(
    `Legacy import failed: ${describeSafeFailure(error)} Source fields and credentials were not logged.`,
  );
  process.exitCode = 1;
});
