#!/bin/bash

# Setup script for brutal-critique-mcp pre-commit hooks

echo "🔧 Setting up pre-commit hooks for brutal-critique-mcp..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Must run this script from the brutal-critique-mcp directory"
  exit 1
fi

# Get the parent git directory
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)
if [ -z "$GIT_DIR" ]; then
  echo "❌ Error: Not in a git repository"
  exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$GIT_DIR/hooks"

# Create or update the pre-commit hook
PRE_COMMIT_HOOK="$GIT_DIR/hooks/pre-commit"

# Create a new pre-commit hook that runs our checks
cat > "$PRE_COMMIT_HOOK" << 'EOF'
#!/bin/sh

# Get list of staged files in brutal-critique-mcp
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep "^brutal-critique-mcp/")

if [ -n "$STAGED_FILES" ]; then
  echo "🔍 Detected changes in brutal-critique-mcp, running pre-commit checks..."
  
  # Save current directory
  ORIGINAL_DIR=$(pwd)
  
  # Change to brutal-critique-mcp directory
  cd brutal-critique-mcp || exit 1
  
  # Run type checking
  echo "📝 Running TypeScript type check..."
  npm run typecheck || {
    echo "❌ Type checking failed"
    cd "$ORIGINAL_DIR"
    exit 1
  }
  
  # Run lint-staged for changed files
  echo "🎨 Running lint-staged (ESLint + Prettier)..."
  npx lint-staged || {
    echo "❌ Linting/formatting failed"
    cd "$ORIGINAL_DIR"
    exit 1
  }
  
  # Run tests
  echo "🧪 Running tests..."
  npm test -- --passWithNoTests || {
    echo "❌ Tests failed"
    cd "$ORIGINAL_DIR"
    exit 1
  }
  
  # Generate documentation (non-blocking)
  echo "📚 Generating documentation..."
  npm run docs 2>/dev/null || {
    echo "⚠️  Documentation generation failed (non-blocking)"
  }
  
  # Return to original directory
  cd "$ORIGINAL_DIR"
  
  echo "✅ All brutal-critique-mcp checks passed!"
fi
EOF

# Make the hook executable
chmod +x "$PRE_COMMIT_HOOK"

echo "✅ Pre-commit hook installed successfully!"
echo ""
echo "The following checks will run on commit:"
echo "  - TypeScript type checking"
echo "  - ESLint linting"
echo "  - Prettier formatting"
echo "  - Jest tests"
echo "  - TypeDoc documentation generation"
echo ""
echo "To test the hook, try making a commit with changes to brutal-critique-mcp files."