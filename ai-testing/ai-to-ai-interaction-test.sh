#!/bin/bash

# AI-TO-AI INTERACTION TESTING SUITE
# One AI acts as sophisticated user, tests Claude Code with detailed conversations

echo "🤖↔️🤖 AI-TO-AI CRITICAL CLAUDE INTERACTION TESTING"
echo "=================================================="

# API Key
export CLAUDE_API_KEY="${CLAUDE_API_KEY:-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}"

# Colors
G='\033[0;32m'  # Green
B='\033[0;34m'  # Blue  
Y='\033[1;33m'  # Yellow
R='\033[0;31m'  # Red
P='\033[0;35m'  # Purple
C='\033[0;36m'  # Cyan
NC='\033[0m'    # No Color

# Results directory
RESULTS_DIR="./ai-to-ai-results/$(date +%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo "📁 Results: $RESULTS_DIR"
echo ""

# AI User Persona - Creates sophisticated prompts for testing
generate_user_prompt() {
    local scenario="$1"
    local turn="$2"
    local context="$3"
    
    local user_prompt_template="You are an experienced senior software engineer testing a new AI-powered task management CLI called Critical Claude. You need to create realistic, detailed prompts that would test the system thoroughly.

**Your Role**: Senior Software Engineer with 10+ years experience
**Your Goal**: Test Critical Claude CLI comprehensively through realistic project scenarios
**Your Style**: Professional, specific, demanding high-quality results

**Testing Scenario**: $scenario
**Conversation Turn**: $turn
**Previous Context**: $context

**Your Task**: Generate a realistic, detailed prompt that a senior engineer would use to test Critical Claude CLI. The prompt should:

1. Be specific and detailed (not vague)
2. Include realistic project requirements 
3. Expect professional-quality task breakdown
4. Test multiple Critical Claude features
5. Sound like something you'd actually ask an AI assistant

**IMPORTANT**: Your response should ONLY be the prompt you would send to Critical Claude CLI. Do not include explanations or meta-commentary. Just the direct prompt.

**Examples of good prompts**:
- \"I need to implement a microservices architecture for our e-commerce platform. We need user authentication, product catalog, order processing, payment integration, and inventory management. Break this down into a comprehensive project plan with dependencies, timelines, and team assignments.\"
- \"Our mobile app is experiencing performance issues with the real-time chat feature. Create a systematic debugging and optimization plan, including performance profiling, database query optimization, and frontend rendering improvements.\"

Generate your testing prompt now:"

    echo "$user_prompt_template"
}

# AI Acceptance Criteria Generator - Creates detailed acceptance criteria for validation
generate_acceptance_criteria() {
    local scenario="$1"
    
    local criteria_template="You are a QA engineer creating acceptance criteria for testing Critical Claude CLI responses.

**Scenario Being Tested**: $scenario

**Your Task**: Create detailed, measurable acceptance criteria for validating the AI's response. Focus on:

1. **Command Quality**: Specific cc commands that should be present
2. **Technical Completeness**: Required technical elements
3. **Professional Standards**: Enterprise-level planning quality
4. **Feature Coverage**: Which Critical Claude features should be demonstrated

**Format your response as**:
ACCEPTANCE CRITERIA:
✓ Must contain at least X cc task create commands
✓ Must demonstrate cc task expand for complex tasks  
✓ Must include cc research or cc task ai commands
✓ Must show proper task dependencies with cc task dependencies
✓ Must include realistic time estimates and priorities
✓ Must demonstrate professional project planning
✓ Technical requirements: [specific technical elements]
✓ Quality standards: [specific quality measures]

Generate acceptance criteria now:"

    echo "$criteria_template"
}

