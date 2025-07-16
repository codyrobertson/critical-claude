/**
 * WebTUI Setup for Critical Claude
 * Enhances the website with terminal-like interactions
 */

class CriticalClaudeWebTUI {
  constructor() {
    this.init();
  }

  init() {
    this.setupTerminalEffects();
    this.setupInteractiveElements();
    this.setupCodeBlocks();
    this.setupStatusIndicators();
    this.setupProgressBars();
    this.initializeTooltips();
  }

  setupTerminalEffects() {
    // Add typing effect to hero title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      const text = heroTitle.textContent;
      heroTitle.innerHTML = '';
      this.typeWriter(heroTitle, text, 50);
    }

    // Add terminal cursor to code blocks
    document.querySelectorAll('[box-="code"], .terminal-content').forEach(block => {
      const cursor = document.createElement('span');
      cursor.className = 'terminal-cursor';
      cursor.textContent = '▋';
      block.appendChild(cursor);
    });
  }

  setupInteractiveElements() {
    // Enhanced button interactions
    document.querySelectorAll('button[variant]').forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 0 20px var(--cc-shadow)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = 'none';
      });
      
      button.addEventListener('click', (e) => {
        // Create ripple effect
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.left = (e.clientX - rect.left) + 'px';
        ripple.style.top = (e.clientY - rect.top) + 'px';
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
      });
    });
  }

  setupCodeBlocks() {
    // Enhanced code blocks with WebTUI styling
    document.querySelectorAll('[box-="code"]').forEach(block => {
      // Add language indicator
      const lang = block.getAttribute('data-lang') || 'bash';
      const langTag = document.createElement('span');
      langTag.className = 'code-lang-tag';
      langTag.textContent = lang.toUpperCase();
      block.appendChild(langTag);
      
      // Add copy functionality
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-button';
      copyBtn.textContent = 'Copy';
      copyBtn.onclick = () => this.copyToClipboard(block.textContent, copyBtn);
      block.appendChild(copyBtn);
      
      // Add line numbers
      const lines = block.textContent.split('\n');
      const lineNumbers = document.createElement('div');
      lineNumbers.className = 'line-numbers';
      lines.forEach((_, i) => {
        const lineNum = document.createElement('span');
        lineNum.textContent = i + 1;
        lineNumbers.appendChild(lineNum);
      });
      block.insertBefore(lineNumbers, block.firstChild);
    });
  }

  setupStatusIndicators() {
    // Dynamic status indicators
    const indicators = document.querySelectorAll('.status-indicator');
    indicators.forEach(indicator => {
      // Add pulsing animation
      indicator.addEventListener('mouseenter', () => {
        indicator.style.animation = 'pulse 1s infinite';
      });
      
      indicator.addEventListener('mouseleave', () => {
        indicator.style.animation = 'none';
      });
    });
  }

  setupProgressBars() {
    // Animated progress bars
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(bar => {
      const fill = bar.querySelector('.progress-fill');
      const progress = parseInt(bar.getAttribute('data-progress') || '0');
      
      // Animate to target progress
      let current = 0;
      const interval = setInterval(() => {
        current += 2;
        fill.style.width = current + '%';
        
        if (current >= progress) {
          clearInterval(interval);
        }
      }, 50);
    });
  }

  initializeTooltips() {
    // WebTUI-style tooltips
    document.querySelectorAll('[data-tooltip]').forEach(element => {
      const tooltip = document.createElement('div');
      tooltip.className = 'webtui-tooltip';
      tooltip.textContent = element.getAttribute('data-tooltip');
      document.body.appendChild(tooltip);
      
      element.addEventListener('mouseenter', (e) => {
        tooltip.style.display = 'block';
        tooltip.style.left = e.pageX + 10 + 'px';
        tooltip.style.top = e.pageY - 30 + 'px';
      });
      
      element.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
      
      element.addEventListener('mousemove', (e) => {
        tooltip.style.left = e.pageX + 10 + 'px';
        tooltip.style.top = e.pageY - 30 + 'px';
      });
    });
  }

  typeWriter(element, text, speed) {
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
  }

  copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.style.background = 'var(--cc-success)';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = 'var(--cc-background)';
      }, 2000);
    });
  }

  // Terminal command simulator
  simulateTerminalCommand(element, command, output) {
    const lines = [
      { type: 'prompt', text: '$ ' + command },
      { type: 'output', text: output }
    ];
    
    element.innerHTML = '';
    
    lines.forEach((line, index) => {
      setTimeout(() => {
        const lineElement = document.createElement('div');
        lineElement.className = `terminal-line ${line.type}`;
        lineElement.textContent = line.text;
        element.appendChild(lineElement);
        
        if (line.type === 'prompt') {
          this.typeWriter(lineElement, line.text, 50);
        } else {
          lineElement.textContent = line.text;
        }
      }, index * 1000);
    });
  }

  // Critical Claude specific features
  addCriticalClaudeFeatures() {
    // Add security vulnerability scanner visualization
    const securitySection = document.querySelector('#security-demo');
    if (securitySection) {
      this.createVulnerabilityScanner(securitySection);
    }
    
    // Add performance analysis visualization
    const performanceSection = document.querySelector('#performance-demo');
    if (performanceSection) {
      this.createPerformanceAnalyzer(performanceSection);
    }
  }

  createVulnerabilityScanner(container) {
    const scanner = document.createElement('div');
    scanner.className = 'vulnerability-scanner';
    scanner.innerHTML = `
      <div box-="terminal">
        <div class="terminal-content">
          <div class="scan-result">
            <span class="status-indicator error"></span>
            <span class="vulnerability-type">SQL Injection</span>
            <span class="severity">CRITICAL</span>
          </div>
          <div class="scan-result">
            <span class="status-indicator warning"></span>
            <span class="vulnerability-type">XSS</span>
            <span class="severity">HIGH</span>
          </div>
          <div class="scan-result">
            <span class="status-indicator success"></span>
            <span class="vulnerability-type">Authentication</span>
            <span class="severity">PASSED</span>
          </div>
        </div>
      </div>
    `;
    container.appendChild(scanner);
  }

  createPerformanceAnalyzer(container) {
    const analyzer = document.createElement('div');
    analyzer.className = 'performance-analyzer';
    analyzer.innerHTML = `
      <div box-="terminal">
        <div class="terminal-content">
          <div class="perf-metric">
            <span>Response Time:</span>
            <div class="progress-bar" data-progress="85">
              <div class="progress-fill"></div>
            </div>
            <span class="metric-value">850ms</span>
          </div>
          <div class="perf-metric">
            <span>Memory Usage:</span>
            <div class="progress-bar" data-progress="60">
              <div class="progress-fill"></div>
            </div>
            <span class="metric-value">60%</span>
          </div>
          <div class="perf-metric">
            <span>CPU Usage:</span>
            <div class="progress-bar" data-progress="40">
              <div class="progress-fill"></div>
            </div>
            <span class="metric-value">40%</span>
          </div>
        </div>
      </div>
    `;
    container.appendChild(analyzer);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const webTUI = new CriticalClaudeWebTUI();
  webTUI.addCriticalClaudeFeatures();
});

