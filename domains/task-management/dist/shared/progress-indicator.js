/**
 * Progress Indicator Utilities
 * Simple progress indicators for long-running CLI operations
 */
export class ProgressIndicator {
    interval = null;
    frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    currentFrame = 0;
    message;
    constructor(message = 'Processing...') {
        this.message = message;
    }
    start() {
        if (this.interval)
            return;
        process.stdout.write('\x1B[?25l'); // Hide cursor
        this.interval = setInterval(() => {
            process.stdout.write(`\r${this.frames[this.currentFrame]} ${this.message}`);
            this.currentFrame = (this.currentFrame + 1) % this.frames.length;
        }, 100);
    }
    updateMessage(message) {
        this.message = message;
    }
    stop(finalMessage) {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        process.stdout.write('\r\x1B[K'); // Clear line
        if (finalMessage) {
            process.stdout.write(`${finalMessage}\n`);
        }
        process.stdout.write('\x1B[?25h'); // Show cursor
    }
    success(message) {
        this.stop(`✅ ${message}`);
    }
    error(message) {
        this.stop(`❌ ${message}`);
    }
}
export class ProgressBar {
    total;
    current = 0;
    width = 40;
    message;
    constructor(total, message = 'Progress') {
        this.total = total;
        this.message = message;
    }
    update(current, message) {
        this.current = current;
        if (message)
            this.message = message;
        const percentage = Math.min(100, Math.round((current / this.total) * 100));
        const completed = Math.round((current / this.total) * this.width);
        const remaining = this.width - completed;
        const progressBar = '█'.repeat(completed) + '░'.repeat(remaining);
        const line = `\r${this.message}: |${progressBar}| ${percentage}% (${current}/${this.total})`;
        process.stdout.write(line);
    }
    increment(message) {
        this.update(this.current + 1, message);
    }
    complete(message) {
        this.update(this.total, message);
        process.stdout.write('\n');
    }
}
//# sourceMappingURL=progress-indicator.js.map