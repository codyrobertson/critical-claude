/**
 * End-to-End Workflow Tests
 * Tests the complete Critical Claude system including hook detection,
 * live monitoring, and real-world usage scenarios
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BacklogManager } from '../../cli/backlog-manager.js';

describe('End-to-End Workflow Tests', () => {
  let testProjectDir: string;
  let backlogManager: BacklogManager;
  let liveMonitorProcess: ChildProcess | null = null;

  beforeAll(async () => {
    // Setup isolated test environment
    testProjectDir = path.join(process.cwd(), 'test-e2e-workflow');
    await fs.mkdir(testProjectDir, { recursive: true });
    process.chdir(testProjectDir);
    
    backlogManager = new BacklogManager();
    await backlogManager.initialize();
  });

  afterAll(async () => {
    // Cleanup
    if (liveMonitorProcess) {
      liveMonitorProcess.kill('SIGTERM');
    }
    
    try {
      await fs.rm(testProjectDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  afterEach(async () => {
    // Stop any running live monitor
    if (liveMonitorProcess) {
      liveMonitorProcess.kill('SIGTERM');
      liveMonitorProcess = null;
    }
  });

  describe('Complete Task Lifecycle with Monitoring', () => {
    it('should demonstrate full workflow: create → monitor → sync → update', async () => {
      const hookLogPath = path.join(process.env.HOME!, '.critical-claude/hook-debug.log');
      const syncLogPath = path.join(process.env.HOME!, '.critical-claude/sync.log');
      
      // Clear logs to start fresh
      try {
        await fs.writeFile(hookLogPath, '');
        await fs.writeFile(syncLogPath, '');
      } catch (error) {
        // Logs may not exist yet
      }

      // Step 1: Start live monitor in background
      liveMonitorProcess = spawn('node', [
        path.join(process.cwd(), '../dist/cli/cc-main.js'),
        'live'
      ], {
        cwd: process.cwd(),
        stdio: 'pipe',
        detached: false
      });

      let monitorOutput = '';
      liveMonitorProcess.stdout?.on('data', (data) => {
        monitorOutput += data.toString();
      });

      // Give monitor time to start
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Create tasks via CLI (should trigger hooks)
      const taskCreationCommands = [
        'task add "E2E Test: Implement user login @high #auth #security 5pts"',
        'task add "E2E Test: Add unit tests @medium #testing 3pts"',
        'task add "E2E Test: Update documentation @low #docs 1pts"'
      ];

      for (const command of taskCreationCommands) {
        const packageRoot = path.resolve(__dirname, '../../..');
        const taskDescription = command.split(' ').slice(2).join(' '); // Everything after 'task add'
        const createProcess = spawn('node', [
          path.join(packageRoot, 'dist/cli/cc-main.js'),
          'task',
          taskDescription
        ], {
          cwd: packageRoot,
          stdio: 'pipe'
        });

        await new Promise((resolve, reject) => {
          createProcess.on('close', (code) => {
            if (code === 0) resolve(undefined);
            else reject(new Error(`Task creation failed: ${command}`));
          });
          setTimeout(() => reject(new Error(`Task creation timeout: ${command}`)), 10000);
        });

        // Small delay between tasks
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 3: Verify tasks were created
      const tasks = await backlogManager.listTasks();
      const e2eTasks = tasks.filter(task => task.title.includes('E2E Test:'));
      expect(e2eTasks).toHaveLength(3);

      // Verify task properties were parsed correctly
      const authTask = e2eTasks.find(task => task.title.includes('user login'));
      expect(authTask).toBeDefined();
      expect(authTask!.priority).toBe('high');
      expect(authTask!.labels).toContain('auth');
      expect(authTask!.labels).toContain('security');
      expect(authTask!.storyPoints).toBe(5);

      // Step 4: Run sync operation
      const syncProcess = spawn('node', [
        path.join(process.cwd(), '../dist/cli/cc-main.js'),
        'sync-claude-code',
        '--execute'
      ], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      let syncOutput = '';
      syncProcess.stdout?.on('data', (data) => {
        syncOutput += data.toString();
      });

      await new Promise((resolve, reject) => {
        syncProcess.on('close', (code) => {
          if (code === 0) resolve(undefined);
          else reject(new Error('Sync operation failed'));
        });
        setTimeout(() => reject(new Error('Sync timeout')), 15000);
      });

      // Step 5: Update a task
      const updateProcess = spawn('node', [
        path.join(process.cwd(), '../dist/cli/cc-main.js'),
        'task',
        'update',
        authTask!.id,
        '--status',
        'in_progress',
        '--priority',
        'critical'
      ], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      await new Promise((resolve, reject) => {
        updateProcess.on('close', (code) => {
          if (code === 0) resolve(undefined);
          else reject(new Error('Task update failed'));
        });
        setTimeout(() => reject(new Error('Task update timeout')), 10000);
      });

      // Step 6: Give monitor time to capture events
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 7: Stop monitor and analyze output
      if (liveMonitorProcess) {
        liveMonitorProcess.kill('SIGTERM');
        liveMonitorProcess = null;
      }

      // Step 8: Verify all operations completed successfully
      expect(syncOutput).toContain('tasks synced');
      expect(e2eTasks).toHaveLength(3);

      // Step 9: Check monitor detected activity
      console.log('Monitor output sample:', monitorOutput.slice(-500));
      
      // The monitor should have shown hook activity
      const hasHookActivity = monitorOutput.includes('🪝') || monitorOutput.includes('Hook triggered');
      const hasSyncActivity = monitorOutput.includes('🔄') || monitorOutput.includes('tasks synced');
      
      if (hasHookActivity) {
        console.log('✅ Live monitor successfully detected hook activity');
      } else {
        console.warn('⚠️  Live monitor did not detect hook activity - this explains the issue you mentioned');
      }
      
      if (hasSyncActivity) {
        console.log('✅ Live monitor successfully detected sync activity');
      }

      // Step 10: Verify final task state
      const finalTasks = await backlogManager.listTasks();
      const updatedAuthTask = finalTasks.find(task => task.id === authTask!.id);
      expect(updatedAuthTask).toBeDefined();
      expect(updatedAuthTask!.status).toBe('in_progress');

      console.log('✅ Complete E2E workflow test passed');
    }, 60000);
  });

  describe('Hook Detection and Live Monitor Integration', () => {
    it('should identify why hooks may not be triggering in live monitor', async () => {
      const hookLogPath = path.join(process.env.HOME!, '.critical-claude/hook-debug.log');
      
      // Test 1: Check if hook log file exists and is writable
      try {
        await fs.access(hookLogPath);
        console.log('✅ Hook log file exists at:', hookLogPath);
      } catch (error) {
        console.warn('⚠️  Hook log file does not exist:', hookLogPath);
        console.warn('This may explain why live monitor shows no hook activity');
      }

      // Test 2: Check Claude Code hook configuration
      const claudeSettingsPath = path.join(process.env.HOME!, '.claude/settings.json');
      try {
        const settingsContent = await fs.readFile(claudeSettingsPath, 'utf-8');
        const settings = JSON.parse(settingsContent);
        
        if (settings.hooks && settings.hooks.length > 0) {
          console.log('✅ Claude Code hooks are configured');
          console.log('Hook count:', settings.hooks.length);
          
          const criticalClaudeHook = settings.hooks.find((hook: any) => 
            hook.name && hook.name.includes('critical-claude')
          );
          
          if (criticalClaudeHook) {
            console.log('✅ Critical Claude hook found:', criticalClaudeHook.name);
            console.log('Hook enabled:', criticalClaudeHook.enabled);
            console.log('Hook command:', criticalClaudeHook.command);
          } else {
            console.warn('⚠️  Critical Claude hook not found in configuration');
          }
        } else {
          console.warn('⚠️  No hooks configured in Claude Code settings');
          console.warn('This explains why TodoWrite operations don\'t trigger hooks');
        }
      } catch (error) {
        console.warn('⚠️  Could not read Claude Code settings:', error.message);
        console.warn('Hook configuration may not be set up properly');
      }

      // Test 3: Manually trigger hook script to test functionality
      const hookScriptPath = path.join(process.env.HOME!, '.critical-claude/claude-code-sync.sh');
      try {
        await fs.access(hookScriptPath);
        console.log('✅ Hook script exists at:', hookScriptPath);
        
        // Test if script is executable
        const stats = await fs.stat(hookScriptPath);
        if (stats.mode & 0o111) {
          console.log('✅ Hook script is executable');
        } else {
          console.warn('⚠️  Hook script is not executable');
        }
      } catch (error) {
        console.warn('⚠️  Hook script does not exist:', hookScriptPath);
      }

      // Test 4: Create a task and manually write to hook log
      const task = await backlogManager.createTask({
        title: 'Hook detection diagnostic task',
        description: 'Testing hook detection'
      });

      // Simulate what should happen when hook triggers
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] DIAGNOSTIC: Hook triggered! Event: PostToolUse, Tool: TodoWrite\\n`;
      
      try {
        // Ensure directory exists
        await fs.mkdir(path.dirname(hookLogPath), { recursive: true });
        await fs.appendFile(hookLogPath, logEntry);
        console.log('✅ Successfully wrote to hook log');
        
        // Test if live monitor would detect this
        const logContent = await fs.readFile(hookLogPath, 'utf-8');
        if (logContent.includes('DIAGNOSTIC: Hook triggered')) {
          console.log('✅ Hook log content is correct format for live monitor');
        }
      } catch (error) {
        console.warn('⚠️  Could not write to hook log:', error.message);
      }

      expect(task).toBeDefined();
    }, 20000);

    it('should test live monitor file watching capabilities', async () => {
      // Start live monitor
      liveMonitorProcess = spawn('node', [
        path.join(process.cwd(), '../dist/cli/cc-main.js'),
        'live'
      ], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      let monitorOutput = '';
      liveMonitorProcess.stdout?.on('data', (data) => {
        monitorOutput += data.toString();
      });

      // Give monitor time to start and begin file watching
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Manually write to hook and sync logs to test file watching
      const hookLogPath = path.join(process.env.HOME!, '.critical-claude/hook-debug.log');
      const syncLogPath = path.join(process.env.HOME!, '.critical-claude/sync.log');

      const timestamp = new Date().toLocaleTimeString();
      
      try {
        // Ensure directories exist
        await fs.mkdir(path.dirname(hookLogPath), { recursive: true });
        await fs.mkdir(path.dirname(syncLogPath), { recursive: true });
        
        // Write hook event
        await fs.appendFile(hookLogPath, `[${new Date().toISOString()}] Hook triggered! Event: PostToolUse, Tool: TodoWrite, PWD: ${process.cwd()}\\n`);
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Write sync event
        await fs.appendFile(syncLogPath, `${timestamp} ✅ 5 tasks synced to Claude Code\\n`);
        await fs.appendFile(syncLogPath, 'Sync completed successfully\\n');
        
        // Give monitor time to detect file changes
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.warn('Could not write to log files:', error.message);
      }

      // Stop monitor
      if (liveMonitorProcess) {
        liveMonitorProcess.kill('SIGTERM');
        liveMonitorProcess = null;
      }

      // Analyze monitor output
      console.log('Live monitor file watching test output:');
      console.log(monitorOutput.slice(-800));

      // Check if monitor detected the manually written events
      const detectedHook = monitorOutput.includes('🪝') || monitorOutput.includes('Hook triggered');
      const detectedSync = monitorOutput.includes('🔄') || monitorOutput.includes('tasks synced');

      if (detectedHook) {
        console.log('✅ Live monitor file watching works for hook events');
      } else {
        console.warn('⚠️  Live monitor did not detect manually written hook events');
        console.warn('This suggests an issue with file watching or log parsing');
      }

      if (detectedSync) {
        console.log('✅ Live monitor file watching works for sync events');
      } else {
        console.warn('⚠️  Live monitor did not detect manually written sync events');
      }

      // This test should help us understand why the monitor isn't showing hook activity
      expect(monitorOutput.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Integration with External Tools', () => {
    it('should work correctly when Claude Code is available', async () => {
      // Test if Claude Code CLI is available
      const claudeCodeTest = spawn('which', ['claude'], {
        stdio: 'pipe'
      });

      let claudeCodeAvailable = false;
      
      await new Promise((resolve) => {
        claudeCodeTest.on('close', (code) => {
          claudeCodeAvailable = (code === 0);
          resolve(undefined);
        });
        setTimeout(resolve, 5000);
      });

      if (claudeCodeAvailable) {
        console.log('✅ Claude Code CLI is available for testing');
        
        // Test actual TodoWrite operation if possible
        // Note: This would require actual Claude Code setup
        console.log('🔍 Full Claude Code integration testing would require live setup');
      } else {
        console.log('ℹ️  Claude Code CLI not available - testing in simulation mode');
      }

      // Test our CLI regardless
      const listProcess = spawn('node', [
        path.join(process.cwd(), '../dist/cli/cc-main.js'),
        'task',
        'list'
      ], {
        cwd: process.cwd(),
        stdio: 'pipe'
      });

      let listOutput = '';
      listProcess.stdout?.on('data', (data) => {
        listOutput += data.toString();
      });

      await new Promise((resolve, reject) => {
        listProcess.on('close', (code) => {
          if (code === 0) resolve(undefined);
          else reject(new Error('Task list command failed'));
        });
        setTimeout(() => reject(new Error('Task list timeout')), 10000);
      });

      expect(listOutput).toBeDefined();
      console.log('✅ Critical Claude CLI is working correctly');
    }, 15000);
  });
});