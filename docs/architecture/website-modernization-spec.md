# Website Modernization

## Problem Statement

The current website runs as a PHP application served by Nginx. It combines a public portfolio, accounts, administrator pages, email workflows, and service links in one application. The site needs a more maintainable foundation for future features, while preserving its current identity, account data, and behavior.

The current account recovery flow does not show an email verification token step, and shared demo credentials are advertised on the login page. These behaviors need safer replacements as the site is refactored. The existing Energy Shop is a separate PHP application and must continue to work without being included in this migration.

## Solution

Replace the main PHP website in phases with a server-rendered Next.js/React application that includes its Node.js API, uses the existing MySQL database, and runs in Docker Compose behind the existing Nginx/nginx-proxy infrastructure.

The new site will provide a public, search-engine-friendly portfolio and preserve the current signed-in user and administrator capabilities. It will preserve existing accounts where possible, verify new account email addresses, use secure password-reset links, and keep administrator permissions separate from public registration. It will preserve existing email workflows while moving credentials to deployment secrets.

Run the new app alongside PHP for validation. Keep the live routes unchanged until the staging acceptance checks pass. Preserve the existing domain and paths where practical, and continue to serve the separate Energy Shop from PHP.

## User Stories

1. As a public visitor, I want to view a public portfolio page, so that I can learn about the site owner without signing in.
2. As a public visitor, I want public pages to include search-engine metadata and rendered content, so that search engines can index the portfolio.
3. As a public visitor, I want a clear way to reach the contact information and resume, so that I can make contact or review qualifications.
4. As a returning user, I want the site to retain its recognizable content and identity, so that the new site still feels familiar.
5. As a visitor, I want the site to work on mobile and desktop screens, so that I can use it on the device I have.
6. As a visitor using assistive technology, I want accessible page structure, controls, and contrast, so that I can navigate and understand the site.
7. As a prospective user, I want to register with my email address and password, so that I can create an account.
8. As a new user, I want to verify my email address, so that the site can confirm I control the address on my account.
9. As a registered user, I want to sign in with my username or email and password, so that I can access my account.
10. As a signed-in user, I want my session to be handled securely, so that another person cannot use my account from an untrusted browser.
11. As a signed-in user, I want to reach my personal homepage, so that I can use the existing member experience.
12. As a signed-in user, I want to update my account details, so that my account information stays current.
13. As a signed-in user, I want to delete my account after confirming my password, so that I can remove my account intentionally.
14. As a user who cannot sign in, I want to request a password-reset link by email, so that I can regain access without exposing my password.
15. As a user resetting a password, I want a reset link to expire and work only once, so that a stolen or reused link cannot change my password later.
16. As an existing user, I want my account record and usable password hash preserved during migration, so that I can continue to sign in without creating a new account.
17. As an existing user whose password hash cannot be validated by the new app, I want a secure reset path, so that I can regain access without weakening password security.
18. As an existing user, I want my current email address treated as verified during the migration, so that I do not lose access solely because the legacy database lacks a verification field.
19. As an administrator, I want administrator access assigned only to confirmed administrator accounts, so that public registration cannot grant elevated permissions.
20. As an administrator, I want to view and manage user accounts, so that I can administer the existing site community.
21. As an administrator, I want to view the current service and documentation links, so that I can continue to reach the resources linked from the admin area.
22. As a site visitor, I want to submit the existing contact form, so that my message reaches the site owner.
23. As a subscriber, I want to join the mailing list, so that I can receive the existing email updates.
24. As a subscriber, I want my subscription and consent information preserved, so that migration does not discard my existing preference.
25. As an administrator, I want to use the existing mailing workflow, so that I can continue to send messages to subscribers.
26. As an email recipient, I want account verification, password reset, contact, and mailing messages delivered through the existing SMTP provider, so that the migrated site keeps its email capabilities.
27. As an operator, I want SMTP and other credentials supplied through deployment secrets or environment configuration, so that credentials are not stored in application source or exposed to browser code.
28. As a visitor, I want the homepage status endpoint to continue returning its status response, so that existing integrations keep working during the migration.
29. As an operator, I want to run the Node app alongside the PHP site, so that I can validate it without disrupting the live website.
30. As an operator, I want the current public domain and paths preserved where practical, so that visitors and existing links continue to work.
31. As an operator, I want a tested rollback path to PHP, so that I can restore the existing site if the new app fails acceptance checks.
32. As an Energy Shop visitor, I want the existing Energy Shop route to keep working on PHP, so that this separate application is not disrupted by the main-site cutover.
33. As a site owner, I want SMS/email product messaging deferred until after parity, so that the initial migration does not add unconfirmed requirements.
34. As a site owner, I want future interactive project integrations restricted to administrators, so that public users cannot control homelab services.

