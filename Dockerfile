# syntax=docker/dockerfile:1.7-labs

# Arguments can be overridden with "docker build --build-arg PORT=6969"
ARG BUN_VERSION=1.1.30
ARG NODE_ENV=production
ARG PORT=3000

FROM oven/bun:${BUN_VERSION}-slim as base

LABEL fly_launch_runtime="Bun"
LABEL maintainer="<EMAIL>"
LABEL version="1.0"

WORKDIR /usr/src/app

# Install curl for health checks
RUN apt update && apt install -y curl && rm -rf /var/lib/apt/lists/*

# Install
FROM base AS install
COPY package.json bun.lock ./
COPY frontend/package.json frontend/bun.lock ./frontend/

# Install dependencies
RUN bun install --frozen-lockfile --production
RUN cd frontend && bun install --frozen-lockfile

# Build
FROM base as build
COPY . .
COPY --from=install /usr/src/app/node_modules node_modules
COPY --from=install /usr/src/app/frontend/node_modules frontend/node_modules

ENV NODE_ENV=${NODE_ENV}
RUN cd frontend && bun run build

# Release
FROM base as release

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bun

# Copy application files
COPY --from=install /usr/src/app/node_modules node_modules
COPY --exclude=frontend --exclude=node_modules --from=build /usr/src/app .
COPY --from=build /usr/src/app/frontend/dist ./frontend/dist

# Clean up
RUN rm -rf /tmp/* /var/tmp/* && \
    bun pm cache rm

# Set environment variables
ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

USER 1001:1001
EXPOSE ${PORT}/tcp
ENTRYPOINT [ "bun", "run", "start" ]