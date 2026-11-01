# Account sign-in

The sign-in flow uses records in `legacy_import_accounts`. It accepts a
username or email address and a PHP-compatible bcrypt password hash. Accounts
with unsupported hashes, unverified addresses, or `password_reset_required`
set cannot sign in.

`POST /api/auth/login` returns the same credential error for an unknown account,
wrong password, and account requiring a reset. Successful sign-in sets a
one-day, HttpOnly, SameSite=Lax session cookie. Production cookies use the
`__Host-` prefix and `Secure`; the database stores only a SHA-256 digest of the
random session token. `/api/account` and `/account` check the session on the
server for every request.

Set `PORTFOLIO_DATABASE_URL` in the deployment environment to a dedicated
MySQL database URL. The Compose service passes it to the app as
`DATABASE_URL` and connects the app to the private database network. The
database must contain `legacy_import_accounts`; the first sign-in or protected
account request creates `portfolio_sessions`, so the database user also needs
permission to create that table.

The legacy import command remains restricted to the disposable staging
database. Do not point it at production. Production account data and the
production schema must be provisioned through a separately reviewed process
before enabling sign-in there. Do not put database credentials in source
control or use the existing database root account for the app.
