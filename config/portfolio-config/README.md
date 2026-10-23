# Portfolio preview

This is the first Next.js foundation for the website modernization. It is
intentionally separate from the PHP site: the existing public routes and the
Energy Shop are not changed.

## Run beside PHP

From the repository root, start the preview with the existing Compose stack:

```sh
docker compose -f docker-compose.yml -f docker-compose.portfolio.yml up --build -d portfolio
```

The default preview hostname is `portfolio-preview.localhost`. On the Docker
host, open `http://portfolio-preview.localhost` or check the health endpoint:

```sh
curl --fail --header 'Host: portfolio-preview.localhost' http://127.0.0.1/api/health
```

For a staging hostname that resolves to this server, set
`PORTFOLIO_STAGING_HOST` in the environment before starting Compose. The default
`.localhost` hostname is intended for local preview only.

Compose reports container readiness from `/api/health`. The application has no
database connection, mail credentials, or other secrets at this stage.

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
