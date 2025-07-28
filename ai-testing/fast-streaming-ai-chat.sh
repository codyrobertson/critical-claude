#!/bin/bash

# FAST STREAMING AI-TO-AI CHAT WITH CLAUDE CODE
# Shows real-time streaming including Claude's thoughts and reasoning

echo "🚀 FAST STREAMING AI-TO-AI CLAUDE CODE CHAT"
echo "==========================================="

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

# Timing function
timer() {
    date +%H:%M:%S
}

# Fast user prompt generator
generate_quick_prompt() {
    local scenario="$1"
    cat << EOF
You are a senior software engineer testing Critical Claude CLI. 

$scenario

Be specific, technical, and demanding. Ask for a comprehensive breakdown with proper task management.
EOF
}

# Real-time streaming conversation
stream_ai_conversation() {
    local scenario_name="$1"
    local scenario_desc="$2"
    local turns="$3"
    
    echo ""
    echo -e "${P}[$(timer)] 🤖 SCENARIO: $scenario_name${NC}"
    echo -e "${B}▶ $scenario_desc${NC}"
    echo ""
    
    local total_cmds=0
    
    for ((turn=1; turn<=turns; turn++)); do
        echo -e "${Y}[$(timer)] 👤 Turn $turn: Generating user request...${NC}"
        
        # Quick prompt generation (no external AI call - faster)
        local user_request=""
        case $turn in
            1) user_request="I need to build $scenario_desc. Create a comprehensive project breakdown with task dependencies, time estimates, and technical specifications. Use Critical Claude CLI extensively." ;;
            2) user_request="The scope has expanded. Add real-time features, mobile apps, and enterprise security. Update the project plan using Critical Claude CLI." ;;
            3) user_request="Project status update: mark 3 tasks complete, 2 in progress, create 5 new tasks discovered during development. Show realistic progression." ;;
        esac
        
        echo -e "${C}[$(timer)] 💬 USER:${NC} ${user_request:0:80}..."
        echo ""
        
        # Stream Claude Code response in real-time
        echo -e "${G}[$(timer)] 🤖 CLAUDE CODE STREAMING RESPONSE:${NC}"
        echo "================================================"
        
        local turn_cmds=0
        local response_file=\"/tmp/claude_response_$$_$turn\"\n        \n        # Send to Claude Code with real-time processing\n        {\n            echo \"test critical claude adherence validation\"\n            echo \"\"\n            echo \"$user_request\"\n        } | claude --print 2>/dev/null | while IFS= read -r line; do\n            # Real-time processing and display\n            if [[ \"$line\" =~ ^cc[[:space:]] ]]; then\n                ((turn_cmds++))\n                echo -e \"${G}[$(timer)] [CMD] $line${NC}\"\n            elif [[ \"$line\" == *\"Expected:\"* ]]; then\n                echo -e \"${B}[$(timer)] [EXP] ${line#*Expected: }${NC}\"\n            elif [[ \"$line\" =~ ^#[[:space:]] ]]; then\n                echo -e \"${Y}[$(timer)] [💭] ${line:2}${NC}\"\n            elif [[ \"$line\" == *\"✅\"* ]] || [[ \"$line\" == *\"🎯\"* ]]; then\n                echo -e \"${C}[$(timer)] [✓] $line${NC}\"\n            elif [[ \"$line\" =~ ^\\`\\`\\`bash$ ]]; then\n                echo -e \"${P}[$(timer)] [CODE BLOCK START]${NC}\"\n            elif [[ \"$line\" =~ ^\\`\\`\\`$ ]]; then\n                echo -e \"${P}[$(timer)] [CODE BLOCK END]${NC}\"\n            elif [[ -n \"$line\" ]]; then\n                echo -e \"${NC}[$(timer)] [MSG] $line${NC}\"\n            fi\n            \n            # Save to temp file for command counting\n            echo \"$line\" >> \"$response_file\"\n        done\n        \n        echo \"================================================\"\n        \n        # Count commands from saved response\n        local actual_cmds=$(grep -c \"^cc \" \"$response_file\" 2>/dev/null || echo \"0\")\n        total_cmds=$((total_cmds + actual_cmds))\n        \n        echo -e \"${G}[$(timer)] ✅ Turn $turn Complete: $actual_cmds commands${NC}\"\n        echo \"\"\n        \n        # Clean up\n        rm -f \"$response_file\"\n        \n        # Short pause between turns (realistic conversation pace)\n        sleep 2\n    done\n    \n    echo -e \"${P}[$(timer)] 🎯 Scenario Complete: $total_cmds total commands${NC}\"\n    echo \"\"\n    \n    return $total_cmds\n}\n\n# Quick multi-scenario test\necho -e \"${B}[$(timer)] 🚀 Starting fast streaming AI conversations...${NC}\"\necho \"\"\n\n# Scenario 1: Enterprise Dashboard (2 turns)\nstream_ai_conversation \"Enterprise_Dashboard\" \\\n\"a comprehensive enterprise analytics dashboard with real-time charts, user management, and data export\" \\\n2\n\n# Scenario 2: E-commerce Platform (3 turns)\nstream_ai_conversation \"Ecommerce_Platform\" \\\n\"a scalable e-commerce platform with payment processing, inventory management, and order fulfillment\" \\\n3\n\n# Scenario 3: DevOps Infrastructure (2 turns)\nstream_ai_conversation \"DevOps_Infrastructure\" \\\n\"a complete DevOps infrastructure with CI/CD, monitoring, and container orchestration\" \\\n2\n\n# Final summary\necho \"\"\necho -e \"${P}[$(timer)] ⚡ FAST STREAMING TEST COMPLETE${NC}\"\necho \"======================================\"\necho -e \"${G}Duration: ~3-5 minutes${NC}\"\necho -e \"${B}All responses streamed in real-time${NC}\"\necho -e \"${Y}Captured Claude's full thought process${NC}\"\necho \"\"\necho -e \"${G}🎯 Fast AI-to-AI streaming validation complete!${NC}\"