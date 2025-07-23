/**
 * Progress Indicator Utilities
 * Simple progress indicators for long-running CLI operations
 */

export class ProgressIndicator {
  private interval: NodeJS.Timeout | null = null;
  private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  private currentFrame = 0;
  private message: string;

  constructor(message: string = 'Processing...') {
    this.message = message;
  }

  start(): void {
    if (this.interval) return;

    process.stdout.write('\x1B[?25l'); // Hide cursor
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.currentFrame]} ${this.message}`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 100);
  }

  updateMessage(message: string): void {
    this.message = message;
  }

  stop(finalMessage?: string): void {
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

  success(message: string): void {
    this.stop(`✅ ${message}`);
  }

  error(message: string): void {
    this.stop(`❌ ${message}`);
  }
}

export class ProgressBar {
  private total: number;
  private current: number = 0;
  private width: number = 40;
  private message: string;

  constructor(total: number, message: string = 'Progress') {
    this.total = total;
    this.message = message;
  }

  update(current: number, message?: string): void {
    this.current = current;
    if (message) this.message = message;

    const percentage = Math.min(100, Math.round((current / this.total) * 100));
    const completed = Math.round((current / this.total) * this.width);
    const remaining = this.width - completed;

    const progressBar = '█'.repeat(completed) + '░'.repeat(remaining);
    const line = `\r${this.message}: |${progressBar}| ${percentage}% (${current}/${this.total})`;

    process.stdout.write(line);
  }

  increment(message?: string): void {
    this.update(this.current + 1, message);
  }

  complete(message?: string): void {
    this.update(this.total, message);
    process.stdout.write('\n');
  }
}