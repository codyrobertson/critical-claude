#!/bin/bash

# Critical Claude Docker Run Script
# Convenient wrapper for running Critical Claude in Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="critical-claude:latest"
CONTAINER_NAME="critical-claude"
DATA_DIR="$HOME/.critical-claude"

# Parse arguments
DETACHED=false
REMOVE_AFTER=true
INTERACTIVE=true
DATA_VOLUME=""
COMMAND=""

echo -e "${BLUE}🐳 Critical Claude Docker Runner${NC}"
echo -e "${BLUE}================================${NC}"

while [[ $# -gt 0 ]]; do
    case $1 in
        --detached|-d)
            DETACHED=true
            INTERACTIVE=false
            REMOVE_AFTER=false
            shift
            ;;
        --persist)
            REMOVE_AFTER=false
            shift
            ;;
        --data-dir)
            DATA_DIR="$2"
            shift 2
            ;;
        --image)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --name)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS] [COMMAND]"
            echo ""
            echo "Options:"
            echo "  -d, --detached         Run in detached mode"
            echo "  --persist              Don't remove container after exit"
            echo "  --data-dir DIR         Data directory to mount (default: ~/.critical-claude)"
            echo "  --image IMAGE          Docker image to use (default: critical-claude:latest)"
            echo "  --name NAME            Container name (default: critical-claude)"
            echo "  --help                 Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                     # Show help"
            echo "  $0 task list           # List tasks"
            echo "  $0 viewer              # Launch viewer"
            echo "  $0 --persist viewer    # Launch viewer, keep container"
            exit 0
            ;;
        *)
            COMMAND="$*"
            break
            ;;
    esac
done

# Create data directory if it doesn't exist
if [ ! -d "$DATA_DIR" ]; then
    echo -e "${YELLOW}📁 Creating data directory: $DATA_DIR${NC}"
    mkdir -p "$DATA_DIR"
fi

# Check if image exists
if ! docker image inspect "$IMAGE_NAME" > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker image '$IMAGE_NAME' not found${NC}"
    echo -e "${YELLOW}💡 Try building it first: ./scripts/docker-build.sh${NC}"
    exit 1
fi

# Prepare Docker run command
DOCKER_CMD="docker run"

# Add flags
if [ "$REMOVE_AFTER" = true ]; then
    DOCKER_CMD="$DOCKER_CMD --rm"
fi

if [ "$INTERACTIVE" = true ]; then
    DOCKER_CMD="$DOCKER_CMD -it"
fi

if [ "$DETACHED" = true ]; then
    DOCKER_CMD="$DOCKER_CMD -d"
fi

# Add volume mount
DOCKER_CMD="$DOCKER_CMD -v $DATA_DIR:/home/claude/.critical-claude"

# Add container name
DOCKER_CMD="$DOCKER_CMD --name $CONTAINER_NAME-$(date +%s)"

# Add image
DOCKER_CMD="$DOCKER_CMD $IMAGE_NAME"

# Add command
if [ -n "$COMMAND" ]; then
    DOCKER_CMD="$DOCKER_CMD $COMMAND"
fi

echo -e "${YELLOW}🚀 Starting Critical Claude...${NC}"
echo "Image: $IMAGE_NAME"
echo "Data: $DATA_DIR"
echo "Command: $COMMAND"
echo ""

# Execute the Docker command
echo -e "${BLUE}Running: $DOCKER_CMD${NC}"
eval "$DOCKER_CMD"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Command completed successfully${NC}"
else
    echo -e "${RED}❌ Command failed${NC}"
    exit 1
fi