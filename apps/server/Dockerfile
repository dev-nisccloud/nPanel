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

# ssh2 is only declared in apps/server/package.json. Bun may install it under
# apps/server/node_modules instead of the repo root, but the bundle loads
# externals from /app/node_modules (where server.js lives in the runner stage).
RUN if [ ! -e node_modules/ssh2/package.json ]; then \
      if [ -e apps/server/node_modules/ssh2/package.json ]; then \
        mkdir -p node_modules && cp -a apps/server/node_modules/ssh2 node_modules/ssh2; \
      else \
        echo "ERROR: ssh2 not found after bun install" && exit 1; \
      fi; \
    fi

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

# Fail the image build if externals required at runtime are missing
RUN test -e node_modules/ssh2/package.json

EXPOSE 8080

CMD ["bun", "run", "server.js"]
