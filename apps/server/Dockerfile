FROM oven/bun:1 AS base

# Install necessary tools for node-gyp and nodejs
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 build-essential curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

WORKDIR /app

# Copy the entire monorepo
COPY . .

# Install dependencies using bun
RUN bun install --frozen-lockfile



# Build the server app
RUN bun run turbo build --filter=server...

# Run stage
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Copy built monorepo
COPY --from=base /app /app

CMD ["bun", "run", "--cwd", "apps/server", "start"]
