
// Utility functions
const utils = {
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
    },

    /**
     * Create DOM element with attributes
     * @param {string} tag - HTML tag name
     * @param {Object} attributes - Element attributes
     * @returns {Element}
     */
    createElement(tag, attributes = {}) {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            element[key] = value;
        });
        return element;
    }
};

// Roadmap renderer
class RoadmapRenderer {
    constructor() {
        this.contentContainer = utils.querySelector('#roadmap-content');
    }

    /**
     * Render a roadmap by ID
     * @param {string} roadmapId - ID of the roadmap to render
     */
    render(roadmapId) {
        if (!this.contentContainer) {
            console.error('Roadmap content container not found');
            return;
        }

        const roadmap = roadmaps[roadmapId];
        if (!roadmap) {
            console.error('Roadmap not found:', roadmapId);
            return;
        }

        this.contentContainer.innerHTML = '';
        const container = this.createRoadmapContainer(roadmap);
        this.contentContainer.appendChild(container);
    }

    createRoadmapContainer(roadmap) {
        const container = utils.createElement('div', { className: 'roadmap-container' });
        
        // Add title
        const title = utils.createElement('h2', { textContent: roadmap.title });
        container.appendChild(title);

        // Create stages
        const stagesContainer = utils.createElement('div', { className: 'roadmap-stages' });
        roadmap.stages.forEach(stage => {
            stagesContainer.appendChild(this.createStageElement(stage));
        });

        container.appendChild(stagesContainer);
        return container;
    }

    createStageElement(stage) {
        const stageElement = utils.createElement('div', {
            className: 'roadmap-stage',
            id: stage.id
        });

        const header = utils.createElement('h3', {
            textContent: `${stage.title} (${stage.position})`
        });
        stageElement.appendChild(header);

        const subtasksList = utils.createElement('ul');
        stage.subtasks.forEach(subtask => {
            const item = utils.createElement('li');
            const link = utils.createElement('a', {
                href: subtask.resource,
                textContent: subtask.title
            });
            item.appendChild(link);
            subtasksList.appendChild(item);
        });

        stageElement.appendChild(subtasksList);
        return stageElement;
    }
}

// Main application
class RoadmapApp {
    constructor() {
        this.renderer = new RoadmapRenderer();
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupRoadmapCards();
            this.renderInitialRoadmap();
        });
    }

    setupRoadmapCards() {
        const cards = document.querySelectorAll('.roadmap-card');
        cards.forEach(card => {
            card.addEventListener('click', () => this.handleRoadmapSelection(card));
        });
    }

    handleRoadmapSelection(card) {
        const selectedRoadmap = card.getAttribute('data-roadmap');
        if (!selectedRoadmap) return;

        // Update URL
        window.history.pushState({}, '', `?roadmap=${selectedRoadmap}`);

        // Update active state
        document.querySelectorAll('.roadmap-card').forEach(c => 
            c.classList.remove('active'));
        card.classList.add('active');

        // Remove placeholder if exists
        const placeholder = utils.querySelector('.placeholder-message');
        if (placeholder) {
            placeholder.remove();
        }

        // Render roadmap
        this.renderer.render(selectedRoadmap);
    }

    renderInitialRoadmap() {
        const urlParams = new URLSearchParams(window.location.search);
        const roadmapType = urlParams.get('roadmap') || 'fullstack';

        this.renderer.render(roadmapType);

        const activeCard = utils.querySelector(`[data-roadmap="${roadmapType}"]`);
        if (activeCard) {
            activeCard.classList.add('active');
        }
    }
}
const feedbackLink = document.querySelector('.feedback-link');

if (feedbackLink) {
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

// Initialize the application
new RoadmapApp();

