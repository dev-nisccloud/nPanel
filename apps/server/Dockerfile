FROM oven/bun:1 AS base

# Install tools needed for native addons (ssh2/cpu-features, etc.)
RUN echo 'Acquire::Retries "5";' > /etc/apt/apt.conf.d/80-retries && \
    apt-get update -qq && \
    apt-get install -y --no-install-recommends python-is-python3 build-essential curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

# Symlink bun as npm so react-email CLI works
RUN ln -sf /usr/local/bin/bun /usr/local/bin/npm

WORKDIR /app

# Copy the entire monorepo and install dependencies
COPY . .
RUN bun install --frozen-lockfile

# Pre-bundle: transpile all TypeScript (including workspace packages such as
# @npanel/api, @npanel/auth, etc.) into a single JavaScript file.
# npm packages remain external so node_modules is still needed at runtime,
# but there is zero TypeScript transpilation work at cold-start.
#
# ssh2 / cpu-features use a relative require() path to a compiled .node binary
# which Bun's bundler cannot resolve at build time — mark them external so they
# are loaded from node_modules at runtime instead.
RUN bun build \
      --target=bun \
      --external cpu-features \
      --external ssh2 \
      --outfile apps/server/dist/server.js \
      apps/server/src/index.ts

# ssh2 is externalized at bundle time. Bun installs it (and asn1, bcrypt-pbkdf, …)
# as symlinks into .bun/ — COPY --from=base breaks those links in the runner stage.
# Re-install ssh2 with real npm (/usr/bin/npm, not the bun symlink) so the full
# dependency tree is materialized under /app/node_modules.
RUN mkdir -p /runtime-externals && cd /runtime-externals && \
    /usr/bin/npm install ssh2@1.17.0 --omit=dev --no-package-lock && \
    rm -rf /app/node_modules/ssh2 /app/node_modules/asn1 /app/node_modules/bcrypt-pbkdf && \
    cp -a node_modules/. /app/node_modules/ && \
    test -f /app/node_modules/ssh2/package.json && \
    test -f /app/node_modules/asn1/package.json

# ---------------------------------------------------------------------------
# Run stage — ship only the pre-bundled JS + npm node_modules.
# No TypeScript source, no workspace package source needed.
# ---------------------------------------------------------------------------
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# npm packages (drizzle-orm, hono, ssh2, fast-xml-parser, …) and native addons
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules

# Pre-bundled server — all workspace TS already inlined, starts instantly
COPY --from=base /app/apps/server/dist/server.js ./server.js

# Fail the image build if ssh2 externals are missing after COPY
RUN test -f node_modules/ssh2/package.json && test -f node_modules/asn1/package.json

EXPOSE 8080

CMD ["bun", "run", "server.js"]
