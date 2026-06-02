FROM oven/bun:1 AS base

# Install necessary tools for node-gyp and nodejs
# Configure apt retries to handle transient mirror sync issues
RUN echo 'Acquire::Retries "5";' > /etc/apt/apt.conf.d/80-retries && \
    apt-get update -qq && \
    apt-get install -y --no-install-recommends python-is-python3 build-essential curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

# Symlink bun as npm so react-email CLI (which internally calls `npm install`) works
RUN ln -sf /usr/local/bin/bun /usr/local/bin/npm

WORKDIR /app

# Copy the entire monorepo
COPY . .

# Install dependencies using bun
RUN bun install --frozen-lockfile

# Run stage — only ship files needed to run the Hono/Bun server.
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Top-level workspace manifests & node_modules
COPY --from=base /app/package.json /app/bun.lock* ./
COPY --from=base /app/node_modules ./node_modules

# Server app source
COPY --from=base /app/apps/server/package.json ./apps/server/package.json
COPY --from=base /app/apps/server/src ./apps/server/src

# Workspace packages the server imports at runtime
COPY --from=base /app/packages ./packages

CMD ["bun", "run", "--cwd", "apps/server", "start"]
