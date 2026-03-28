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



# Accept build arguments and set them as environment variables
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL

# Provide placeholder BETTER_AUTH_SECRET if needed by some build steps
ARG BETTER_AUTH_SECRET="build-time-placeholder-do-not-use-in-production"
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET

# Vite reads .env files at build time — file isn't in git
RUN echo 'VITE_SERVER_URL=https://npanel-server-staging-961768926506.us-east1.run.app' > apps/web/.env

# Build the web app
ENV NODE_OPTIONS="--max-old-space-size=8192"
RUN bun run turbo build --filter=web...

# Run stage
FROM oven/bun:1 AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

COPY --from=base /app /app

CMD ["bun", "run", "--cwd", "apps/web", "start"]
