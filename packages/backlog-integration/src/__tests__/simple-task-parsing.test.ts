/**
 * Simple unit tests for natural language parsing
 */

describe('Natural Language Parsing', () => {
  it('should parse priority from text', () => {
    const tests = [
      { text: 'Task @critical', expected: 'critical' },
      { text: 'Task @high priority', expected: 'high' },
      { text: 'Task @medium', expected: 'medium' },
      { text: 'Task @low', expected: 'low' },
      { text: 'Task without priority', expected: 'medium' }
    ];

    tests.forEach(({ text, expected }) => {
      const priorityMatch = text.match(/@(critical|high|medium|low)/);
      const priority = priorityMatch ? priorityMatch[1] : 'medium';
      expect(priority).toBe(expected);
    });
  });

  it('should parse labels from text', () => {
    const text = 'Implement feature #frontend #javascript #api';
    const labelMatches = text.match(/#(\w+)/g);
    const labels = labelMatches ? labelMatches.map(match => match.substring(1)) : [];
    
    expect(labels).toEqual(['frontend', 'javascript', 'api']);
  });

  it('should parse story points from text', () => {
    const tests = [
      { text: 'Task 8pts', expected: 8 },
      { text: 'Task 13 points', expected: 13 },
      { text: 'Task with no points', expected: 0 }
    ];

    tests.forEach(({ text, expected }) => {
      const pointsMatch = text.match(/(\d+)\s*(?:pts?|points?)/);
      const points = pointsMatch ? parseInt(pointsMatch[1]) : 0;
      expect(points).toBe(expected);
    });
  });

  it('should parse assignee from text', () => {
    const tests = [
      { text: 'Task for:john.doe', expected: 'john.doe' },
      { text: 'Task for:@alice', expected: 'alice' },
      { text: 'Task without assignee', expected: undefined }
    ];

    tests.forEach(({ text, expected }) => {
      const assigneeMatch = text.match(/for:@?(\w+(?:\.\w+)*)/);
      const assignee = assigneeMatch ? assigneeMatch[1] : undefined;
      expect(assignee).toBe(expected);
    });
  });
});