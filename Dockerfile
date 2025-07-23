# Critical Claude CLI - Docker Image
# Multi-stage build for optimized production image

# Stage 1: Build environment
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./
COPY packages/critical-claude/package*.json ./packages/critical-claude/
COPY domains/*/package*.json ./domains/
COPY applications/*/package*.json ./applications/
COPY infrastructure/*/package*.json ./infrastructure/

# Install dependencies
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build all domains and applications
RUN npm run build:domains
RUN npm run build:apps

# Stage 2: Production environment
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    git \
    bash \
    curl \
    jq \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1000 claude && \
    adduser -D -s /bin/bash -u 1000 -G claude claude

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=claude:claude /app/dist ./dist
COPY --from=builder --chown=claude:claude /app/applications/cli-application/dist ./cli
COPY --from=builder --chown=claude:claude /app/domains/*/dist ./domains/
COPY --from=builder --chown=claude:claude /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Create directories for data persistence
RUN mkdir -p /home/claude/.critical-claude/tasks \
             /home/claude/.critical-claude/templates \
             /home/claude/.critical-claude/backups \
             /home/claude/.critical-claude/analytics && \
    chown -R claude:claude /home/claude/.critical-claude

# Switch to non-root user
USER claude

# Set environment variables
ENV NODE_ENV=production
ENV CRITICAL_CLAUDE_HOME=/home/claude/.critical-claude
ENV PATH="/app/cli:$PATH"

# Create CLI entrypoint
RUN echo '#!/bin/bash\nnode /app/cli/index.js "$@"' > /usr/local/bin/cc && \
    chmod +x /usr/local/bin/cc

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD cc task list > /dev/null || exit 1

# Default command
ENTRYPOINT ["cc"]
CMD ["--help"]

# Labels for metadata
LABEL org.opencontainers.image.title="Critical Claude CLI"
LABEL org.opencontainers.image.description="Advanced task management CLI with DDD architecture"
LABEL org.opencontainers.image.version="2.3.0"
LABEL org.opencontainers.image.author="Critical Claude Team"
LABEL org.opencontainers.image.source="https://github.com/critical-claude/critical-claude"
LABEL org.opencontainers.image.documentation="https://github.com/critical-claude/critical-claude/blob/main/README.md"