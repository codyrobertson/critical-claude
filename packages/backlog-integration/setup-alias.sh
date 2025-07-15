#!/bin/bash

# Setup script for Critical Claude aliases

echo "Setting up Critical Claude aliases..."

# Detect shell
if [[ "$SHELL" == *"zsh"* ]]; then
    RC_FILE="$HOME/.zshrc"
elif [[ "$SHELL" == *"bash"* ]]; then
    RC_FILE="$HOME/.bashrc"
else
    echo "Unsupported shell: $SHELL"
    exit 1
fi

# Add aliases
echo "" >> "$RC_FILE"
echo "# Critical Claude aliases" >> "$RC_FILE"
echo "alias cc='cc'" >> "$RC_FILE"
echo "alias ccr='cc review'" >> "$RC_FILE"
echo "alias ccp='cc plan'" >> "$RC_FILE"
echo "alias cct='cc task'" >> "$RC_FILE"
echo "alias brutal='cc \"Be extremely brutal and critical about\"'" >> "$RC_FILE"

echo "✅ Aliases added to $RC_FILE"
echo ""
echo "Available commands:"
echo "  cc <prompt>      - Run any Claude prompt"
echo "  ccr <file>       - Brutal code review"
echo "  ccp <feature>    - Generate brutal timeline"
echo "  cct <feature>    - Generate AGILE tasks"
echo "  brutal <topic>   - Be extremely critical about something"
echo ""
echo "Run 'source $RC_FILE' to activate or restart your terminal."