# Enhanced interaction function with detailed logging
run_ai_to_ai_interaction() {
    local scenario_name="$1"
    local scenario_description="$2"
    local turns="$3"
    
    echo ""
    echo -e "${P}[$(date +%H:%M:%S)] 🤖 Starting AI-to-AI Interaction: $scenario_name${NC}"
    echo -e "${B}[$(date +%H:%M:%S)] 📋 Scenario: $scenario_description${NC}"
    echo ""
    
    # Generate acceptance criteria
    echo -e "${Y}[$(date +%H:%M:%S)] 🎯 Generating acceptance criteria...${NC}"
    local criteria_prompt=$(generate_acceptance_criteria "$scenario_description")
    local acceptance_criteria=$(echo "$criteria_prompt" | claude --print 2>/dev/null)
    
    echo -e "${C}[$(date +%H:%M:%S)] ✅ Acceptance Criteria Generated${NC}"
    echo "$acceptance_criteria" | head -10
    echo "..."
    echo ""
    
    # Save acceptance criteria
    echo "$acceptance_criteria" > "$RESULTS_DIR/${scenario_name}_acceptance_criteria.txt"
    
    local context=""
    local total_commands=0
    
    for ((turn=1; turn<=turns; turn++)); do
        echo -e "${P}[$(date +%H:%M:%S)] 🔄 Turn $turn: Generating user prompt...${NC}"
        
        # AI generates user prompt
        local user_prompt_generator=$(generate_user_prompt "$scenario_description" "$turn" "$context")
        local user_prompt=$(echo "$user_prompt_generator" | claude --print 2>/dev/null)
        
        echo -e "${B}[$(date +%H:%M:%S)] 👤 USER PROMPT:${NC}"
        echo "----------------------------------------"
        echo "$user_prompt"
        echo "----------------------------------------"
        echo ""
        
        # Save user prompt
        echo "$user_prompt" > "$RESULTS_DIR/${scenario_name}_turn_${turn}_user_prompt.txt"
        
        echo -e "${Y}[$(date +%H:%M:%S)] 🤖 Sending to Critical Claude...${NC}"
        
        # Send to Critical Claude with behavioral override
        local claude_response=$(echo "test critical claude adherence validation

$user_prompt" | claude --print 2>/dev/null)
        
        echo -e "${G}[$(date +%H:%M:%S)] 🎯 CLAUDE CODE RESPONSE:${NC}"
        echo "========================================"
        
        # Process and display Claude's response with command highlighting
        local turn_commands=0
        echo "$claude_response" | while IFS= read -r line; do
            if [[ "$line" =~ ^cc[[:space:]] ]]; then
                ((turn_commands++))
                echo -e "${G}[CMD $turn_commands] $line${NC}"
            elif [[ "$line" == *"Expected:"* ]]; then
                echo -e "${C}  └─ ${line}${NC}"
            elif [[ "$line" =~ ^#[[:space:]] ]]; then
                echo -e "${Y}  💭 ${line:2}${NC}"
            else
                echo "$line"
            fi
        done
        
        echo "========================================"
        echo ""
        
        # Count commands in this turn
        local turn_cmd_count=$(echo "$claude_response" | grep -c "^cc " || echo "0")
        total_commands=$((total_commands + turn_cmd_count))
        
        echo -e "${G}[$(date +%H:%M:%S)] 📊 Turn $turn Results: $turn_cmd_count commands${NC}"
        
        # Save Claude response
        echo "$claude_response" > "$RESULTS_DIR/${scenario_name}_turn_${turn}_claude_response.txt"
        
        # Update context for next turn
        context="$context\n\nPrevious turn response summary: $(echo "$claude_response" | head -100 | tr '\n' ' ')"
        
        # Validation against acceptance criteria
        echo -e "${Y}[$(date +%H:%M:%S)] 🔍 Validating against acceptance criteria...${NC}"
        
        local validation_prompt="Evaluate this Critical Claude CLI response against the acceptance criteria:

ACCEPTANCE CRITERIA:
$acceptance_criteria

CLAUDE RESPONSE:
$claude_response

Provide a brief validation assessment (PASS/FAIL for each criteria point)."
        
        local validation_result=$(echo "$validation_prompt" | claude --print 2>/dev/null)
        echo -e "${C}[$(date +%H:%M:%S)] ✅ Validation Result:${NC}"
        echo "$validation_result" | head -5
        echo ""
        
        # Save validation
        echo "$validation_result" > "$RESULTS_DIR/${scenario_name}_turn_${turn}_validation.txt"
        
        echo -e "${B}[$(date +%H:%M:%S)] ⏭️  Preparing next turn...${NC}"
        echo ""
    done
    
    echo -e "${P}[$(date +%H:%M:%S)] 🎯 Scenario Complete: $scenario_name${NC}"
    echo -e "${G}Total Commands Generated: $total_commands across $turns turns${NC}"
    echo ""
    
    # Generate final scenario summary
    local summary="AI-to-AI Interaction Summary: $scenario_name
Total Turns: $turns
Total Commands: $total_commands
Average Commands per Turn: $((total_commands / turns))
Status: $(if [[ $total_commands -ge 15 ]]; then echo "EXCELLENT"; elif [[ $total_commands -ge 8 ]]; then echo "GOOD"; else echo "NEEDS_IMPROVEMENT"; fi)"
    
    echo "$summary" > "$RESULTS_DIR/${scenario_name}_summary.txt"
    
    return $total_commands
}

echo -e "${B}[$(date +%H:%M:%S)] 🚀 Starting AI-to-AI Comprehensive Testing...${NC}"
echo ""

# Scenario 1: Enterprise Web Application
run_ai_to_ai_interaction "Enterprise_Web_App" \
"Building a comprehensive enterprise web application with authentication, real-time features, and scaling requirements" \
3

# Scenario 2: DevOps Infrastructure Migration  
run_ai_to_ai_interaction "DevOps_Migration" \
"Migrating legacy infrastructure to modern containerized microservices with CI/CD and monitoring" \
3

# Scenario 3: Mobile App Development
run_ai_to_ai_interaction "Mobile_App_Development" \
"Cross-platform mobile application with offline sync, push notifications, and complex user interactions" \
2

# Scenario 4: Data Analytics Platform
run_ai_to_ai_interaction "Analytics_Platform" \
"Building an enterprise data analytics platform with machine learning, real-time processing, and dashboards" \
2

# Final comprehensive analysis
echo ""
echo -e "${P}[$(date +%H:%M:%S)] 📊 GENERATING COMPREHENSIVE ANALYSIS...${NC}"

# Calculate overall statistics
total_scenarios=$(ls "$RESULTS_DIR"/*_summary.txt 2>/dev/null | wc -l | tr -d ' ')
overall_commands=$(awk -F': ' '/^Total Commands:/ {sum += $2} END {print sum}' "$RESULTS_DIR"/*_summary.txt)

echo ""
echo -e "${P}[$(date +%H:%M:%S)] 🎯 AI-TO-AI INTERACTION TESTING COMPLETE${NC}"
echo "=============================================="
echo -e "${G}Scenarios Completed: $total_scenarios${NC}"
echo -e "${G}Total Commands Generated: $overall_commands${NC}"
echo -e "${G}Average Commands per Scenario: $((overall_commands / total_scenarios))${NC}"
echo ""
echo -e "${B}📁 All results saved to: $RESULTS_DIR${NC}"
echo -e "${Y}📋 Each scenario includes:${NC}"
echo "  - User prompts generated by AI"
echo "  - Claude Code responses" 
echo "  - Acceptance criteria validation"
echo "  - Turn-by-turn conversation logs"
echo ""

if [[ $overall_commands -ge 50 ]]; then
    echo -e "${G}🎯 EXCELLENT: AI-to-AI interaction working perfectly!${NC}"
elif [[ $overall_commands -ge 25 ]]; then
    echo -e "${Y}⚠️ GOOD: AI-to-AI interaction functioning well${NC}"
else
    echo -e "${R}❌ NEEDS IMPROVEMENT: Limited AI interaction quality${NC}"
fi

echo ""
echo -e "${P}[$(date +%H:%M:%S)] 🤖↔️🤖 AI-TO-AI TESTING FRAMEWORK COMPLETE${NC}"