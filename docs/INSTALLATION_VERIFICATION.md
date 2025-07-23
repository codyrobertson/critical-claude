# 🔍 Installation Verification Guide

Critical Claude includes comprehensive verification tools to ensure your installation is working correctly and identify any issues before you start using the system.

## 🚀 Quick Verification

### CLI Verification Command

The fastest way to verify your installation:

```bash
# Basic verification
cc verify

# Quick health check
cc verify --health

# Detailed verification with verbose output
cc verify --verbose

# Skip resource-intensive tests
cc verify --skip-docker --skip-performance
```

### Expected Output

A successful verification will show:

```
🔍 Critical Claude Installation Verification
===========================================

✅ System Requirements: Node.js v20.x.x on darwin/arm64 with 16GB RAM
✅ File System: Data directory accessible with write permissions
✅ Domain Architecture: 3/3 domains built
✅ CLI Installation: CLI accessible, version 2.3.0
✅ Basic Functionality: Core functionality working (help, create, list)
✅ Analytics System: Analytics system functional
✅ Data Persistence: Data persistence working (5 tasks stored)
✅ Performance: Performance acceptable: 45ms per task

📋 INSTALLATION VERIFICATION REPORT
====================================

Success Rate: 100%
🎉 All tests passed! Critical Claude is ready to use.
```

## 🏥 Health Check System

### Automated Health Monitoring

Critical Claude includes a comprehensive health check system that monitors:

- **System Requirements**: Node.js version, OS compatibility
- **File System**: Data directory access and permissions
- **Domain Architecture**: All domains built and accessible
- **CLI Functionality**: Core commands working
- **Performance**: Response times within acceptable ranges
- **Data Persistence**: Task storage and retrieval
- **Analytics System**: Usage tracking functionality

### Health Check Commands

```bash
# Full health check
node scripts/health-check.js

# Through CLI
cc verify --health

# Programmatic access
const HealthChecker = require('./scripts/health-check.js');
const checker = new HealthChecker();
const isHealthy = await checker.runAllChecks();
```

### Health Check Output

```
🏥 Critical Claude Health Check Starting
=====================================

🔍 Running check: System Requirements
✅ System Requirements: Node.js v20.1.0 on darwin/arm64 with 16GB RAM (1250ms)

🔍 Running check: File System
✅ File System: Data directory accessible with write permissions (15ms)

🔍 Running check: Domain Architecture
✅ Domain Architecture: 3/3 domains built (125ms)

📋 HEALTH CHECK REPORT
======================

📊 Summary:
  Status: 🟢 HEALTHY
  Checks: 8/8 passed
  Success Rate: 100%

💡 Recommendations:
  🎉 Everything looks great! Critical Claude is ready to use.
  - Try: cc task create --title "My first task"
  - Try: cc viewer
  - Try: cc shortcuts
```

## 🔧 Manual Verification Steps

### 1. System Requirements Check

```bash
# Check Node.js version (requires >= 18)
node --version

# Check NPM version
npm --version

# Check available memory
free -h  # Linux
vm_stat  # macOS
```

### 2. Installation Verification

```bash
# Verify project structure
ls -la domains/
ls -la applications/
ls -la scripts/

# Check if domains are built
ls -la domains/*/dist/

# Test CLI accessibility
cc --help
cc --version
```

### 3. Basic Functionality Test

```bash
# Create a test task
cc task create --title "Installation Test" --description "Testing installation"

# List tasks
cc task list

# Export tasks
cc task export --format json

# Check analytics
cc analytics stats
```

### 4. Advanced Feature Testing

```bash
# Test viewer (exit with 'q')
cc viewer

# Test keyboard shortcuts
cc shortcuts

# Test backup functionality
cc task backup

# Test import functionality
cc task export --file test.json
cc task import --file test.json --merge-strategy skip
```

## 🚨 Troubleshooting Common Issues

### Node.js Version Issues

**Problem**: `Node.js version too old`

**Solution**:
```bash
# Install Node.js >= 18
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Verify version
node --version
```

### Build Issues

**Problem**: `Domain not built` or `CLI not accessible`

**Solution**:
```bash
# Clean and rebuild
npm run clean
npm install
npm run build

# Verify build
ls -la domains/*/dist/
```

### Permission Issues

**Problem**: `No write permissions in data directory`

