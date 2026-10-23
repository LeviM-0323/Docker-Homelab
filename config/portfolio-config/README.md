# Personal website

The Next.js application serves `levimclean.world` through the Compose-managed
nginx-proxy and Let's Encrypt services. The PHP site is no longer routed through
the public proxy. Account, email, and Energy Shop features have not been
migrated and are unavailable from the new site.

## Start the site

From the repository root, rebuild and start the proxy and portfolio services:

```sh
docker compose up --build -d nginx nginx-proxy acme-companion portfolio
```

Once DNS for `levimclean.world` points to this server and the services are
healthy, open `https://levimclean.world`. Check readiness on the Docker host:

```sh
curl --fail --header 'Host: levimclean.world' http://127.0.0.1/api/health
```

Compose reports container readiness from `/api/health`. The application does
not yet use a database or send email.

## Local development

Use Node.js 20.9 or newer:

```sh
npm ci
npm run dev
```

## HTTP acceptance tests

From this directory, run:

```sh
npm run test:e2e
```

The test command starts a one-off app with the `portfolio-test` Compose profile.
It provisions a disposable MySQL database and Mailpit SMTP sink on a private
Docker network, runs the HTTP tests inside the app container, then removes the
test containers. The test app has no published host port and is not attached to
the production proxy or database network. Test database credentials are
local-only placeholders; the mail sink cannot send to real recipients.

At this foundation stage, the checks cover the public health response and
server-rendered homepage. Later account and mail features can exercise their
behavior through the same isolated database and mail sink.
