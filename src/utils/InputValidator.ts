/**
 * Simple Input Validator
 * Basic validation utilities for CLI inputs
 */

export class InputValidator {
  static validateTaskTitle(title: string): { valid: boolean; error?: string } {
    if (!title || !title.trim()) {
      return { valid: false, error: 'Task title is required' };
    }
    
    if (title.length > 200) {
      return { valid: false, error: 'Task title must be less than 200 characters' };
    }
    
    return { valid: true };
  }
  
  static validateTaskDescription(description: string): { valid: boolean; error?: string } {
    if (description && description.length > 2000) {
      return { valid: false, error: 'Task description must be less than 2000 characters' };
    }
    
    return { valid: true };
  }
  
  static validatePriority(priority: string): { valid: boolean; error?: string } {
    const validPriorities = ['critical', 'high', 'medium', 'low'];
    
    if (!validPriorities.includes(priority)) {
      return { 
        valid: false, 
        error: `Priority must be one of: ${validPriorities.join(', ')}` 
      };
    }
    
    return { valid: true };
  }
  
  static validateStatus(status: string): { valid: boolean; error?: string } {
    const validStatuses = ['todo', 'in_progress', 'done', 'blocked', 'archived'];
    
    if (!validStatuses.includes(status)) {
      return { 
        valid: false, 
        error: `Status must be one of: ${validStatuses.join(', ')}` 
      };
    }
    
    return { valid: true };
  }
  
  // Email validation removed - not currently used in CLI
  // Can be restored if needed for future assignee validation
  
  static validateHours(hours: number): { valid: boolean; error?: string } {
    if (hours < 0) {
      return { valid: false, error: 'Hours must be a positive number' };
    }
    
    if (hours > 1000) {
      return { valid: false, error: 'Hours must be less than 1000' };
    }
    
    return { valid: true };
  }
  
  static sanitizeString(input: string): string {
    // Basic sanitization - remove potentially dangerous characters
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/[{}]/g, '') // Remove curly braces
      .trim();
  }
}