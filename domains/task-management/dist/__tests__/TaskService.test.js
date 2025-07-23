/**
 * Task Service Unit Tests
 * Comprehensive tests for task management functionality
 */
import { TaskService } from '../application/services/TaskService.js';
import { TaskRepository } from '../infrastructure/TaskRepository.js';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
describe('TaskService', () => {
    let taskService;
    let tempDir;
    beforeEach(async () => {
        // Create temporary directory for each test
        tempDir = path.join(os.tmpdir(), `test-tasks-${Date.now()}`);
        await fs.mkdir(tempDir, { recursive: true });
        const taskRepository = new TaskRepository(tempDir);
        taskService = new TaskService(taskRepository);
    });
    afterEach(async () => {
        // Clean up temporary directory
        try {
            await fs.rmdir(tempDir, { recursive: true });
        }
        catch (error) {
            // Ignore cleanup errors
        }
    });
    describe('createTask', () => {
        it('should create a task successfully', async () => {
            const result = await taskService.createTask({
                title: 'Test Task',
                description: 'Test Description',
                priority: 'high',
                assignee: 'test-user',
                labels: ['test', 'unit']
            });
            expect(result.success).toBe(true);
            expect(result.task).toBeDefined();
            expect(result.task.title).toBe('Test Task');
            expect(result.task.description).toBe('Test Description');
            expect(result.task.priority.value).toBe('high');
            expect(result.task.assignee).toBe('test-user');
            expect(result.task.labels).toEqual(['test', 'unit']);
        });
        it('should fail to create task without title', async () => {
            const result = await taskService.createTask({
                title: '',
                description: 'Test Description'
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('title');
        });
        it('should create task with default values', async () => {
            const result = await taskService.createTask({
                title: 'Minimal Task'
            });
            expect(result.success).toBe(true);
            expect(result.task.priority.value).toBe('medium');
            expect(result.task.status.value).toBe('todo');
            expect(result.task.labels).toEqual([]);
        });
    });
    describe('listTasks', () => {
        beforeEach(async () => {
            // Create test tasks
            await taskService.createTask({
                title: 'Task 1',
                priority: 'high',
                status: 'todo'
            });
            await taskService.createTask({
                title: 'Task 2',
                priority: 'medium',
                status: 'in_progress'
            });
            await taskService.createTask({
                title: 'Task 3',
                priority: 'low',
                status: 'done'
            });
        });
        it('should list all tasks', async () => {
            const result = await taskService.listTasks({});
            expect(result.success).toBe(true);
            expect(result.tasks).toHaveLength(3);
        });
        it('should filter tasks by status', async () => {
            const result = await taskService.listTasks({
                status: 'in_progress'
            });
            expect(result.success).toBe(true);
            expect(result.tasks).toHaveLength(1);
            expect(result.tasks[0].status.value).toBe('in_progress');
        });
        it('should filter tasks by priority', async () => {
            const result = await taskService.listTasks({
                priority: 'high'
            });
            expect(result.success).toBe(true);
            expect(result.tasks).toHaveLength(1);
            expect(result.tasks[0].priority.value).toBe('high');
        });
    });
    describe('updateTask', () => {
        let taskId;
        beforeEach(async () => {
            const result = await taskService.createTask({
                title: 'Update Test Task',
                description: 'Original description',
                priority: 'medium'
            });
            taskId = result.task.id.value;
        });
        it('should update task title', async () => {
            const result = await taskService.updateTask({
                id: taskId,
                title: 'Updated Title'
            });
            expect(result.success).toBe(true);
            expect(result.task.title).toBe('Updated Title');
        });
        it('should update task status', async () => {
            const result = await taskService.updateTask({
                id: taskId,
                status: 'in_progress'
            });
            expect(result.success).toBe(true);
            expect(result.task.status.value).toBe('in_progress');
        });
        it('should fail to update non-existent task', async () => {
            const result = await taskService.updateTask({
                id: 'non-existent-id',
                title: 'Should Fail'
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
    });
    describe('deleteTask', () => {
        let taskId;
        beforeEach(async () => {
            const result = await taskService.createTask({
                title: 'Delete Test Task'
            });
            taskId = result.task.id.value;
        });
        it('should delete task successfully', async () => {
            const deleteResult = await taskService.deleteTask({ taskId });
            expect(deleteResult.success).toBe(true);
            // Verify task is gone
            const viewResult = await taskService.viewTask({ taskId });
            expect(viewResult.success).toBe(false);
        });
        it('should fail to delete non-existent task', async () => {
            const result = await taskService.deleteTask({
                taskId: 'non-existent-id'
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('not found');
        });
    });
    describe('archiveTask', () => {
        let taskId;
        beforeEach(async () => {
            const result = await taskService.createTask({
                title: 'Archive Test Task',
                status: 'done'
            });
            taskId = result.task.id.value;
        });
        it('should archive completed task', async () => {
            const result = await taskService.archiveTask({ taskId });
            expect(result.success).toBe(true);
            expect(result.archivedTask).toBeDefined();
        });
        it('should fail to archive incomplete task', async () => {
            // Create incomplete task
            const createResult = await taskService.createTask({
                title: 'Incomplete Task',
                status: 'todo'
            });
            const archiveResult = await taskService.archiveTask({
                taskId: createResult.task.id.value
            });
            expect(archiveResult.success).toBe(false);
            expect(archiveResult.error).toContain('completed');
        });
    });
});
// Simple test runner function for basic verification
export async function runTests() {
    console.log('🧪 Running TaskService Tests...');
    try {
        // Basic smoke test
        const tempDir = path.join(os.tmpdir(), `smoke-test-${Date.now()}`);
        await fs.mkdir(tempDir, { recursive: true });
        const taskRepository = new TaskRepository(tempDir);
        const taskService = new TaskService(taskRepository);
        // Test 1: Create task
        const createResult = await taskService.createTask({
            title: 'Smoke Test Task',
            description: 'Testing basic functionality'
        });
        if (!createResult.success) {
            throw new Error('Failed to create task');
        }
        console.log('✅ Task creation test passed');
        // Test 2: List tasks
        const listResult = await taskService.listTasks({});
        if (!listResult.success || !listResult.tasks || listResult.tasks.length === 0) {
            throw new Error('Failed to list tasks');
        }
        console.log('✅ Task listing test passed');
        // Test 3: Update task
        const updateResult = await taskService.updateTask({
            id: createResult.task.id.value,
            status: 'in_progress'
        });
        if (!updateResult.success) {
            throw new Error('Failed to update task');
        }
        console.log('✅ Task update test passed');
        // Cleanup
        await fs.rmdir(tempDir, { recursive: true });
        console.log('🎉 All TaskService tests passed!');
    }
    catch (error) {
        console.error('❌ TaskService tests failed:', error);
        throw error;
    }
}
// Export for manual testing
if (typeof require !== 'undefined' && require.main === module) {
    runTests().catch(console.error);
}
//# sourceMappingURL=TaskService.test.js.map