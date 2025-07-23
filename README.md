# 🚀 Critical Claude

**Enterprise-grade task management CLI with DDD architecture, advanced analytics, and production-ready deployment.**

[![CI/CD](https://github.com/critical-claude/critical-claude/workflows/CI/badge.svg)](https://github.com/critical-claude/critical-claude/actions)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://github.com/critical-claude/critical-claude/blob/main/docs/DOCKER.md)
[![Coverage](https://img.shields.io/badge/coverage-70%25-green)](https://github.com/critical-claude/critical-claude/blob/main/docs/CI_CD.md)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## ⚡ Quick Start

```bash
# Install
npm install -g critical-claude

# Verify installation
cc verify

# Create your first task
cc task create --title "Welcome to Critical Claude" --priority high

# Launch interactive viewer
cc viewer

# Show keyboard shortcuts
cc shortcuts
```

## 🎯 Core Features

### 📋 **Advanced Task Management**
- **Domain-Driven Architecture**: Clean separation of concerns with DDD patterns
- **Rich Task Model**: Priority, status, labels, assignees, time tracking
- **Interactive Viewer**: Terminal UI with Vim-style navigation and real-time search
- **Bulk Operations**: Export, import, and batch processing capabilities

### 💾 **Data Management & Migration**
```bash
# Export tasks in multiple formats
cc task export --format json --include-archived
cc task export --format csv --file my-tasks.csv
cc task export --format markdown

# Import with flexible merge strategies
cc task import --file backup.json --merge-strategy merge
cc task import --file tasks.csv --merge-strategy replace

# Automated backups with retention
cc task backup --format json
```

### 📊 **Analytics & Monitoring**
```bash
# Usage statistics (anonymous, no PII)
cc analytics stats

# Export analytics data
cc analytics export --format csv

# System health monitoring
cc verify --health
```

### 🖥️ **Interactive Terminal UI**
- **Vim-Style Navigation**: Full keyboard control with j/k, gg/G, search with `/`
- **Real-Time Search**: Fuzzy search across titles, descriptions, and labels
- **Advanced Filtering**: Filter by status, priority, assignee, or custom criteria
- **Visual Feedback**: Progress indicators for long-running operations

### 🐳 **Production Deployment**
```bash
# Docker containerization
docker build -t critical-claude .
docker run --rm -it critical-claude task list

# Docker Compose for development
docker-compose up critical-claude-dev

# Health checks and monitoring
docker run --rm critical-claude verify --health
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js**: >= 18.0.0
- **NPM**: >= 8.0.0
- **Docker**: >= 20.0.0 (optional)

### Installation Methods

#### NPM (Recommended)
```bash
npm install -g critical-claude
cc verify  # Verify installation
```

#### Docker
```bash
docker pull ghcr.io/critical-claude/critical-claude:latest
docker run --rm -it ghcr.io/critical-claude/critical-claude:latest
```

#### From Source
```bash
git clone https://github.com/critical-claude/critical-claude.git
cd critical-claude
npm install
npm run build
npm link
```

## 📖 Command Reference

### Task Management
```bash
# Core CRUD operations
cc task create --title "Task title" --priority high --assignee user@example.com
cc task list --status todo --priority high
cc task update <task-id> --status in_progress
cc task delete <task-id>
cc task archive <task-id>

# Data operations
cc task export --format json --file backup.json
cc task import --file backup.json --merge-strategy merge
cc task backup --format json

# Advanced querying
cc task list --assignee "john@company.com" --labels bug,critical
cc task list --status in_progress --priority high
```

### Interactive Viewer
```bash
# Launch viewer
cc viewer --theme dark --log-level info

# Keyboard shortcuts in viewer
j/k or ↑/↓     # Navigate tasks
/              # Search tasks
f              # Filter by status
Enter          # Select task
Space          # Toggle task status
q              # Quit viewer
?              # Show help
```

### System & Analytics
```bash
# Installation verification
cc verify                    # Full verification
cc verify --health          # Quick health check
cc verify --skip-docker     # Skip Docker tests

# Usage analytics
cc analytics stats           # View usage statistics
cc analytics export --format csv
cc analytics clear           # Clear analytics data

# Help and documentation
cc shortcuts                 # Show keyboard shortcuts
cc --help                   # Show command help
cc <command> --help         # Command-specific help
```

## 🏗️ Architecture

Critical Claude follows **Domain-Driven Design (DDD)** principles:

```
📁 domains/
├── 📁 task-management/     # Core task domain
│   ├── 📁 application/     # Use cases & services
│   ├── 📁 domain/          # Entities & value objects
│   └── 📁 infrastructure/  # Repositories & adapters
├── 📁 analytics/           # Usage analytics domain
├── 📁 user-interface/      # Terminal UI domain
└── 📁 template-system/     # Task templates domain

📁 applications/
└── 📁 cli-application/     # Main CLI entry point

📁 infrastructure/
└── 📁 shared-kernel/       # Cross-cutting concerns
```

### Key Design Patterns
- **Domain-Driven Design**: Clear domain boundaries and ubiquitous language
- **Hexagonal Architecture**: Ports and adapters for testability
- **CQRS**: Command Query Responsibility Segregation for complex operations
- **Event Sourcing**: Domain events for audit trails and analytics

## 🧪 Testing & Quality

### Test Coverage
- **Unit Tests**: Domain logic and business rules
- **Integration Tests**: CLI commands and data persistence
- **E2E Tests**: Full user workflows and terminal interactions
- **Performance Tests**: Benchmarking and regression detection

```bash
# Run all tests
npm test

# Specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Coverage reporting
npm run test:coverage

# Performance benchmarks
npm run benchmark
```

### Quality Gates
- **70% minimum test coverage** across all domains
- **TypeScript strict mode** with zero compiler errors
- **ESLint + Prettier** for consistent code style
- **Security scanning** with Snyk and CodeQL
- **Performance benchmarks** with automated regression detection

## 🔒 Security & Privacy

### Security Features
- **Input Validation**: All user inputs validated and sanitized
- **No Hardcoded Secrets**: Environment-based configuration
- **Docker Security**: Non-root containers with minimal attack surface
- **Dependency Scanning**: Automated vulnerability detection

### Privacy Protection
- **Anonymous Analytics**: Usage statistics with no personally identifiable information
- **Local Data Storage**: All task data stored locally in `~/.critical-claude/`
- **No External Calls**: Core functionality works completely offline
- **Configurable Tracking**: Analytics can be disabled via configuration

## 🚀 CI/CD & Deployment

### Automated Pipeline
- **GitHub Actions**: Comprehensive CI/CD with multiple quality gates
- **Multi-Node Testing**: Node.js 18, 20, 22 compatibility
- **Security Scanning**: Snyk, CodeQL, and Trivy for containers
- **Performance Monitoring**: Automated benchmarks with regression alerts
- **Docker Publishing**: Multi-arch container images

### Deployment Options
```bash
# Development with live reload
docker-compose --profile dev up

# Production deployment
docker-compose up critical-claude

# Kubernetes deployment (see docs/KUBERNETES.md)
kubectl apply -f k8s/

# Health monitoring
cc verify --health
node scripts/health-check.js
```

## 📚 Documentation

### Comprehensive Guides
- 🎮 **[Keyboard Shortcuts](docs/KEYBOARD_SHORTCUTS.md)** - Complete shortcuts reference
- 🐳 **[Docker Guide](docs/DOCKER.md)** - Containerization and deployment
- 🔄 **[CI/CD Pipeline](docs/CI_CD.md)** - Automated testing and deployment
- 🔍 **[Installation Verification](docs/INSTALLATION_VERIFICATION.md)** - Health checks and troubleshooting
- 📋 **[Quick Reference](docs/QUICK_REFERENCE.md)** - Essential commands cheat sheet

### API Documentation
- **Domain Models**: Complete TypeScript interfaces and entity definitions
- **Use Case Documentation**: Application service contracts and examples
- **CLI Reference**: Comprehensive command documentation with examples

## 🎯 Use Cases

### Software Development Teams
```bash
# Sprint planning
cc task template agile-sprint --sprint-length 2weeks --team-size 5

# Bug tracking
cc task create --title "Fix login validation" --priority critical --labels bug,security

# Code review workflow
cc task list --assignee reviewer@team.com --status pending_review
```

### Project Management
```bash
# Project tracking
cc task export --format csv --file project-status.csv

# Team analytics
cc analytics stats | grep "task create"

# Milestone management
cc task list --labels milestone --status todo
```

### Personal Productivity
```bash
# Daily task management
cc viewer  # Interactive task management

# Weekly reviews
cc task export --format markdown --file weekly-review.md

# Goal tracking
cc task list --priority high --status in_progress
```

## 🤝 Contributing

### Development Setup
```bash
# Clone and setup
git clone https://github.com/critical-claude/critical-claude.git
cd critical-claude
npm install
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

### Contribution Guidelines
- **Domain-Driven Design**: Follow DDD principles and maintain clean architecture
- **Test Coverage**: Maintain minimum 70% test coverage
- **Security First**: All inputs validated, no secrets in code
- **Performance**: Benchmark critical paths and avoid regressions
- **Documentation**: Update relevant docs with new features

## 📊 Performance Benchmarks

### Current Performance (v2.3.0)
- **Task Creation**: ~45ms average
- **Task Listing**: ~125ms for 1000 tasks
- **Export Operations**: ~300ms for 1000 tasks
- **Viewer Startup**: ~800ms with large datasets
- **Memory Usage**: ~256MB baseline, ~512MB with large datasets

### Performance Targets
- **Basic Operations**: < 100ms (CREATE, READ, UPDATE, DELETE)
- **Bulk Operations**: < 500ms for 1000 items
- **Interactive Response**: < 50ms for UI feedback
- **Memory Efficiency**: < 1GB for 10,000 tasks

## 🐛 Troubleshooting

### Common Issues

**Installation Problems**
```bash
# Verify Node.js version
node --version  # Should be >= 18

# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Performance Issues**
```bash
# Clear data directory
rm -rf ~/.critical-claude/tasks/*

# Run performance benchmark
npm run benchmark
```

**Docker Issues**
```bash
# Clean Docker cache
docker system prune -f

# Rebuild image
docker build --no-cache -t critical-claude .
```

### Getting Help
- 🔍 **Run Diagnostics**: `cc verify --verbose`
- 📖 **Check Documentation**: Complete guides in `docs/` directory
- 🐛 **Report Issues**: GitHub Issues with diagnostic output
- 💬 **Community Support**: Discussions and Q&A

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- **Domain-Driven Design** patterns inspired by Eric Evans
- **Terminal UI** built with blessed and custom ANSI rendering
- **Vim-style Navigation** following standard Vim conventions
- **Docker Security** following OWASP container security guidelines

---

<div align="center">

**Ready to supercharge your task management?**

```bash
npm install -g critical-claude
cc task create --title "My first Critical Claude task" --priority high
```

[📖 Documentation](docs/) • [🐳 Docker Hub](https://hub.docker.com/r/critical-claude/critical-claude) • [💬 Discussions](https://github.com/critical-claude/critical-claude/discussions) • [🐛 Issues](https://github.com/critical-claude/critical-claude/issues)

</div>