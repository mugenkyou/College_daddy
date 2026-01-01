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
        offset:120,
        duration: 800, // smooth fade duration
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
    initCursorTrail();
});

// Handle window resize
window.addEventListener('resize', () => {
    const navLinks = document.querySelector('.nav-links');
    if (window.innerWidth > 768) {
        navLinks.classList.remove('active');
    }
});

// Initialize custom cursor trail
function initCursorTrail() {
  // Check if it's a mobile device, if so, don't initialize the cursor trail
  if (isMobile()) {
    return;
  }

  // Check if user prefers reduced motion, if so, don't initialize the cursor trail
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  // Create the cursor elements
  const cursor = document.createElement('div');
  const cursorInner = document.createElement('div');
  
  cursor.classList.add('custom-cursor');
  cursorInner.classList.add('cursor-trail');
  
  // Add to document
  document.body.appendChild(cursor);
  document.body.appendChild(cursorInner);
  
  // Set initial positions
  cursor.style.cssText = `
    position: fixed;
    width: 16px;
    height: 16px;
    border: 2px solid var(--primary-color, #009dff);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 9999;
    mix-blend-mode: difference;
  `;
  
  cursorInner.style.cssText = `
    position: fixed;
    width: 4px;
    height: 4px;
    background-color: var(--primary-color, #009dff);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 9998;
  `;
  
  // Variables for trail effect
  const trail = [];
  const trailLength = 12; // Reduced number of particles to improve performance
  const particles = [];
  
  // Create trail particles
  for (let i = 0; i < trailLength; i++) {
    const particle = document.createElement('div');
    particle.classList.add('cursor-particle');
    particle.style.cssText = `
      position: fixed;
      width: ${8 - (i * 0.5)}px;
      height: ${8 - (i * 0.5)}px;
      background-color: var(--primary-color, #009dff);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 9997;
      opacity: ${0.9 - (i * 0.07)};
    `;
    document.body.appendChild(particle);
    particles.push(particle);
    trail.push({x: 0, y: 0});
  }
  
  let mouseX = 0;
  let mouseY = 0;
  let posX = 0;
  let posY = 0;
  let innerMouseX = 0;
  let innerMouseY = 0;
  let innerPosX = 0;
  let innerPosY = 0;
  
  // Track mouse movement
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    innerMouseX = e.clientX;
    innerMouseY = e.clientY;
  });
  
  // Handle mouse clicks for ripple effect
  document.addEventListener('mousedown', () => {
    cursor.style.transform = `translate(-50%, -50%) scale(1.5)`;
    cursorInner.style.transform = `translate(-50%, -50%) scale(2)`;
  });
  
  document.addEventListener('mouseup', () => {
    cursor.style.transform = `translate(-50%, -50%) scale(1)`;
    cursorInner.style.transform = `translate(-50%, -50%) scale(1)`;
  });
  
  // Animation loop for smooth cursor movement
  function animateCursor() {
    // Smoothly follow the mouse for the main cursor
    posX += (mouseX - posX) / 8; // Increased divisor for smoother, more performant animation
    posY += (mouseY - posY) / 8;
    
    // Update main cursor position
    cursor.style.left = `${posX}px`;
    cursor.style.top = `${posY}px`;
    
    // Smoothly follow the mouse for the inner cursor
    innerPosX += (innerMouseX - innerPosX) / 10;
    innerPosY += (innerMouseY - innerPosY) / 10;
    
    // Update inner cursor position
    cursorInner.style.left = `${innerPosX}px`;
    cursorInner.style.top = `${innerPosY}px`;
    
    // Update trail positions efficiently
    for (let i = trailLength - 1; i >= 0; i--) {
      if (i === 0) {
        trail[i] = {x: innerPosX, y: innerPosY};
      } else {
        // Apply easing to create trail effect
        const easing = 0.3;
        trail[i].x += (trail[i-1].x - trail[i].x) * easing;
        trail[i].y += (trail[i-1].y - trail[i].y) * easing;
      }
      
      // Update particle position and appearance
      if (particles[i]) {
        particles[i].style.left = `${trail[i].x}px`;
        particles[i].style.top = `${trail[i].y}px`;
        
        // Make particles smaller and more transparent as they age
        const size = Math.max(1, 8 - (i * 0.5));
        particles[i].style.width = `${size}px`;
        particles[i].style.height = `${size}px`;
        particles[i].style.opacity = `${0.9 - (i * 0.07)}`;
      }
    }
    
    requestAnimationFrame(animateCursor);
  }
  
  // Start the animation
  animateCursor();
}

// text animation 
const texts = ["CGPA Calculator", "Study Planner", "Expert Roadmaps"];
let count = 0;
let index = 0;
let currentText = "";
let letter = "";

function type() {
  if(count === texts.length){
    count = 0;
  }
  currentText = texts[count];
  letter = currentText.slice(0 , ++index);

  document.getElementById("changingText").textContent = letter;

  if(letter.length === currentText.length){
    index = 0;
    count++;
    setTimeout(type , 1500); // pause before next text
  }else{
    setTimeout(type , 120); //typing speed
  }
}

type(); 
