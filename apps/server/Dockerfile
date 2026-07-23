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

# Full monorepo: workspace packages are TypeScript and resolved at runtime by Bun.
COPY . .
# --ignore-scripts: skip optional native ssh2 addons (cpu-features/buildcheck).
# ssh2 still works at runtime without them.
RUN bun install --frozen-lockfile --ignore-scripts

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

EXPOSE 8080

WORKDIR /app/apps/server
CMD ["bun", "src/index.ts"]
