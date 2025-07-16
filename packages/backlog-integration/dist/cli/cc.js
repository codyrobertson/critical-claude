#!/usr/bin/env node
/**
 * Critical Claude CLI - Unified command interface
 *
 * Usage patterns:
 *   cc <command> [subcommand] [options]
 *   cc crit code <file>              - Brutal code review
 *   cc crit arch <file>              - Architecture review
 *   cc explore <path>                - Explore codebase
 *   cc plan timeline <description>   - Generate timeline
 *   cc plan arch <path>              - Architecture plan
 *   cc init                          - Initialize project
 *   cc prompt list                   - List prompts
 *   cc mvp <name>                    - Generate MVP plan
 *   cc design analyze <path>         - System design analysis
 *   cc stack recommend               - Tech stack recommendations
 *   cc flow analyze <path>           - Data flow analysis
 *   cc flow trace <entry>            - Trace data flow
 *   cc flow diagram <path>           - Generate flow diagrams
 *   cc backlog <command>             - AGILE backlog management
 *   cc chat <prompt>                 - Direct Claude chat
 */
import { program } from 'commander';
import { spawn } from 'child_process';
import chalk from 'chalk';
import ora from 'ora';
// Helper to run Claude with MCP tools
async function runClaudeWithTool(toolName, args, options = {}) {
    const spinner = ora(`Running ${toolName}...`).start();
    // Build the prompt based on tool
    let prompt = '';
    switch (toolName) {
        case 'cc_crit_code':
            prompt = `Use the cc_crit_code tool with filePath: "${args.filePath || args.file}". Be brutal but pragmatic.`;
            break;
        case 'cc_crit_arch':
            prompt = `Use the cc_crit_arch tool with filePath: "${args.filePath || args.file}"${args.context ? ` and context: ${JSON.stringify(args.context)}` : ''}. Focus on architecture that matches the problem size.`;
            break;
        case 'cc_crit_explore':
            prompt = `Use the cc_crit_explore tool with rootPath: "${args.rootPath || args.path}". Analyze the codebase structure.`;
            break;
        case 'cc_plan_timeline':
            prompt = `Use the cc_plan_timeline tool with input: "${args.input || args.description}"${args.estimatedDays ? `, estimatedDays: ${args.estimatedDays}` : ''}${args.context ? `, context: ${JSON.stringify(args.context)}` : ''}. Be brutally realistic.`;
            break;
        case 'cc_plan_arch':
            prompt = `Use the cc_plan_arch tool with rootPath: "${args.rootPath || args.path}"${args.includeAnalysis !== undefined ? `, includeAnalysis: ${args.includeAnalysis}` : ''}. Create a pragmatic improvement plan.`;
            break;
        case 'cc_init_project':
            prompt = `Use the cc_init_project tool${args.projectName ? ` with projectName: "${args.projectName}"` : ''}. Initialize Critical Claude for this project.`;
            break;
        case 'cc_prompt_mgmt':
            prompt = `Use the cc_prompt_mgmt tool with ${JSON.stringify(args)}`;
            break;
        case 'cc_mvp_plan':
            prompt = `Use the cc_mvp_plan tool with projectName: "${args.projectName}", description: "${args.description}", targetUsers: "${args.targetUsers}"${args.constraints ? `, constraints: ${JSON.stringify(args.constraints)}` : ''}`;
            break;
        case 'cc_system_design_analyze':
            prompt = `Use the cc_system_design_analyze tool with rootPath: "${args.rootPath}"${args.focus ? `, focus: "${args.focus}"` : ''}`;
            break;
        case 'cc_tech_stack_recommend':
            prompt = `Use the cc_tech_stack_recommend tool with ${JSON.stringify(args)}`;
            break;
        case 'cc_data_flow_analyze':
            prompt = `Use the cc_data_flow_analyze tool with rootPath: "${args.rootPath}"`;
            break;
        case 'cc_data_flow_trace':
            prompt = `Use the cc_data_flow_trace tool with entryPoint: "${args.entryPoint}", rootPath: "${args.rootPath}"`;
            break;
        case 'cc_data_flow_diagram':
            prompt = `Use the cc_data_flow_diagram tool with rootPath: "${args.rootPath}"${args.diagramType ? `, diagramType: "${args.diagramType}"` : ''}`;
            break;
        default:
            prompt = args.prompt || '';
    }
    spinner.stop();
    return new Promise((resolve, reject) => {
        const claudeArgs = [
            '--print',
            '--model', options.model || 'sonnet',
            '--output-format', options.json ? 'json' : 'text'
        ];
        const claude = spawn('claude', claudeArgs, {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: process.env
        });
        let output = '';
        let errorOutput = '';
        claude.stdout.on('data', (data) => {
            output += data.toString();
            if (!options.quiet) {
                process.stdout.write(data);
            }
        });
        claude.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        claude.stdin.write(prompt);
        claude.stdin.end();
        claude.on('close', (code) => {
            if (code !== 0) {
                console.error(chalk.red(`\n❌ Error: ${errorOutput}`));
                reject(new Error(`Claude exited with code ${code}`));
            }
            else {
                resolve(output);
            }
        });
        claude.on('error', (error) => {
            console.error(chalk.red('❌ Failed to run Claude:'), error.message);
            reject(error);
        });
    });
}
// Main CLI
program
    .name('cc')
    .description('Critical Claude CLI - Brutal honesty for better code')
    .version('2.0.0')
    .option('-m, --model <model>', 'Claude model to use', 'sonnet')
    .option('-j, --json', 'Output in JSON format')
    .option('-q, --quiet', 'Suppress output during execution');
