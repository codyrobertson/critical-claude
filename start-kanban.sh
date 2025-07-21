#!/bin/bash

# Critical Claude Kanban Board Launcher
# Automatically starts the web-based task management interface

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII art header
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║   ██████╗██████╗ ██╗████████╗██╗ ██████╗ █████╗ ██╗         ██████╗██╗     █████╗ ║
║  ██╔════╝██╔══██╗██║╚══██╔══╝██║██╔════╝██╔══██╗██║        ██╔════╝██║    ██╔══██╗║
║  ██║     ██████╔╝██║   ██║   ██║██║     ███████║██║        ██║     ██║    ███████║║
║  ██║     ██╔══██╗██║   ██║   ██║██║     ██╔══██║██║        ██║     ██║    ██╔══██║║
║  ╚██████╗██║  ██║██║   ██║   ██║╚██████╗██║  ██║███████╗   ╚██████╗███████╗██║  ██║║
║   ╚═════╝╚═╝  ╚═╝╚═╝   ╚═╝   ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝    ╚═════╝╚══════╝╚═╝  ╚═╝║
║                                                                                   ║
║                           🎯 KANBAN TASK BOARD 🎯                               ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}🚀 Starting Critical Claude Kanban Board...${NC}\n"

# Check if we're in the right directory
if [[ ! -d "packages/critical-claude-web" ]]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    echo -e "${YELLOW}💡 Expected structure: ./packages/critical-claude-web/${NC}"
    exit 1
fi

# Change to web package directory
cd packages/critical-claude-web

# Check if node_modules exists
if [[ ! -d "node_modules" ]]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Build critical-claude package if needed
echo -e "${BLUE}🔧 Building Critical Claude core...${NC}"
cd ../critical-claude && npm run build && cd ../critical-claude-web

echo -e "${GREEN}✅ Setup complete!${NC}\n"

# Show available commands
echo -e "${CYAN}Available commands:${NC}"
echo -e "  ${GREEN}npm start${NC}        - Start with auto port detection"
echo -e "  ${GREEN}npm run health${NC}   - Check running services"
echo -e "  ${GREEN}npm run server${NC}   - Start backend only"
echo -e "  ${GREEN}npm run dev${NC}      - Start frontend only"
echo ""

# Start the orchestrator
echo -e "${BLUE}🎬 Launching orchestrator...${NC}\n"
exec npm start