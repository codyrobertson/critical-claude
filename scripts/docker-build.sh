#!/bin/bash

# Critical Claude Docker Build Script
# Builds and tags Docker images for different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="critical-claude"
VERSION=$(node -p "require('./package.json').version")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo -e "${BLUE}🐳 Critical Claude Docker Build${NC}"
echo -e "${BLUE}================================${NC}"
echo "Version: $VERSION"
echo "Build Date: $BUILD_DATE"
echo "Git Commit: $GIT_COMMIT"
echo ""

# Parse arguments
BUILD_TARGET="production"
PUSH_TO_REGISTRY=false
REGISTRY=""
NO_CACHE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dev|--development)
            BUILD_TARGET="builder"
            shift
            ;;
        --push)
            PUSH_TO_REGISTRY=true
            shift
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dev, --development    Build development image"
            echo "  --push                  Push to registry after build"
            echo "  --registry REGISTRY     Registry to push to (e.g., docker.io/username)"
            echo "  --no-cache             Build without using cache"
            echo "  --help                 Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Prepare build args
BUILD_ARGS="--build-arg VERSION=$VERSION --build-arg BUILD_DATE=$BUILD_DATE --build-arg GIT_COMMIT=$GIT_COMMIT"

if [ "$NO_CACHE" = true ]; then
    BUILD_ARGS="$BUILD_ARGS --no-cache"
fi

# Set image tags
BASE_TAG="$IMAGE_NAME:$VERSION"
LATEST_TAG="$IMAGE_NAME:latest"

if [ "$BUILD_TARGET" = "builder" ]; then
    BASE_TAG="$IMAGE_NAME:$VERSION-dev"
    LATEST_TAG="$IMAGE_NAME:dev"
fi

if [ -n "$REGISTRY" ]; then
    BASE_TAG="$REGISTRY/$BASE_TAG"
    LATEST_TAG="$REGISTRY/$LATEST_TAG"
fi

echo -e "${YELLOW}🔨 Building Docker image...${NC}"
echo "Target: $BUILD_TARGET"
echo "Tags: $BASE_TAG, $LATEST_TAG"
echo ""

# Build the image
docker build \
    --target "$BUILD_TARGET" \
    --tag "$BASE_TAG" \
    --tag "$LATEST_TAG" \
    $BUILD_ARGS \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully${NC}"
    
    # Show image info
    echo -e "${BLUE}📊 Image Information:${NC}"
    docker images "$IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    echo ""
    
    # Run basic tests
    echo -e "${YELLOW}🧪 Running basic tests...${NC}"
    
    # Test help command
    if docker run --rm "$LATEST_TAG" --help > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Help command works${NC}"
    else
        echo -e "${RED}❌ Help command failed${NC}"
        exit 1
    fi
    
    # Test version command
    if docker run --rm "$LATEST_TAG" --version > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Version command works${NC}"
    else
        echo -e "${YELLOW}⚠️  Version command not available${NC}"
    fi
    
    # Push to registry if requested
    if [ "$PUSH_TO_REGISTRY" = true ]; then
        echo -e "${YELLOW}📤 Pushing to registry...${NC}"
        
        docker push "$BASE_TAG"
        docker push "$LATEST_TAG"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Push completed successfully${NC}"
        else
            echo -e "${RED}❌ Push failed${NC}"
            exit 1
        fi
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Docker build completed!${NC}"
    echo ""
    echo -e "${BLUE}Usage Examples:${NC}"
    echo "  docker run --rm -it $LATEST_TAG task list"
    echo "  docker run --rm -it $LATEST_TAG viewer"
    echo "  docker run --rm -it -v \$(pwd)/data:/home/claude/.critical-claude $LATEST_TAG"
    
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi