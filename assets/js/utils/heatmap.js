let heatmapYear = new Date().getFullYear();

function getEffectiveDate() {
    const now = new Date();
    if (now.getHours() < 4) now.setDate(now.getDate() - 1);
    return formatDate(now);
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function renderHeatmap(year = heatmapYear) {
    const grid = document.getElementById('heatmapGrid');
    if (!grid) return;

    heatmapYear = year;
    const yearLabel = document.getElementById('heatmapYearLabel');
    if (yearLabel) yearLabel.textContent = year;

    const data = getAllActivityData();
    const streak = calculateCurrentStreak(data);
    
    const streakEl = document.getElementById('homeStreakCount');
    if (streakEl) streakEl.textContent = streak;

    // Start from Jan 1st of the selected year
    const startDate = new Date(year, 0, 1);
    // Align to the start of the week (Sunday)
    startDate.setDate(startDate.getDate() - startDate.getDay()); 
    
    // End at Dec 31st of that year (or today if current year)
    const today = new Date();
    const endDate = (year === today.getFullYear()) ? today : new Date(year, 11, 31);

    grid.innerHTML = '';
    
    // Header for months
    let header = document.getElementById('heatmapMonthsHeader');
    if (!header) {
        header = document.createElement('div');
        header.id = 'heatmapMonthsHeader';
        header.className = 'heatmap-months-header';
        grid.parentNode.insertBefore(header, grid);
    }
    header.innerHTML = '';

    const tempDate = new Date(startDate);
    let lastMonth = -1;
    let weekCount = 0;

    // We render up to the end of the year to maintain "year structure"
    const finalDate = new Date(year, 11, 31);

    while (tempDate <= finalDate) {
        const dateStr = formatDate(tempDate);
        const dayData = data[dateStr] || { totalMinutes: 0, roadmapSteps: 0 };
        
        let intensity = (dayData.totalMinutes || 0) + (dayData.roadmapSteps || 0) * 15;
        
        // Live updates only for today
        if (dateStr === today.toISOString().split('T')[0] && typeof pomodoroTimer !== 'undefined') {
            const liveMs = pomodoroTimer.initialTime - pomodoroTimer.remainingTime;
            if (pomodoroTimer.currentPhase === 'work') {
                intensity += (liveMs / 60000);
            }
        }

        const level = getIntensityLevel(intensity);

        const cell = document.createElement('div');
        cell.className = `heatmap-cell level-${level}`;
        
        // Only show pulsing/live if it's within the active year
        if (dateStr === today.toISOString().split('T')[0] && typeof pomodoroTimer !== 'undefined' && pomodoroTimer.isRunning && pomodoroTimer.currentPhase === 'work') {
            cell.classList.add('pumping');
        }
        
        cell.dataset.tooltip = `${dateStr}: ${Math.round(intensity)} pts`;
        
        grid.appendChild(cell);

        if (tempDate.getDay() === 0) {
            if (tempDate.getMonth() !== lastMonth && tempDate.getFullYear() === year) {
                const monthLabel = document.createElement('span');
                monthLabel.textContent = tempDate.toLocaleString('default', { month: 'short' });
                monthLabel.style.gridColumnStart = Math.floor(weekCount) + 1;
                header.appendChild(monthLabel);
                lastMonth = tempDate.getMonth();
            }
            weekCount++;
        }

        tempDate.setDate(tempDate.getDate() + 1);
    }
}

function changeHeatmapYear(delta) {
    heatmapYear += delta;
    renderHeatmap(heatmapYear);
}

function getIntensityLevel(points) {
    if (points === 0) return 0;
    if (points < 15) return 1;
    if (points < 45) return 2;
    if (points < 90) return 3;
    return 4;
}

function getAllActivityData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('pomodoro_')) {
            const date = key.replace('pomodoro_', '');
            try {
                data[date] = JSON.parse(localStorage.getItem(key));
            } catch (e) {}
        }
    }
    return data;
}

function calculateCurrentStreak(data) {
    let streak = 0;
    const effectiveDay = getEffectiveDate();
    let checkDate = new Date();
    if (new Date().getHours() < 4) checkDate.setDate(checkDate.getDate() - 1);
    checkDate.setHours(0,0,0,0);

    while (true) {
        const dateStr = formatDate(checkDate);
        const dayData = data[dateStr];
        const hasActivity = dayData && ((dayData.totalMinutes || 0) > 0 || (dayData.roadmapSteps || 0) > 0);
        
        if (hasActivity) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            if (dateStr === effectiveDay) {
                checkDate.setDate(checkDate.getDate() - 1);
                continue;
            }
            break;
        }
    }
    return streak;
}

document.addEventListener('DOMContentLoaded', () => {
    renderHeatmap();
});
window.renderHeatmap = renderHeatmap;
window.changeHeatmapYear = changeHeatmapYear;