// Add CSS for WebTUI enhancements
const webTUIStyles = `
  .terminal-cursor {
    color: var(--cc-primary);
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  .ripple {
    position: absolute;
    border-radius: 50%;
    background: var(--cc-primary);
    transform: scale(0);
    animation: ripple-effect 0.6s linear;
    pointer-events: none;
  }

  @keyframes ripple-effect {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  .code-lang-tag {
    position: absolute;
    top: 8px;
    right: 60px;
    background: var(--cc-primary);
    color: var(--cc-background);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.7rem;
    font-weight: bold;
  }

  .line-numbers {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 40px;
    background: var(--cc-background);
    border-right: 1px solid var(--cc-border);
    padding: 16px 8px;
    font-size: 0.8rem;
    color: var(--cc-text-dim);
    user-select: none;
  }

  .line-numbers span {
    display: block;
    line-height: 1.5;
  }

  [box-="code"] {
    padding-left: 56px;
  }

  .webtui-tooltip {
    position: absolute;
    background: var(--cc-surface);
    border: 1px solid var(--cc-border);
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    color: var(--cc-text);
    z-index: 1000;
    display: none;
    pointer-events: none;
    font-family: var(--cc-font-mono);
  }

  .vulnerability-scanner, .performance-analyzer {
    margin: 2rem 0;
  }

  .scan-result {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--cc-border);
  }

  .vulnerability-type {
    flex: 1;
    font-weight: 500;
  }

  .severity {
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 0.8rem;
    font-weight: bold;
  }

  .severity.CRITICAL {
    background: var(--cc-danger);
    color: var(--cc-background);
  }

  .severity.HIGH {
    background: var(--cc-warning);
    color: var(--cc-background);
  }

  .severity.PASSED {
    background: var(--cc-success);
    color: var(--cc-background);
  }

  .perf-metric {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 0;
  }

  .perf-metric span:first-child {
    min-width: 120px;
  }

  .perf-metric .progress-bar {
    flex: 1;
    height: 6px;
    margin: 0;
  }

  .metric-value {
    min-width: 60px;
    text-align: right;
    color: var(--cc-primary);
    font-weight: 500;
  }

  /* Mobile responsive enhancements */
  @media (max-width: 768px) {
    .line-numbers {
      width: 30px;
      padding: 16px 4px;
    }
    
    [box-="code"] {
      padding-left: 40px;
    }
    
    .code-lang-tag {
      right: 40px;
    }
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = webTUIStyles;
document.head.appendChild(styleSheet);