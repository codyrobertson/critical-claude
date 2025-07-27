/**
 * Task Command Handler
 * Extracted from the massive CLI switch statement
 */

import { TaskService } from '../../../../src/services/TaskService.js';
import { ResearchService } from '../../../../domains/research-intelligence/dist/application/services/ResearchService.js';
import { TaskCommandOptions, CommandArgs, UpdateTaskData } from '../types/cli-types.js';
import { CliHelpers } from '../utils/cli-helpers.js';
import { timeOperation, logMetric } from '../../../../shared/simple-observability.js';
import { InputSanitizer, taskCreateLimiter } from '../../../../shared/input-sanitizer.js';

export class TaskCommandHandler {
  constructor(
    private taskService: TaskService,
    private getResearchService: () => ResearchService
  ) {}

  async handleCreate(options: TaskCommandOptions): Promise<void> {
    return timeOperation('cli', 'task-create', async () => {
      // Rate limiting check
      const clientId = process.env.USER || 'unknown';
      if (!taskCreateLimiter(clientId)) {
        await logMetric('cli', 'task-create-rate-limit', 'error', { client_id: clientId });
        console.error('❌ Rate limit exceeded. Please wait before creating more tasks.');
        process.exit(1);
      }

      // Basic validation first
      CliHelpers.validateRequired(options.title, 'Title', 'cc task create -t "Task Title"');
      
      // Comprehensive security sanitization
      let sanitizedInput;
      try {
        sanitizedInput = InputSanitizer.sanitizeTaskInput(options);
      } catch (sanitizeError) {
        await logMetric('cli', 'task-create-sanitization', 'error', { 
          error: sanitizeError instanceof Error ? sanitizeError.message : 'Sanitization failed' 
        });
        console.error(`❌ Input validation failed: ${sanitizeError instanceof Error ? sanitizeError.message : 'Invalid input'}`);
        process.exit(1);
      }
      
      const result = await this.taskService.createTask(sanitizedInput);
      
      if (result.success && result.task) {
        await logMetric('cli', 'task-create', 'success', { task_id: result.task.id.value });
        console.log(`✅ Created task: ${result.task.title}`);
        console.log(`   ID: ${result.task.id.value}`);
      } else {
        await logMetric('cli', 'task-create', 'error', { error: result.error || 'Unknown error' });
        CliHelpers.handleVoidServiceResult(result, '', 'Failed to create task');
      }
    }, { title_length: options.title?.length });
  }

