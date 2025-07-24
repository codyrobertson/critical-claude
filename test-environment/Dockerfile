# Critical Claude CLI - Comprehensive Test Environment
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    vim \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /test-env

# Create test user (non-root)
RUN adduser -D -s /bin/bash testuser

# Install Claude Code CLI (if available)
RUN npm install -g @anthropic-ai/claude-code || echo "Claude Code CLI not available"

# Copy test scripts
COPY test-scripts/ ./test-scripts/
COPY test-data/ ./test-data/

# Make scripts executable
RUN chmod +x test-scripts/*.sh

# Set up test environment
RUN mkdir -p /home/testuser/.critical-claude
RUN chown -R testuser:testuser /test-env /home/testuser

# Switch to test user
USER testuser

# Create test results directory
RUN mkdir -p /test-env/results

# Set default command
CMD ["/test-env/test-scripts/run-all-tests.sh"]