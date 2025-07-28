# 🐳 CRITICAL CLAUDE AI TESTING DOCKER ENVIRONMENT

## 🎯 Overview

This Docker environment provides a complete testing infrastructure for validating AI adherence to Critical Claude CLI task management patterns through 0-shot learning validation.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│             Docker Environment              │
├─────────────────────────────────────────────┤
│  📦 ai-testing-environment (main)          │
│  ├── Claude CLI (headless)                 │
│  ├── Critical Claude CLI (v2.3.9)          │
│  ├── AI Testing Framework                  │
│  ├── Prompt Injection System               │
│  ├── Multi-Agent Validation                │
│  └── 0-Shot Adherence Testing              │
├─────────────────────────────────────────────┤
│  🌐 results-viewer (optional)              │
│  └── Nginx server for result viewing       │
├─────────────────────────────────────────────┤
│  📊 log-aggregator (optional)              │
│  └── Fluent Bit for log collection         │
└─────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Option 1: Automated Build and Test
```bash
# Run complete testing suite
./ai-testing/docker/build-and-test.sh
```

### Option 2: Manual Docker Compose
```bash
# Set Claude API key (optional - will run in simulation mode without)
export CLAUDE_API_KEY="your-api-key-here"

# Build and start environment
docker-compose -f ai-testing/docker/docker-compose.yml up --build

# View results
open http://localhost:8080/results/
```

### Option 3: Direct Docker Build
```bash
# Build image
docker build -f ai-testing/docker/Dockerfile -t critical-claude/ai-testing .

# Run container
docker run -it \
  -e CLAUDE_API_KEY="your-api-key" \
  -v $(pwd)/results:/home/aitest/ai-tests/results \
  critical-claude/ai-testing
```

## 🧪 Testing Framework Components

### Prompt Injection System
- **Location**: `/home/aitest/.claude/testing-prompts/`
- **Purpose**: Auto-inject Critical Claude testing behavior
- **Files**: 
  - `claude-md-injection.md` - Core behavioral prompts
  - `.cursorrules` - Real-time constraint enforcement

### Multi-Agent Framework
- **Location**: `/home/aitest/.claude/agent-configs/`
- **Agents**:
  - **ALPHA**: Task Creation Specialist
  - **BETA**: Workflow Orchestrator
  - **GAMMA**: Data Integrity Guardian
  - **DELTA**: Performance Validator
  - **EPSILON**: Integration Specialist

### Test Scenarios
```bash
# Inside container
cd /home/aitest/ai-tests

# Run all tests
bash run-ai-adherence-tests.sh

# Run specific test phases
bash scripts/test-prompt-injection.sh
bash scripts/test-command-syntax.sh
bash scripts/test-schema-compliance.sh
bash scripts/test-workflow-logic.sh
bash scripts/test-multi-agent.sh
bash scripts/test-zero-shot.sh
```

## 📊 Test Results

### Automated Results Collection
Results are automatically saved to timestamped directories:
```
/home/aitest/ai-tests/results/
├── 20241201_143022/           # Timestamp format: YYYYMMDD_HHMMSS
│   ├── comprehensive-report.md
│   ├── prompt-injection/
│   ├── command-syntax/
│   ├── schema-compliance/
│   ├── workflow-logic/
│   ├── multi-agent/
│   └── zero-shot/
```

### Results Viewer
Access via web interface at `http://localhost:8080/results/` when using docker-compose.

### Key Metrics Tracked
- **Command Syntax Accuracy**: 0-100% perfect syntax match
- **Schema Compliance Rate**: 0-100% data model adherence
- **Workflow Logic Correctness**: 0-100% logical operation order
- **0-Shot Performance**: Success without prior examples
- **Multi-Agent Coordination**: Agent interaction effectiveness

## 🔧 Configuration

### Environment Variables
```bash
# Claude API Configuration
CLAUDE_API_KEY=your-api-key           # Required for full testing
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_TEMPERATURE=0.0
CLAUDE_MAX_TOKENS=4096

# Testing Configuration
TESTING_MODE=true
VALIDATION_STRICT=true
ZERO_SHOT_REQUIRED=true
AUTO_INJECT_PROMPTS=true

# Critical Claude Configuration
CC_HOME=/home/aitest/.critical-claude
CC_LOG_LEVEL=info
CC_ANALYTICS=false
```

