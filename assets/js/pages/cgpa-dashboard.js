/**
 * CGPA Visual Dashboard
 * Native SVG-based visualizations for CGPA tracking
 * No external dependencies - pure vanilla JavaScript
 */

const CGPADashboard = {
    // Configuration
    config: {
        radialMeter: {
            size: 280,
            strokeWidth: 24,
            animationDuration: 1500
        },
        progressBar: {
            height: 40,
            animationDuration: 1200,
            animationDelay: 150
        },
        targetTracker: {
            height: 100,
            animationDuration: 1000
        }
    },

    // Initialize dashboard
    init() {
        this.containers = {
            radialMeter: document.getElementById('radialMeterContainer'),
            targetTracker: document.getElementById('targetTrackerContainer'),
            progressBars: document.getElementById('progressBarsContainer')
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

    // Create radial CGPA meter
    createRadialMeter(cgpa, maxCGPA = 10) {
        const { size, strokeWidth } = this.config.radialMeter;
        const colors = this.getThemeColors();
        const percentage = (cgpa / maxCGPA) * 100;
        const radius = (size - strokeWidth) / 2;
        const circumference = 2 * Math.PI * radius;
        const center = size / 2;

        // Determine color based on CGPA
        let progressColor = colors.danger;
        if (cgpa >= 8.5) progressColor = colors.success;
        else if (cgpa >= 7.5) progressColor = colors.primaryHover;
        else if (cgpa >= 7.0) progressColor = colors.warning;

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

        // CGPA value
        const valueText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        valueText.setAttribute('x', center);
        valueText.setAttribute('y', center - 10);
        valueText.setAttribute('text-anchor', 'middle');
        valueText.setAttribute('dominant-baseline', 'middle');
        valueText.setAttribute('fill', colors.textLight);
        valueText.setAttribute('font-size', '48');
        valueText.setAttribute('font-weight', 'bold');
        valueText.classList.add('meter-value');
        valueText.textContent = '0.0';

        // Label
        const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        labelText.setAttribute('x', center);
        labelText.setAttribute('y', center + 30);
        labelText.setAttribute('text-anchor', 'middle');
        labelText.setAttribute('dominant-baseline', 'middle');
        labelText.setAttribute('fill', colors.textMuted);
        labelText.setAttribute('font-size', '16');
        labelText.textContent = 'CGPA';

        // Grade text
        const gradeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        gradeText.setAttribute('x', center);
        gradeText.setAttribute('y', center + 50);
        gradeText.setAttribute('text-anchor', 'middle');
        gradeText.setAttribute('dominant-baseline', 'middle');
        gradeText.setAttribute('fill', progressColor);
        gradeText.setAttribute('font-size', '14');
        gradeText.setAttribute('font-weight', '600');
        gradeText.classList.add('meter-grade');
        gradeText.textContent = this.getGrade(cgpa);

        textGroup.appendChild(valueText);
        textGroup.appendChild(labelText);
        textGroup.appendChild(gradeText);

        svg.appendChild(bgCircle);
        svg.appendChild(progressCircle);
        svg.appendChild(textGroup);

        // Animate
        this.animateRadialMeter(progressCircle, valueText, circumference, percentage, cgpa);

        return svg;
    },

    // Animate radial meter
    animateRadialMeter(circle, textElement, circumference, targetPercentage, targetValue) {
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
            textElement.textContent = currentValue.toFixed(1);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    // Get grade based on CGPA
    getGrade(cgpa) {
        if (cgpa >= 9.0) return 'A+';
        if (cgpa >= 8.5) return 'A';
        if (cgpa >= 8.0) return 'A-';
        if (cgpa >= 7.5) return 'B+';
        if (cgpa >= 7.0) return 'B';
        if (cgpa >= 6.5) return 'B-';
        if (cgpa >= 6.0) return 'C+';
        if (cgpa >= 5.5) return 'C';
        return 'D';
    },

    // Create target tracker
    createTargetTracker(currentCGPA, targetCGPA, requiredCGPA) {
        const colors = this.getThemeColors();
        const width = 100; // percentage
        const height = this.config.targetTracker.height;
        
        const container = document.createElement('div');
        container.classList.add('target-tracker');

        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.classList.add('target-tracker-svg');

        // Track line
        const trackLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        trackLine.setAttribute('x1', '10');
        trackLine.setAttribute('y1', height / 2);
        trackLine.setAttribute('x2', '90');
        trackLine.setAttribute('y2', height / 2);
        trackLine.setAttribute('stroke', colors.bgDarker);
        trackLine.setAttribute('stroke-width', '4');
        trackLine.classList.add('tracker-line');

        // Progress line
        const currentPosition = 10 + ((currentCGPA / 10) * 80);
        const targetPosition = 10 + ((targetCGPA / 10) * 80);

        const progressLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        progressLine.setAttribute('x1', '10');
        progressLine.setAttribute('y1', height / 2);
        progressLine.setAttribute('x2', '10');
        progressLine.setAttribute('y2', height / 2);
        progressLine.setAttribute('stroke', colors.primary);
        progressLine.setAttribute('stroke-width', '4');
        progressLine.classList.add('tracker-progress');

        // Current marker
        const currentMarker = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        currentMarker.classList.add('tracker-marker-current');
        
        const currentCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        currentCircle.setAttribute('cx', '10');
        currentCircle.setAttribute('cy', height / 2);
        currentCircle.setAttribute('r', '6');
        currentCircle.setAttribute('fill', colors.primary);
        currentCircle.setAttribute('stroke', colors.textLight);
        currentCircle.setAttribute('stroke-width', '2');

        const currentLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        currentLabel.setAttribute('x', '10');
        currentLabel.setAttribute('y', height / 2 - 15);
        currentLabel.setAttribute('text-anchor', 'middle');
        currentLabel.setAttribute('fill', colors.textLight);
        currentLabel.setAttribute('font-size', '12');
        currentLabel.setAttribute('font-weight', '600');
        currentLabel.textContent = currentCGPA.toFixed(1);

        currentMarker.appendChild(currentCircle);
        currentMarker.appendChild(currentLabel);

        // Target marker
        const targetMarker = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        targetMarker.classList.add('tracker-marker-target');
        
        const targetCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        targetCircle.setAttribute('cx', targetPosition);
        targetCircle.setAttribute('cy', height / 2);
        targetCircle.setAttribute('r', '6');
        targetCircle.setAttribute('fill', colors.success);
        targetCircle.setAttribute('stroke', colors.textLight);
        targetCircle.setAttribute('stroke-width', '2');

        const targetLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        targetLabel.setAttribute('x', targetPosition);
        targetLabel.setAttribute('y', height / 2 - 15);
        targetLabel.setAttribute('text-anchor', 'middle');
        targetLabel.setAttribute('fill', colors.success);
        targetLabel.setAttribute('font-size', '12');
        targetLabel.setAttribute('font-weight', '600');
        targetLabel.textContent = targetCGPA.toFixed(1);

        targetMarker.appendChild(targetCircle);
        targetMarker.appendChild(targetLabel);

        svg.appendChild(trackLine);
        svg.appendChild(progressLine);
        svg.appendChild(currentMarker);
        svg.appendChild(targetMarker);

        // Info text
        const infoDiv = document.createElement('div');
        infoDiv.classList.add('tracker-info');
        
        const gap = targetCGPA - currentCGPA;
        const achievable = requiredCGPA <= 10;
        
        infoDiv.innerHTML = `
            <div class="tracker-stat">
                <span class="tracker-stat-label">Gap to Target</span>
                <span class="tracker-stat-value" style="color: ${achievable ? colors.warning : colors.danger}">
                    ${gap.toFixed(2)} points
                </span>
            </div>
            <div class="tracker-stat">
                <span class="tracker-stat-label">Required per Semester</span>
                <span class="tracker-stat-value" style="color: ${achievable ? colors.success : colors.danger}">
                    ${requiredCGPA.toFixed(2)} CGPA
                </span>
            </div>
            <div class="tracker-stat">
                <span class="tracker-stat-label">Status</span>
                <span class="tracker-stat-value" style="color: ${achievable ? colors.success : colors.danger}">
                    ${achievable ? '✓ Achievable' : '✗ Not Achievable'}
                </span>
            </div>
        `;

        container.appendChild(svg);
        container.appendChild(infoDiv);

        // Animate progress line
        this.animateTargetTracker(progressLine, currentPosition);

        return container;
    },

    // Animate target tracker
    animateTargetTracker(line, targetX) {
        const duration = this.config.targetTracker.animationDuration;
        const startTime = performance.now();
        const startX = 10;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out cubic
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentX = startX + (targetX - startX) * easedProgress;
            line.setAttribute('x2', currentX);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    },

    // Create progress bars for performance breakdown
    createProgressBars(data) {
        const container = document.createElement('div');
        container.classList.add('progress-bars-list');

        const bars = [
            { label: 'Current CGPA', value: data.currentCGPA, max: 10, color: 'primary' },
            { label: 'Target CGPA', value: data.targetCGPA, max: 10, color: 'success' },
            { label: 'Required CGPA', value: data.requiredCGPA, max: 10, color: 'warning' }
        ];

        bars.forEach((bar, index) => {
            const barElement = this.createProgressBar(bar, index);
            container.appendChild(barElement);
        });

        return container;
    },

    // Create single progress bar
    createProgressBar(config, index) {
        const colors = this.getThemeColors();
        const percentage = (config.value / config.max) * 100;
        const height = this.config.progressBar.height;
        
        const colorMap = {
            primary: colors.primary,
            success: colors.success,
            warning: colors.warning,
            danger: colors.danger
        };
        
        const barColor = colorMap[config.color] || colors.primary;

        const wrapper = document.createElement('div');
        wrapper.classList.add('progress-bar-wrapper');

        // Label and value
        const header = document.createElement('div');
        header.classList.add('progress-bar-header');
        header.innerHTML = `
            <span class="progress-bar-label">${config.label}</span>
            <span class="progress-bar-value">${config.value.toFixed(2)} / ${config.max}</span>
        `;

        // SVG bar
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', height);
        svg.setAttribute('viewBox', '0 0 100 ' + height);
        svg.classList.add('progress-bar-svg');

        // Background
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('x', '0');
        bgRect.setAttribute('y', '0');
        bgRect.setAttribute('width', '100');
        bgRect.setAttribute('height', height);
        bgRect.setAttribute('rx', '8');
        bgRect.setAttribute('fill', colors.bgDarker);
        bgRect.classList.add('bar-bg');

        // Progress
        const progressRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        progressRect.setAttribute('x', '0');
        progressRect.setAttribute('y', '0');
        progressRect.setAttribute('width', '0');
        progressRect.setAttribute('height', height);
        progressRect.setAttribute('rx', '8');
        progressRect.setAttribute('fill', barColor);
        progressRect.classList.add('bar-progress');

        // Percentage text
        const percentText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        percentText.setAttribute('x', '50');
        percentText.setAttribute('y', height / 2);
        percentText.setAttribute('text-anchor', 'middle');
        percentText.setAttribute('dominant-baseline', 'middle');
        percentText.setAttribute('fill', colors.textLight);
        percentText.setAttribute('font-size', '14');
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

    // Render complete dashboard
    render(data) {
        if (!this.containers.radialMeter) {
            console.error('Dashboard containers not initialized');
            return;
        }

        // Show dashboard
        const dashboard = document.getElementById('visual-dashboard');
        if (dashboard) {
            dashboard.classList.add('visible');
        }

        // Clear existing content
        this.containers.radialMeter.innerHTML = '';
        this.containers.targetTracker.innerHTML = '';
        this.containers.progressBars.innerHTML = '';

        // Render components
        const radialMeter = this.createRadialMeter(data.currentCGPA, 10);
        this.containers.radialMeter.appendChild(radialMeter);

        const targetTracker = this.createTargetTracker(
            data.currentCGPA,
            data.targetCGPA,
            data.requiredCGPA
        );
        this.containers.targetTracker.appendChild(targetTracker);

        const progressBars = this.createProgressBars(data);
        this.containers.progressBars.appendChild(progressBars);
    },

    // Update dashboard with new data
    update(data) {
        this.render(data);
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    CGPADashboard.init();
});

// Export for use in cgpa.js
window.CGPADashboard = CGPADashboard;
