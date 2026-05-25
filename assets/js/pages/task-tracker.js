/**
 * Gamified Task Tracker Logic
 */

const XP_PER_TASK = 100;
const XP_PER_LEVEL = 500;
const RANK_NAMES = {
    1: "Novice Scholar",
    2: "Diligent Apprentice",
    3: "Focused Disciple",
    4: "Knowledge Seeker",
    5: "Sage in Training",
    10: "Grand Academic"
};

let trackerState = {
    tasks: [],
    xp: 0,
    level: 1,
    totalPoints: 0,
    completedToday: 0,
    lastResetDate: new Date().toDateString()
};

document.addEventListener('DOMContentLoaded', () => {
    loadTrackerState();
    initTrackerUI();
});

function loadTrackerState() {
    const saved = localStorage.getItem('cd_gamified_tasks');
    if (saved) {
        trackerState = JSON.parse(saved);
        
        // Daily reset for "Completed Today" counter
        const today = new Date().toDateString();
        if (trackerState.lastResetDate !== today) {
            trackerState.completedToday = 0;
            trackerState.lastResetDate = today;
        }
    }
    renderTasks();
    updateTrackerUI();
}

function saveTrackerState() {
    localStorage.setItem('cd_gamified_tasks', JSON.stringify(trackerState));
}

function initTrackerUI() {
    const addBtn = document.getElementById('addTaskBtn');
    const taskInput = document.getElementById('taskInput');

    if (addBtn && taskInput) {
        addBtn.addEventListener('click', () => {
            const title = taskInput.value.trim();
            if (!title) return;

            const category = document.getElementById('taskCategory').value;
            const newTask = {
                id: Date.now(),
                title,
                category,
                completed: false,
                createdAt: new Date().toISOString()
            };

            trackerState.tasks.push(newTask);
            taskInput.value = '';
            saveTrackerState();
            renderTasks();
        });

        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addBtn.click();
        });
    }
}

function renderTasks() {
    const container = document.getElementById('taskList');
    const countDisplay = document.getElementById('activeTaskCount');
    if (!container) return;
    
    if (trackerState.tasks.length === 0) {
        container.innerHTML = `
            <div class="empty-tasks">
                <i class="fas fa-tasks"></i>
                <p>Your quest board is empty. Add a task to start earning XP!</p>
            </div>`;
        if (countDisplay) countDisplay.textContent = '0 active';
        return;
    }

    const activeTasks = trackerState.tasks.filter(t => !t.completed);
    if (countDisplay) countDisplay.textContent = `${activeTasks.length} active`;

    container.innerHTML = trackerState.tasks.map(task => `
        <div class="task-item" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 10px;">
            <button onclick="toggleTask(${task.id})" style="background: ${task.completed ? 'var(--primary-color)' : 'transparent'}; border: 2px solid var(--primary-color); width: 22px; height: 22px; border-radius: 6px; cursor: pointer; color: #000;">
                ${task.completed ? '<i class="fas fa-check" style="font-size: 10px;"></i>' : ''}
            </button>
            <div style="flex: 1;">
                <div style="font-weight: 500; font-size: 0.9rem; text-decoration: ${task.completed ? 'line-through' : 'none'}; opacity: ${task.completed ? 0.5 : 1};">${task.title}</div>
                <div style="font-size: 0.7rem; color: var(--primary-color); font-weight: 600; text-transform: uppercase;">${task.category}</div>
            </div>
            <button onclick="deleteTask(${task.id})" style="background: none; border: none; color: #ff5252; opacity: 0.4; cursor: pointer;">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');
}

window.toggleTask = function(id) {
    const task = trackerState.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        if (task.completed) {
            trackerState.xp += XP_PER_TASK;
            trackerState.totalPoints += XP_PER_TASK;
            trackerState.completedToday++;
            
            if (trackerState.xp >= XP_PER_LEVEL) {
                trackerState.level++;
                trackerState.xp -= XP_PER_LEVEL;
                showLevelUpAlert(trackerState.level);
            }
        } else {
            trackerState.xp = Math.max(0, trackerState.xp - XP_PER_TASK);
            trackerState.totalPoints = Math.max(0, trackerState.totalPoints - XP_PER_TASK);
            trackerState.completedToday = Math.max(0, trackerState.completedToday - 1);
        }
        saveTrackerState();
        renderTasks();
        updateTrackerUI();
    }
};

window.deleteTask = function(id) {
    trackerState.tasks = trackerState.tasks.filter(t => t.id !== id);
    saveTrackerState();
    renderTasks();
};

function updateTrackerUI() {
    const elements = {
        level: document.getElementById('userLevel'),
        xp: document.getElementById('currentXP'),
        nextXp: document.getElementById('nextLevelXP'),
        total: document.getElementById('totalPointsDisplay'),
        daily: document.getElementById('dailyGoalProgress'),
        rank: document.getElementById('rankName'),
        bar: document.getElementById('xpBarFill')
    };

    if (elements.level) elements.level.textContent = trackerState.level;
    if (elements.xp) elements.xp.textContent = trackerState.xp;
    if (elements.total) elements.total.textContent = trackerState.totalPoints;
    if (elements.daily) elements.daily.textContent = `${trackerState.completedToday}/3`;
    if (elements.bar) elements.bar.style.width = `${(trackerState.xp / XP_PER_LEVEL) * 100}%`;
    if (elements.rank) elements.rank.textContent = RANK_NAMES[trackerState.level] || (trackerState.level >= 10 ? RANK_NAMES[10] : RANK_NAMES[5]);

    // Achievement Logic
    const bFocus = document.getElementById('badge-focus');
    const bStreak = document.getElementById('badge-streak');
    const bTasks = document.getElementById('badge-tasks');
    
    if (bFocus && trackerState.level >= 3) bFocus.classList.add('unlocked');
    if (bStreak && trackerState.completedToday >= 3) bStreak.classList.add('unlocked');
    if (bTasks && trackerState.totalPoints >= 1000) bTasks.classList.add('unlocked');
}

function showLevelUpAlert(lvl) {
    const notification = document.createElement('div');
    notification.className = 'notification show';
    notification.style.background = 'linear-gradient(135deg, #00b3ff, #00ff88)';
    notification.style.color = '#000';
    notification.style.fontWeight = 'bold';
    notification.innerHTML = `<i class="fas fa-medal"></i> LEVEL UP! You are now Level ${lvl}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
}