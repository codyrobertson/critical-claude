#!/bin/bash

# Rename critical-claude to critical-claude across entire codebase
set -e

echo "🔄 Renaming critical-claude to critical-claude across entire codebase..."

# Find and replace in all text files (excluding node_modules, .git, dist)
find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" -o -name "*.md" -o -name "*.yml" -o -name "*.yaml" -o -name "*.sh" \) \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -not -path "./dist/*" \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -exec sed -i '' 's/critical-claude/critical-claude/g' {} \;

echo "✅ Text replacement complete"

# Find and replace package names specifically
find . -type f -name "package.json" \
  -not -path "./node_modules/*" \
  -not -path "*/node_modules/*" \
  -exec sed -i '' 's/@critical-claude\/critical-claude/@critical-claude\/critical-claude/g' {} \;

echo "✅ Package name replacement complete"

# Find and replace import paths
find . -type f \( -name "*.ts" -o -name "*.js" \) \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -not -path "./dist/*" \
  -not -path "*/node_modules/*" \
  -not -path "*/dist/*" \
  -exec sed -i '' 's/packages\/critical-claude/packages\/critical-claude/g' {} \;

echo "✅ Import path replacement complete"

# Update any remaining references
find . -type f \( -name "*.md" -o -name "*.txt" \) \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -not -path "*/node_modules/*" \
  -exec sed -i '' 's/Backlog Integration/Critical Claude/g' {} \;

echo "✅ Documentation replacement complete"

echo "🎉 Renaming complete! critical-claude → critical-claude across entire codebase"
echo ""
echo "📝 Summary of changes:"
echo "  • Package paths: packages/critical-claude → packages/critical-claude"
echo "  • Import paths updated in all TypeScript/JavaScript files"
echo "  • Package names updated in package.json files"
echo "  • Documentation references updated"
echo ""
echo "⚠️  Note: Directory was already renamed. This script updated all references."