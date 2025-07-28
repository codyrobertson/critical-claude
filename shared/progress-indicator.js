/**
 * Progress Indicator Utilities
 * Simple progress indicators for long-running CLI operations
 */
export class ProgressIndicator {
    constructor(message = 'Processing...') {
        this.interval = null;
        this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.currentFrame = 0;
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
    constructor(total, message = 'Progress') {
        this.current = 0;
        this.width = 40;
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
export const withProgress = async (operation, message = 'Processing...') => {
    const indicator = new ProgressIndicator(message);
    indicator.start();
    try {
        const result = await operation(indicator);
        indicator.success('Completed');
        return result;
    }
    catch (error) {
        indicator.error('Failed');
        throw error;
    }
};
export const withProgressBar = async (items, processor, message = 'Processing items') => {
    const bar = new ProgressBar(items.length, message);
    for (let i = 0; i < items.length; i++) {
        await processor(items[i], i, bar);
        bar.increment();
    }
    bar.complete();
};
