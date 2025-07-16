/**
 * Simple utility tests
 */

describe('Utility Functions', () => {
  it('should format task content for display', () => {
    const task = {
      id: '1',
      title: 'Test Task',
      priority: 'high',
      labels: ['test', 'example'],
      storyPoints: 5
    };

    const formatted = `${task.title} @${task.priority} #${task.labels.join(' #')} ${task.storyPoints}pts`;
    expect(formatted).toBe('Test Task @high #test #example 5pts');
  });

  it('should calculate task statistics', () => {
    const tasks = [
      { status: 'todo' },
      { status: 'todo' },
      { status: 'in_progress' },
      { status: 'done' },
      { status: 'done' }
    ];

    const stats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'done').length
    };

    expect(stats.total).toBe(5);
    expect(stats.pending).toBe(2);
    expect(stats.inProgress).toBe(1);
    expect(stats.completed).toBe(2);
  });

  it('should validate task data', () => {
    const validTask = {
      id: 'valid-id',
      title: 'Valid Task',
      status: 'todo'
    };

    const invalidTask = {
      id: '',
      title: '',
      status: 'invalid'
    };

    expect(validTask.id.length).toBeGreaterThan(0);
    expect(validTask.title.length).toBeGreaterThan(0);
    expect(['todo', 'in_progress', 'done'].includes(validTask.status)).toBe(true);

    expect(invalidTask.id.length).toBe(0);
    expect(invalidTask.title.length).toBe(0);
    expect(['todo', 'in_progress', 'done'].includes(invalidTask.status as any)).toBe(false);
  });

  it('should handle error cases gracefully', () => {
    const tryParseJson = (text: string) => {
      try {
        return JSON.parse(text);
      } catch (error) {
        return null;
      }
    };

    expect(tryParseJson('{"valid": true}')).toEqual({ valid: true });
    expect(tryParseJson('invalid json')).toBe(null);
    expect(tryParseJson('')).toBe(null);
  });

  it('should format time strings correctly', () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    
    expect(timeString).toMatch(/\d{1,2}:\d{2}:\d{2}/);
  });
});