**Solution**:
```bash
# Check data directory
ls -la ~/.critical-claude/

# Fix permissions
chmod -R 755 ~/.critical-claude/

# Alternative: Set custom directory
export CRITICAL_CLAUDE_HOME=/path/to/writable/directory
```

### Docker Issues

**Problem**: `Docker build failed`

**Solution**:
```bash
# Check Docker installation
docker --version

# Clean Docker cache
docker system prune -f

# Build with verbose output
docker build --progress=plain .
```

### Performance Issues

**Problem**: `Performance test took too long`

**Solution**:
```bash
# Check system resources
top
htop

# Clear data directory
rm -rf ~/.critical-claude/tasks/*

# Run performance benchmark
npm run benchmark
```

## 📊 Verification Metrics

### Performance Thresholds

- **Task Creation**: < 100ms per task
- **Task Listing**: < 200ms for 100 tasks
- **Export Operations**: < 500ms for 100 tasks
- **CLI Startup**: < 1000ms

### Success Criteria

- **System Requirements**: All checks pass
- **File System**: Read/write access verified
- **Build System**: All domains compiled
- **Core Functionality**: Create, list, update, delete tasks
- **Data Persistence**: Tasks saved and retrieved
- **Analytics**: Usage tracking functional

### Quality Gates

| Check | Requirement | Critical |
|-------|-------------|----------|
| Node.js Version | >= 18.0.0 | Yes |
| Domain Build | All 3 domains | Yes |
| CLI Commands | Help, version work | Yes |
| Task Operations | CRUD operations | Yes |
| File Permissions | Read/write access | Yes |
| Performance | < 100ms basic ops | No |
| Docker Build | Image builds | No |

## 🔄 Continuous Verification

### Automated Checks

Include verification in your workflow:

```bash
# In deployment scripts
./scripts/verify-installation.sh --skip-docker

# In CI/CD pipeline
npm run test
npm run build
node scripts/health-check.js

# Daily health check (cron)
0 9 * * * cd /path/to/critical-claude && node scripts/health-check.js
```

### Monitoring Integration

```javascript
// Programmatic health checking
import HealthChecker from './scripts/health-check.js';

const checker = new HealthChecker();
const results = await checker.runAllChecks();

if (results.status !== 'healthy') {
  // Send alert
  await sendAlert('Critical Claude health check failed', results);
}
```

## 📋 Verification Checklist

### Pre-Installation

- [ ] Node.js >= 18 installed
- [ ] NPM/Yarn available
- [ ] Git installed (optional)
- [ ] Docker installed (optional)
- [ ] Sufficient disk space (>1GB)
- [ ] Write permissions in home directory

### Post-Installation

- [ ] All domains built successfully
- [ ] CLI commands respond correctly
- [ ] Task CRUD operations work
- [ ] Data persists between sessions
- [ ] Analytics tracking functional
- [ ] Export/import operations work
- [ ] Viewer launches and responds
- [ ] Performance meets thresholds

### Deployment Verification

- [ ] Health check passes
- [ ] All tests pass
- [ ] Docker image builds
- [ ] Documentation accessible
- [ ] Backup/restore tested
- [ ] Security scan clean
- [ ] Performance benchmarks acceptable

## 🆘 Getting Help

### Self-Service Options

1. **Run diagnostics**: `cc verify --verbose`
2. **Check logs**: Look in `~/.critical-claude/logs/`
3. **Review documentation**: `docs/` directory
4. **Search issues**: GitHub repository issues

### Support Channels

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Comprehensive guides in `docs/`
- **Community**: Discussions and Q&A
- **Health Check**: Automated diagnostics and recommendations

### Reporting Issues

When reporting verification issues, include:

```bash
# System information
uname -a
node --version
npm --version

# Verification output
cc verify --verbose > verification-output.txt

# Health check results
node scripts/health-check.js > health-check-results.json
```

---

## 🎯 Quick Commands Reference

```bash
# Essential verification commands
cc verify                    # Full verification
cc verify --health          # Quick health check
cc verify --verbose         # Detailed output
cc --version                # Check version
cc shortcuts                # Show all shortcuts

# Manual testing
cc task create --title "Test"
cc task list
cc task export --format json
cc analytics stats
cc viewer  # (exit with 'q')

# Troubleshooting
npm run build               # Rebuild if needed
npm run clean && npm run build  # Full rebuild
./scripts/verify-installation.sh  # Direct script
node scripts/health-check.js      # Direct health check
```

*Verification complete? Start creating tasks with `cc task create --title "My first task"`! 🚀*