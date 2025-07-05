# Pre-commit Hooks Setup

This project uses automated pre-commit hooks powered by Husky to ensure code quality and consistency. All checks must pass before commits are allowed.

## What runs on commit

When you commit changes to `brutal-critique-mcp`, the following checks run automatically:

1. **TypeScript Type Checking** - Ensures no type errors (`npm run typecheck`)
2. **ESLint** - Checks for code quality issues and auto-fixes when possible
3. **Prettier** - Formats code automatically for consistency
4. **Jest Tests** - Runs full test suite with ESM support (all tests must pass)
5. **TypeDoc** - Generates documentation (non-blocking, warnings logged)

### Check Flow

```
┌─────────────────┐
│ Git Commit      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Type Check      │ ◄── Blocks commit on failure
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Lint-Staged     │ ◄── Runs on staged files only
│ - ESLint        │
│ - Prettier      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Jest Tests      │ ◄── All tests must pass
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ TypeDoc         │ ◄── Non-blocking documentation
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Commit Success  │
└─────────────────┘
```

## Setup

Pre-commit hooks are automatically installed when you run:

```bash
npm install
```

This triggers the `postinstall` script which runs:

```bash
npm run prepare  # Installs Husky
```

### Manual Setup

If hooks aren't working, you can manually install them:

```bash
# Install Husky
npm install --save-dev husky

# Initialize Husky
npm run prepare

# Verify hook installation
ls -la .husky/
```

### Troubleshooting Hook Installation

1. **Hooks not running**: Check if `.husky/pre-commit` exists and is executable
2. **Permission issues**: Run `chmod +x .husky/pre-commit`
3. **Path issues**: Ensure the script changes to the correct directory
4. **Dependencies**: Run `npm install` to ensure all dev dependencies are installed

## Manual Commands

You can run these checks manually:

```bash
# Type checking
npm run typecheck

# Linting (source files only, tests ignored)
npm run lint

# Formatting (via Prettier)
npm run format

# Tests (ESM-compatible Jest)
npm test
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage

# Documentation generation
npm run docs

# Build (compiles TypeScript)
npm run build

# Development server (watch mode)
npm run watch
```

## Configuration Files

- **`.eslintrc.json`** - ESLint rules (ignores test files)
- **`.prettierrc.json`** - Prettier formatting rules
- **`.prettierignore`** - Files to ignore for formatting
- **`jest.config.js`** - Jest configuration with ESM support
- **`tsconfig.json`** - TypeScript compiler configuration
- **`typedoc.json`** - Documentation generation config
- **`commitlint.config.js`** - Commit message format rules
- **`package.json`** - lint-staged configuration
- **`.husky/pre-commit`** - Pre-commit hook script

### Key Configuration Details

**ESLint** ignores test files to avoid ESM parsing issues:

```json
{
  "ignorePatterns": ["src/__tests__/**/*"]
}
```

**Jest** uses ESM with experimental VM modules:

```json
{
  "preset": "ts-jest/presets/default-esm",
  "extensionsToTreatAsEsm": [".ts"]
}
```

**lint-staged** runs tools only on staged files:

```json
{
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,jsx,json,md}": ["prettier --write"]
}
```

## Commit Message Format

Commits follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types: feat, fix, docs, style, refactor, perf, test, chore, revert, build, ci

## Bypassing Hooks

If you need to commit without running hooks (not recommended):

```bash
git commit --no-verify -m "message"
```

**⚠️ Warning**: Bypassing hooks can introduce bugs and inconsistencies. Only use this for:

- Emergency hotfixes
- Work-in-progress commits on feature branches
- Fixing broken CI/CD pipelines

**Always run checks manually** before merging:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

## Troubleshooting

### ESLint errors

- Run `npm run lint:fix` to auto-fix most issues
- Check `.eslintrc.json` for rule configuration

### Prettier conflicts

- Run `npm run format` to auto-format all files
- Prettier runs after ESLint to ensure consistent formatting

### Type errors

- Run `npm run typecheck` to see detailed errors
- Fix type issues before committing

### Test failures

- Run `npm test` to see failing tests
- All tests must pass before commit
- Tests use ESM modules with `jest.unstable_mockModule`
- If Jest hangs, check for missing `--experimental-vm-modules` flag

### ESM/Module issues

- Tests use `jest.unstable_mockModule` for proper ESM mocking
- Import statements must use `.js` extensions
- Top-level await is supported in test files
- Check `NODE_OPTIONS=--experimental-vm-modules` in test scripts

## Benefits

- **Consistent code style** across the team with Prettier
- **Catch bugs early** with TypeScript type checking and ESLint
- **Automatic formatting** reduces style debates
- **Better commits** with conventional commit format
- **Up-to-date docs** generated automatically with TypeDoc
- **Reliable tests** with comprehensive ESM-compatible test suite
- **Security** with path validation and safe file operations
- **Performance** with optimized builds and tree-shaking

## Development Workflow

1. **Make changes** to source files
2. **Run tests** during development: `npm run test:watch`
3. **Check types** occasionally: `npm run typecheck`
4. **Stage changes**: `git add .`
5. **Commit** triggers all checks automatically
6. **Push** once all checks pass

### Recommended VS Code Extensions

- **ESLint** - Real-time linting
- **Prettier** - Format on save
- **TypeScript** - Enhanced TypeScript support
- **Jest** - Test runner integration
- **GitLens** - Git integration

### Editor Configuration

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "jest.autoRun": "watch"
}
```
