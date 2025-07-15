/**
 * Task Parser - Natural language parsing for task creation
 * Extracts metadata from strings like: "fix login bug @high #auth #security 3pts due:tomorrow for:@alice"
 */
import { TaskPriority } from '../types/agile.js';
export interface ParsedTask {
    title: string;
    description?: string;
    priority?: TaskPriority;
    labels?: string[];
    points?: number;
    assignee?: string;
    dueDate?: Date;
    mentions?: string[];
}
export declare class TaskParser {
    private patterns;
    /**
     * Parse natural language task input
     */
    parse(input: string): ParsedTask;
    /**
     * Parse various due date formats
     */
    private parseDueDate;
    /**
     * Get the next occurrence of a weekday
     */
    private getNextWeekday;
    /**
     * Validate parsed task
     */
    validate(parsed: ParsedTask): {
        valid: boolean;
        errors: string[];
    };
}
export declare const taskParser: TaskParser;
//# sourceMappingURL=task-parser.d.ts.map