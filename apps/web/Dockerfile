FROM oven/bun:1 AS base

# Install necessary tools for node-gyp and nodejs
# Configure apt retries to handle transient mirror sync issues
RUN echo 'Acquire::Retries "5";' > /etc/apt/apt.conf.d/80-retries && \
    apt-get update -qq && \
    apt-get install -y --no-install-recommends python-is-python3 build-essential curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the entire monorepo
COPY . .

# Install dependencies using bun
RUN bun install --frozen-lockfile



# Provide placeholder BETTER_AUTH_SECRET if needed by some build steps
ARG BETTER_AUTH_SECRET="build-time-placeholder-do-not-use-in-production"
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET

# Make API origin available to Vite at build time.
# GitHub Actions already passes this as --build-arg VITE_SERVER_URL=...
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL
RUN if [ -z "$VITE_SERVER_URL" ]; then \
      echo "ERROR: VITE_SERVER_URL build arg is required for production web build." >&2; \
      exit 1; \
    fi \
    && case "$VITE_SERVER_URL" in \
      https://*) ;; \
      *) echo "ERROR: VITE_SERVER_URL must be an https URL. Got: $VITE_SERVER_URL" >&2; exit 1 ;; \
    esac

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
