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

// Theme Manager
class ThemeManager {
    constructor() {
        this.theme = this.getStoredTheme() || 'dark';
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
    }

    setupToggleButton() {
        // Set up theme toggle button
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            // Add click listener
            themeToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleTheme();
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

    applyTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        this.setStoredTheme(theme);
        this.updateToggleIcon();
    }

    toggleTheme() {
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }

    updateToggleIcon() {
        const themeIcon = document.querySelector('.theme-toggle .theme-icon');
        if (themeIcon) {
            themeIcon.textContent = this.theme === 'dark' ? '🌙' : '☀️';
        }
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

