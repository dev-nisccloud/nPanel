
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

# Copy essential root configs that turbo prune might miss
COPY tsconfig.json tsconfig.base.json turbo.json ./

# Install dependencies
# We use --ignore-scripts because some postinstalls might depend on files in 'full'
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY --from=pruner /app/out/full/ .

# Re-run install to trigger postinstalls properly now that 'full' is present
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
# Internal packages like @nPanel/db need the generated client to build
# We include both musl (for Alpine) and debian (for CI runners) to be safe
RUN PRISMA_BINARY_TARGETS='["native", "linux-musl-openssl-3.0.x", "debian-openssl-3.0.x"]' \
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres" \
    pnpm turbo run db:generate --filter=npanel...

# Build the project (same BETTER_AUTH_SECRET fallback as runner stage so build does not warn)
ARG NEXT_PUBLIC_APP_URL
ARG BETTER_AUTH_SECRET=6314f0d045ce9041126b81021bc5123bd51f718ec650ed8aa06f3ffe5ac45558
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV NEXT_PUBLIC_PLESK_HOST="orion.nisccloud.com"
ENV NODE_ENV=production
ENV DOCKER_BUILD=true
# Skip env validation during build to prevent failures due to missing runtime secrets
ENV SKIP_ENV_VALIDATION=1
# Increase memory limit and limit concurrency to prevent OOM errors (API build is memory-heavy)
RUN NODE_OPTIONS="--max-old-space-size=8192" pnpm turbo run build --filter=npanel... --concurrency=1

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

# Ensure Prisma generated client is present at runtime (standalone tracer can miss workspace packages)
RUN mkdir -p node_modules/@nPanel/db/prisma
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/prisma/generated ./node_modules/@nPanel/db/prisma/generated

ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV=production
# Do NOT set PORT here: Cloud Run injects PORT at runtime (default 8080). Hardcoding PORT can conflict with Cloud Run and break the build/deploy.
# Fallback so app doesn't crash when no secret is provided at runtime (Docker warns about ENV secrets—override in production via GCP Secret Manager or -e)
ENV BETTER_AUTH_SECRET="6314f0d045ce9041126b81021bc5123bd51f718ec650ed8aa06f3ffe5ac45558"

# In monorepo standalone mode, the entrypoint is nested in the apps folder
CMD ["node", "apps/npanel/server.js"]
