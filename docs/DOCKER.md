# 🐳 Critical Claude Docker Guide

This guide covers how to build, run, and deploy Critical Claude using Docker containers.

## 🚀 Quick Start

### Using Pre-built Scripts

```bash
# Build the Docker image
./scripts/docker-build.sh

# Run Critical Claude in Docker
./scripts/docker-run.sh task list

# Launch interactive viewer
./scripts/docker-run.sh viewer
```

### Manual Docker Commands

```bash
# Build image
docker build -t critical-claude:latest .

# Run with persistent data
docker run --rm -it \
  -v ~/.critical-claude:/home/claude/.critical-claude \
  critical-claude:latest task list
```

## 🏗️ Building Images

### Production Build

```bash
# Build optimized production image
./scripts/docker-build.sh

# Build without cache
./scripts/docker-build.sh --no-cache

# Build and push to registry
./scripts/docker-build.sh --push --registry docker.io/username
```

### Development Build

```bash
# Build development image with dev tools
./scripts/docker-build.sh --dev

# Use docker-compose for development
docker-compose --profile dev up critical-claude-dev
```

## 🏃 Running Containers

### Basic Usage

```bash
# Show help
docker run --rm critical-claude:latest

# List tasks
docker run --rm -it critical-claude:latest task list

# Create a task
docker run --rm -it \
  -v ~/.critical-claude:/home/claude/.critical-claude \
  critical-claude:latest task create -t "Docker task" -p high
```

### Interactive Mode

```bash
# Launch viewer with persistent data
docker run --rm -it \
  -v ~/.critical-claude:/home/claude/.critical-claude \
  critical-claude:latest viewer

# Interactive shell access
docker run --rm -it \
  -v ~/.critical-claude:/home/claude/.critical-claude \
  --entrypoint /bin/bash \
  critical-claude:latest
```

### Using Docker Compose

```bash
# Production deployment
docker-compose up critical-claude

# Development with live reload
docker-compose --profile dev up critical-claude-dev

# Background service
docker-compose up -d critical-claude
```

## 📁 Data Persistence

### Volume Mounts

Critical Claude stores data in `/home/claude/.critical-claude` inside the container. Mount this to persist data:

```bash
# Use host directory
docker run --rm -it \
  -v $PWD/data:/home/claude/.critical-claude \
  critical-claude:latest

# Use named volume
docker volume create claude-data
docker run --rm -it \
  -v claude-data:/home/claude/.critical-claude \
  critical-claude:latest
```

### Directory Structure

```
~/.critical-claude/
├── tasks/           # Task storage
├── templates/       # Template files
├── backups/         # Automatic backups
├── analytics.json   # Usage analytics
└── config.json      # Configuration
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `CRITICAL_CLAUDE_HOME` | Data directory | `/home/claude/.critical-claude` |
| `LOG_LEVEL` | Logging level | `info` |

### Custom Configuration

```bash
# Mount custom config
docker run --rm -it \
  -v ~/.critical-claude:/home/claude/.critical-claude \
  -v ./config:/app/config:ro \
  critical-claude:latest
```

## 🔧 Advanced Usage

### Multi-stage Builds

The Dockerfile uses multi-stage builds for optimization:

- **builder**: Development environment with all tools
- **production**: Minimal runtime environment

```bash
# Build specific stage
docker build --target builder -t critical-claude:dev .
docker build --target production -t critical-claude:latest .
```

### Custom Images

```dockerfile
# Extend base image
FROM critical-claude:latest

# Add custom plugins or configuration
COPY ./plugins /app/plugins
COPY ./config /app/config

# Custom entrypoint
COPY ./entrypoint.sh /usr/local/bin/
ENTRYPOINT ["entrypoint.sh"]
```

### Networking

```bash
# Custom network
docker network create claude-net

# Run with custom network
docker run --rm -it \
  --network claude-net \
  -v ~/.critical-claude:/home/claude/.critical-claude \
  critical-claude:latest
