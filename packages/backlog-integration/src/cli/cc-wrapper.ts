#!/usr/bin/env node

/**
 * Critical Claude wrapper for easy Claude CLI usage
 * Usage: cc "your prompt here"
 */

import { spawn } from 'child_process';
import { program } from 'commander';

program
  .name('cc')
  .description('Critical Claude CLI wrapper - brutal honesty mode activated')
  .version('1.0.0')
  .argument('[prompt...]', 'Your prompt to Claude')
  .option('-m, --model <model>', 'Model to use (opus, sonnet, haiku)', 'sonnet')
  .option('-t, --temperature <temp>', 'Temperature (0.0-1.0)', '0.1')
  .option('-o, --output <format>', 'Output format (text, json)', 'text')
  .option('--no-print', 'Interactive mode (default is non-interactive)')
  .option('--resume <session>', 'Resume a previous session')
  .option('--tools <tools...>', 'Allowed tools', ['Read', 'LS', 'Grep', 'Glob'])
  .action((promptParts, options) => {
    if (!promptParts || promptParts.length === 0) {
      console.error('❌ No prompt provided. Usage: cc "your prompt here"');
      process.exit(1);
    }

    const prompt = promptParts.join(' ');
    
    // Build Claude CLI arguments
    const args = [];
    
    // Non-interactive by default
    if (options.print !== false) {
      args.push('--print');
    }
    
    // Model selection
    args.push('--model', options.model);
    
    // Output format
    args.push('--output-format', options.output);
    
    // Resume session
    if (options.resume) {
      args.push('--resume', options.resume);
    }
    
    // Tools
    if (options.tools && options.tools.length > 0) {
      args.push('--allowedTools', ...options.tools);
    }
    
    console.log('🔥 Critical Claude activated...\n');
    
    // Spawn Claude process with stdin pipe
    const claude = spawn('claude', args, {
      stdio: ['pipe', 'inherit', 'inherit'],
      env: process.env
    });
    
    // Send prompt via stdin
    claude.stdin.write(prompt);
    claude.stdin.end();
    
    claude.on('error', (error) => {
      console.error('❌ Failed to run Claude:', error.message);
      console.log('\n💡 Make sure Claude CLI is installed: npm install -g @anthropic-ai/claude-code');
      process.exit(1);
    });
    
    claude.on('exit', (code) => {
      if (code !== 0) {
        console.error(`\n❌ Claude exited with code ${code}`);
        process.exit(code || 1);
      }
    });
  });

// Add subcommands for common tasks
program
  .command('review <file>')
  .description('Run brutal code review on a file')
  .option('-m, --model <model>', 'Model to use', 'sonnet')
  .action((file, options) => {
    const prompt = `Use the cc_crit_code tool to review ${file}. Be brutal but pragmatic.`;
    
    const args = [
      '--print',
      '--model', options.model,
      '--output-format', 'text',
      prompt
    ];
    
    console.log(`🔍 Reviewing ${file}...\n`);
    
    const claude = spawn('claude', args, {
      stdio: 'inherit',
      env: process.env
    });
    
    claude.on('error', (error) => {
      console.error('❌ Review failed:', error.message);
      process.exit(1);
    });
  });

program
  .command('plan <description>')
  .description('Generate brutal timeline for a feature')
  .option('-d, --days <days>', 'Estimated days', '0')
  .option('-m, --model <model>', 'Model to use', 'sonnet')
  .action((description, options) => {
    const prompt = `Use the cc_plan_timeline tool to create a timeline for: "${description}". Estimated days: ${options.days}`;
    
    const args = [
      '--print',
      '--model', options.model,
      '--output-format', 'text',
      prompt
    ];
    
    console.log(`📅 Planning timeline...\n`);
    
    const claude = spawn('claude', args, {
      stdio: 'inherit',
      env: process.env
    });
    
    claude.on('error', (error) => {
      console.error('❌ Planning failed:', error.message);
      process.exit(1);
    });
  });

program
  .command('task <feature>')
  .description('Generate AGILE tasks from feature description')
  .option('-m, --model <model>', 'Model to use', 'sonnet')
  .action((feature, options) => {
    const prompt = `Break down this feature into concrete AGILE tasks: "${feature}". Be specific and realistic about effort.`;
    
    const args = [
      '--print',
      '--model', options.model,
      '--output-format', 'text',
      prompt
    ];
    
    console.log(`📋 Generating tasks...\n`);
    
    const claude = spawn('claude', args, {
      stdio: 'inherit',
      env: process.env
    });
    
    claude.on('error', (error) => {
      console.error('❌ Task generation failed:', error.message);
      process.exit(1);
    });
  });

program.parse();