## Implementation Decisions

- Build the main-site replacement with Next.js and React, using server-rendered public pages for search indexing.
- Keep the Node.js server and API route handlers in the same application initially. Do not split into separate frontend and API services without a concrete need.
- Reuse the existing MySQL database.
- Preserve the current site domain and existing URL paths where practical. Provide redirects for paths that must change.
- Keep first-party email/password authentication. Store session state securely and enforce access checks on the server.
- Model user and administrator authorization explicitly. Public registration must not grant administrator access.
- Require email verification for new accounts. Treat existing account email addresses as verified during migration, as agreed.
- Preserve existing account records and password hashes where compatible. If a legacy hash cannot be validated, require the user to reset the password securely.
- Replace email-only password changes with expiring, single-use reset links. Store only reset-token hashes.
- Retire the shared demo/guest login.
- Migrate the main site's public landing, login, registration, signed-in homepage, contact, resume, account, administrator, mailing, and status experiences.
- Preserve current contact, subscriber, and administrator mailing capabilities. Reuse the existing SMTP provider.
- Move SMTP and other secrets out of application source. Do not send secrets to the browser.
- Preserve subscriber consent information during migration.
- Preserve recognizable branding, content, and imagery while improving layout, typography, responsiveness, and accessibility.
- Add the new application as a Docker Compose service on the existing network. Validate it through the existing proxy infrastructure without changing production PHP routes first.
- Cut over main-site routes only after acceptance checks pass. Keep the Energy Shop route on PHP.
- Keep SMS/email product messaging and interactive project controls out of the initial parity release. Future project integrations are administrator-only.

## Testing Decisions

- Use one high-level end-to-end seam: exercise the staged app over HTTP with a test database and mail sink.
- Tests must verify externally visible behavior, not internal component structure or implementation details.
- Verify that public pages render meaningful content and metadata, and that the login and registration routes behave as specified.
- Verify representative account journeys: successful and failed sign-in, email verification for new registrations, protected-page access, password reset expiry and single use, and account deletion confirmation.
- Verify that ordinary accounts cannot use administrator routes or operations, and that administrator accounts can use their intended capabilities.
- Verify contact and subscriber workflows through the test mail sink; do not send test messages to real users.
- Verify account and subscriber migration against copied test data, including row counts, supported password hashes, and the fallback reset path. Never log passwords or usable tokens.
- Verify that the status endpoint returns its public response.
- Verify the new app can run in Compose behind the proxy without changing the existing production PHP route.
- Verify the Energy Shop route continues to serve its PHP application before and after the main-site cutover.
- Verify the rollback procedure restores the previous PHP routes.
- No existing React or Next.js test suite was found during this exploration. The first app implementation must establish the HTTP-level test harness for this seam.

## Out of Scope

- Migrating or rewriting the separate Energy Shop application.
- Adding SMS messaging or selecting a new messaging provider.
- Designing two-way messaging, notification recipients, consent rules, or messaging workflows.
- Adding interactive controls for homelab projects in the initial parity release.
- Replacing first-party authentication with an external identity provider.
- Rebranding the site or removing recognizable content and identity.
- Cutting over the production website before staging acceptance checks pass.
- Changing the database engine from MySQL.

## Further Notes

- The current PHP website is served by the LinuxServer Nginx service and PHP-FPM. The existing Nginx proxy routes the public domain to that service.
- The current PHP account data uses a `users` table with username, email, and password fields. Confirm actual administrator identities and password-hash formats before planning a production import.
- The current PHP app includes a separate homepage status endpoint, and the Energy Shop has its own PHP routes.
- The existing deployment files have local uncommitted changes. Implementation must inspect and preserve those changes; do not replace whole Compose files or revert unrelated work.
- The issue tracker is GitHub Issues. This specification will also be published there and marked `ready-for-agent`.
