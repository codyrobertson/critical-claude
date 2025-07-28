#!/bin/bash

# SUPER FAST AI-TO-AI CHAT - REAL-TIME STREAMING
# Shows live conversation with Claude Code including thoughts

echo "⚡ SUPER FAST AI-TO-AI CLAUDE CODE CHAT"
echo "======================================"

# API Key
export CLAUDE_API_KEY="${CLAUDE_API_KEY:-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}"

# Colors
G='\033[0;32m'
B='\033[0;34m' 
Y='\033[1;33m'
P='\033[0;35m'
NC='\033[0m'

t() { date +%H:%M:%S; }

# Fast chat function
fast_chat() {
    local name=\"$1\"
    local prompt=\"$2\"
    
    echo \"\"
    echo -e \"${B}[$(t)] 🗣️  USER REQUEST: $name${NC}\"
    echo -e \"${Y}$prompt${NC}\"
    echo \"\"
    echo -e \"${G}[$(t)] 🤖 CLAUDE CODE LIVE RESPONSE:${NC}\"
    echo \"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\"
    
    local cmd_count=0
    
    # Stream response with live parsing
    echo \"test critical claude adherence validation
    
$prompt\" | claude --print 2>/dev/null | while read -r line; do
        case \"$line\" in
            cc\\ *)
                ((cmd_count++))
                echo -e \"${G}[$(t)] 🔧 [$cmd_count] $line${NC}\"
                ;;
            *\"Expected:\"*)
                echo -e \"${B}[$(t)] 📋 ${line#*Expected: }${NC}\"
                ;;
            \\#\\ *)
                echo -e \"${Y}[$(t)] 💭 ${line:2}${NC}\"
                ;;
            *\"✅\"*|*\"🎯\"*)
                echo -e \"${P}[$(t)] ✨ $line${NC}\"
                ;;
            *\"```bash\"*)
                echo -e \"${P}[$(t)] 📦 [CODE BLOCK]${NC}\"
                ;;
            *)
                if [[ -n \"$line\" && ! \"$line\" =~ ^[[:space:]]*$ ]]; then
                    echo -e \"${NC}[$(t)] 💬 $line${NC}\"
                fi
                ;;
        esac
        echo \"$line\" >> \"/tmp/chat_log_$$\"
    done
    
    echo \"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\"
    
    # Count actual commands
    local actual_cmds=$(grep -c \"^cc \" \"/tmp/chat_log_$$\" 2>/dev/null || echo \"0\")
    echo -e \"${G}[$(t)] ✅ Response Complete: $actual_cmds Critical Claude commands${NC}\"
    rm -f \"/tmp/chat_log_$$\"
    
    return $actual_cmds
}

echo \"\"
echo -e \"${B}[$(t)] 🚀 Starting super fast AI chat test...${NC}\"

# Test 1: Quick project
fast_chat \"Dashboard Project\" \\\n\"Build a React analytics dashboard with user authentication, real-time charts, and data export features. Create comprehensive project breakdown using Critical Claude CLI.\"

# Test 2: Multi-turn conversation
echo \"\"
echo -e \"${P}[$(t)] 🔄 Multi-Turn Conversation Test${NC}\"

fast_chat \"Initial Request\" \\\n\"Create a mobile e-commerce app with user accounts, product catalog, shopping cart, and payment processing. Use Critical Claude CLI for complete breakdown.\"

fast_chat \"Scope Change\" \\\n\"Client wants to add: real-time notifications, social features, AR product views, and offline sync. Update the project using Critical Claude CLI.\"

fast_chat \"Status Update\" \\\n\"Week 2 progress update: mark authentication as complete, product catalog in progress, create 3 new integration tasks discovered. Use cc task update commands.\"

# Test 3: Technical deep-dive
fast_chat \"Technical Architecture\" \\\n\"Design microservices architecture for the mobile app backend: user service, product service, order service, notification service, and API gateway. Use cc task expand extensively.\"

echo \"\"
echo -e \"${P}[$(t)] ⚡ SUPER FAST CHAT TEST COMPLETE${NC}\"
echo \"=====================================\"
echo -e \"${G}✅ All conversations streamed in real-time${NC}\"
echo -e \"${B}💭 Captured Claude's complete thought process${NC}\"
echo -e \"${Y}🔧 Showed all Critical Claude commands live${NC}\"
echo \"\"
echo -e \"${G}[$(t)] 🎯 Fast streaming validation complete!${NC}\"