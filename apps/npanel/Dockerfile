
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

# Build the project
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_PLESK_HOST="orion.nisccloud.com"
ENV NODE_ENV=production
ENV DOCKER_BUILD=true
# Skip env validation during build to prevent failures due to missing runtime secrets
ENV SKIP_ENV_VALIDATION=1
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

ENV HOSTNAME="0.0.0.0"

# In standalone mode, Next.js generates a server.js in the root of the output
CMD ["node", "server.js"]
