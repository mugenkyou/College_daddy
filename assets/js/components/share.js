/**
 * Social Share Component
 * Provides sharing functionality for roadmap pages using Web Share API with fallback
 */

class SocialShare {
    constructor() {
        this.currentUrl = window.location.href;
        this.productionOrigin = 'https://collegedaddy.vercel.app';
        // When on localhost, share the PRODUCTION URL so WhatsApp/social crawlers can fetch the page and show og:image
        const isLocal = /^localhost$|^127\.0\.0\.1$/i.test(window.location.hostname);
        this.shareUrl = isLocal
            ? this.productionOrigin + window.location.pathname + window.location.search
            : this.currentUrl;
        this.currentTitle = this.getTitle();
        this.currentDescription = this.getDescription();
        this.init();
    }

    getTitle() {
        // Priority: og:title > document.title > fallback
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) return ogTitle.content;
        
        return document.title || 'College Daddy - Career Roadmap';
    }

    getDescription() {
        // Priority: og:description > meta description > hero text > fallback
        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) return ogDesc.content;
        
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) return metaDesc.content;
        
        const heroText = document.querySelector('.hero-text p');
        if (heroText) return heroText.textContent.trim();
        
        return 'Explore this career roadmap on College Daddy - Your ultimate companion for academic success.';
    }

    init() {
        // Only initialize on individual roadmap pages (not on main roadmap selection page)
        const isRoadmapPage = window.location.pathname.includes('/roadmap_assets/html/') || 
                              document.querySelector('.roadmap-hero') || 
                              document.querySelector('.hero-content');
        
        if (!isRoadmapPage) {
            return; // Don't add share buttons on main roadmap selection page
        }
        
        // Create share container if it doesn't exist
        if (!document.getElementById('share-container')) {
            this.createShareContainer();
        }
    }

    createShareContainer() {
        const shareContainer = document.createElement('div');
        shareContainer.id = 'share-container';
        shareContainer.className = 'share-container';
        
        // Add label
        const shareLabel = document.createElement('div');
        shareLabel.className = 'share-label';
        shareLabel.textContent = 'Share this roadmap:';
        shareContainer.appendChild(shareLabel);
        
        const buttonsWrapper = document.createElement('div');
        buttonsWrapper.className = 'share-buttons-wrapper';
        
        // Check if Web Share API is supported
        if (navigator.share) {
            buttonsWrapper.innerHTML = `
                <button class="share-btn share-native" aria-label="Share this roadmap" title="Share">
                    <i class="fas fa-share-alt"></i>
                    <span>Share</span>
                </button>
                <button class="share-btn share-copy" aria-label="Copy link" title="Copy link (use this in WhatsApp for preview)">
                    <i class="fas fa-link"></i>
                </button>
            `;
            buttonsWrapper.querySelector('.share-native').addEventListener('click', () => this.shareNative());
            buttonsWrapper.querySelector('.share-copy').addEventListener('click', () => this.copyLink());
        } else {
            // Fallback: Show individual platform buttons
            buttonsWrapper.innerHTML = `
                <button class="share-btn share-twitter" aria-label="Share on Twitter" title="Share on Twitter">
                    <i class="fab fa-twitter"></i>
                </button>
                <button class="share-btn share-linkedin" aria-label="Share on LinkedIn" title="Share on LinkedIn">
                    <i class="fab fa-linkedin"></i>
                </button>
                <button class="share-btn share-facebook" aria-label="Share on Facebook" title="Share on Facebook">
                    <i class="fab fa-facebook"></i>
                </button>
                <button class="share-btn share-whatsapp" aria-label="Share on WhatsApp" title="Share on WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button class="share-btn share-copy" aria-label="Copy link" title="Copy link">
                    <i class="fas fa-link"></i>
                </button>
            `;

            // Add event listeners
            buttonsWrapper.querySelector('.share-twitter')?.addEventListener('click', () => this.shareTwitter());
            buttonsWrapper.querySelector('.share-linkedin')?.addEventListener('click', () => this.shareLinkedIn());
            buttonsWrapper.querySelector('.share-facebook')?.addEventListener('click', () => this.shareFacebook());
            buttonsWrapper.querySelector('.share-whatsapp')?.addEventListener('click', () => this.shareWhatsApp());
            buttonsWrapper.querySelector('.share-copy')?.addEventListener('click', () => this.copyLink());
        }
        
        shareContainer.appendChild(buttonsWrapper);

        // Insert share container into hero section - after hero-stats or at end of hero-text
        const heroText = document.querySelector('.hero-text');
        const heroStats = document.querySelector('.hero-stats');
        
        if (heroText) {
            // Insert after hero-stats if it exists, otherwise at end of hero-text
            if (heroStats && heroStats.parentElement === heroText) {
                heroText.insertBefore(shareContainer, heroStats.nextSibling);
            } else {
                heroText.appendChild(shareContainer);
            }
        } else {
            // Fallback: insert into hero-content or roadmap-hero
            const heroContent = document.querySelector('.hero-content') || document.querySelector('.roadmap-hero');
            if (heroContent) {
                heroContent.appendChild(shareContainer);
            } else {
                // Last resort: insert at top of main
                const main = document.querySelector('main');
                if (main) {
                    main.insertBefore(shareContainer, main.firstChild);
                }
            }
        }
    }

    shareNative() {
        const shareData = {
            title: this.currentTitle,
            text: this.currentDescription,
            url: this.shareUrl || this.currentUrl
        };

        if (navigator.share) {
            navigator.share(shareData)
                .then(() => {
                    this.showNotification('Shared successfully!');
                })
                .catch((error) => {
                    if (error.name !== 'AbortError') {
                        console.error('Error sharing:', error);
                        this.showNotification('Failed to share. Please try again.');
                    }
                });
        }
    }

    shareTwitter() {
        // Use roadmap-specific title and description
        const shareText = `${this.currentTitle}\n\n${this.currentDescription}`;
        const text = encodeURIComponent(shareText);
        const url = encodeURIComponent(this.shareUrl || this.currentUrl);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
    }

    shareLinkedIn() {
        const url = encodeURIComponent(this.shareUrl || this.currentUrl);
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        window.open(linkedInUrl, '_blank', 'width=550,height=420');
    }

    shareFacebook() {
        const url = encodeURIComponent(this.shareUrl || this.currentUrl);
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        window.open(facebookUrl, '_blank', 'width=550,height=420');
    }

    shareWhatsApp() {
        // Format: Title + Description + URL
        const shareUrl = this.shareUrl || this.currentUrl;
        const shareText = `*${this.currentTitle}*\n\n${this.currentDescription}\n\n${shareUrl}`;
        const text = encodeURIComponent(shareText);
        const whatsappUrl = `https://wa.me/?text=${text}`;
        window.open(whatsappUrl, '_blank');
    }

    async copyLink() {
        const urlToCopy = this.shareUrl || this.currentUrl;
        try {
            await navigator.clipboard.writeText(urlToCopy);
            const isLocal = /^localhost$|^127\.0\.0\.1$/i.test(window.location.hostname);
            this.showNotification(isLocal
                ? 'Link copied! Paste in WhatsApp so the preview image appears.'
                : 'Link copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = urlToCopy;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                this.showNotification('Link copied to clipboard!');
            } catch (e) {
                this.showNotification('Failed to copy link.');
            }
            document.body.removeChild(textArea);
        }
    }

    showNotification(message) {
        // Remove existing notification if any
        const existing = document.querySelector('.share-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'share-notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);

        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize share component when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new SocialShare();
    });
} else {
    new SocialShare();
}