  async handleList(options: TaskCommandOptions): Promise<void> {
    const result = await this.taskService.listTasks({
      status: options.status === 'todo' ? undefined : options.status,
      assignee: options.assignee
    });
    
    if (result.success && result.tasks) {
      // Map domain tasks to display format - NO MORE 'as any' BULLSHIT
      const displayTasks = result.tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignee: task.assignee,
        labels: task.labels,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        estimatedHours: task.estimatedHours
      }));
      
      CliHelpers.displayTaskList(displayTasks);
    } else {
      CliHelpers.handleVoidServiceResult(result, '', 'Failed to list tasks');
    }
  }

  async handleView(args: CommandArgs): Promise<void> {
    const taskId = args[0];
    CliHelpers.validateRequired(taskId, 'Task ID', 'cc task view <task-id>');
    
    const result = await this.taskService.viewTask({ taskId });
    if (result.success && result.task) {
      CliHelpers.displayTask(result.task as any);
    } else {
      console.error(`❌ Task not found: ${taskId}`);
      process.exit(1);
    }
  }

  async handleUpdate(args: CommandArgs, options: TaskCommandOptions): Promise<void> {
    const taskId = args[0];
    CliHelpers.validateRequired(taskId, 'Task ID', 'cc task update <task-id> -s done');
    
    const updateData: UpdateTaskData = { taskId };
    if (options.title) updateData.title = options.title;
    if (options.description) updateData.description = options.description;
    if (options.status) updateData.status = options.status;
    if (options.priority) updateData.priority = options.priority;
    if (options.assignee) updateData.assignee = options.assignee;
    if (options.labels) updateData.labels = options.labels;
    if (options.hours) updateData.estimatedHours = options.hours;
    
    const result = await this.taskService.updateTask(updateData);
    if (result.success && result.task) {
      console.log(`✅ Updated task: ${result.task.title}`);
    } else {
      CliHelpers.handleVoidServiceResult(result, '', 'Failed to update task');
    }
  }

  async handleDelete(args: CommandArgs): Promise<void> {
    const taskId = args[0];
    CliHelpers.validateRequired(taskId, 'Task ID', 'cc task delete <task-id>');
    
    const result = await this.taskService.deleteTask({ taskId });
    CliHelpers.handleVoidServiceResult(result, `Deleted task: ${taskId}`, 'Failed to delete task');
  }

  async handleArchive(args: CommandArgs): Promise<void> {
    const taskId = args[0];
    CliHelpers.validateRequired(taskId, 'Task ID', 'cc task archive <task-id>');
    
    const result = await this.taskService.archiveTask({ taskId });
    if (result.success && result.archivedTask) {
      console.log(`📦 Archived task: ${result.archivedTask.title}`);
    } else {
      CliHelpers.handleVoidServiceResult(result, '', 'Failed to archive task');
    }
  }

  async handleExport(options: TaskCommandOptions): Promise<void> {
    const result = await this.taskService.exportTasks({
      format: (options.format || 'json') as 'json' | 'csv' | 'markdown',
      includeArchived: options.includeArchived,
      outputPath: options.file
    });

    if (result.success) {
      console.log(`✅ Exported ${result.taskCount} tasks to ${result.exportPath}`);
    } else {
      CliHelpers.handleVoidServiceResult(result, '', 'Export failed');
    }
  }

  async handleImport(options: TaskCommandOptions): Promise<void> {
    CliHelpers.validateRequired(options.file, 'File path', 'cc task import --file backup.json');

    const result = await this.taskService.importTasks({
      filePath: options.file,
      format: (options.format === 'json' || options.format === 'csv') ? options.format : 'auto',
      mergeStrategy: options.mergeStrategy
    });

    if (result.success) {
      console.log(`✅ ${result.summary}`);
      if (result.errors && result.errors.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.errors.forEach(error => console.log(`   ${error}`));
      }
    } else {
      console.error(`❌ Import failed:`);
      result.errors?.forEach(error => console.error(`   ${error}`));
      process.exit(1);
    }
  }

  async handleBackup(options: TaskCommandOptions): Promise<void> {
    const result = await this.taskService.backupTasks({
      format: (options.format === 'csv') ? 'csv' : 'json'
    });

    if (result.success) {
      console.log(`✅ Backup created: ${result.backupPath}`);
      if (result.cleanedUpCount && result.cleanedUpCount > 0) {
        console.log(`   Cleaned up ${result.cleanedUpCount} old backups`);
      }
    } else {
      CliHelpers.handleVoidServiceResult(result, '', 'Backup failed');
    }
  }

  async handleAi(args: CommandArgs, options?: TaskCommandOptions): Promise<void> {
    const query = args[0];
    CliHelpers.validateRequired(query, 'AI query', 'cc task ai "Create tasks for building a web app"');
    
    console.log('🤖 Generating intelligent task breakdown with auto-expansion...');
    console.log(`📝 Query: ${query}`);
    
    // Enhanced AI task generation with intelligent rewrites and auto-expansion
    const intelligentPrompt = this.buildIntelligentTaskPrompt(query, options);
    
    const result = await this.getResearchService().executeResearch({
      query: intelligentPrompt,
      outputFormat: 'tasks',
      maxDepth: 3
    });
    
    if (result.success) {
      console.log('✅ AI task generation completed');
      console.log('🧠 Features applied:');
      console.log('   • Intelligent query rewriting');
      console.log('   • Auto-expansion into subtasks');
      console.log('   • Template detection and application');
      console.log('   • Priority and effort estimation');
      
      if (result.tasksCreated) {
        console.log(`📋 Created ${result.tasksCreated} tasks with subtasks`);
      }
    } else {
      console.error(`❌ AI task generation failed: ${result.error || 'Unknown error'}`);
      process.exit(1);
    }
  }

  /**
   * Build an intelligent prompt for AI task generation with auto-expansion
   */
  private buildIntelligentTaskPrompt(query: string, options?: TaskCommandOptions): string {
    return `Act as an expert project manager and software architect. Analyze this request and create an intelligent task breakdown:

REQUEST: "${query}"

INTELLIGENT PROCESSING STEPS:
1. REWRITE ANALYSIS: First, analyze if the request needs clarification or expansion. Rewrite it into a more specific, actionable format if needed.

2. AUTO-EXPANSION: Break down the request into:
   - Main tasks (3-8 primary tasks)
   - Subtasks for each main task (2-5 subtasks per main task)
   - Dependencies between tasks
   - Acceptance criteria for each task

3. TEMPLATE DETECTION: Determine if this fits common project patterns:
   - Web application development
   - API development
   - Mobile app development
   - DevOps/Infrastructure
   - Data analysis project
   - Marketing campaign
   If a template is detected, apply best practices from that domain.

4. INTELLIGENT ESTIMATION: For each task, provide:
   - Priority (critical/high/medium/low) based on dependencies and impact
   - Effort estimation in hours (realistic estimates)
   - Complexity assessment
   - Required skills/expertise

REQUIREMENTS:
- Generate tasks that are specific and actionable
- Include proper task dependencies
- Ensure tasks follow SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound)
- Add subtasks that break down complex work into manageable pieces
- Include testing and documentation tasks
- Consider different phases (planning, development, testing, deployment)

Generate comprehensive tasks that a development team can immediately act upon.`;
  }

  async handleResearch(args: CommandArgs, options?: any): Promise<void> {
    const query = args[0];
    const inputFile = args[1]; // Optional file input
    
    CliHelpers.validateRequired(query, 'Research query', 'cc task research "Research modern web frameworks" [file]');
    
    console.log('🔍 Conducting full agentic research workflow...');
    console.log(`📝 Query: ${query}`);
    if (inputFile) {
      console.log(`📄 Input file: ${inputFile}`);
    }
    
    // Determine target output type
    const targetType = options?.target || 'comprehensive';
    console.log(`🎯 Target output: ${targetType}`);
    
    // Build enhanced research prompt with target specification
    const enhancedQuery = this.buildAgenticResearchPrompt(query, targetType, inputFile);
    
    const result = await this.getResearchService().executeResearch({
      query: enhancedQuery,
      files: inputFile ? [inputFile] : undefined,
      outputFormat: 'both',
      maxDepth: 5 // Deeper research for agentic workflow
    });
    
    if (result.success) {
      console.log('✅ Agentic research completed successfully');
      console.log('🤖 Workflow stages completed:');
      console.log('   • Multi-source information gathering');
      console.log('   • Cross-reference validation');
      console.log('   • Expert analysis synthesis');
      console.log('   • Target-specific formatting');
      console.log('   • Actionable deliverable generation');
      
      if (result.reportPath) {
        console.log(`📄 ${this.getTargetDescription(targetType)} saved: ${result.reportPath}`);
      }
      if (result.tasksCreated) {
        console.log(`📋 Implementation tasks created: ${result.tasksCreated}`);
      }
    } else {
      console.error(`❌ Research failed: ${result.error || 'Unknown error'}`);
      process.exit(1);
    }
  }

  /**
   * Build an agentic research prompt with targeted output specification
   */
  private buildAgenticResearchPrompt(query: string, targetType: string, inputFile?: string): string {
    const targetSpecs = this.getTargetSpecification(targetType);
    const fileContext = inputFile ? `\n\nFILE CONTEXT: Analyze the provided file "${inputFile}" as additional context for this research.` : '';
    
    return `Act as a senior research agent with expertise in comprehensive analysis and deliverable creation. Conduct a full agentic research workflow:

RESEARCH QUERY: "${query}"
TARGET OUTPUT: ${targetType}
${fileContext}

AGENTIC WORKFLOW:

PHASE 1: INFORMATION GATHERING
- Conduct multi-source research using diverse perspectives
- Gather current industry data, best practices, and expert opinions
- Identify key stakeholders, technologies, and methodologies
- Cross-reference information for accuracy and completeness

PHASE 2: ANALYSIS & SYNTHESIS
- Analyze gathered information for patterns and insights
- Identify gaps, opportunities, and potential challenges
- Synthesize findings into coherent recommendations
- Validate conclusions against industry standards

PHASE 3: TARGET-SPECIFIC FORMATTING
${targetSpecs.requirements}

PHASE 4: DELIVERABLE GENERATION
Create the following deliverable structure:
${targetSpecs.structure}

PHASE 5: ACTIONABLE NEXT STEPS
- Generate specific implementation tasks
- Include timelines and resource requirements
- Provide success metrics and validation criteria
- Suggest iterative improvement processes

QUALITY REQUIREMENTS:
- Professional-grade deliverable suitable for stakeholder presentation
- Evidence-based recommendations with clear rationale
- Actionable insights with specific next steps
- Industry-standard formatting and terminology
- Comprehensive coverage addressing all aspects of the query

Generate a complete ${targetType} that can be immediately used for decision-making and implementation.`;
  }

  /**
   * Get target-specific requirements and structure
   */
  private getTargetSpecification(targetType: string): { requirements: string; structure: string } {
    const specs = {
      'prd': {
        requirements: `
- Follow standard PRD format with executive summary, goals, features, and requirements
- Include user stories, acceptance criteria, and success metrics
- Define technical requirements, constraints, and dependencies
- Provide competitive analysis and market positioning`,
        structure: `
1. Executive Summary
2. Product Goals & Objectives
3. Target Users & Personas
4. Feature Requirements & User Stories
5. Technical Requirements & Architecture
6. Success Metrics & KPIs
7. Timeline & Milestones
8. Risk Assessment & Mitigation`
      },
      'build-docs': {
        requirements: `
- Create comprehensive technical documentation for implementation
- Include architecture diagrams, API specifications, and deployment guides
- Provide setup instructions, dependencies, and configuration details
- Add troubleshooting guides and best practices`,
        structure: `
1. Architecture Overview
2. System Requirements & Dependencies
3. Installation & Setup Guide
4. API Documentation & Specifications
5. Deployment Instructions
6. Configuration Management
7. Monitoring & Maintenance
8. Troubleshooting & FAQ`
      },
      'ux-flow': {
        requirements: `
- Design complete user experience flows and journeys
- Include wireframes, user interactions, and decision points
- Define user personas, pain points, and success paths
- Provide usability guidelines and accessibility considerations`,
        structure: `
1. User Personas & Research Insights
2. User Journey Mapping
3. Information Architecture
4. Interaction Design Flows
5. Wireframes & Prototypes
6. Usability Testing Plan
7. Accessibility Guidelines
8. Implementation Recommendations`
      },
      'market-analysis': {
        requirements: `
- Conduct thorough market research and competitive analysis
- Include market size, trends, and growth opportunities
- Analyze competitors, pricing strategies, and positioning
- Provide go-to-market recommendations and strategy`,
        structure: `
1. Market Overview & Size
2. Industry Trends & Drivers
3. Competitive Landscape Analysis
4. Target Market Segmentation
5. Pricing Strategy & Models
6. Go-to-Market Strategy
7. Growth Opportunities
8. Strategic Recommendations`
      },
      'technical-spec': {
        requirements: `
- Create detailed technical specifications for development
- Include system architecture, data models, and API designs
- Define performance requirements, security considerations, and scalability
- Provide implementation guidelines and best practices`,
        structure: `
1. System Architecture & Design
2. Data Models & Database Schema
3. API Specifications & Endpoints
4. Security & Authentication
5. Performance & Scalability Requirements
6. Integration Points & Dependencies
7. Testing Strategy & Quality Assurance
8. Deployment & Operations`
      },
      'comprehensive': {
        requirements: `
- Provide comprehensive analysis covering all relevant aspects
- Include strategic, tactical, and operational recommendations
- Balance high-level insights with actionable details
- Address multiple stakeholder perspectives and concerns`,
        structure: `
1. Executive Summary & Key Findings
2. Research Methodology & Sources
3. Current State Analysis
4. Opportunities & Challenges
5. Strategic Recommendations
6. Implementation Roadmap
7. Success Metrics & Monitoring
8. Next Steps & Action Items`
      }
    };

    return specs[targetType as keyof typeof specs] || specs.comprehensive;
  }

  /**
   * Get description for the target output type
   */
  private getTargetDescription(targetType: string): string {
    const descriptions = {
      'prd': 'Product Requirements Document',
      'build-docs': 'Build & Implementation Documentation',
      'ux-flow': 'UX Flow & Design Documentation',
      'market-analysis': 'Market Analysis Report',
      'technical-spec': 'Technical Specification Document',
      'comprehensive': 'Comprehensive Research Report'
    };

    return descriptions[targetType as keyof typeof descriptions] || 'Research Output';
  }
}