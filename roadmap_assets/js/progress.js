/**
 * Progress Tracker Frontend 
 * Handles UI updates, calendar rendering, and user interactions
 */

let currentMonth = new Date();
let currentTab = 'stats';

// Initialization


document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    loadStatistics();
    renderCalendar();
    showTab('stats'); // Start with stats tab
}


// Tab Management


function showTab(tabName) {

    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // If tabs are not present on this page, stop execution
    if (!tabButtons.length || !tabContents.length) {
        return;
    }

    // Update tab buttons
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
    });

    const statsTab = document.getElementById('statsTab');
    const calendarTab = document.getElementById('calendarTab');

    if (tabName === 'stats' && statsTab) {
        statsTab.classList.add('active');
    } else if (calendarTab) {
        calendarTab.classList.add('active');
    }

    // Update tab content
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    const statsContent = document.getElementById('statsContent');
    const calendarContent = document.getElementById('calendarContent');

    if (tabName === 'stats' && statsContent) {
        statsContent.classList.add('active');
        loadStatistics();
    } else if (calendarContent) {
        calendarContent.classList.add('active');
        renderCalendar();
    }

    currentTab = tabName;
}

// Statistics Loading


function loadStatistics() {
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const stats = getMonthStats(year, month);
    
    // Update stat cards
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    document.getElementById('daysFocused').textContent = `${stats.daysFocused} / ${stats.daysInMonth}`;
    document.getElementById('avgFocusTime').textContent = formatTime(stats.avgFocusDay);
    document.getElementById('totalFocusTime').textContent = formatTime(stats.totalFocusMinutes);
    document.getElementById('totalPomodoros').textContent = stats.totalPomodoros;
    document.getElementById('currentStreak').textContent = stats.currentStreak;
    document.getElementById('bestStreak').textContent = stats.bestStreak;
    
    // Update progress bar
    const progressPercent = stats.daysInMonth > 0 
        ? Math.round((stats.daysFocused / stats.daysInMonth) * 100)
        : 0;
    document.getElementById('progressPercent').textContent = `${progressPercent}%`;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
    
    // Show motivation message
    showMotivation(stats.currentStreak);
}

function formatTime(minutes) {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function showMotivation(streak) {
    const motivationCard = document.getElementById('motivationCard');
    const motivationText = document.getElementById('motivationText');
    
    if (streak === 0) {
        motivationCard.style.display = 'none';
        return;
    }
    
    let message;
    if (streak === 1) {
        message = "Great start! Keep it going!";
    } else if (streak < 7) {
        message = `${streak} days streak! You're building momentum!`;
    } else if (streak < 30) {
        message = `${streak} days streak! You're on fire! 🔥`;
    } else {
        message = `${streak} days streak! Incredible dedication! 🌟`;
    }
    
    motivationText.textContent = message;
    motivationCard.style.display = 'flex';
}


// Calendar Rendering


function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthData = getMonthProgress(year, month);
    
    // Update month/year header
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    document.getElementById('monthYear').textContent = `${monthNames[month]} ${year}`;
    
    // Get calendar info
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    // Clear and populate calendar grid
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        grid.appendChild(emptyDay);
    }
    
    // Add day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dateString = new Date(year, month, day).toISOString().split('T')[0];
        const dayData = monthData.find(d => d.date === dateString);
        const minutes = dayData ? dayData.totalMinutes : 0;
        const pomodoros = dayData ? dayData.completedPomodoros : 0;
        
        const dayCell = document.createElement('div');
        dayCell.className = `calendar-day ${getIntensityClass(minutes)}`;
        dayCell.textContent = day;
        dayCell.title = `${day}: ${pomodoros} pomodoros, ${minutes} min`;
        
        // Check if today
        const isToday = day === new Date().getDate() &&
            month === new Date().getMonth() &&
            year === new Date().getFullYear();
        if (isToday) {
            dayCell.classList.add('today');
        }
        
        // Add click handler
        dayCell.addEventListener('click', () => showDayDetails(day, dayData));
        
        grid.appendChild(dayCell);
    }
}

function getIntensityClass(minutes) {
    if (minutes === 0) return 'intensity-0';
    if (minutes < 30) return 'intensity-1';
    if (minutes < 60) return 'intensity-2';
    if (minutes < 120) return 'intensity-3';
    return 'intensity-4';
}

function changeMonth(direction) {
    currentMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + direction
    );
    renderCalendar();
}

function showDayDetails(day, dayData) {
    const detailsDiv = document.getElementById('dayDetails');
    
    if (!dayData || dayData.completedPomodoros === 0) {
        detailsDiv.style.display = 'none';
        return;
    }
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    document.getElementById('selectedDate').textContent = 
        `${monthNames[month]} ${day}, ${year}`;
    document.getElementById('detailPomodoros').textContent = dayData.completedPomodoros;
    document.getElementById('detailMinutes').textContent = dayData.totalMinutes;
    
    detailsDiv.style.display = 'block';
    
    // Scroll to details
    detailsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}


// Data Management


function exportData() {
    const allData = getAllProgress();
    
    if (allData.length === 0) {
        alert('⚠️ No data to export yet. Complete some Pomodoro sessions first!');
        return;
    }
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `pomodoro-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    alert('✅ Your progress data has been exported successfully!');
}

function importDataFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonData = e.target.result;
            const data = JSON.parse(jsonData);
            
            // Validate data structure
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format');
            }
            
            // Import data
            let imported = 0;
            data.forEach(item => {
                if (item.date && item.completedPomodoros !== undefined && item.totalMinutes !== undefined) {
                    localStorage.setItem(`pomodoro_${item.date}`, JSON.stringify(item));
                    imported++;
                }
            });
            
            alert(`✅ Successfully imported ${imported} records!`);
            
            // Refresh the display
            initializePage();
        } catch (error) {
            alert(`❌ Import failed: ${error.message}`);
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

function clearAllData() {
    const allData = getAllProgress();
    
    if (allData.length === 0) {
        alert('ℹ️ No data to clear.');
        return;
    }
    
    const confirmed = confirm(
        '⚠️ Are you sure you want to delete all progress data?\n\n' +
        'This will permanently remove:\n' +
        '- All pomodoro session history\n' +
        '- Streak records\n' +
        '- Statistics\n\n' +
        'This action cannot be undone!'
    );
    
    if (!confirmed) return;
    
    let deletedCount = 0;
    const keys = [];
    
    // Collect all pomodoro keys
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('pomodoro_')) {
            keys.push(key);
        }
    }
    
    // Delete all keys
    keys.forEach(key => {
        localStorage.removeItem(key);
        deletedCount++;
    });
    
    alert(`✅ Deleted ${deletedCount} records.`);
    
    // Refresh the display
    initializePage();
}

// Initialize on page load


console.log('Progress page loaded');