FROM cgr.dev/chainguard/node:latest-dev AS deps
WORKDIR /app
COPY --chown=node:node package.json package-lock.json* ./
RUN npm ci

FROM deps AS build
COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node src ./src
RUN npm run build && npm prune --omit=dev

FROM cgr.dev/chainguard/node:latest AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./package.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD ["node", "-e", "require('http').get('http://127.0.0.1:3000/livez', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]

CMD ["dist/server.js"]
