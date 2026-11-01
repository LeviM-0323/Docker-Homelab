# Website Modernization Plan

## Goal

Modernize the main PHP website into a polished, responsive React application while preserving its recognizable identity and existing behavior. The first release should establish a secure, maintainable foundation and reach feature parity before adding larger capabilities.

## Scope

Migrate the main website currently under `config/nginx-config/www`, including:

- A public, search-engine-friendly landing/portfolio experience.
- Registration, login, the signed-in homepage, account updates and deletion.
- Contact and resume pages.
- Admin pages for users and existing service/documentation links.
- Existing contact, subscriber, and admin mailing workflows.
- The homepage status endpoint.

The separate `energyshop/` application is out of scope and remains on PHP at its current route. During and after the main-site cutover, Nginx must continue routing `/energyshop/` to that PHP application.

## Decisions

### Application architecture

- Use Next.js and React for server-rendered public pages and the signed-in experience.
- Keep the Node.js server and API route handlers in the same application initially; split services only if a concrete need emerges.
- Reuse the existing MySQL database rather than introducing a second database engine.
- Preserve the current public domain and existing paths where practical. Add redirects for any paths that must change.

### Accounts and authorization

- Keep first-party email/password authentication and preserve existing accounts.
- Preserve the distinction between ordinary users and administrators. Represent authorization explicitly in the new application; public registration must never grant administrator privileges.
- Trust existing account email addresses as verified during migration. Require email verification for new registrations.
- Preserve existing password hashes when the Node application can validate them. Require a secure password reset for any account whose legacy hash cannot be validated.
- Replace email-only password changes with single-use, expiring reset links. Store reset-token hashes, not usable reset tokens.
- Retire the shared demo/guest login.
- Enforce authentication and authorization on the server for every protected route and operation.

### Email and secrets

- Preserve current contact, subscription, and admin mailing behavior for parity.
- Reuse the current SMTP provider for verification, password recovery, and existing mail workflows.
- Move SMTP and other credentials out of application source and into deployment secrets or environment configuration. Do not expose provider credentials to browser code.
- Preserve subscriber consent information when moving the current subscriber records into managed application storage.

### Visual direction and future capabilities

- Retain recognizable branding, imagery, and content while modernizing layout, typography, spacing, responsiveness, and accessibility.
- Keep current service links, but defer interactive project controls until after the parity release. Any future integrations are administrator-only, with service credentials kept server-side.
- Record SMS/email messaging as a later phase. Choose its provider, recipients, consent rules, and whether it is notification-only or conversational when that feature is designed.

## Target deployment

Add the Node application as a Docker Compose service on the existing network and route it through the current Nginx/nginx-proxy setup. Initially validate it through a non-production host or route while PHP remains available. Cut over the main-site routes only after validation; preserve the PHP route for `/energyshop/`.

## Delivery phases

1. **Baseline and migration design**
   - Record the current main-site routes and expected behavior.
   - Confirm the existing administrator accounts and the legacy password-hash formats.
   - Back up the MySQL data and subscriber records; test a repeatable migration on a copy before production use.
   - Define health checks, staging routing, cutover criteria, and a rollback procedure.
2. **Application foundation**
   - Create the Next.js application and Compose service.
   - Configure the Nginx route, environment/secrets, health checks, and public-page metadata.
   - Establish MySQL access and server-side authorization boundaries.
3. **Accounts and mail**
   - Add secure sessions, registration verification, password recovery, and explicit user/admin roles.
   - Import accounts and subscriber records; verify row counts and account behavior before cutover.
   - Move SMTP configuration to deployment secrets.
4. **Main-site feature parity**
   - Implement the public landing page and existing user, contact, resume, account, admin, mailing, and status experiences.
   - Refresh the visual design while preserving established identity and content.
5. **Validation and cutover**
   - Test public and authenticated routes, authorization, mail delivery, account migration, mobile layouts, and the unchanged Energy Shop route.
   - Switch the main-site routes after acceptance checks pass; retain a tested rollback path to PHP.
6. **Future feature design**
   - Design SMS/email messaging and interactive project integrations as separate work.
   - Keep project integrations administrator-only and introduce them one service/action at a time.

## Cutover checks and risks

- Confirm the administrator identities before assigning roles; never infer admin access from a public signup.
- Test legacy password-hash validation without logging or exposing password data. Accounts with unsupported hashes need the secure reset path.
- Treat database and subscriber migrations as repeatable, backed-up operations; compare source and destination record counts.
- Test SMTP verification and reset messages, including expired and already-used links.
- Verify route precedence so Next.js does not capture `/energyshop/`.
- Keep PHP serving the production site until the new app passes the agreed smoke, authorization, and rollback checks.
