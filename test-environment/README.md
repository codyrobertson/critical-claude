# Critical Claude CLI - Docker Test Environment

This directory contains a comprehensive Docker-based testing environment for the Critical Claude CLI. It tests every aspect of the application in a fresh, isolated environment.

## 🧪 What Gets Tested

### Core CLI Functionality
- Package installation from npm
- Basic command help and navigation
- Version information and validation

### Task Management Operations
- ✅ Task creation (various configurations)
- ✅ Task listing and filtering  
- ✅ Task viewing and updates
- ✅ Task status changes
- ✅ Task deletion and archiving

### Data Management
- ✅ Export to JSON, CSV, Markdown
- ✅ Import from various formats
- ✅ Backup and restore operations
- ✅ Data integrity validation

### Template System
- ✅ Template listing and viewing
- ✅ Template creation and application
- ✅ Template variable substitution

### AI Integration
- ✅ AI task generation (`cc task ai`)
- ✅ AI research functionality (`cc task research`)
- ✅ Timeout handling for long operations

### Analytics & Monitoring
- ✅ Usage statistics tracking
- ✅ Analytics export functionality
- ✅ Performance monitoring

### Error Handling & Edge Cases
- ✅ Invalid command handling
- ✅ Missing parameter validation
- ✅ Empty state behavior
- ✅ Large dataset performance

### System Integration
- ✅ Keyboard shortcuts documentation
- ✅ Installation verification
- ✅ Multi-user scenarios

## 🚀 Running Tests

### Automated Test Suite
```bash
# Run complete test suite
docker-compose up critical-claude-test

# View test results
cat results/test-report.md
```

### Interactive Testing
```bash
# Start interactive container
docker-compose up -d critical-claude-interactive

# Connect to container
docker exec -it critical-claude-interactive /bin/bash

# Run individual tests
./test-scripts/run-all-tests.sh
./test-scripts/stress-test.sh
./test-scripts/sequential-test.sh
```

### Manual Testing
```bash
# Build and run container manually
docker build -t critical-claude-test .
docker run -it --rm -v $(pwd)/results:/test-env/results critical-claude-test

# Run specific test phases
docker run -it --rm critical-claude-test /test-env/test-scripts/stress-test.sh
```

## 📊 Test Results

Test results are automatically generated in the `results/` directory:

- `test-report.md` - Comprehensive test report
- `test-*.log` - Individual test logs
- `analytics-output.txt` - Analytics data
- `*-export.*` - Sample export files

## 🔧 Test Environment Details

### Container Specifications
- **Base Image:** node:20-alpine
- **User:** Non-root testuser
- **Package Manager:** npm (latest)
- **Dependencies:** bash, curl, git, vim, python3, make, g++

### Test Data
- `test-data/sample-tasks.json` - Sample task data for import testing
- Fresh npm installation of latest Critical Claude CLI
- Clean user environment with no existing configuration

### Test Coverage
- **Package Installation:** npm global install verification
- **Command Validation:** All CLI commands and options
- **Data Operations:** CRUD operations, import/export, backup/restore
- **AI Features:** Task generation, research functionality
- **Error Scenarios:** Invalid inputs, missing data, edge cases
- **Performance:** Stress testing with large datasets
- **Integration:** End-to-end workflow simulation

## 📋 Test Phases

1. **Package Installation** - npm install and binary verification
2. **Basic CLI Tests** - Help, version, command structure
3. **Task Management** - CRUD operations and workflow
4. **Data Management** - Export, import, backup operations
5. **Template System** - Template operations and creation
6. **Analytics Tests** - Statistics and reporting
7. **AI Integration** - AI-powered features (with timeouts)
8. **Error Handling** - Invalid inputs and edge cases
9. **System Integration** - Advanced features and utilities
10. **Advanced Features** - Complex workflows and integrations
11. **Cleanup & Edge Cases** - Cleanup operations and corner cases

## 🎯 Success Criteria

- ✅ All core commands execute without errors
- ✅ Data import/export maintains integrity
- ✅ AI features handle timeouts gracefully
- ✅ Error messages are clear and helpful
- ✅ Performance acceptable with large datasets
- ✅ Package installs correctly from npm

## 🐛 Troubleshooting

### Common Issues
- **Timeout Errors:** AI features may timeout in containers - this is expected
- **Permission Issues:** Ensure container runs as testuser, not root
- **Network Issues:** Some tests require internet access for npm install

### Debug Mode
```bash
# Run with debug output
docker run -it --rm -e DEBUG=1 critical-claude-test
```

### Logs
```bash
# View all test logs
docker run --rm -v $(pwd)/results:/test-env/results critical-claude-test cat /test-env/results/test-report.md
```

## 🚀 CI/CD Integration

This test environment can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Test Critical Claude CLI
  run: |
    cd test-environment
    docker-compose up critical-claude-test
    cat results/test-report.md
```