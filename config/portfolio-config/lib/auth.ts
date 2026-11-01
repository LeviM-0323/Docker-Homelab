import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { createPool, type Pool, type RowDataPacket } from "mysql2/promise";

const sessionLifetimeSeconds = 60 * 60 * 24;
const sessionTable = `
  CREATE TABLE IF NOT EXISTS portfolio_sessions (
    token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
    legacy_id BIGINT UNSIGNED NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX portfolio_sessions_expires_at (expires_at)
  )
`;

interface LegacyAccount extends RowDataPacket {
  legacy_id: number;
  username: string;
  email: string;
  password_hash: string;
  email_verified: number;
  password_reset_required: number;
}

interface AuthenticatedAccount extends RowDataPacket {
  legacy_id: number;
  username: string;
  email: string;
}

let pool: Pool | undefined;
let sessionSchemaReady: Promise<void> | undefined;
let dummyPasswordHash: Promise<string> | undefined;

export interface PublicAccount {
  id: number;
  username: string;
  email: string;
}

export function getSessionCookieName() {
  return process.env.NODE_ENV === "production"
    ? "__Host-portfolio_session"
    : "portfolio_session";
}

export function getSessionLifetimeSeconds() {
  return sessionLifetimeSeconds;
}

function getPool() {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required for authentication.");
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(databaseUrl);
    } catch {
      throw new Error("DATABASE_URL is not a valid MySQL URL.");
    }

    if (parsedUrl.protocol !== "mysql:" || !parsedUrl.hostname) {
      throw new Error("DATABASE_URL must identify a MySQL database.");
    }

    pool = createPool({
      uri: databaseUrl,
      connectionLimit: 5,
      waitForConnections: true,
      queueLimit: 10,
    });
  }

  return pool;
}

async function ensureSessionTable() {
  sessionSchemaReady ??= getPool()
    .execute(sessionTable)
    .then(() => undefined)
    .catch((error: unknown) => {
      sessionSchemaReady = undefined;
      throw error;
    });
  await sessionSchemaReady;
}

function isSupportedPasswordHash(value: string) {
  return /^\$2[aby]\$(?:0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/.test(value);
}

function getDummyPasswordHash() {
  dummyPasswordHash ??= bcrypt.hash(randomBytes(32).toString("hex"), 10);
  return dummyPasswordHash;
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function authenticate(identifier: string, password: string) {
  const database = getPool();
  const [accounts] = await database.execute<LegacyAccount[]>(
    `SELECT legacy_id, username, email, password_hash, email_verified, password_reset_required
       FROM legacy_import_accounts
      WHERE username = ? OR email = ?
      LIMIT 2`,
    [identifier, identifier],
  );
  const account = accounts.length === 1 ? accounts[0] : undefined;
  const validHash =
    account && isSupportedPasswordHash(account.password_hash)
      ? account.password_hash.replace(/^\$2y\$/, "$2b$")
      : await getDummyPasswordHash();
  const passwordMatches =
    Buffer.byteLength(password, "utf8") <= 72 &&
    (await bcrypt.compare(password, validHash));

  if (
    !account ||
    !isSupportedPasswordHash(account.password_hash) ||
    account.email_verified !== 1 ||
    account.password_reset_required !== 0 ||
    !passwordMatches
  ) {
    return null;
  }

  return {
    id: account.legacy_id,
    username: account.username,
    email: account.email,
  } satisfies PublicAccount;
}

export async function createSession(accountId: number) {
  await ensureSessionTable();
  const token = randomBytes(32).toString("base64url");
  await getPool().execute(
    "DELETE FROM portfolio_sessions WHERE expires_at <= UTC_TIMESTAMP(6)",
  );
  await getPool().execute(
    `INSERT INTO portfolio_sessions (token_hash, legacy_id, expires_at)
     VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(6), INTERVAL ? SECOND))`,
    [hashSessionToken(token), accountId, sessionLifetimeSeconds],
  );
  return token;
}

export async function getAuthenticatedAccount(token: string | undefined) {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return null;
  }

  await ensureSessionTable();
  const [accounts] = await getPool().execute<AuthenticatedAccount[]>(
    `SELECT account.legacy_id, account.username, account.email
       FROM portfolio_sessions AS session
       JOIN legacy_import_accounts AS account
         ON account.legacy_id = session.legacy_id
      WHERE session.token_hash = ?
        AND session.expires_at > UTC_TIMESTAMP(6)
        AND account.email_verified = 1
        AND account.password_reset_required = 0
      LIMIT 1`,
    [hashSessionToken(token)],
  );
  const account = accounts[0];

  return account
    ? {
        id: account.legacy_id,
        username: account.username,
        email: account.email,
      } satisfies PublicAccount
    : null;
}

export function serializeSessionCookie(token: string) {
  const cookieName = getSessionCookieName();
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${cookieName}=${token}; Max-Age=${sessionLifetimeSeconds}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}
