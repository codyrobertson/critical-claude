# Pre-commit Hooks Setup

This project uses automated pre-commit hooks to ensure code quality and consistency.

## What runs on commit

When you commit changes to `brutal-critique-mcp`, the following checks run automatically:

1. **TypeScript Type Checking** - Ensures no type errors
2. **ESLint** - Checks for code quality issues
3. **Prettier** - Formats code automatically
4. **Jest Tests** - Runs unit tests (if configured)
5. **TypeDoc** - Generates documentation (non-blocking)

## Setup

The pre-commit hook is automatically installed when you run the setup script:

```bash
./setup-hooks.sh
```

This installs a git hook that runs whenever files in `brutal-critique-mcp` are staged for commit.

## Manual Commands

You can run these checks manually:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix  # Auto-fix issues

# Formatting
npm run format:check  # Check formatting
npm run format        # Auto-format

# Tests
npm test

# Documentation
npm run docs

# Run all pre-commit checks
npm run pre-commit
```

## Configuration Files

- `.eslintrc.json` - ESLint rules
- `.prettierrc.json` - Prettier formatting rules
- `typedoc.json` - Documentation generation config
- `commitlint.config.js` - Commit message format rules
- `package.json` - lint-staged configuration

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
- Tests must pass before commit (or use --no-verify)

## Benefits

- **Consistent code style** across the team
- **Catch bugs early** with type checking and linting
- **Automatic formatting** reduces style debates
- **Better commits** with standardized messages
- **Up-to-date docs** generated automatically
