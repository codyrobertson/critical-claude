// Critical Claude - GitHub Pages JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Mobile navigation toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Installation tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const target = this.getAttribute('data-tab');
            
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            this.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            navbar.style.transform = currentScrollY > lastScrollY ? 'translateY(-100%)' : 'translateY(0)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.transform = 'translateY(0)';
            navbar.style.boxShadow = 'none';
        }
        
        lastScrollY = currentScrollY;
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Apply fade-in animation to elements
    const animateElements = document.querySelectorAll('.feature, .framework-item, .example, .doc-card');
    animateElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });

    // Copy to clipboard functionality for code blocks
    document.querySelectorAll('pre code').forEach(codeBlock => {
        const pre = codeBlock.parentElement;
        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.textContent = 'Copy';
        button.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        pre.style.position = 'relative';
        pre.appendChild(button);
        
        pre.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
        });
        
        pre.addEventListener('mouseleave', () => {
            button.style.opacity = '0';
        });
        
        button.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(codeBlock.textContent);
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        });
    });

    // Performance monitoring
    if ('performance' in window && 'measure' in performance) {
        window.addEventListener('load', function() {
            performance.mark('page-load-complete');
            performance.measure('page-load-time', 'navigationStart', 'page-load-complete');
            
            const pageLoadTime = performance.getEntriesByName('page-load-time')[0];
            console.log(`Page load time: ${pageLoadTime.duration}ms`);
        });
    }

    // Error handling for images
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function() {
            this.style.display = 'none';
        });
    });

    // Analytics tracking (placeholder)
    function trackEvent(eventName, eventData) {
        // This would integrate with your analytics service
        console.log('Event tracked:', eventName, eventData);
    }

    // Track button clicks
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function() {
            trackEvent('button_click', {
                button_text: this.textContent,
                button_class: this.className,
                page_url: window.location.href
            });
        });
    });

    // Track navigation clicks
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            trackEvent('nav_click', {
                link_text: this.textContent,
                link_href: this.getAttribute('href'),
                page_url: window.location.href
            });
        });
    });

    // Service Worker registration (for offline functionality)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/critical-claude/sw.js')
                .then(function(registration) {
                    console.log('ServiceWorker registration successful');
                })
                .catch(function(error) {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }

    // Dark mode toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode'));
        });

        // Check for saved dark mode preference
        if (localStorage.getItem('dark-mode') === 'true') {
            document.body.classList.add('dark-mode');
        }
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close mobile menu
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });

    // Focus management for accessibility
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const firstFocusableElement = document.querySelectorAll(focusableElements)[0];
    const focusableContent = document.querySelectorAll(focusableElements);
    const lastFocusableElement = focusableContent[focusableContent.length - 1];

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusableElement) {
                    lastFocusableElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusableElement) {
                    firstFocusableElement.focus();
                    e.preventDefault();
                }
            }
        }
    });

    // Lazy loading for images
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });

    // Form validation (for future contact forms)
    function validateForm(form) {
        const inputs = form.querySelectorAll('input, textarea');
        let isValid = true;

        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                isValid = false;
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });

        return isValid;
    }

    // Search functionality (for future implementation)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = this.value.trim();
                if (query.length > 2) {
                    // Implement search functionality
                    console.log('Searching for:', query);
                }
            }, 300);
        });
    }

    // Console welcome message
    console.log(`
    🔥 Critical Claude GitHub Pages
    ================================
    
    Battle-tested code analysis that catches what everyone else misses.
    
    Version: 1.0.0
    Built with: HTML5, CSS3, Vanilla JavaScript
    Performance: Optimized for speed and accessibility
    
    Interested in contributing? Check out our GitHub repository!
    https://github.com/critical-claude/critical-claude
    `);
});

// Global utility functions
window.CriticalClaude = {
    // Utility function to format code blocks
    formatCode: function(code) {
        return code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    // Utility function to highlight syntax
    highlightSyntax: function(code, language) {
        // Basic syntax highlighting - would integrate with a proper library
        return code;
    },

    // Utility function to copy text to clipboard
    copyToClipboard: async function(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy text: ', err);
            return false;
        }
    },

    // Utility function to debounce function calls
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Utility function to throttle function calls
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};