// Navigation menu toggle
const menuButton = document.querySelector('.menu-button');
const navLinks = document.querySelector('.nav-links');

menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', !expanded);
    navLinks.classList.toggle('active');
});

// Close menu when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-container')) {
        menuButton.setAttribute('aria-expanded', 'false');
        navLinks.classList.remove('active');
    }
});

// Handle checkbox interactions and progress bars
document.querySelectorAll('.roadmap-section').forEach(section => {
    const headingCheckbox = section.querySelector('.heading-checkbox');
    const subheadingCheckboxes = section.querySelectorAll('.subheading-checkbox');
    const progressBar = section.querySelector('.progress-bar');

    // Update progress bar
    const updateProgress = () => {
        const totalCheckboxes = subheadingCheckboxes.length;
        const checkedCheckboxes = Array.from(subheadingCheckboxes).filter(checkbox => checkbox.checked).length;
        const progress = (checkedCheckboxes / totalCheckboxes) * 100;
        progressBar.style.width = `${progress}%`;
        
        // Update heading checkbox based on subheadings
        headingCheckbox.checked = checkedCheckboxes === totalCheckboxes;
        headingCheckbox.indeterminate = checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes;

        // Save progress to localStorage
        saveProgress(section);
    };

    // Heading checkbox event
    headingCheckbox.addEventListener('change', () => {
        subheadingCheckboxes.forEach(checkbox => {
            checkbox.checked = headingCheckbox.checked;
        });
        updateProgress();
    });

    // Subheading checkboxes events
    subheadingCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateProgress();

            // Add animation class to progress bar
            progressBar.classList.add('progress-animated');
            setTimeout(() => {
                progressBar.classList.remove('progress-animated');
            }, 300);

            // Trigger haptic feedback if supported
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        });

        // Add keyboard support
        checkbox.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                checkbox.checked = !checkbox.checked;
                updateProgress();
            }
        });
    });

    // Save progress to localStorage
    const saveProgress = (section) => {
        const sectionId = section.querySelector('h2 span').textContent.trim();
        const progress = {
            heading: headingCheckbox.checked,
            subheadings: Array.from(subheadingCheckboxes).map(checkbox => checkbox.checked)
        };
        localStorage.setItem(`roadmap-progress-${sectionId}`, JSON.stringify(progress));
    };

    // Load saved progress
    const loadProgress = () => {
        const sectionId = section.querySelector('h2 span').textContent.trim();
        const savedProgress = localStorage.getItem(`roadmap-progress-${sectionId}`);
        
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            headingCheckbox.checked = progress.heading;
            subheadingCheckboxes.forEach((checkbox, index) => {
                checkbox.checked = progress.subheadings[index];
            });
            updateProgress();
        }
    };

    // Initialize progress on page load
    loadProgress();
});

// Add smooth scrolling to sections
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const section = document.querySelector(href);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Add intersection observer for scroll animations
const sections = document.querySelectorAll('.roadmap-section');
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -10% 0px'
};

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            sectionObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

sections.forEach(section => {
    sectionObserver.observe(section);
});

// Add resize handler for mobile menu
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('active');
            menuButton.setAttribute('aria-expanded', 'false');
        }
    }, 250);
});

const feedbackLink = document.querySelector('.feedback-link');

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

/* back to top */
const backToTopBtn = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTopBtn.style.display = "flex";
  } else {
    backToTopBtn.style.display = "none";
  }
});

backToTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}); 