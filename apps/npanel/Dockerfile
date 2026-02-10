
FROM node:20-alpine AS base

# This Dockerfile is designed for the monorepo structure
# It uses the turbo build system to prune and build the specific app

FROM base AS pruner
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo
COPY . .
# Prune the workspace for the npanel app
RUN turbo prune --scope=npanel --docker

FROM base AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Install pnpm
RUN npm install -g pnpm

# Copy pruned lockfile and package.json's
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json

# Build the project
ENV NODE_ENV=production
ENV DOCKER_BUILD=true
RUN pnpm turbo run build --filter=npanel...

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/apps/npanel/public ./apps/npanel/public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/npanel/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/npanel/.next/static ./apps/npanel/.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/npanel/server.js"]
