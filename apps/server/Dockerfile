FROM oven/bun:1.3.4

# Native addons (ssh2 → cpu-features) need a compiler + OpenSSL headers at install time.
RUN echo 'Acquire::Retries "5";' > /etc/apt/apt.conf.d/80-retries && \
    apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      python-is-python3 \
      build-essential \
      libssl-dev \
      pkg-config && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Full monorepo: workspace packages are TypeScript; we pre-bundle the server below.
COPY . .
# --ignore-scripts: skip optional native ssh2 addons (cpu-features/buildcheck).
# ssh2 still works at runtime without them.
RUN bun install --frozen-lockfile --ignore-scripts

# Pre-bundle entrypoints so Cloud Run cold start does not transpile ~5k modules at runtime.
# Native optional deps stay external and resolve from node_modules if present.
WORKDIR /app/apps/server
RUN bun build ./src/index.ts ./src/workers-index.ts \
      --outdir=./dist \
      --target=bun \
      --external cpu-features \
      --external ssh2 \
      --external @serialport/bindings-cpp

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

EXPOSE 8080

CMD ["bun", "run", "dist/index.js"]
