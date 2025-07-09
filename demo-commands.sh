#!/bin/bash

# Critical Claude - Working code beats perfect theory

# Install and run brutal code reviews
npm install -g @critical-claude/mcp
cc --help

# Review code for REAL problems
cc crit code src/auth.ts

# Get realistic project timelines  
cc plan timeline 'user authentication system'

# AI-powered AGILE task management
cc task create 'OAuth integration' --epic auth-system
cc task focus auth-001

# Explore codebase architecture  
cc explore .

# Generate brutal MCP timeline
cc plan timeline 'deploy to cloudflare' --team-size 2