// Critique commands
const crit = program
    .command('crit')
    .alias('review')
    .description('Critical code review commands');
crit
    .command('code <file>')
    .alias('c')
    .description('Brutal code review that identifies REAL problems')
    .option('--no-theory', 'Skip theoretical issues')
    .action(async (file, options) => {
    try {
        await runClaudeWithTool('cc_crit_code', { filePath: file }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
crit
    .command('arch <file>')
    .alias('a')
    .description('Architecture review that matches patterns to problem size')
    .option('-u, --users <count>', 'Current user count', parseInt)
    .option('-t, --team <size>', 'Team size', parseInt)
    .option('-p, --problems <problems...>', 'Current problems')
    .action(async (file, options) => {
    const context = {};
    if (options.users)
        context.user_count = options.users;
    if (options.team)
        context.team_size = options.team;
    if (options.problems)
        context.current_problems = options.problems;
    try {
        await runClaudeWithTool('cc_crit_arch', {
            filePath: file,
            context: Object.keys(context).length > 0 ? context : undefined
        }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
// Explore command
program
    .command('explore <path>')
    .alias('x')
    .description('Explore codebase structure and patterns')
    .action(async (rootPath) => {
    try {
        await runClaudeWithTool('cc_crit_explore', { rootPath }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
// Planning commands
const plan = program
    .command('plan')
    .alias('p')
    .description('Planning and timeline generation');
plan
    .command('timeline <description>')
    .alias('t')
    .description('Generate brutal reality-based timeline')
    .option('-d, --days <days>', 'Estimated days', parseInt)
    .option('-t, --team <size>', 'Team size', parseInt)
    .option('--deadline', 'Has hard deadline')
    .option('--stack <tech...>', 'Tech stack')
    .action(async (description, options) => {
    const context = {};
    if (options.team)
        context.teamSize = options.team;
    if (options.deadline)
        context.hasDeadline = true;
    if (options.stack)
        context.techStack = options.stack;
    try {
        await runClaudeWithTool('cc_plan_timeline', {
            input: description,
            estimatedDays: options.days,
            context: Object.keys(context).length > 0 ? context : undefined
        }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
plan
    .command('arch <path>')
    .alias('a')
    .description('Create architectural improvement plan')
    .option('--no-analysis', 'Skip code analysis')
    .action(async (rootPath, options) => {
    try {
        await runClaudeWithTool('cc_plan_arch', {
            rootPath,
            includeAnalysis: !options.noAnalysis
        }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
// Initialize command
program
    .command('init [name]')
    .description('Initialize Critical Claude for project')
    .action(async (projectName) => {
    try {
        await runClaudeWithTool('cc_init_project', { projectName }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
// Prompt management
const prompt = program
    .command('prompt')
    .description('Manage developer prompt templates');
prompt
    .command('list')
    .alias('ls')
    .description('List all prompts')
    .option('-c, --category <category>', 'Filter by category')
    .action(async (options) => {
    try {
        await runClaudeWithTool('cc_prompt_mgmt', {
            action: 'list',
            category: options.category
        }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
prompt
    .command('get <id>')
    .description('Get a specific prompt')
    .action(async (id) => {
    try {
        await runClaudeWithTool('cc_prompt_mgmt', {
            action: 'get',
            id
        }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
prompt
    .command('add <id>')
    .description('Add a new prompt')
    .requiredOption('-n, --name <name>', 'Prompt name')
    .requiredOption('-d, --description <desc>', 'Description')
    .requiredOption('-t, --template <template>', 'Template content')
    .option('-c, --category <category>', 'Category', 'custom')
    .option('--tags <tags...>', 'Tags')
    .action(async (id, options) => {
    try {
        await runClaudeWithTool('cc_prompt_mgmt', {
            action: 'add',
            id,
            category: options.category,
            prompt: {
                name: options.name,
                description: options.description,
                template: options.template,
                tags: options.tags || []
            }
        }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
// MVP Planning
program
    .command('mvp <name>')
    .description('Generate MVP plan for new product')
    .requiredOption('-d, --description <desc>', 'Product description')
    .requiredOption('-u, --users <users>', 'Target users')
    .option('-b, --budget <amount>', 'Budget in USD', parseInt)
    .option('-t, --timeline <time>', 'Timeline (e.g., "3 months")')
    .option('--team <size>', 'Team size', parseInt)
    .action(async (name, options) => {
    const constraints = {};
    if (options.budget)
        constraints.budget = options.budget;
    if (options.timeline)
        constraints.timeline = options.timeline;
    if (options.team)
        constraints.teamSize = options.team;
    try {
        await runClaudeWithTool('cc_mvp_plan', {
            projectName: name,
            description: options.description,
            targetUsers: options.users,
            constraints: Object.keys(constraints).length > 0 ? constraints : undefined
        }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
// System design commands
const design = program
    .command('design')
    .alias('sys')
    .description('System design and architecture analysis');
design
    .command('analyze <path>')
    .alias('a')
    .description('Analyze system architecture')
    .option('-f, --focus <area>', 'Focus area', /^(scalability|performance|maintainability|security|all)$/, 'all')
    .action(async (rootPath, options) => {
    try {
        await runClaudeWithTool('cc_system_design_analyze', {
            rootPath,
            focus: options.focus
        }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
// Tech stack recommendation
program
    .command('stack')
    .description('Recommend technology stack')
    .requiredOption('-t, --type <type>', 'Project type', /^(web-app|mobile-app|api|desktop-app|microservices)$/)
    .requiredOption('-r, --requirements <reqs...>', 'Requirements')
    .requiredOption('-e, --experience <level>', 'Team experience', /^(beginner|intermediate|advanced)$/)
    .option('-b, --budget <level>', 'Budget level', /^(low|medium|high)$/)
    .option('--timeline <period>', 'Timeline', /^(weeks|months|years)$/)
    .action(async (options) => {
    const constraints = {};
    if (options.budget)
        constraints.budget = options.budget;
    if (options.timeline)
        constraints.timeline = options.timeline;
    try {
        await runClaudeWithTool('cc_tech_stack_recommend', {
            projectType: options.type,
            requirements: options.requirements,
            teamExperience: options.experience,
            constraints: Object.keys(constraints).length > 0 ? constraints : undefined
        }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
// Data flow commands
const flow = program
    .command('flow')
    .alias('data')
    .description('Data flow analysis commands');
flow
    .command('analyze <path>')
    .alias('a')
    .description('Analyze data flow patterns')
    .action(async (rootPath) => {
    try {
        await runClaudeWithTool('cc_data_flow_analyze', { rootPath }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
flow
    .command('trace <entry>')
    .alias('t')
    .description('Trace data flow from entry point')
    .requiredOption('-r, --root <path>', 'Root directory path')
    .action(async (entryPoint, options) => {
    try {
        await runClaudeWithTool('cc_data_flow_trace', {
            entryPoint,
            rootPath: options.root
        }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
flow
    .command('diagram <path>')
    .alias('d')
    .description('Generate data flow diagrams')
    .option('-t, --type <type>', 'Diagram type', /^(system|critical-path|database|all)$/, 'all')
    .action(async (rootPath, options) => {
    try {
        await runClaudeWithTool('cc_data_flow_diagram', {
            rootPath,
            diagramType: options.type
        }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
// Task management (simple interface)
const task = program
    .command('task')
    .alias('t')
    .description('Task management commands');
task
    .command('list')
    .alias('ls')
    .description('List all tasks')
    .action(async () => {
    const child = spawn('cc-backlog', ['task-ui', 'list'], {
        stdio: 'inherit',
        env: process.env
    });
    child.on('error', (error) => {
        console.error(chalk.red('❌ Failed to run task command:'), error.message);
        process.exit(1);
    });
    child.on('exit', (code) => {
        process.exit(code || 0);
    });
});
task
    .command('show <id>')
    .description('Show task details')
    .action(async (id) => {
    const child = spawn('cc-backlog', ['task-ui', 'show', id], {
        stdio: 'inherit',
        env: process.env
    });
    child.on('error', (error) => {
        console.error(chalk.red('❌ Failed to run task command:'), error.message);
        process.exit(1);
    });
    child.on('exit', (code) => {
        process.exit(code || 0);
    });
});
task
    .command('ui')
    .description('Launch task management interface')
    .action(async () => {
    const child = spawn('cc-backlog', ['task-ui'], {
        stdio: 'inherit',
        env: process.env
    });
    child.on('error', (error) => {
        console.error(chalk.red('❌ Failed to run task UI:'), error.message);
        process.exit(1);
    });
    child.on('exit', (code) => {
        process.exit(code || 0);
    });
});
// Backlog management (delegate to cc-backlog)
program
    .command('backlog <command...>')
    .alias('b')
    .description('AGILE backlog management (see: cc backlog --help)')
    .allowUnknownOption()
    .action((command) => {
    const child = spawn('cc-backlog', command, {
        stdio: 'inherit',
        env: process.env
    });
    child.on('error', (error) => {
        console.error(chalk.red('❌ Failed to run backlog command:'), error.message);
        process.exit(1);
    });
    child.on('exit', (code) => {
        process.exit(code || 0);
    });
});
// Direct chat (default command)
program
    .command('chat <prompt...>')
    .alias('c')
    .description('Direct Claude chat')
    .action(async (promptParts) => {
    const prompt = promptParts.join(' ');
    try {
        await runClaudeWithTool('chat', { prompt }, program.opts());
    }
    catch (error) {
        process.exit(1);
    }
});
// Default action for direct prompts
program
    .arguments('[prompt...]')
    .action(async (promptParts) => {
    if (promptParts && promptParts.length > 0) {
        const prompt = promptParts.join(' ');
        try {
            await runClaudeWithTool('chat', { prompt }, program.opts());
        }
        catch (error) {
            process.exit(1);
        }
    }
    else {
        program.help();
    }
});
// Custom help
program.on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ cc task list                           # List all tasks');
    console.log('  $ cc task ui                             # Launch task interface');
    console.log('  $ cc crit code src/index.ts              # Brutal code review');
    console.log('  $ cc explore .                           # Explore codebase');
    console.log('  $ cc plan timeline "chat app"            # Generate timeline');
    console.log('  $ cc mvp MyApp -d "Social app" -u "Gen Z"');
    console.log('  $ cc flow analyze .                      # Analyze data flow');
    console.log('  $ cc backlog status                      # Project overview');
    console.log('  $ cc "What is the meaning of life?"      # Direct chat');
    console.log('');
    console.log('Use "cc <command> --help" for command details');
});
program.parse();
//# sourceMappingURL=cc.js.map