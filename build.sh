#!/bin/bash

# Critical Claude Build Script
# Builds all packages in the monorepo

set -e

echo "🔥 Building Critical Claude..."
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current branch
BRANCH=$(git branch --show-current)
BUILD_ENV="development"

# Determine build environment
if [[ "$BRANCH" == "main" ]] || [[ "$BRANCH" == "master" ]]; then
    BUILD_ENV="production"
elif [[ "$BRANCH" == "staging" ]]; then
    BUILD_ENV="staging"
fi

echo -e "${YELLOW}Branch: $BRANCH${NC}"
echo -e "${YELLOW}Build Environment: $BUILD_ENV${NC}"
echo ""

# Function to build a package
build_package() {
    local package_name=$1
    local package_path=$2
    
    echo -e "${YELLOW}Building $package_name...${NC}"
    
    if [ -d "$package_path" ]; then
        cd "$package_path"
        
        # Clean previous build
        if [ -d "dist" ]; then
            rm -rf dist
        fi
        if [ -d "build" ]; then
            rm -rf build
        fi
        
        # Install dependencies if needed
        if [ ! -d "node_modules" ]; then
            echo "Installing dependencies..."
            npm install
        fi
        
        # Run build
        if npm run build; then
            echo -e "${GREEN}✓ $package_name built successfully${NC}"
        else
            echo -e "${RED}✗ $package_name build failed${NC}"
            exit 1
        fi
        
        cd - > /dev/null
    else
        echo -e "${RED}✗ Package directory not found: $package_path${NC}"
        exit 1
    fi
    
    echo ""
}

# Build core packages first (dependencies)
echo "📦 Building core packages..."
echo "----------------------------"
build_package "core" "packages/core"
build_package "code-critique" "packages/code-critique"
build_package "project-management" "packages/project-management"
build_package "prompt-management" "packages/prompt-management"
build_package "web-search" "packages/web-search"

# Build service packages
echo "🛠️  Building service packages..."
echo "------------------------------"
build_package "system-design" "packages/system-design"
build_package "data-flow" "packages/data-flow"

# Build integration packages
echo "🔧 Building integration packages..."
echo "---------------------------------"
build_package "backlog-integration" "packages/backlog-integration"

# Build MCP server last (depends on everything)
echo "🚀 Building MCP server..."
echo "------------------------"
cd critical-claude-mcp

# Clean previous build
if [ -d "build" ]; then
    rm -rf build
fi

# Build MCP server
if npm run build; then
    echo -e "${GREEN}✓ MCP server built successfully${NC}"
    
    # Make the build executable
    chmod +x build/index.js
else
    echo -e "${RED}✗ MCP server build failed${NC}"
    exit 1
fi

cd ..

# Run tests if not in production
if [[ "$BUILD_ENV" != "production" ]]; then
    echo ""
    echo "🧪 Running tests..."
    echo "-------------------"
    
    # Run linting
    echo "Running linters..."
    if npm run lint 2>/dev/null; then
        echo -e "${GREEN}✓ Linting passed${NC}"
    else
        echo -e "${YELLOW}⚠ Linting warnings (non-blocking)${NC}"
    fi
    
    # Run type checking
    echo "Running type checks..."
    if npm run typecheck 2>/dev/null; then
        echo -e "${GREEN}✓ Type checking passed${NC}"
    else
        echo -e "${YELLOW}⚠ Type checking warnings (non-blocking)${NC}"
    fi
fi

# Generate build info
BUILD_INFO_FILE="build-info.json"
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BUILD_COMMIT=$(git rev-parse HEAD)
BUILD_COMMIT_SHORT=$(git rev-parse --short HEAD)

cat > $BUILD_INFO_FILE <<EOF
{
  "version": "1.0.0",
  "branch": "$BRANCH",
  "commit": "$BUILD_COMMIT",
  "commitShort": "$BUILD_COMMIT_SHORT",
  "buildTime": "$BUILD_TIME",
  "buildEnv": "$BUILD_ENV"
}
EOF

echo ""
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo "================================"
echo ""
echo "Build Info:"
echo "  Branch: $BRANCH"
echo "  Commit: $BUILD_COMMIT_SHORT"
echo "  Time: $BUILD_TIME"
echo "  Environment: $BUILD_ENV"
echo ""

# Development branch instructions
if [[ "$BUILD_ENV" == "development" ]]; then
    echo -e "${YELLOW}Development Build Instructions:${NC}"
    echo "  1. Test locally: npm link && cc --help"
    echo "  2. Run integration tests: npm test"
    echo "  3. Create PR when ready"
    echo ""
fi

# Staging branch instructions
if [[ "$BUILD_ENV" == "staging" ]]; then
    echo -e "${YELLOW}Staging Build Instructions:${NC}"
    echo "  1. Deploy to staging: ./deploy.sh staging"
    echo "  2. Run smoke tests"
    echo "  3. Get approval before production"
    echo ""
fi

# Production branch instructions
if [[ "$BUILD_ENV" == "production" ]]; then
    echo -e "${GREEN}Production Build Ready!${NC}"
    echo "  Deploy with: ./deploy.sh production"
    echo ""
fi