// Utility function to detect mobile devices
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Initialize mobile menu
function initMobileMenu() {
    const menuButton = document.querySelector('.menu-button');
    const navLinks = document.querySelector('.nav-links');

    if (menuButton && navLinks) {
        menuButton.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && 
                !e.target.closest('.nav-links') && 
                !e.target.closest('.menu-button')) {
                navLinks.classList.remove('active');
            }
        });
    }
}

// Initialize feature cards
function initFeatureCards() {
    const cards = document.querySelectorAll('.feature-card');
    const isMobileDevice = isMobile();
    
    // Initializing AOS (scroll fade-up animations)
    AOS.init({
        offset:100,
        duration: 900, // smooth fade duration
        easing: 'ease-in-out',
        once: true,
    });

    cards.forEach(card => {
        if (isMobileDevice) {
            // Mobile touch handling (unchanged from previous version)
            let touchStartY = 0;
            let touchEndY = 0;
            const MIN_SWIPE_DISTANCE = 10;
            let isScrolling = false;
            let touchStartTime = 0;

            card.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
                touchStartTime = Date.now();
                isScrolling = false;
                
                // Add pressed state
                card.style.transform = 'scale(0.98)';
                card.style.backgroundColor = '#111111';
            });

            card.addEventListener('touchmove', (e) => {
                touchEndY = e.touches[0].clientY;
                
                // Check if user is scrolling
                if (Math.abs(touchEndY - touchStartY) > MIN_SWIPE_DISTANCE) {
                    isScrolling = true;
                    // Remove pressed state
                    card.style.transform = 'scale(1)';
                    card.style.backgroundColor = '#000000';
                }
            });

            card.addEventListener('touchend', (e) => {
                const touchEndTime = Date.now();
                const touchDuration = touchEndTime - touchStartTime;
                
                // Reset styles
                card.style.transform = 'scale(1)';
                card.style.backgroundColor = '#000000';

                // Navigate only if it was a tap (not a scroll) and touch duration was short
                if (!isScrolling && touchDuration < 300) {
                    const url = card.getAttribute('data-url');
                    if (url) {
                        window.location.href = url;
                    }
                }
            });
        } else {
            // Desktop click handling to navigate in same tab
            card.addEventListener('click', () => {
                const url = card.getAttribute('data-url');
                if (url) {
                    window.location.href = url;
                }
            });

            // Desktop hover effects
            card.addEventListener('mouseover', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 5px 15px rgba(0, 157, 255, 0.3)';
                card.style.backgroundColor = '#111111';
            });

            card.addEventListener('mouseout', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'none';
                card.style.backgroundColor = '#000000';
            });
        }
    });
}

// Initialize ripple effect for feedback link
function initFeedbackLinkRipple() {
    const feedbackLink = document.querySelector('.feedback-link');
     if (!feedbackLink) return;

    // Avoid duplicate listeners
    if (feedbackLink.dataset.listenerAdded === 'true') return;
    feedbackLink.dataset.listenerAdded = 'true';

    console.log("Feedback listener added!");


    feedbackLink.addEventListener('click', (e) => {
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.animation = 'ripple 0.6s linear';
        ripple.style.left = `${e.clientX - e.target.offsetLeft}px`;
        ripple.style.top = `${e.clientY - e.target.offsetTop}px`;

        feedbackLink.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });

    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            0% {
                width: 0;
                height: 0;
                opacity: 0.5;
            }
            100% {
                width: 200px;
                height: 200px;
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initFeatureCards();
    initFeedbackLinkRipple();
});

// Handle window resize
window.addEventListener('resize', () => {
    const navLinks = document.querySelector('.nav-links');
    if (window.innerWidth > 768) {
        navLinks.classList.remove('active');
    }
});

