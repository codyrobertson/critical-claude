# Critical Claude Docker Image
FROM node:18-alpine

# Install git and other dependencies
RUN apk add --no-cache git curl bash

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/backlog-integration/package*.json ./packages/backlog-integration/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S critical-claude && \
    adduser -S critical-claude -u 1001 -G critical-claude

# Create necessary directories
RUN mkdir -p /app/.critical-claude /app/logs && \
    chown -R critical-claude:critical-claude /app

# Switch to non-root user
USER critical-claude

# Expose port for MCP server
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Environment variables
ENV NODE_ENV=production
ENV CRITICAL_CLAUDE_LOG_LEVEL=info
ENV CRITICAL_CLAUDE_HOOKS_ENABLED=false

# Start the application
CMD ["node", "packages/backlog-integration/dist/cli/cc-main.js", "--server", "--port", "3000"]