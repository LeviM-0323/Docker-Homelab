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
