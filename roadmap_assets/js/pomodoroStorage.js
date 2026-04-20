/**
 * Pomodoro Storage Utility
 * Manages localStorage for tracking pomodoro history
 */

const STORAGE_PREFIX = 'pomodoro_';

/**
 * Save today's pomodoro data
 */
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

function saveTodayProgress(completedPomodoros, totalMinutes) {
    const today = getEffectiveDate();
    const key = `${STORAGE_PREFIX}${today}`;
    
    // Read existing data first
    let data = {};
    try {
        const existing = localStorage.getItem(key);
        if (existing) data = JSON.parse(existing);
    } catch (e) {}

    // Update with new values
    data.date = today;
    data.completedPomodoros = completedPomodoros;
    data.totalMinutes = totalMinutes;
    data.timestamp = Date.now();
    
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return data;
    } catch (e) {
        console.error('Error saving progress:', e);
        return null;
    }
}

/**
 * Get data for a specific date
 */
function getDateProgress(dateString) {
    try {
        const data = localStorage.getItem(`${STORAGE_PREFIX}${dateString}`);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Error getting date progress:', e);
        return null;
    }
}

/**
 * Get all pomodoro history data
 */
function getAllProgress() {
    const allData = [];
    
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX)) {
                const data = JSON.parse(localStorage.getItem(key));
                allData.push(data);
            }
        }
        
        // Sort by date (newest first)
        return allData.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
        console.error('Error getting all progress:', e);
        return [];
    }
}

/**
 * Get progress for a specific month
 */
function getMonthProgress(year, month) {
    const allData = getAllProgress();
    return allData.filter(item => {
        const date = new Date(item.date);
        return date.getFullYear() === year && date.getMonth() === month;
    });
}

/**
 * Calculate current streak
 */
function calculateStreak() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
            const d = JSON.parse(localStorage.getItem(key));
            data[key.replace(STORAGE_PREFIX, '')] = d;
        }
    }
    
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

/**
 * Calculate best streak
 */
function calculateBestStreak() {
    const allData = getAllProgress()
        .filter(d => (d.totalMinutes || 0) > 0 || (d.roadmapSteps || 0) > 0)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (allData.length === 0) return 0;
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < allData.length; i++) {
        const prevDate = new Date(allData[i - 1].date);
        const currDate = new Date(allData[i].date);
        const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }
    
    return maxStreak;
}

/**
 * Calculate statistics for a month
 */
function getMonthStats(year, month) {
    const monthData = getMonthProgress(year, month);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const daysFocused = monthData.filter(d => (d.totalMinutes || 0) > 0 || (d.roadmapSteps || 0) > 0).length;
    const totalFocusMinutes = monthData.reduce((sum, d) => sum + d.totalMinutes, 0);
    const totalPomodoros = monthData.reduce((sum, d) => sum + d.completedPomodoros, 0);
    const avgFocusDay = daysFocused > 0 ? Math.round(totalFocusMinutes / daysFocused) : 0;
    
    return {
        daysFocused,
        daysInMonth,
        totalFocusMinutes,
        totalPomodoros,
        avgFocusDay,
        currentStreak: calculateStreak(),
        bestStreak: calculateBestStreak()
    };
}

/**
 * Export all data as JSON
 */
function exportData() {
    const allData = getAllProgress();
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `pomodoro-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

/**
 * Import data from JSON file
 */
function importData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        
        if (!Array.isArray(data)) {
            throw new Error('Invalid data format');
        }
        
        data.forEach(item => {
            if (item.date && item.completedPomodoros !== undefined && item.totalMinutes !== undefined) {
                localStorage.setItem(`${STORAGE_PREFIX}${item.date}`, JSON.stringify(item));
            }
        });
        
        return { success: true, count: data.length };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Clear all pomodoro data
 */
function clearAllData() {
    const keys = [];
    
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(STORAGE_PREFIX)) {
                keys.push(key);
            }
        }
        
        keys.forEach(key => localStorage.removeItem(key));
        return keys.length;
    } catch (e) {
        console.error('Error clearing data:', e);
        return 0;
    }
}

// Log that the storage utility is loaded
console.log('Pomodoro Storage Utility loaded');