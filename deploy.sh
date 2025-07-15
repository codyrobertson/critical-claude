#!/bin/bash

# Critical Claude Deploy Script
# Deploy to npm, GitHub releases, or other targets

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check arguments
if [ $# -eq 0 ]; then
    echo -e "${RED}Error: No deploy target specified${NC}"
    echo "Usage: ./deploy.sh [staging|production|npm|github]"
    exit 1
fi

TARGET=$1
BRANCH=$(git branch --show-current)

echo "🚀 Critical Claude Deploy"
echo "========================"
echo -e "${BLUE}Target: $TARGET${NC}"
echo -e "${BLUE}Branch: $BRANCH${NC}"
echo ""

# Function to check if working directory is clean
check_git_clean() {
    if [[ -n $(git status -s) ]]; then
        echo -e "${RED}Error: Working directory is not clean${NC}"
        echo "Please commit or stash your changes before deploying"
        exit 1
    fi
}

# Function to check branch restrictions
check_branch() {
    local allowed_branch=$1
    if [[ "$BRANCH" != "$allowed_branch" ]]; then
        echo -e "${RED}Error: Cannot deploy $TARGET from branch '$BRANCH'${NC}"
        echo "Must be on '$allowed_branch' branch"
        exit 1
    fi
}

# Function to bump version
bump_version() {
    local version_type=$1 # patch, minor, major
    echo "Bumping version..."
    
    # Update root package.json
    npm version $version_type --no-git-tag-version
    
    # Update all package versions
    for package_json in packages/*/package.json; do
        if [ -f "$package_json" ]; then
            (cd $(dirname $package_json) && npm version $version_type --no-git-tag-version)
        fi
    done
    
    # Update MCP server version
    (cd critical-claude-mcp && npm version $version_type --no-git-tag-version)
    
    # Get new version
    NEW_VERSION=$(node -p "require('./package.json').version")
    echo -e "${GREEN}Version bumped to: $NEW_VERSION${NC}"
}

# Deploy functions
deploy_staging() {
    echo "📦 Deploying to staging environment..."
    
    # Check branch
    if [[ "$BRANCH" != "staging" ]] && [[ "$BRANCH" != "develop" ]]; then
        echo -e "${YELLOW}Warning: Deploying from non-staging branch '$BRANCH'${NC}"
        read -p "Continue? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Build with staging config
    echo "Building for staging..."
    ./build.sh
    
    # Deploy to staging npm registry (if configured)
    if [ -n "$NPM_STAGING_REGISTRY" ]; then
        echo "Publishing to staging registry..."
        npm publish --registry $NPM_STAGING_REGISTRY --tag staging
    else
        echo "Publishing to npm with staging tag..."
        npm publish --tag staging --access public
    fi
    
    echo -e "${GREEN}✅ Deployed to staging!${NC}"
    echo ""
    echo "Test with: npm install @critical-claude/mcp@staging"
}

deploy_production() {
    echo "🚀 Deploying to production..."
    
    # Strict checks for production
    check_git_clean
    check_branch "main"
    
    # Confirm production deploy
    echo -e "${YELLOW}⚠️  PRODUCTION DEPLOYMENT${NC}"
    echo "This will:"
    echo "  - Bump version"
    echo "  - Create git tag"
    echo "  - Publish to npm"
    echo "  - Create GitHub release"
    echo ""
    read -p "Deploy to production? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    
    # Get version bump type
    echo ""
    echo "Version bump type:"
    echo "  1) patch (bug fixes)"
    echo "  2) minor (new features)"
    echo "  3) major (breaking changes)"
    read -p "Select (1-3): " version_choice
    
    case $version_choice in
        1) VERSION_TYPE="patch";;
        2) VERSION_TYPE="minor";;
        3) VERSION_TYPE="major";;
        *) echo -e "${RED}Invalid choice${NC}"; exit 1;;
    esac
    
    # Bump version
    bump_version $VERSION_TYPE
    
    # Build production
    echo "Building for production..."
    ./build.sh
    
    # Commit version bump
    git add -A
    git commit -m "chore: bump version to $NEW_VERSION"
    
    # Create tag
    git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
    
    # Push changes
    echo "Pushing to git..."
    git push origin main
    git push origin "v$NEW_VERSION"
    
    # Publish to npm
    echo "Publishing to npm..."
    npm publish --access public
    
    # Publish all workspace packages
    for package_dir in packages/*; do
        if [ -f "$package_dir/package.json" ]; then
            echo "Publishing $(basename $package_dir)..."
            (cd $package_dir && npm publish --access public)
        fi
    done
    
    # Create GitHub release
    if command -v gh &> /dev/null; then
        echo "Creating GitHub release..."
        gh release create "v$NEW_VERSION" \
            --title "Critical Claude v$NEW_VERSION" \
            --notes "Release v$NEW_VERSION - Working code beats perfect theory" \
            --draft
        echo -e "${YELLOW}GitHub release created as draft - edit and publish on GitHub${NC}"
    fi
    
    echo -e "${GREEN}✅ Deployed to production!${NC}"
    echo ""
    echo "Published packages:"
    echo "  - @critical-claude/mcp"
    echo "  - @critical-claude/core"
    echo "  - @critical-claude/backlog-integration"
    echo ""
    echo "Install with: npm install -g @critical-claude/mcp"
}

deploy_npm_dev() {
    echo "📦 Publishing development version to npm..."
    
    # Add dev tag to version
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    DEV_VERSION="$CURRENT_VERSION-dev.$(date +%Y%m%d%H%M%S)"
    
    # Temporarily update package.json with dev version
    npm version $DEV_VERSION --no-git-tag-version --allow-same-version
    
    # Build
    echo "Building..."
    ./build.sh
    
    # Publish with dev tag
    echo "Publishing to npm with dev tag..."
    npm publish --tag dev --access public
    
    # Restore original version
    git checkout package.json
    
    echo -e "${GREEN}✅ Published dev version: $DEV_VERSION${NC}"
    echo ""
    echo "Install with: npm install @critical-claude/mcp@dev"
}

deploy_local() {
    echo "🏠 Installing locally..."
    
    # Build
    ./build.sh
    
    # Link all packages
    echo "Linking packages..."
    npm link
    
    (cd packages/backlog-integration && npm link)
    
    echo -e "${GREEN}✅ Installed locally!${NC}"
    echo ""
    echo "Commands available:"
    echo "  - cc (Critical Claude CLI)"
    echo "  - cc-backlog (Backlog management)"
}

# Main deploy logic
case $TARGET in
    staging)
        deploy_staging
        ;;
    production|prod)
        deploy_production
        ;;
    npm-dev|dev)
        deploy_npm_dev
        ;;
    local)
        deploy_local
        ;;
    *)
        echo -e "${RED}Unknown deploy target: $TARGET${NC}"
        echo ""
        echo "Available targets:"
        echo "  staging    - Deploy to staging environment"
        echo "  production - Deploy to production (main branch only)"
        echo "  npm-dev    - Publish development version to npm"
        echo "  local      - Install locally via npm link"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deploy complete!"