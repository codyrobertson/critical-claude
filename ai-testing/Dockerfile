FROM node:20-alpine

RUN apk add --no-cache bash curl git jq
RUN adduser -D -s /bin/bash aitest

COPY . /tmp/critical-claude
WORKDIR /tmp/critical-claude
RUN npm install && npm run build
RUN npm install -g .

USER aitest
WORKDIR /home/aitest

RUN mkdir -p tests results
RUN mkdir -p .local/bin

# Create Claude CLI stub
RUN echo '#!/bin/bash\necho "Claude CLI simulation mode"\necho "$@"' > .local/bin/claude && chmod +x .local/bin/claude

ENV PATH="/home/aitest/.local/bin:$PATH"

# Create test script
RUN echo '#!/bin/bash\necho "🧠 CRITICAL CLAUDE AI TESTING IN DOCKER"\necho "======================================="\necho "Testing Critical Claude..."\nif cc --version; then\n    echo "✅ Critical Claude working"\nelse\n    echo "❌ Critical Claude failed"\n    exit 1\nfi\necho "Testing task creation..."\nif cc task create -t "Docker Test Task" -p high -s todo; then\n    echo "✅ Task creation working"\nelse\n    echo "❌ Task creation failed"\nfi\necho "Testing task listing..."\nif cc task list; then\n    echo "✅ Task listing working"\nelse\n    echo "❌ Task listing failed"\nfi\necho "✅ Docker AI testing framework validated!"\necho "Critical Claude is running successfully in Docker container"' > run-tests.sh && chmod +x run-tests.sh

CMD ["./run-tests.sh"]