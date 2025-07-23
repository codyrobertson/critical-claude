/**
 * Silent Logger Implementation
 * Discards all log messages to prevent UI corruption
 */
import { LogLevel } from '../../application/ports/ILogger.js';
export class SilentLogger {
    level = LogLevel.INFO;
    context = {};
    constructor(initialLevel, initialContext) {
        if (initialLevel !== undefined) {
            this.level = initialLevel;
        }
        if (initialContext) {
            this.context = initialContext;
        }
    }
    debug(message, context) {
        // Silent - no output
    }
    info(message, context) {
        // Silent - no output
    }
    warn(message, context) {
        // Silent - no output
    }
    error(message, error, context) {
        // Silent - no output
    }
    fatal(message, error, context) {
        // Silent - no output
    }
    setLevel(level) {
        this.level = level;
    }
    getLevel() {
        return this.level;
    }
    child(context) {
        return new SilentLogger(this.level, { ...this.context, ...context });
    }
}
//# sourceMappingURL=SilentLogger.js.map