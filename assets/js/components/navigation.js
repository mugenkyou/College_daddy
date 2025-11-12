// Navigation utility functions
const navUtils = {
    /**
     * Safely query DOM elements
     * @param {string} selector - CSS selector
     * @param {Element} [context=document] - Context to search within
     * @returns {Element|null}
     */
    querySelector(selector, context = document) {
        try {
            return context.querySelector(selector);
        } catch (error) {
            console.error(`Error querying selector "${selector}":`, error);
            return null;
        }
    }
};

// Mobile menu handler
class MobileMenu {
    constructor() {
        this.menuButton = navUtils.querySelector('.menu-button');
        this.navLinks = navUtils.querySelector('.nav-links');
        this.initialized = false;
        this.init();
    }

    init() {
        if (this.menuButton && this.navLinks && !this.initialized) {
            // Remove any existing listeners to prevent duplicates
            const newMenuButton = this.menuButton.cloneNode(true);
            this.menuButton.parentNode.replaceChild(newMenuButton, this.menuButton);
            this.menuButton = newMenuButton;
            
            // Add toggle menu listener
            this.menuButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMenu();
            });
            
            // Create overlay if it doesn't exist
            let overlay = document.querySelector('.nav-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.classList.add('nav-overlay');
                document.body.appendChild(overlay);
            }
            this.overlay = overlay;
            
            // Close menu when clicking overlay
            this.overlay.addEventListener('click', () => {
                if (this.navLinks.classList.contains('active')) {
                    this.toggleMenu();
                }
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (this.navLinks.classList.contains('active') && 
                    !this.navLinks.contains(e.target) && 
                    !this.menuButton.contains(e.target)) {
                    this.toggleMenu();
                }
            });

            // Add ESC key handler to close menu
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.navLinks.classList.contains('active')) {
                    this.toggleMenu();
                }
            });
            
            // Set as initialized
            this.initialized = true;
            
            console.log('Mobile menu initialized successfully');
        } else {
            console.error('Menu elements not found or already initialized');
        }
    }

    toggleMenu() {
        console.log('Toggling menu');
        if (this.navLinks.classList.contains('active')) {
            this.navLinks.classList.remove('active');
            this.overlay.classList.remove('active');
            this.menuButton.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        } else {
            this.navLinks.classList.add('active');
            this.overlay.classList.add('active');
            this.menuButton.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
        }
    }
}

// Theme Manager with Auto-Switch and Smooth Transitions
class ThemeManager {
    constructor() {
        this.theme = this.getStoredTheme() || this.getAutoTheme();
        this.autoMode = this.getAutoMode();
        this.autoCheckInterval = null;
        this.init();
    }

    init() {
        // Apply stored theme immediately to prevent flash
        this.applyTheme(this.theme);
        
        // Wait for DOM to be ready before setting up button
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupToggleButton());
        } else {
            this.setupToggleButton();
        }

        // Start auto-theme checking if enabled
        if (this.autoMode) {
            this.startAutoThemeCheck();
        }
    }

    setupToggleButton() {
        // Set up theme toggle button
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            // Add click listener for manual toggle
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleTheme();
            });

            // Add long press listener for auto-mode toggle
            let pressTimer;
            themeToggle.addEventListener('mousedown', (e) => {
                pressTimer = setTimeout(() => {
                    this.toggleAutoMode();
                }, 1000);
            });

            themeToggle.addEventListener('mouseup', () => {
                clearTimeout(pressTimer);
            });

            themeToggle.addEventListener('mouseleave', () => {
                clearTimeout(pressTimer);
            });

            // Touch events for mobile
            themeToggle.addEventListener('touchstart', (e) => {
                pressTimer = setTimeout(() => {
                    this.toggleAutoMode();
                }, 1000);
            });

            themeToggle.addEventListener('touchend', () => {
                clearTimeout(pressTimer);
            });

            this.updateToggleIcon();
        }
    }

    getStoredTheme() {
        try {
            return localStorage.getItem('theme');
        } catch (e) {
            console.warn('localStorage not available:', e);
            return null;
        }
    }

    setStoredTheme(theme) {
        try {
            localStorage.setItem('theme', theme);
        } catch (e) {
            console.warn('localStorage not available:', e);
        }
    }

    getAutoMode() {
        try {
            return localStorage.getItem('themeAutoMode') === 'true';
        } catch (e) {
            return false;
        }
    }

    setAutoMode(enabled) {
        try {
            localStorage.setItem('themeAutoMode', enabled.toString());
        } catch (e) {
            console.warn('localStorage not available:', e);
        }
    }

    getAutoTheme() {
        const hour = new Date().getHours();
        // Dark theme from 6 PM (18:00) to 6 AM (6:00)
        // Light theme from 6 AM (6:00) to 6 PM (18:00)
        return (hour >= 18 || hour < 6) ? 'dark' : 'light';
    }

    applyTheme(theme, animate = true) {
        this.theme = theme;
        
        if (animate) {
            // Add transitioning class for smooth animation
            document.documentElement.classList.add('theme-transitioning');
            
            // Apply theme
            document.documentElement.setAttribute('data-theme', theme);
            
            // Remove transitioning class after animation completes
            setTimeout(() => {
                document.documentElement.classList.remove('theme-transitioning');
            }, 300);
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        
        this.setStoredTheme(theme);
        this.updateToggleIcon();
    }

    toggleTheme() {
        // Manual toggle disables auto mode
        if (this.autoMode) {
            this.autoMode = false;
            this.setAutoMode(false);
            this.stopAutoThemeCheck();
        }
        
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }

    toggleAutoMode() {
        this.autoMode = !this.autoMode;
        this.setAutoMode(this.autoMode);
        
        if (this.autoMode) {
            // Apply auto theme immediately
            const autoTheme = this.getAutoTheme();
            this.applyTheme(autoTheme);
            this.startAutoThemeCheck();
            this.showNotification('Auto theme enabled');
        } else {
            this.stopAutoThemeCheck();
            this.showNotification('Auto theme disabled');
        }
    }

    startAutoThemeCheck() {
        // Check every minute if theme should change based on time
        this.autoCheckInterval = setInterval(() => {
            if (this.autoMode) {
                const autoTheme = this.getAutoTheme();
                if (autoTheme !== this.theme) {
                    this.applyTheme(autoTheme);
                }
            }
        }, 60000); // Check every minute
    }

    stopAutoThemeCheck() {
        if (this.autoCheckInterval) {
            clearInterval(this.autoCheckInterval);
            this.autoCheckInterval = null;
        }
    }

    updateToggleIcon() {
        const themeIcon = document.querySelector('.theme-toggle .theme-icon');
        if (themeIcon) {
            if (this.autoMode) {
                themeIcon.textContent = '🌓'; // Auto mode icon
            } else {
                themeIcon.textContent = this.theme === 'dark' ? '🌙' : '☀️';
            }
        }

        // Update button title
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            if (this.autoMode) {
                themeToggle.setAttribute('title', 'Auto theme enabled (long-press to disable)');
            } else {
                themeToggle.setAttribute('title', 'Toggle theme (long-press for auto mode)');
            }
        }
    }

    showNotification(message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Remove after 2 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme manager first
    const themeManager = new ThemeManager();
    
    // Wait a moment to ensure other scripts have run
    setTimeout(() => {
        console.log('Initializing mobile menu');
        new MobileMenu();
        
        // Set active class for current page
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath.includes(href)) {
                link.classList.add('active');
            }
        });
    }, 100);
}); 

