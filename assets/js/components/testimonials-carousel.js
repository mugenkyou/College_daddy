/**
 * Testimonials Carousel Component
 * Handles carousel navigation, auto-play, touch/swipe support, and keyboard navigation
 */

class TestimonialsCarousel {
  constructor() {
    this.currentIndex = 0;
    this.autoPlayInterval = null;
    this.autoPlayDelay = 5000; // 5 seconds
    this.isTransitioning = false;
    this.touchStartX = 0;
    this.touchEndX = 0;
    
    this.initElements();
    this.initEventListeners();
    this.startAutoPlay();
  }

  initElements() {
    this.carousel = document.querySelector('.testimonial-carousel');
    this.track = document.querySelector('.testimonial-track');
    this.testimonials = document.querySelectorAll('.testimonial');
    this.prevBtn = document.querySelector('.prev-btn');
    this.nextBtn = document.querySelector('.next-btn');
    this.indicators = document.querySelectorAll('.indicator');
    this.totalSlides = this.testimonials.length;

    if (!this.track || this.totalSlides === 0) {
      console.warn('Testimonials carousel elements not found');
      return;
    }
  }

  initEventListeners() {
    // Navigation buttons
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.goToPrevious());
    }
    
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.goToNext());
    }

    // Indicator dots
    this.indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => this.goToSlide(index));
    });

    // Pause auto-play on hover
    if (this.carousel) {
      this.carousel.addEventListener('mouseenter', () => this.pauseAutoPlay());
      this.carousel.addEventListener('mouseleave', () => this.startAutoPlay());
    }

    // Touch/swipe support
    if (this.track) {
      this.track.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
      this.track.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
      this.track.addEventListener('touchend', () => this.handleTouchEnd());
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Pause auto-play when tab is not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAutoPlay();
      } else {
        this.startAutoPlay();
      }
    });
  }

  goToSlide(index) {
    if (this.isTransitioning || index === this.currentIndex) return;
    
    this.isTransitioning = true;
    this.currentIndex = index;
    
    // Update track position
    const offset = -100 * this.currentIndex;
    this.track.style.transform = `translateX(${offset}%)`;
    
    // Update indicators
    this.updateIndicators();
    
    // Reset transition lock after animation
    setTimeout(() => {
      this.isTransitioning = false;
    }, 500);
    
    // Reset auto-play timer
    this.resetAutoPlay();
  }

  goToNext() {
    const nextIndex = (this.currentIndex + 1) % this.totalSlides;
    this.goToSlide(nextIndex);
  }

  goToPrevious() {
    const prevIndex = (this.currentIndex - 1 + this.totalSlides) % this.totalSlides;
    this.goToSlide(prevIndex);
  }

  updateIndicators() {
    this.indicators.forEach((indicator, index) => {
      if (index === this.currentIndex) {
        indicator.classList.add('active');
        indicator.setAttribute('aria-current', 'true');
      } else {
        indicator.classList.remove('active');
        indicator.removeAttribute('aria-current');
      }
    });
  }

  startAutoPlay() {
    this.pauseAutoPlay(); // Clear any existing interval
    this.autoPlayInterval = setInterval(() => {
      this.goToNext();
    }, this.autoPlayDelay);
  }

  pauseAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  resetAutoPlay() {
    this.pauseAutoPlay();
    this.startAutoPlay();
  }

  handleTouchStart(e) {
    this.touchStartX = e.touches[0].clientX;
  }

  handleTouchMove(e) {
    this.touchEndX = e.touches[0].clientX;
  }

  handleTouchEnd() {
    const swipeThreshold = 50; // Minimum swipe distance in pixels
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left - go to next
        this.goToNext();
      } else {
        // Swiped right - go to previous
        this.goToPrevious();
      }
    }

    // Reset touch positions
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  handleKeyboard(e) {
    // Only handle keyboard if carousel is in viewport
    if (!this.isInViewport(this.carousel)) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.goToPrevious();
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.goToNext();
        break;
      case 'Home':
        e.preventDefault();
        this.goToSlide(0);
        break;
      case 'End':
        e.preventDefault();
        this.goToSlide(this.totalSlides - 1);
        break;
    }
  }

  isInViewport(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  destroy() {
    this.pauseAutoPlay();
    // Remove event listeners if needed
  }
}

// Initialize carousel when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TestimonialsCarousel();
  });
} else {
  new TestimonialsCarousel();
}
