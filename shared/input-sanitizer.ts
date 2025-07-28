/**
 * Input Sanitization & Security
 * Prevents injection attacks and validates input data
 */

// Simple but effective sanitization without heavy dependencies
export class InputSanitizer {
  
  /**
   * Sanitize string input - removes dangerous characters
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      throw new Error('Input must be a string');
    }
    
    return input
      // Remove null bytes and control characters
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Remove potentially dangerous Unicode characters
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      // Normalize unicode
      .normalize('NFKC')
      // Trim whitespace
      .trim();
  }

  /**
   * Sanitize filename - prevent directory traversal
   */
  static sanitizeFilename(filename: string): string {
    const sanitized = this.sanitizeString(filename)
      // Remove path separators
      .replace(/[\/\\]/g, '')
      // Remove dangerous characters
      .replace(/[<>:"|?*]/g, '')
      // Remove leading/trailing periods and spaces
      .replace(/^[\.\s]+|[\.\s]+$/g, '')
      // Limit length
      .substring(0, 255);
    
    if (!sanitized || sanitized.length === 0) {
      throw new Error('Invalid filename after sanitization');
    }
    
    // Check for reserved Windows filenames
    const reserved = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i;
    if (reserved.test(sanitized)) {
      throw new Error('Reserved filename not allowed');
    }
    
    return sanitized;
  }

  /**
   * Sanitize email address
   */
  static sanitizeEmail(email: string): string {
    const sanitized = this.sanitizeString(email);
    
    // Basic email validation (not perfect but good enough)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    return sanitized.toLowerCase();
  }

  /**
   * Sanitize number input
   */
  static sanitizeNumber(input: unknown, min?: number, max?: number): number {
    const num = Number(input);
    
    if (isNaN(num) || !isFinite(num)) {
      throw new Error('Invalid number');
    }
    
    if (min !== undefined && num < min) {
      throw new Error(`Number must be at least ${min}`);
    }
    
    if (max !== undefined && num > max) {
      throw new Error(`Number cannot exceed ${max}`);
    }
    
    return num;
  }

  /**
   * Sanitize array of strings
   */
  static sanitizeStringArray(input: unknown, maxLength = 100): string[] {
    if (!Array.isArray(input)) {
      throw new Error('Input must be an array');
    }
    
    if (input.length > maxLength) {
      throw new Error(`Array cannot exceed ${maxLength} items`);
    }
    
    return input.map(item => {
      if (typeof item !== 'string') {
        throw new Error('All array items must be strings');
      }
      return this.sanitizeString(item);
    });
  }

  /**
   * Validate priority value
   */
  static validatePriority(priority: unknown): 'critical' | 'high' | 'medium' | 'low' {
    const validPriorities = ['critical', 'high', 'medium', 'low'] as const;
    
    if (typeof priority !== 'string' || !validPriorities.includes(priority as any)) {
      throw new Error('Priority must be one of: critical, high, medium, low');
    }
    
    return priority as 'critical' | 'high' | 'medium' | 'low';
  }

  /**
   * Validate task status
   */
  static validateTaskStatus(status: unknown): 'todo' | 'in_progress' | 'done' | 'blocked' | 'archived' {
    const validStatuses = ['todo', 'in_progress', 'done', 'blocked', 'archived'] as const;
    
    if (typeof status !== 'string' || !validStatuses.includes(status as any)) {
      throw new Error('Status must be one of: todo, in_progress, done, blocked, archived');
    }
    
    return status as 'todo' | 'in_progress' | 'done' | 'blocked' | 'archived';
  }

  /**
   * Comprehensive task input sanitization
   */
  static sanitizeTaskInput(input: {
    title?: unknown;
    description?: unknown;
    priority?: unknown;
    assignee?: unknown;
    labels?: unknown;
    estimatedHours?: unknown;
  }) {
    const sanitized: any = {};
    
    if (input.title !== undefined) {
      sanitized.title = this.sanitizeString(input.title as string);
      if (sanitized.title.length === 0) {
        throw new Error('Title cannot be empty');
      }
      if (sanitized.title.length > 200) {
        throw new Error('Title cannot exceed 200 characters');
      }
    }
    
    if (input.description !== undefined && input.description !== null) {
      sanitized.description = this.sanitizeString(input.description as string);
      if (sanitized.description.length > 2000) {
        throw new Error('Description cannot exceed 2000 characters');
      }
    }
    
    if (input.priority !== undefined) {
      sanitized.priority = this.validatePriority(input.priority);
    }
    
    if (input.assignee !== undefined && input.assignee !== null) {
      sanitized.assignee = this.sanitizeEmail(input.assignee as string);
    }
    
    if (input.labels !== undefined) {
      sanitized.labels = this.sanitizeStringArray(input.labels, 10)
        .filter(label => label.length > 0)
        .map(label => {
          if (label.length > 50) {
            throw new Error('Label cannot exceed 50 characters');
          }
          return label;
        });
    }
    
    if (input.estimatedHours !== undefined) {
      sanitized.estimatedHours = this.sanitizeNumber(input.estimatedHours, 0, 1000);
    }
    
    return sanitized;
  }

  /**
   * Prevent command injection in shell commands
   */
  static sanitizeShellArg(arg: string): string {
    // Remove or escape dangerous shell characters
    return this.sanitizeString(arg)
      .replace(/[;&|`$(){}[\]\\]/g, '')
      .replace(/\.\./g, ''); // Prevent directory traversal
  }

  /**
   * Rate limiting helper - simple token bucket
   */
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();
    
    return (identifier: string): boolean => {
      const now = Date.now();
      const userRequests = requests.get(identifier) || [];
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);
      
      return true; // Request allowed
    };
  }
}

// Create rate limiters for different operations
export const taskCreateLimiter = InputSanitizer.createRateLimiter(10, 60000); // 10 per minute
export const taskListLimiter = InputSanitizer.createRateLimiter(30, 60000); // 30 per minute
export const researchLimiter = InputSanitizer.createRateLimiter(5, 300000); // 5 per 5 minutes