/**
 * Task Parser - Natural language parsing for task creation
 * Extracts metadata from strings like: "fix login bug @high #auth #security 3pts due:tomorrow for:@alice"
 */
export class TaskParser {
    patterns = {
        // @high, @critical, etc.
        priority: /@(critical|high|medium|low)\b/i,
        // #bug, #feature, #auth, etc.
        labels: /#(\w+)/g,
        // 3pts, 5pt, 8 points
        points: /(\d+)\s*(?:pts?|points?)\b/i,
        // for:@alice, for:alice
        assignee: /for:@?(\w+)/i,
        // due:tomorrow, due:friday, due:2024-01-15
        due: /due:(\S+)/i,
        // @mentions in the text
        mentions: /@(\w+)/g,
        // [description] or (description) for additional context
        description: /[\[(](.+?)[\])]/,
    };
    /**
     * Parse natural language task input
     */
    parse(input) {
        let workingText = input;
        const result = {
            title: input, // Will be cleaned up at the end
        };
        // Extract priority
        const priorityMatch = workingText.match(this.patterns.priority);
        if (priorityMatch) {
            result.priority = priorityMatch[1].toLowerCase();
            workingText = workingText.replace(priorityMatch[0], '');
        }
        // Extract labels
        const labels = [];
        let labelMatch;
        while ((labelMatch = this.patterns.labels.exec(workingText)) !== null) {
            labels.push(labelMatch[1].toLowerCase());
        }
        if (labels.length > 0) {
            result.labels = labels;
            workingText = workingText.replace(this.patterns.labels, '');
        }
        // Extract story points
        const pointsMatch = workingText.match(this.patterns.points);
        if (pointsMatch) {
            result.points = parseInt(pointsMatch[1], 10);
            workingText = workingText.replace(pointsMatch[0], '');
        }
        // Extract assignee
        const assigneeMatch = workingText.match(this.patterns.assignee);
        if (assigneeMatch) {
            result.assignee = assigneeMatch[1];
            workingText = workingText.replace(assigneeMatch[0], '');
        }
        // Extract due date
        const dueMatch = workingText.match(this.patterns.due);
        if (dueMatch) {
            result.dueDate = this.parseDueDate(dueMatch[1]);
            workingText = workingText.replace(dueMatch[0], '');
        }
        // Extract description
        const descMatch = workingText.match(this.patterns.description);
        if (descMatch) {
            result.description = descMatch[1];
            workingText = workingText.replace(descMatch[0], '');
        }
        // Extract mentions (excluding priority which also uses @)
        const mentions = [];
        let mentionMatch;
        const mentionRegex = /@(\w+)/g;
        while ((mentionMatch = mentionRegex.exec(workingText)) !== null) {
            const mention = mentionMatch[1].toLowerCase();
            if (!['critical', 'high', 'medium', 'low'].includes(mention)) {
                mentions.push(mention);
            }
        }
        if (mentions.length > 0) {
            result.mentions = mentions;
            // Remove mentions from title
            workingText = workingText.replace(/@\w+/g, '');
        }
        // Clean up the title
        result.title = workingText
            .trim()
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/^\W+|\W+$/g, ''); // Remove leading/trailing non-word chars
        // If title is empty after extraction, use the original input
        if (!result.title) {
            result.title = input
                .replace(this.patterns.priority, '')
                .replace(this.patterns.labels, '')
                .replace(this.patterns.points, '')
                .replace(this.patterns.assignee, '')
                .replace(this.patterns.due, '')
                .replace(this.patterns.description, '')
                .replace(/@\w+/g, '')
                .trim();
        }
        return result;
    }
    /**
     * Parse various due date formats
     */
    parseDueDate(dateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lowerStr = dateStr.toLowerCase();
        // Relative dates
        switch (lowerStr) {
            case 'today':
                return new Date(today);
            case 'tomorrow':
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return tomorrow;
            case 'monday':
            case 'tuesday':
            case 'wednesday':
            case 'thursday':
            case 'friday':
            case 'saturday':
            case 'sunday':
                return this.getNextWeekday(lowerStr);
            case 'next-week':
            case 'nextweek':
                const nextWeek = new Date(today);
                nextWeek.setDate(nextWeek.getDate() + 7);
                return nextWeek;
            case 'next-month':
            case 'nextmonth':
                const nextMonth = new Date(today);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                return nextMonth;
        }
        // Try parsing as ISO date (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            const parsed = new Date(dateStr + 'T00:00:00');
            if (!isNaN(parsed.getTime())) {
                return parsed;
            }
        }
        // Try parsing as MM/DD/YYYY or MM-DD-YYYY
        if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(dateStr)) {
            const parsed = new Date(dateStr);
            if (!isNaN(parsed.getTime())) {
                return parsed;
            }
        }
        // Try parsing relative days (in 3 days, 5d, etc.)
        const relativeDaysMatch = dateStr.match(/(?:in\s*)?(\d+)\s*(?:d|days?)/i);
        if (relativeDaysMatch) {
            const days = parseInt(relativeDaysMatch[1], 10);
            const futureDate = new Date(today);
            futureDate.setDate(futureDate.getDate() + days);
            return futureDate;
        }
        return undefined;
    }
    /**
     * Get the next occurrence of a weekday
     */
    getNextWeekday(weekdayName) {
        const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDay = weekdays.indexOf(weekdayName);
        if (targetDay === -1)
            return new Date();
        const today = new Date();
        const currentDay = today.getDay();
        let daysUntilTarget = targetDay - currentDay;
        // If the day has already passed this week, get next week's
        if (daysUntilTarget <= 0) {
            daysUntilTarget += 7;
        }
        const result = new Date(today);
        result.setDate(result.getDate() + daysUntilTarget);
        result.setHours(0, 0, 0, 0);
        return result;
    }
    /**
     * Validate parsed task
     */
    validate(parsed) {
        const errors = [];
        if (!parsed.title || parsed.title.trim().length === 0) {
            errors.push('Task title is required');
        }
        if (parsed.title && parsed.title.length > 200) {
            errors.push('Task title is too long (max 200 characters)');
        }
        if (parsed.points && (parsed.points < 1 || parsed.points > 100)) {
            errors.push('Story points must be between 1 and 100');
        }
        if (parsed.dueDate && parsed.dueDate < new Date()) {
            errors.push('Due date cannot be in the past');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
// Export singleton instance
export const taskParser = new TaskParser();
//# sourceMappingURL=task-parser.js.map