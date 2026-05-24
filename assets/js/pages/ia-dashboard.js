/**
 * Internal Assessment (IA) Visual Dashboard
 * Native SVG-based visualizations for internal marks tracking
 * Integrates with IA Calculator
 */

const IADashboard = {
    // Configuration
    config: {
        radialMeter: {
            size: 260,
            strokeWidth: 22,
            animationDuration: 1500
        },
        progressBar: {
            height: 35,
            animationDuration: 1200,
            animationDelay: 100
        }
    },

    // Initialize dashboard
    init() {
        this.containers = {
            progressBars: document.getElementById('internalProgressBars'),
            radialMeter: document.getElementById('internalRadialMeter'),
            eligibilityVisual: document.getElementById('eligibilityVisual')
        };
    },

    // Get theme colors from CSS custom properties
    getThemeColors() {
        const root = getComputedStyle(document.documentElement);
        return {
            primary: root.getPropertyValue('--primary-color').trim() || '#009dff',
            primaryHover: root.getPropertyValue('--primary-hover').trim() || '#00ff88',
            success: root.getPropertyValue('--success-color').trim() || '#4AFF91',
            warning: root.getPropertyValue('--warning-color').trim() || '#FFD44A',
            danger: root.getPropertyValue('--error-color').trim() || '#FF4A4A',
            textLight: root.getPropertyValue('--text-light').trim() || '#ffffff',
            textMuted: root.getPropertyValue('--text-muted').trim() || '#a0a0a0',
            cardBg: root.getPropertyValue('--card-bg').trim() || 'rgba(24, 24, 24, 0.7)',
            bgDarker: root.getPropertyValue('--bg-darker').trim() || '#0f0f0f'
        };
    },

    // Create internal marks progress bars
    createInternalProgressBars(components) {
        const container = document.createElement('div');
        container.classList.add('internal-bars-list');

        components.forEach((component, index) => {
            const barElement = this.createInternalProgressBar(component, index);
            container.appendChild(barElement);
        });

        return container;
    },

    // Create single internal progress bar
    createInternalProgressBar(config, index) {
        const colors = this.getThemeColors();
        const percentage = (config.obtained / config.maximum) * 100;
        const height = this.config.progressBar.height;
        
        // Determine color based on percentage
        let barColor = colors.danger;
        if (percentage >= 80) barColor = colors.success;
        else if (percentage >= 60) barColor = colors.primaryHover;
        else if (percentage >= 40) barColor = colors.warning;

        const wrapper = document.createElement('div');
        wrapper.classList.add('internal-bar-wrapper');

        // Header with label and value
        const header = document.createElement('div');
        header.classList.add('internal-bar-header');
        header.innerHTML = `
            <span class="internal-bar-label">
                <i class="${config.icon}"></i>
                ${config.label}
            </span>
            <span class="internal-bar-value">${config.obtained.toFixed(2)} / ${config.maximum}</span>
        `;

        // SVG bar
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', '0 0 100 ' + height);
        svg.classList.add('internal-bar-svg');

        // Background
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('x', '0');
        bgRect.setAttribute('y', '0');
        bgRect.setAttribute('width', '100');
        bgRect.setAttribute('height', height);
        bgRect.setAttribute('rx', '6');
        bgRect.setAttribute('fill', colors.bgDarker);
        bgRect.classList.add('bar-bg');

        // Threshold line (if applicable)
        if (config.threshold) {
            const thresholdPercentage = (config.threshold / config.maximum) * 100;
            const thresholdLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            thresholdLine.setAttribute('x1', thresholdPercentage);
            thresholdLine.setAttribute('y1', '0');
            thresholdLine.setAttribute('x2', thresholdPercentage);
            thresholdLine.setAttribute('y2', height);
            thresholdLine.setAttribute('stroke', colors.warning);
            thresholdLine.setAttribute('stroke-width', '2');
            thresholdLine.setAttribute('stroke-dasharray', '4,4');
            thresholdLine.classList.add('threshold-line');
            svg.appendChild(thresholdLine);
        }

        // Progress
        const progressRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        progressRect.setAttribute('x', '0');
        progressRect.setAttribute('y', '0');
        progressRect.setAttribute('width', '0');
        progressRect.setAttribute('height', height);
        progressRect.setAttribute('rx', '6');
        progressRect.setAttribute('fill', barColor);
        progressRect.classList.add('bar-progress');

        // Percentage text
        const percentText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        percentText.setAttribute('x', '50');
        percentText.setAttribute('y', height / 2);
        percentText.setAttribute('text-anchor', 'middle');
        percentText.setAttribute('dominant-baseline', 'middle');
        percentText.setAttribute('fill', colors.textLight);
        percentText.setAttribute('font-size', '13');
        percentText.setAttribute('font-weight', '600');
        percentText.classList.add('bar-percent');
        percentText.textContent = '0%';

        svg.appendChild(bgRect);
        svg.appendChild(progressRect);
        svg.appendChild(percentText);

        wrapper.appendChild(header);
        wrapper.appendChild(svg);

        // Animate with delay
        const delay = index * this.config.progressBar.animationDelay;
        setTimeout(() => {
            this.animateProgressBar(progressRect, percentText, percentage);
        }, delay);

        return wrapper;
    },

    // Animate progress bar
    animateProgressBar(rect, textElement, targetPercentage) {
        const duration = this.config.progressBar.animationDuration;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out cubic
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentPercentage = targetPercentage * easedProgress;
            
            rect.setAttribute('width', currentPercentage);
            textElement.textContent = Math.round(currentPercentage) + '%';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    // Create radial meter for total internal marks
    createRadialMeter(obtained, maximum) {
        const { size, strokeWidth } = this.config.radialMeter;
        const colors = this.getThemeColors();
        const percentage = (obtained / maximum) * 100;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const center = size / 2;

        // Determine color based on percentage
        let progressColor = colors.danger;
        if (percentage >= 80) progressColor = colors.success;
        else if (percentage >= 60) progressColor = colors.primaryHover;
        else if (percentage >= 40) progressColor = colors.warning;

        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        svg.classList.add('radial-meter-svg');

        // Background circle
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', center);
        bgCircle.setAttribute('cy', center);
        bgCircle.setAttribute('r', radius);
        bgCircle.setAttribute('fill', 'none');
        bgCircle.setAttribute('stroke', colors.bgDarker);
        bgCircle.setAttribute('stroke-width', strokeWidth);
        bgCircle.classList.add('meter-bg');

        // Progress circle
        const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        progressCircle.setAttribute('cx', center);
        progressCircle.setAttribute('cy', center);
        progressCircle.setAttribute('r', radius);
        progressCircle.setAttribute('fill', 'none');
        progressCircle.setAttribute('stroke', progressColor);
        progressCircle.setAttribute('stroke-width', strokeWidth);
        progressCircle.setAttribute('stroke-linecap', 'round');
        progressCircle.setAttribute('stroke-dasharray', circumference);
        progressCircle.setAttribute('stroke-dashoffset', circumference);
        progressCircle.setAttribute('transform', `rotate(-90 ${center} ${center})`);
        progressCircle.classList.add('meter-progress');

        // Center text group
        const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        textGroup.classList.add('meter-text-group');

        // Marks value
        const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valueText.setAttribute('x', center);
        valueText.setAttribute('y', center - 15);
        valueText.setAttribute('text-anchor', 'middle');
        valueText.setAttribute('dominant-baseline', 'middle');
        valueText.setAttribute('fill', colors.textLight);
        valueText.setAttribute('font-size', '42');
        valueText.setAttribute('font-weight', 'bold');
        valueText.classList.add('meter-value');
        valueText.textContent = '0';

        // Maximum text
        const maxText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        maxText.setAttribute('x', center);
        maxText.setAttribute('y', center + 15);
        maxText.setAttribute('text-anchor', 'middle');
        maxText.setAttribute('dominant-baseline', 'middle');
        maxText.setAttribute('fill', colors.textMuted);
        maxText.setAttribute('font-size', '18');
        maxText.textContent = `/ ${maximum}`;

        // Label
        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('x', center);
        labelText.setAttribute('y', center + 40);
        labelText.setAttribute('text-anchor', 'middle');
        labelText.setAttribute('dominant-baseline', 'middle');
        labelText.setAttribute('fill', colors.textMuted);
        labelText.setAttribute('font-size', '14');
        labelText.textContent = 'Total Marks';

        // Percentage text
        const percentText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        percentText.setAttribute('x', center);
        percentText.setAttribute('y', center + 58);
        percentText.setAttribute('text-anchor', 'middle');
        percentText.setAttribute('dominant-baseline', 'middle');
        percentText.setAttribute('fill', progressColor);
        percentText.setAttribute('font-size', '16');
        percentText.setAttribute('font-weight', '600');
        percentText.classList.add('meter-percent');
        percentText.textContent = '0%';

        textGroup.appendChild(valueText);
        textGroup.appendChild(maxText);
        textGroup.appendChild(labelText);
        textGroup.appendChild(percentText);

        svg.appendChild(bgCircle);
        svg.appendChild(progressCircle);
        svg.appendChild(textGroup);

        // Animate
        this.animateRadialMeter(progressCircle, valueText, percentText, circumference, percentage, obtained);

        return svg;
    },

    // Animate radial meter
    animateRadialMeter(circle, valueText, percentText, circumference, targetPercentage, targetValue) {
        const duration = this.config.radialMeter.animationDuration;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out cubic
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentPercentage = targetPercentage * easedProgress;
            const currentValue = targetValue * easedProgress;
            const offset = circumference - (circumference * currentPercentage / 100);
            
            circle.setAttribute('stroke-dashoffset', offset);
            valueText.textContent = currentValue.toFixed(1);
            percentText.textContent = Math.round(currentPercentage) + '%';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    // Create eligibility visual
    createEligibilityVisual(isEligible, totalMarks, threshold) {
        const colors = this.getThemeColors();
        const container = document.createElement('div');
        container.classList.add('eligibility-visual-container');

        // Status icon and text
        const statusDiv = document.createElement('div');
        statusDiv.classList.add('eligibility-status');
        statusDiv.innerHTML = `
            <div class="eligibility-icon ${isEligible ? 'eligible' : 'not-eligible'}">
                <i class="fas ${isEligible ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            </div>
            <div class="eligibility-text">
                <div class="eligibility-title">${isEligible ? 'Eligible for SEE' : 'Not Eligible'}</div>
                <div class="eligibility-subtitle">
                    ${isEligible ? 
                        `You have ${totalMarks.toFixed(2)} marks (≥${threshold} required)` : 
                        `Need ${(threshold - totalMarks).toFixed(2)} more marks`
                    }
                </div>
            </div>
        `;

        // Progress bar showing threshold
        const thresholdBar = document.createElement('div');
        thresholdBar.classList.add('threshold-progress');
        
        const percentage = Math.min((totalMarks / threshold) * 100, 100);
        
        thresholdBar.innerHTML = `
            <div class="threshold-bar-bg">
                <div class="threshold-bar-fill ${isEligible ? 'eligible' : 'not-eligible'}" 
                     style="width: 0%; background: ${isEligible ? colors.success : colors.danger}">
                </div>
                <div class="threshold-marker" style="left: 100%">
                    <span class="threshold-label">${threshold}</span>
                </div>
            </div>
            <div class="threshold-info">
                <span>Current: ${totalMarks.toFixed(2)}</span>
                <span>Required: ${threshold}</span>
            </div>
        `;

        container.appendChild(statusDiv);
        container.appendChild(thresholdBar);

        // Animate threshold bar
        setTimeout(() => {
            const fillBar = thresholdBar.querySelector('.threshold-bar-fill');
            if (fillBar) {
                fillBar.style.transition = 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
                fillBar.style.width = percentage + '%';
            }
        }, 100);

        return container;
    },

    // Render complete dashboard
    render(data) {
        if (!this.containers.progressBars) {
            console.error('IA Dashboard containers not initialized');
            return;
        }

        // Show dashboard
        const dashboard = document.getElementById('internal-marks-dashboard');
        if (dashboard) {
            dashboard.classList.add('visible');
        }

        // Clear existing content
        this.containers.progressBars.innerHTML = '';
        this.containers.radialMeter.innerHTML = '';
        this.containers.eligibilityVisual.innerHTML = '';

        // Render components
        const progressBars = this.createInternalProgressBars(data.components);
        this.containers.progressBars.appendChild(progressBars);

        const radialMeter = this.createRadialMeter(data.totalMarks, data.maxMarks);
        this.containers.radialMeter.appendChild(radialMeter);

        const eligibilityVisual = this.createEligibilityVisual(
            data.isEligible,
            data.totalMarks,
            data.threshold
        );
        this.containers.eligibilityVisual.appendChild(eligibilityVisual);
    },

    // Update dashboard with new data
    update(data) {
        this.render(data);
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    IADashboard.init();
});

// Export for use in ia.js
window.IADashboard = IADashboard;
