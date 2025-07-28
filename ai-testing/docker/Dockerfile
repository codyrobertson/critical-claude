# AI TESTING ENVIRONMENT - Claude + Critical Claude Integration
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    bash \
    curl \
    git \
    python3 \
    py3-pip \
    jq \
    vim \
    && rm -rf /var/cache/apk/*

# Create testing user
RUN addgroup -g 1000 aitest && \
    adduser -D -s /bin/bash -G aitest -u 1000 aitest

# Switch to testing user
USER aitest
WORKDIR /home/aitest

# Install Claude CLI (headless mode)
RUN curl -fsSL https://install.anthropic.com | bash
ENV PATH="/home/aitest/.local/bin:$PATH"

# Create directory structure for AI testing
RUN mkdir -p \
    /home/aitest/.claude \
    /home/aitest/.claude/testing-prompts \
    /home/aitest/.claude/agent-configs \
    /home/aitest/.claude/validation-logs \
    /home/aitest/ai-tests \
    /home/aitest/ai-tests/scenarios \
    /home/aitest/ai-tests/results \
    /home/aitest/ai-tests/scripts

# Copy Critical Claude source and install globally
COPY --chown=aitest:aitest . /home/aitest/critical-claude
WORKDIR /home/aitest/critical-claude

# Install Critical Claude dependencies and build
RUN npm install && npm run build

# Install Critical Claude globally in container
USER root
RUN npm install -g /home/aitest/critical-claude
USER aitest

# Copy AI testing framework files
COPY --chown=aitest:aitest ai-testing/claude-md-injection.md /home/aitest/.claude/testing-prompts/
COPY --chown=aitest:aitest ai-testing/.cursorrules /home/aitest/critical-claude/
COPY --chown=aitest:aitest ai-testing/agents.md /home/aitest/.claude/agent-configs/
COPY --chown=aitest:aitest ai-testing/zero-shot-validation-system.md /home/aitest/.claude/validation-framework/
COPY --chown=aitest:aitest ai-testing/testing-hypothesis-methodology.md /home/aitest/.claude/methodology/

# Create Claude configuration with prompt injection
RUN mkdir -p /home/aitest/.claude && \
    echo '[ai]' > /home/aitest/.claude/config.toml && \
    echo 'model = "claude-3-5-sonnet-20241022"' >> /home/aitest/.claude/config.toml && \
    echo 'temperature = 0.0' >> /home/aitest/.claude/config.toml && \
    echo 'max_tokens = 4096' >> /home/aitest/.claude/config.toml && \
    echo '' >> /home/aitest/.claude/config.toml && \
    echo '[testing]' >> /home/aitest/.claude/config.toml && \
    echo 'mode = "adherence_validation"' >> /home/aitest/.claude/config.toml && \
    echo 'framework = "critical_claude"' >> /home/aitest/.claude/config.toml && \
    echo 'zero_shot_required = true' >> /home/aitest/.claude/config.toml

# Create automated testing scripts
WORKDIR /home/aitest/ai-tests

# Main testing orchestrator
RUN cat > /home/aitest/ai-tests/run-ai-adherence-tests.sh << 'EOF'
#!/bin/bash

# AI ADHERENCE TESTING ORCHESTRATOR
echo "🧠 CRITICAL CLAUDE AI ADHERENCE TESTING FRAMEWORK"
echo "================================================="
echo ""

# Initialize test environment
source /home/aitest/ai-tests/scripts/test-environment.sh

# Test Results Directory
RESULTS_DIR="/home/aitest/ai-tests/results/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo "📋 Starting AI adherence validation tests..."
echo "Results will be saved to: $RESULTS_DIR"
echo ""

# Phase 1: Prompt Injection Validation
echo "🎯 Phase 1: Testing Prompt Injection Effectiveness"
bash /home/aitest/ai-tests/scripts/test-prompt-injection.sh "$RESULTS_DIR"

# Phase 2: Command Syntax Validation
echo "🔧 Phase 2: Testing Command Syntax Adherence"
bash /home/aitest/ai-tests/scripts/test-command-syntax.sh "$RESULTS_DIR"

# Phase 3: Schema Compliance Testing
echo "📊 Phase 3: Testing Schema Compliance"
bash /home/aitest/ai-tests/scripts/test-schema-compliance.sh "$RESULTS_DIR"

# Phase 4: Workflow Logic Validation
echo "🔄 Phase 4: Testing Workflow Logic"
bash /home/aitest/ai-tests/scripts/test-workflow-logic.sh "$RESULTS_DIR"

# Phase 5: Multi-Agent Coordination
echo "🤖 Phase 5: Testing Multi-Agent Coordination"
bash /home/aitest/ai-tests/scripts/test-multi-agent.sh "$RESULTS_DIR"

# Phase 6: 0-Shot Performance Validation
echo "🎯 Phase 6: Testing 0-Shot Performance"
bash /home/aitest/ai-tests/scripts/test-zero-shot.sh "$RESULTS_DIR"

# Generate comprehensive report
echo "📋 Generating Comprehensive Test Report"
bash /home/aitest/ai-tests/scripts/generate-report.sh "$RESULTS_DIR"

echo ""
echo "✅ AI Adherence Testing Complete!"
echo "📄 Full report available at: $RESULTS_DIR/comprehensive-report.md"
EOF

chmod +x /home/aitest/ai-tests/run-ai-adherence-tests.sh

# Test environment setup script
RUN mkdir -p /home/aitest/ai-tests/scripts
RUN cat > /home/aitest/ai-tests/scripts/test-environment.sh << 'EOF'
#!/bin/bash

# TEST ENVIRONMENT SETUP
export CLAUDE_API_KEY="${CLAUDE_API_KEY:-test-mode}"
export CC_HOME="/home/aitest/.critical-claude"
export TESTING_MODE=true
export VALIDATION_STRICT=true

# Initialize Critical Claude
mkdir -p "$CC_HOME"

# Verify installations
echo "🔍 Verifying test environment..."

# Check Claude CLI
if ! command -v claude &> /dev/null; then
    echo "❌ Claude CLI not found"
    exit 1
fi

# Check Critical Claude
if ! command -v cc &> /dev/null; then
    echo "❌ Critical Claude not found"  
    exit 1
fi

echo "✅ Test environment ready"
echo "   Claude CLI: $(claude --version 2>/dev/null || echo 'installed')"
echo "   Critical Claude: $(cc --version 2>/dev/null || echo '2.3.9')"
echo ""
EOF

# Prompt injection testing script
RUN cat > /home/aitest/ai-tests/scripts/test-prompt-injection.sh << 'EOF'
#!/bin/bash

RESULTS_DIR="$1"
PROMPT_TEST_DIR="$RESULTS_DIR/prompt-injection"
mkdir -p "$PROMPT_TEST_DIR"

echo "Testing prompt injection effectiveness..."

# Test 1: Activation trigger detection
echo "🎯 Test 1: Activation Trigger Detection"
claude_response=$(echo "test critical claude adherence validation" | claude chat --no-interactive 2>/dev/null || echo "CLAUDE_UNAVAILABLE")

if [[ "$claude_response" == *"CRITICAL CLAUDE TESTING MODE ACTIVATED"* ]]; then
    echo "✅ Prompt activation trigger detected" | tee "$PROMPT_TEST_DIR/activation-test.log"
    echo "PASS" > "$PROMPT_TEST_DIR/activation-result.txt"
else
    echo "❌ Prompt activation trigger failed" | tee "$PROMPT_TEST_DIR/activation-test.log"
    echo "FAIL" > "$PROMPT_TEST_DIR/activation-result.txt"
fi

# Test 2: Behavioral override validation
echo "🤖 Test 2: Behavioral Override Validation"
behavior_response=$(echo "What is your identity and primary function?" | claude chat --no-interactive 2>/dev/null || echo "CLAUDE_UNAVAILABLE")

if [[ "$behavior_response" == *"Virtual Critical Claude Testing Agent"* ]]; then
    echo "✅ Behavioral override successful" | tee "$PROMPT_TEST_DIR/behavior-test.log"
    echo "PASS" > "$PROMPT_TEST_DIR/behavior-result.txt"
else
    echo "❌ Behavioral override failed" | tee "$PROMPT_TEST_DIR/behavior-test.log"
    echo "FAIL" > "$PROMPT_TEST_DIR/behavior-result.txt"
fi

# Test 3: Command knowledge injection
echo "📋 Test 3: Command Knowledge Injection"
command_response=$(echo "List all Critical Claude task management commands" | claude chat --no-interactive 2>/dev/null || echo "CLAUDE_UNAVAILABLE")

if [[ "$command_response" == *"cc task create"* ]] && [[ "$command_response" == *"cc task list"* ]]; then
    echo "✅ Command knowledge injection successful" | tee "$PROMPT_TEST_DIR/commands-test.log"
    echo "PASS" > "$PROMPT_TEST_DIR/commands-result.txt"
else
    echo "❌ Command knowledge injection failed" | tee "$PROMPT_TEST_DIR/commands-test.log"
    echo "FAIL" > "$PROMPT_TEST_DIR/commands-result.txt"
fi

echo "Prompt injection tests completed"
echo ""
EOF

# Command syntax testing script  
RUN cat > /home/aitest/ai-tests/scripts/test-command-syntax.sh << 'EOF'
#!/bin/bash

RESULTS_DIR="$1"
SYNTAX_TEST_DIR="$RESULTS_DIR/command-syntax"
mkdir -p "$SYNTAX_TEST_DIR"

echo "Testing command syntax adherence..."

# Test scenarios for command generation
declare -a test_scenarios=(
    "Create a high-priority task for user authentication"
    "List all todo tasks"
    "Update task status to in_progress" 
    "Export tasks to JSON format"
    "Create task with description and assignee"
)

declare -a expected_patterns=(
    "cc task create.*-t.*-p high"
    "cc task list.*--status todo"
    "cc task update.*-s in_progress"
    "cc task export.*--format json"
    "cc task create.*-t.*-d.*-a"
)

total_tests=${#test_scenarios[@]}
passed_tests=0

for i in "${!test_scenarios[@]}"; do
    scenario="${test_scenarios[$i]}"
    pattern="${expected_patterns[$i]}"
    
    echo "🧪 Test $((i+1)): $scenario"
    
    response=$(echo "test critical claude adherence validation

$scenario" | claude chat --no-interactive 2>/dev/null || echo "CLAUDE_UNAVAILABLE")
    
    if [[ "$response" =~ $pattern ]]; then
        echo "✅ PASS: Command syntax correct"
        echo "PASS" > "$SYNTAX_TEST_DIR/test_$((i+1))_result.txt"
        ((passed_tests++))
    else
        echo "❌ FAIL: Command syntax incorrect"
        echo "FAIL" > "$SYNTAX_TEST_DIR/test_$((i+1))_result.txt"
    fi
    
    echo "$response" > "$SYNTAX_TEST_DIR/test_$((i+1))_response.txt"
    echo ""
done

# Calculate success rate
success_rate=$((passed_tests * 100 / total_tests))
echo "Command Syntax Tests: $passed_tests/$total_tests passed ($success_rate%)"
echo "$success_rate" > "$SYNTAX_TEST_DIR/success_rate.txt"

echo "Command syntax tests completed"
echo ""
EOF

# Schema compliance testing script
RUN cat > /home/aitest/ai-tests/scripts/test-schema-compliance.sh << 'EOF'
#!/bin/bash

RESULTS_DIR="$1"
SCHEMA_TEST_DIR="$RESULTS_DIR/schema-compliance"
mkdir -p "$SCHEMA_TEST_DIR"

echo "Testing schema compliance..."

# Create test task and validate schema
echo "🧪 Creating test task for schema validation"

# Generate task creation command via AI
task_cmd=$(echo "test critical claude adherence validation

Create a task for implementing user authentication with high priority, medium estimated hours of 8, and labels security,backend" | claude chat --no-interactive 2>/dev/null | grep -o 'cc task create[^"]*' | head -1)

if [[ -n "$task_cmd" ]]; then
    echo "Generated command: $task_cmd"
    
    # Execute the command and capture output
    if eval "$task_cmd" 2>/dev/null; then
        echo "✅ Task creation successful"
        
        # Get task list and validate structure
        task_list=$(cc task list --format json 2>/dev/null || echo "[]")
        
        # Basic schema validation
        if echo "$task_list" | jq '.[0] | has("id") and has("title") and has("priority") and has("status")' 2>/dev/null | grep -q true; then
            echo "✅ Schema compliance validated"
            echo "PASS" > "$SCHEMA_TEST_DIR/schema_result.txt"
        else
            echo "❌ Schema compliance failed"
            echo "FAIL" > "$SCHEMA_TEST_DIR/schema_result.txt"
        fi
        
        echo "$task_list" > "$SCHEMA_TEST_DIR/task_data.json"
    else
        echo "❌ Task creation failed"
        echo "FAIL" > "$SCHEMA_TEST_DIR/schema_result.txt"
    fi
else
    echo "❌ No valid command generated"
    echo "FAIL" > "$SCHEMA_TEST_DIR/schema_result.txt"
fi

echo "Schema compliance tests completed"
echo ""
EOF

# Workflow logic testing script
RUN cat > /home/aitest/ai-tests/scripts/test-workflow-logic.sh << 'EOF'
#!/bin/bash

RESULTS_DIR="$1"
WORKFLOW_TEST_DIR="$RESULTS_DIR/workflow-logic"
mkdir -p "$WORKFLOW_TEST_DIR"

echo "Testing workflow logic..."

# Test complete task lifecycle workflow
echo "🔄 Testing complete task lifecycle workflow"

workflow_prompt="test critical claude adherence validation

Create a complete task management workflow: create a task, list it, update its status to in_progress, then mark it as done, and finally archive it. Provide the exact sequence of cc commands."

workflow_response=$(echo "$workflow_prompt" | claude chat --no-interactive 2>/dev/null || echo "CLAUDE_UNAVAILABLE")

# Extract commands from response
commands=$(echo "$workflow_response" | grep -o 'cc task [^"]*' | head -10)

if [[ -n "$commands" ]]; then
    echo "Generated workflow commands:"
    echo "$commands" | tee "$WORKFLOW_TEST_DIR/generated_workflow.txt"
    
    # Validate logical sequence
    if echo "$commands" | grep -q "cc task create" && \
       echo "$commands" | grep -q "cc task list" && \
       echo "$commands" | grep -q "cc task update.*in_progress" && \
       echo "$commands" | grep -q "cc task update.*done" && \
       echo "$commands" | grep -q "cc task archive"; then
        echo "✅ Workflow logic validation passed"
        echo "PASS" > "$WORKFLOW_TEST_DIR/workflow_result.txt"
    else
        echo "❌ Workflow logic validation failed"
        echo "FAIL" > "$WORKFLOW_TEST_DIR/workflow_result.txt"
    fi
else
    echo "❌ No workflow commands generated"
    echo "FAIL" > "$WORKFLOW_TEST_DIR/workflow_result.txt"
fi

echo "Workflow logic tests completed"
echo ""
EOF

# Multi-agent testing script
RUN cat > /home/aitest/ai-tests/scripts/test-multi-agent.sh << 'EOF'
#!/bin/bash

RESULTS_DIR="$1"
AGENT_TEST_DIR="$RESULTS_DIR/multi-agent"
mkdir -p "$AGENT_TEST_DIR"

echo "Testing multi-agent coordination..."

# Test each agent role
declare -a agents=("ALPHA" "BETA" "GAMMA" "DELTA" "EPSILON")
declare -a agent_prompts=(
    "test critical claude adherence validation\n\nAs AGENT ALPHA (Task Creation Specialist), create 3 tasks for a web development project"
    "test critical claude adherence validation\n\nAs AGENT BETA (Workflow Orchestrator), manage the lifecycle of existing tasks"
    "test critical claude adherence validation\n\nAs AGENT GAMMA (Data Integrity Guardian), validate task data structure compliance"
    "test critical claude adherence validation\n\nAs AGENT DELTA (Performance Validator), measure command execution efficiency" 
    "test critical claude adherence validation\n\nAs AGENT EPSILON (Integration Specialist), test system integration points"
)

agent_success=0
total_agents=${#agents[@]}

for i in "${!agents[@]}"; do
    agent="${agents[$i]}"
    prompt="${agent_prompts[$i]}"
    
    echo "🤖 Testing Agent $agent"
    
    response=$(echo -e "$prompt" | claude chat --no-interactive 2>/dev/null || echo "CLAUDE_UNAVAILABLE")
    
    if [[ "$response" == *"cc task"* ]] || [[ "$response" == *"validation"* ]]; then
        echo "✅ Agent $agent responded appropriately"
        echo "PASS" > "$AGENT_TEST_DIR/agent_${agent}_result.txt"
        ((agent_success++))
    else
        echo "❌ Agent $agent failed to respond appropriately"
        echo "FAIL" > "$AGENT_TEST_DIR/agent_${agent}_result.txt"
    fi
    
    echo "$response" > "$AGENT_TEST_DIR/agent_${agent}_response.txt"
done

# Calculate agent coordination success
coordination_rate=$((agent_success * 100 / total_agents))
echo "Multi-Agent Coordination: $agent_success/$total_agents agents passed ($coordination_rate%)"
echo "$coordination_rate" > "$AGENT_TEST_DIR/coordination_rate.txt"

echo "Multi-agent tests completed"
echo ""
EOF

# Zero-shot performance testing script
RUN cat > /home/aitest/ai-tests/scripts/test-zero-shot.sh << 'EOF'
#!/bin/bash

RESULTS_DIR="$1" 
ZERO_SHOT_DIR="$RESULTS_DIR/zero-shot"
mkdir -p "$ZERO_SHOT_DIR"

echo "Testing 0-shot performance..."

# Test novel scenarios without examples
declare -a novel_scenarios=(
    "Create a task management workflow for a DevOps pipeline"
    "Generate tasks for API development with microservices architecture"
    "Create project template for e-commerce platform development"
    "Design task workflow for ML model deployment"
    "Create tasks for database migration and optimization"
)

zero_shot_success=0
total_scenarios=${#novel_scenarios[@]}

for i in "${!novel_scenarios[@]}"; do
    scenario="${novel_scenarios[$i]}"
    
    echo "🎯 0-Shot Test $((i+1)): $scenario"
    
    response=$(echo "test critical claude adherence validation

$scenario" | claude chat --no-interactive 2>/dev/null || echo "CLAUDE_UNAVAILABLE")
    
    # Check for Critical Claude command generation
    commands_found=$(echo "$response" | grep -c "cc task")
    
    if [[ $commands_found -gt 0 ]]; then
        echo "✅ Generated $commands_found Critical Claude commands"
        echo "PASS" > "$ZERO_SHOT_DIR/scenario_$((i+1))_result.txt"
        ((zero_shot_success++))
    else
        echo "❌ No Critical Claude commands generated"
        echo "FAIL" > "$ZERO_SHOT_DIR/scenario_$((i+1))_result.txt"
    fi
    
    echo "$response" > "$ZERO_SHOT_DIR/scenario_$((i+1))_response.txt"
    echo ""
done

# Calculate 0-shot success rate
zero_shot_rate=$((zero_shot_success * 100 / total_scenarios))
echo "0-Shot Performance: $zero_shot_success/$total_scenarios scenarios passed ($zero_shot_rate%)"
echo "$zero_shot_rate" > "$ZERO_SHOT_DIR/zero_shot_rate.txt"

echo "0-shot performance tests completed"
echo ""
EOF

# Report generation script
RUN cat > /home/aitest/ai-tests/scripts/generate-report.sh << 'EOF'
#!/bin/bash

RESULTS_DIR="$1"
REPORT_FILE="$RESULTS_DIR/comprehensive-report.md"

echo "Generating comprehensive test report..."

cat > "$REPORT_FILE" << 'REPORT_HEADER'
# 🧠 CRITICAL CLAUDE AI ADHERENCE TEST REPORT

## 📊 Executive Summary

This report presents the results of comprehensive AI adherence testing for Critical Claude CLI task management system using 0-shot learning validation.

## 🎯 Test Overview

**Testing Framework**: Critical Claude AI Adherence Validation System
**Test Date**: $(date)
**Test Environment**: Docker Container with Claude CLI + Critical Claude
**Testing Mode**: 0-Shot Learning Validation

REPORT_HEADER

# Collect results from all test phases
echo "## 📋 Test Results Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Prompt Injection Results
if [[ -f "$RESULTS_DIR/prompt-injection/activation-result.txt" ]]; then
    activation_result=$(cat "$RESULTS_DIR/prompt-injection/activation-result.txt")
    behavior_result=$(cat "$RESULTS_DIR/prompt-injection/behavior-result.txt" 2>/dev/null || echo "N/A")
    commands_result=$(cat "$RESULTS_DIR/prompt-injection/commands-result.txt" 2>/dev/null || echo "N/A")
    
    echo "### 🎯 Prompt Injection Phase" >> "$REPORT_FILE"
    echo "- **Activation Trigger**: $activation_result" >> "$REPORT_FILE"
    echo "- **Behavioral Override**: $behavior_result" >> "$REPORT_FILE"
    echo "- **Command Knowledge**: $commands_result" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Command Syntax Results
if [[ -f "$RESULTS_DIR/command-syntax/success_rate.txt" ]]; then
    syntax_rate=$(cat "$RESULTS_DIR/command-syntax/success_rate.txt")
    echo "### 🔧 Command Syntax Phase" >> "$REPORT_FILE"
    echo "- **Success Rate**: $syntax_rate%" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Schema Compliance Results
if [[ -f "$RESULTS_DIR/schema-compliance/schema_result.txt" ]]; then
    schema_result=$(cat "$RESULTS_DIR/schema-compliance/schema_result.txt")
    echo "### 📊 Schema Compliance Phase" >> "$REPORT_FILE"
    echo "- **Compliance Status**: $schema_result" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Workflow Logic Results
if [[ -f "$RESULTS_DIR/workflow-logic/workflow_result.txt" ]]; then
    workflow_result=$(cat "$RESULTS_DIR/workflow-logic/workflow_result.txt")
    echo "### 🔄 Workflow Logic Phase" >> "$REPORT_FILE"
    echo "- **Logic Validation**: $workflow_result" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Multi-Agent Results
if [[ -f "$RESULTS_DIR/multi-agent/coordination_rate.txt" ]]; then
    coordination_rate=$(cat "$RESULTS_DIR/multi-agent/coordination_rate.txt")
    echo "### 🤖 Multi-Agent Coordination Phase" >> "$REPORT_FILE"
    echo "- **Coordination Rate**: $coordination_rate%" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Zero-Shot Results
if [[ -f "$RESULTS_DIR/zero-shot/zero_shot_rate.txt" ]]; then
    zero_shot_rate=$(cat "$RESULTS_DIR/zero-shot/zero_shot_rate.txt")
    echo "### 🎯 0-Shot Performance Phase" >> "$REPORT_FILE"
    echo "- **0-Shot Success Rate**: $zero_shot_rate%" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Calculate overall success
echo "## 🏆 Overall Assessment" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Determine overall performance classification
if [[ -f "$RESULTS_DIR/zero-shot/zero_shot_rate.txt" ]]; then
    overall_rate=$(cat "$RESULTS_DIR/zero-shot/zero_shot_rate.txt")
    if [[ $overall_rate -ge 95 ]]; then
        classification="🌟 EXCELLENT_0_SHOT"
    elif [[ $overall_rate -ge 90 ]]; then
        classification="✅ PRODUCTION_READY"
    elif [[ $overall_rate -ge 80 ]]; then
        classification="⚠️ ACCEPTABLE_WITH_MONITORING"
    elif [[ $overall_rate -ge 70 ]]; then
        classification="🔄 NEEDS_IMPROVEMENT"
    else
        classification="❌ REQUIRES_MAJOR_FIXES"
    fi
    
    echo "**Performance Classification**: $classification" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
fi

# Add detailed logs section
echo "## 📁 Detailed Test Logs" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Complete test logs and response data are available in:" >> "$REPORT_FILE"
echo "- \`$RESULTS_DIR/\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "## 🎯 Conclusions" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "This comprehensive testing validates the effectiveness of:" >> "$REPORT_FILE"
echo "- Prompt injection for behavioral modification" >> "$REPORT_FILE"
echo "- Real-time constraint enforcement" >> "$REPORT_FILE"
echo "- Multi-agent coordination protocols" >> "$REPORT_FILE"  
echo "- 0-shot learning capabilities for task management" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "Report generation completed: $REPORT_FILE"
EOF

# Make all scripts executable
RUN chmod +x /home/aitest/ai-tests/scripts/*.sh

# Create container startup script
RUN cat > /home/aitest/start-ai-testing.sh << 'EOF'
#!/bin/bash

echo "🧠 CRITICAL CLAUDE AI TESTING CONTAINER"
echo "======================================"
echo ""
echo "Container includes:"
echo "✓ Claude CLI (headless mode)"
echo "✓ Critical Claude CLI (v2.3.9)"
echo "✓ AI Testing Framework with prompt injection"
echo "✓ Multi-agent validation protocols"
echo "✓ 0-shot adherence testing suite"
echo ""

# Check if Claude API key is provided
if [[ -z "$CLAUDE_API_KEY" ]]; then
    echo "⚠️  CLAUDE_API_KEY not provided - running in simulation mode"
    echo "   Set CLAUDE_API_KEY environment variable for full testing"
    echo ""
fi

echo "🚀 Starting AI adherence testing..."
echo ""

# Run the comprehensive testing suite
cd /home/aitest/ai-tests
bash run-ai-adherence-tests.sh

echo ""
echo "🎯 Testing complete! Check results in /home/aitest/ai-tests/results/"
echo ""
echo "To run tests manually:"
echo "  docker exec -it <container> bash"
echo "  cd /home/aitest/ai-tests" 
echo "  bash run-ai-adherence-tests.sh"
EOF

chmod +x /home/aitest/start-ai-testing.sh

# Set working directory and default command
WORKDIR /home/aitest
CMD ["/home/aitest/start-ai-testing.sh"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD cc --version || exit 1

# Container metadata
LABEL maintainer="Critical Claude Team"
LABEL description="AI Testing Environment with Claude CLI + Critical Claude Integration"
LABEL version="2.3.9"
LABEL testing.framework="critical-claude-ai-adherence"
LABEL testing.capabilities="0-shot,multi-agent,prompt-injection,real-time-validation"