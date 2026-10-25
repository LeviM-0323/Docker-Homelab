FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime-base
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

FROM runtime-base AS test-runner
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/mysql2 ./node_modules/mysql2
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/aws-ssl-profiles ./node_modules/aws-ssl-profiles
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/generate-function ./node_modules/generate-function
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/iconv-lite ./node_modules/iconv-lite
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/is-property ./node_modules/is-property
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/long ./node_modules/long
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/lru.min ./node_modules/lru.min
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/named-placeholders ./node_modules/named-placeholders
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sql-escaper ./node_modules/sql-escaper
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/safer-buffer ./node_modules/safer-buffer
CMD ["node", "server.js"]

FROM runtime-base AS runner
CMD ["node", "server.js"]