### Volume Mounts
```yaml
volumes:
  - ai-test-results:/home/aitest/ai-tests/results
  - ai-test-logs:/home/aitest/.claude/validation-logs
  - ./scenarios:/home/aitest/ai-tests/external-scenarios:ro
```

## 🧠 AI Testing Validation

### Prompt Activation Test
```bash
# Test trigger phrase
echo "test critical claude adherence validation" | claude chat --no-interactive

# Expected response should contain:
# "CRITICAL CLAUDE TESTING MODE ACTIVATED"
```

### Command Generation Test
```bash
# Test command generation
echo "Create a high-priority task for user authentication" | claude chat --no-interactive

# Expected output should contain:
# cc task create -t "Implement user authentication" -p high -s todo
```

### Workflow Validation Test
```bash
# Test complete workflow
echo "Create complete task lifecycle workflow" | claude chat --no-interactive

# Should generate sequence:
# cc task create...
# cc task list...
# cc task update...
# cc task archive...
```

## 📈 Performance Classifications

Based on composite testing scores:

- **🌟 EXCELLENT_0_SHOT** (≥95%): Perfect AI adherence
- **✅ PRODUCTION_READY** (≥90%): Ready for production use
- **⚠️ ACCEPTABLE_WITH_MONITORING** (≥80%): Usable with oversight
- **🔄 NEEDS_IMPROVEMENT** (≥70%): Requires optimization
- **❌ REQUIRES_MAJOR_FIXES** (<70%): Significant issues found

## 🚨 Troubleshooting

### Container Won't Start
```bash
# Check Docker logs
docker-compose -f ai-testing/docker/docker-compose.yml logs

# Rebuild image
docker-compose -f ai-testing/docker/docker-compose.yml build --no-cache
```

### Claude API Issues
```bash
# Test Claude CLI installation
docker exec critical-claude-ai-testing claude --version

# Check API key configuration
docker exec critical-claude-ai-testing env | grep CLAUDE
```

### Critical Claude Issues
```bash
# Test Critical Claude installation
docker exec critical-claude-ai-testing cc --version

# Check Critical Claude health
docker exec critical-claude-ai-testing cc verify --health
```

### No Test Results
```bash
# Check if tests ran
docker exec critical-claude-ai-testing ls -la /home/aitest/ai-tests/results/

# Manual test execution
docker exec -it critical-claude-ai-testing bash
cd /home/aitest/ai-tests
bash run-ai-adherence-tests.sh
```

## 🔒 Security Considerations

- Container runs as non-root user (`aitest`)
- API keys are handled as environment variables
- No sensitive data is stored in the image
- Results are isolated in mounted volumes
- Network access is limited to testing requirements

## 📋 Manual Testing Commands

```bash
# Connect to container
docker exec -it critical-claude-ai-testing bash

# Test prompt injection
echo "test critical claude adherence validation" | claude chat --no-interactive

# Test command generation
echo "Create task for user authentication" | claude chat --no-interactive

# Test Critical Claude
cc task create -t "Test Task" -p high -s todo
cc task list
cc verify --health

# View test results
ls -la /home/aitest/ai-tests/results/
cat /home/aitest/ai-tests/results/*/comprehensive-report.md
```

## 🎯 Success Criteria

The testing framework validates:

1. **Prompt Injection Effectiveness**: AI responds to trigger phrases
2. **Behavioral Override Success**: AI adopts Critical Claude testing persona
3. **Command Syntax Mastery**: 100% accurate CLI command generation
4. **Schema Compliance**: Perfect adherence to data models
5. **Workflow Logic**: Logical operation sequences
6. **0-Shot Learning**: No reliance on prior examples
7. **Multi-Agent Coordination**: Successful agent interaction

## 📚 Additional Resources

- [AI Testing Framework Documentation](../README.md)
- [Prompt Injection System](../claude-md-injection.md)
- [Multi-Agent Framework](../agents.md)
- [Testing Methodology](../testing-hypothesis-methodology.md)
- [Validation System](../zero-shot-validation-system.md)

---

**🎯 Mission**: Achieve 100% AI adherence to Critical Claude CLI standards through comprehensive Docker-based testing infrastructure.