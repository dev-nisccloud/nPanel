FROM oven/bun:1

# Native addons (ssh2 optional deps) need a compiler at install time
RUN echo 'Acquire::Retries "5";' > /etc/apt/apt.conf.d/80-retries && \
    apt-get update -qq && \
    apt-get install -y --no-install-recommends python-is-python3 build-essential && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install the full monorepo (workspace packages + server deps). Running TS from
# source avoids bun build externals (ssh2, cpu-features) and broken .bun symlinks
# when copying a slim runner image.
COPY . .
RUN bun install --frozen-lockfile

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

EXPOSE 8080

# Same entry as local dev (`bun run src/index.ts` from apps/server)
WORKDIR /app/apps/server
CMD ["bun", "src/index.ts"]