```

## 🚢 Deployment

### Container Registry

```bash
# Tag for registry
docker tag critical-claude:latest registry.example.com/critical-claude:2.3.0

# Push to registry
docker push registry.example.com/critical-claude:2.3.0

# Using build script
./scripts/docker-build.sh --push --registry registry.example.com
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: critical-claude
spec:
  replicas: 1
  selector:
    matchLabels:
      app: critical-claude
  template:
    metadata:
      labels:
        app: critical-claude
    spec:
      containers:
      - name: critical-claude
        image: critical-claude:latest
        volumeMounts:
        - name: data
          mountPath: /home/claude/.critical-claude
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: claude-data
```

### Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml critical-claude

# Scale service
docker service scale critical-claude_critical-claude=3
```

## 🔍 Troubleshooting

### Common Issues

**Container exits immediately**
```bash
# Check logs
docker logs <container-id>

# Run with shell to debug
docker run --rm -it --entrypoint /bin/bash critical-claude:latest
```

**Permission issues**
```bash
# Fix ownership of data directory
sudo chown -R 1000:1000 ~/.critical-claude

# Run as current user
docker run --rm -it \
  -u $(id -u):$(id -g) \
  -v ~/.critical-claude:/home/claude/.critical-claude \
  critical-claude:latest
```

**Build failures**
```bash
# Clean build without cache
./scripts/docker-build.sh --no-cache

# Check disk space
docker system df

# Clean up unused resources
docker system prune -f
```

### Health Checks

```bash
# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Manual health check
docker exec <container-id> cc task list > /dev/null && echo "Healthy" || echo "Unhealthy"
```

### Debugging

```bash
# View container logs
docker logs -f <container-id>

# Execute commands in running container
docker exec -it <container-id> cc task list

# Access container shell
docker exec -it <container-id> /bin/bash
```

## 📊 Performance

### Resource Usage

- **Memory**: ~256MB base, ~512MB with large task sets
- **CPU**: Minimal when idle, burst for operations
- **Storage**: ~100MB image, variable data size

### Optimization Tips

1. Use multi-stage builds to minimize image size
2. Mount data directories as volumes for persistence
3. Use `.dockerignore` to exclude unnecessary files
4. Set appropriate resource limits
5. Use specific image tags in production

## 🔐 Security

### Best Practices

1. Run as non-root user (UID 1000)
2. Use specific image versions, not `latest`
3. Limit container capabilities
4. Use read-only file systems where possible
5. Scan images for vulnerabilities

```bash
# Security scan
docker scout quickview critical-claude:latest

# Run with limited capabilities
docker run --rm -it \
  --cap-drop=ALL \
  --cap-add=CHOWN \
  --cap-add=SETUID \
  --cap-add=SETGID \
  critical-claude:latest
```

## 📝 Examples

### Development Workflow

```bash
# 1. Build development image
./scripts/docker-build.sh --dev

# 2. Start development container
docker-compose --profile dev up critical-claude-dev

# 3. Make changes to code (auto-reloaded)

# 4. Test in container
docker exec -it critical-claude-dev cc task list
```

### Production Deployment

```bash
# 1. Build production image
./scripts/docker-build.sh --push --registry your-registry.com

# 2. Deploy to production
docker pull your-registry.com/critical-claude:latest
docker run -d \
  --name critical-claude-prod \
  --restart unless-stopped \
  -v /opt/critical-claude/data:/home/claude/.critical-claude \
  your-registry.com/critical-claude:latest

# 3. Schedule backups
echo "0 2 * * * docker exec critical-claude-prod cc task backup" | crontab -
```

### CI/CD Integration

```bash
# In your CI/CD pipeline
./scripts/docker-build.sh --no-cache --push --registry $CI_REGISTRY

# Deploy to staging
docker service update \
  --image $CI_REGISTRY/critical-claude:$CI_COMMIT_SHA \
  staging_critical-claude

# Integration tests
docker run --rm \
  --network staging_default \
  $CI_REGISTRY/critical-claude:$CI_COMMIT_SHA \
  task list > /dev/null
```

Happy containerizing! 🐳