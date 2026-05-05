class PomodoroTimer {
    constructor() {
        this.isRunning = false;
        this.currentPhase = 'work';
        this.completedPomodoros = 0;
        this.totalFocusTime = 0;
        this.currentStreak = 0;
        this.interval = null;
        this.startTime = null;
        this.pausedTime = null;
        this.setupElements();
        this.loadStoredSettings();
        this.loadTodayProgress(); // NEW: Load today's progress data
        this.setupEventListeners();
        this.resetTimer();
        this.updateDisplay();
        this.updateStats();
    }

    setupElements() {
        // Add settings icon element
        this.settingsIcon = document.getElementById('settings-icon');
        this.settingsPanel = document.getElementById('settings-panel');
        
        // Timer elements
        this.display = document.querySelector('.time-display');
        this.phaseDisplay = document.querySelector('.phase-display');
        this.startBtn = document.getElementById('start');
        this.circleBtn = document.querySelector(".timer-container");
        this.skipBtn = document.getElementById('skip');
        this.resetBtn = document.getElementById('reset');
        this.progressRing = document.querySelector('.progress-ring circle');
        
        // Settings elements
        this.workDurationInput = document.getElementById('work-duration');
        this.shortBreakInput = document.getElementById('short-break');
        this.longBreakInput = document.getElementById('long-break');
        this.pomodorosCountInput = document.getElementById('pomodoros-count');
        this.applySettingsBtn = document.getElementById('apply-settings');

        // Music elements
        this.youtubeInput = document.getElementById('youtube-url');
        this.addYoutubeBtn = document.getElementById('add-youtube');
        this.youtubeContainer = document.querySelector('.youtube-container');
        this.volumeSlider = document.querySelector('.volume-slider');

        // Stats elements
        this.completedPomodorosDisplay = document.getElementById('completed-pomodoros');
        this.totalFocusTimeDisplay = document.getElementById('total-focus-time');
        this.currentStreakDisplay = document.getElementById('current-streak');

        // Notification element
        this.notification = document.getElementById('notification');

        // Quiz elements
        this.studyTopicInput = document.getElementById('study-topic');
        this.quizModal = document.getElementById('quiz-modal');
        this.quizLoading = document.getElementById('quiz-loading');
        this.quizContainer = document.getElementById('quiz-container');
        this.quizSummary = document.getElementById('quiz-summary');
        
        this.quizQuestion = document.getElementById('quiz-question');
        this.quizOptions = document.getElementById('quiz-options');
        this.quizProgress = document.getElementById('quiz-progress');
        
        this.skipQuizBtn = document.getElementById('skip-quiz');
        this.nextQuestionBtn = document.getElementById('next-question');
        this.finishQuizBtn = document.getElementById('finish-quiz');

        // Quiz State
        this.quizData = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.pendingPhase = null;

        // Initialize progress ring
        if (this.progressRing) {
            this.circumference = 2 * Math.PI * parseFloat(this.progressRing.getAttribute('r'));
            this.progressRing.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        }
    }

    setupEventListeners() {
        if (this.circleBtn ) {
            this.circleBtn .addEventListener('click', () => this.toggleTimer());
        }
        // Timer controls
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.toggleTimer());
        }
        if (this.skipBtn) {
            this.skipBtn.addEventListener('click', () => this.skipPhase());
        }
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetTimer());
        }

        // Settings panel
        if (this.settingsIcon && this.settingsPanel) {
            this.settingsIcon.addEventListener('click', () => {
                this.settingsPanel.classList.toggle('show');
                this.updateSettingsInputs();
            });
        }
        if (this.applySettingsBtn) {
            this.applySettingsBtn.addEventListener('click', () => this.applySettings());
        }

        // YouTube controls
        if (this.addYoutubeBtn && this.youtubeInput) {
            this.addYoutubeBtn.addEventListener('click', () => this.loadYoutubeVideo());
        }
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener('input', (e) => this.updateVolume(e.target.value));
        }

        // Close settings panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.settingsPanel && this.settingsIcon && 
                !this.settingsPanel.contains(e.target) && 
                !this.settingsIcon.contains(e.target)) {
                this.settingsPanel.classList.remove('show');
            }
        });

        // Quiz Event Listeners
        if (this.skipQuizBtn) {
            this.skipQuizBtn.addEventListener('click', () => this.endQuiz());
        }
        if (this.nextQuestionBtn) {
            this.nextQuestionBtn.addEventListener('click', () => this.handleNextQuestion());
        }
        if (this.finishQuizBtn) {
            this.finishQuizBtn.addEventListener('click', () => this.endQuiz());
        }

        // Save settings on inputs change
        const settingsInputs = [this.workDurationInput, this.shortBreakInput, this.longBreakInput, this.pomodorosCountInput];
        settingsInputs.forEach(input => {
            if (input) {
                input.addEventListener('change', () => this.validateInput(input));
            }
        });
    }

    validateInput(input) {
        if (!input) return;
        
        let value = parseInt(input.value);
        const min = parseInt(input.getAttribute('min') || 1);
        const max = parseInt(input.getAttribute('max') || 60);
        
        if (isNaN(value) || value < min) {
            value = min;
        } else if (value > max) {
            value = max;
        }
        
        input.value = value;
    }

    loadStoredSettings() {
        try {
            const savedSettings = localStorage.getItem('pomodoroSettings');
            if (savedSettings) {
                this.settings = JSON.parse(savedSettings);
                this.updateSettingsInputs();
            } else {
                this.loadDefaultSettings();
            }
        } catch (e) {
            this.loadDefaultSettings();
        }
    }

    loadDefaultSettings() {
        this.settings = {
            workDuration: 25,
            shortBreak: 5,
            longBreak: 15,
            pomodorosUntilLongBreak: 4
        };
        this.updateSettingsInputs();
    }

    updateSettingsInputs() {
        if (this.workDurationInput) this.workDurationInput.value = this.settings.workDuration;
        if (this.shortBreakInput) this.shortBreakInput.value = this.settings.shortBreak;
        if (this.longBreakInput) this.longBreakInput.value = this.settings.longBreak;
        if (this.pomodorosCountInput) this.pomodorosCountInput.value = this.settings.pomodorosUntilLongBreak;
    }

    applySettings() {
        const workDuration = parseInt(this.workDurationInput?.value) || 25;
        const shortBreak = parseInt(this.shortBreakInput?.value) || 5;
        const longBreak = parseInt(this.longBreakInput?.value) || 15;
        const pomodorosUntilLongBreak = parseInt(this.pomodorosCountInput?.value) || 4;

        this.settings = {
            workDuration,
            shortBreak,
            longBreak,
            pomodorosUntilLongBreak
        };

        try {
            localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
        } catch (e) {
            this.showNotification('Settings could not be persisted in this browser session');
        }

        this.resetTimer();
        this.showNotification('Settings applied successfully');
        this.settingsPanel.classList.remove('show');
    }

    // NEW METHOD: Load today's progress from storage
    loadTodayProgress() {
        try {
            // Check if the storage utility exists
            if (typeof getDateProgress === 'function') {
                const today = new Date().toISOString().split('T')[0];
                const todayData = getDateProgress(today);
                
                if (todayData) {
                    this.completedPomodoros = todayData.completedPomodoros || 0;
                    this.totalFocusTime = todayData.totalMinutes || 0;
                }
            }
        } catch (e) {
            this.showNotification('Progress history is unavailable right now');
        }
    }

    resetTimer() {
        clearInterval(this.interval);
        this.isRunning = false;
        this.startTime = null;
        this.pausedTime = null;
        if (this.startBtn) {
            this.startBtn.textContent = 'Start';
            this.startBtn.classList.remove('btn-pause');
        }
        this.currentPhase = 'work';
        this.remainingTime = this.settings.workDuration * 60 * 1000;
        this.initialTime = this.remainingTime;
        this.updateDisplay();
        this.updateProgress(1);
        this.updatePhaseDisplay();
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        if (this.remainingTime <= 0) return;

        this.isRunning = true;
        if (this.startBtn) {
            this.startBtn.textContent = 'Pause';
            this.startBtn.classList.add('btn-pause');
        }

        if (this.pausedTime) {
            this.startTime = Date.now() - (this.initialTime - this.remainingTime);
        } else {
            this.startTime = Date.now() - (this.initialTime - this.remainingTime);
        }

        this.interval = setInterval(() => {
            const currentTime = Date.now();
            this.remainingTime = Math.max(this.initialTime - (currentTime - this.startTime), 0);

            if (this.remainingTime === 0) {
                this.completePhase();
            } else {
                this.updateDisplay();
                this.updateProgress(this.remainingTime / this.initialTime);
            }
        }, 100);
    }

    pauseTimer() {
        this.isRunning = false;
        this.pausedTime = Date.now();
        clearInterval(this.interval);
        if (this.startBtn) {
            this.startBtn.textContent = 'Resume';
            this.startBtn.classList.remove('btn-pause');
        }
    }

    skipPhase() {
        this.completePhase();
    }

    completePhase() {
        clearInterval(this.interval);
        this.isRunning = false;
        this.startTime = null;
        this.pausedTime = null;
        
        if (this.startBtn) {
            this.startBtn.textContent = 'Start';
            this.startBtn.classList.remove('btn-pause');
        }

        if (this.currentPhase === 'work') {
            this.completedPomodoros++;
            this.totalFocusTime += this.settings.workDuration;
            this.currentStreak++;
            this.updateStats();

            // NEW: Save progress data for tracking
            this.saveProgressData();

            if (this.completedPomodoros % this.settings.pomodorosUntilLongBreak === 0) {
                this.pendingPhase = 'longBreak';
            } else {
                this.pendingPhase = 'shortBreak';
            }
            
            // Start quiz instead of going immediately to break
            this.startQuiz();
            return;
        } else {
            this.currentPhase = 'work';
            this.remainingTime = this.settings.workDuration * 60 * 1000;
        }

        this.applyPhaseChange();
    }

    applyPhaseChange() {
        if (this.pendingPhase) {
            this.currentPhase = this.pendingPhase;
            this.remainingTime = this.settings[this.pendingPhase] * 60 * 1000;
            this.pendingPhase = null;
        }
        
        this.initialTime = this.remainingTime;
        this.updateDisplay();
        this.updateProgress(1);
        this.updatePhaseDisplay();
        this.playNotificationSound();
        this.showNotification(`${this.currentPhase === 'work' ? 'Work Time' : 'Break Time'} - Let's go!`);
    }

    // QUIZ LOGIC
    async startQuiz() {
        if (!this.quizModal) {
            this.applyPhaseChange();
            return;
        }
        
        const topic = this.studyTopicInput ? this.studyTopicInput.value.trim() : 'General Knowledge';
        const finalTopic = topic === '' ? 'General Knowledge' : topic;
        
        // Reset quiz state
        this.quizData = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        
        // UI changes
        this.quizModal.classList.add('show');
        this.quizLoading.style.display = 'flex';
        this.quizContainer.style.display = 'none';
        this.quizSummary.style.display = 'none';
        
        try {
            const response = await fetch('/api/quiz/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    topic: finalTopic,
                    count: 5
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.quiz && data.quiz.length > 0) {
                this.quizData = data.quiz;
                this.quizLoading.style.display = 'none';
                this.quizContainer.style.display = 'block';
                this.renderQuestion();
            } else {
                this.showNotification(data.message || 'Failed to generate quiz. Skipping to break.');
                this.endQuiz();
            }
        } catch (error) {
            console.error('Quiz generation error:', error);
            this.showNotification('Network error while generating quiz.');
            this.endQuiz();
        }
    }
    
    renderQuestion() {
        if (this.currentQuestionIndex >= this.quizData.length) {
            this.showQuizSummary();
            return;
        }
        
        const q = this.quizData[this.currentQuestionIndex];
        this.quizProgress.textContent = `Question ${this.currentQuestionIndex + 1}/${this.quizData.length}`;
        this.quizQuestion.textContent = q.question;
        
        this.quizOptions.innerHTML = '';
        this.nextQuestionBtn.disabled = true;
        
        q.options.forEach((optText, idx) => {
            const optDiv = document.createElement('div');
            optDiv.className = 'quiz-option';
            optDiv.textContent = optText;
            
            optDiv.addEventListener('click', () => {
                // Remove selected from all
                Array.from(this.quizOptions.children).forEach(c => c.classList.remove('selected'));
                // Add selected to this
                optDiv.classList.add('selected');
                this.userAnswers[this.currentQuestionIndex] = idx;
                this.nextQuestionBtn.disabled = false;
            });
            
            this.quizOptions.appendChild(optDiv);
        });
        
        if (this.currentQuestionIndex === this.quizData.length - 1) {
            this.nextQuestionBtn.textContent = 'Finish';
        } else {
            this.nextQuestionBtn.textContent = 'Next';
        }
    }
    
    handleNextQuestion() {
        if (this.userAnswers[this.currentQuestionIndex] === undefined) return;
        
        this.currentQuestionIndex++;
        this.renderQuestion();
    }
    
    showQuizSummary() {
        this.quizContainer.style.display = 'none';
        this.quizSummary.style.display = 'block';
        
        let correctCount = 0;
        const reviewContainer = document.getElementById('quiz-review');
        reviewContainer.innerHTML = '';
        
        this.quizData.forEach((q, idx) => {
            const userAns = this.userAnswers[idx];
            const isCorrect = userAns === q.correctAnswer;
            
            if (isCorrect) correctCount++;
            
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            
            reviewItem.innerHTML = `
                <div class="review-q">${idx + 1}. ${q.question}</div>
                <div class="review-a" style="color: ${isCorrect ? '#28a745' : '#dc3545'}">
                    Your Answer: ${userAns !== undefined ? q.options[userAns] : 'None'} 
                    ${isCorrect ? '✅' : '❌'}
                </div>
                ${!isCorrect ? `<div class="review-a">Correct Answer: ${q.options[q.correctAnswer]}</div>` : ''}
                <div class="review-exp">${q.explanation}</div>
            `;
            
            reviewContainer.appendChild(reviewItem);
        });
        
        document.getElementById('score-value').textContent = correctCount;
        document.querySelector('.score-total').textContent = `/ ${this.quizData.length}`;
        
        const scoreMsg = document.getElementById('score-message');
        const percentage = correctCount / this.quizData.length;
        if (percentage === 1) scoreMsg.textContent = 'Perfect score! Outstanding work!';
        else if (percentage >= 0.8) scoreMsg.textContent = 'Great job! You really know this topic.';
        else if (percentage >= 0.6) scoreMsg.textContent = 'Good effort. Keep studying!';
        else scoreMsg.textContent = 'Use this as a learning opportunity and review the answers below.';
    }
    
    endQuiz() {
        if (this.quizModal) {
            this.quizModal.classList.remove('show');
        }
        this.applyPhaseChange();
    }

    // NEW METHOD: Save progress data
    saveProgressData() {
        try {
            // Check if the storage utility exists
            if (typeof saveTodayProgress === 'function') {
                saveTodayProgress(this.completedPomodoros, this.totalFocusTime);
            }
        } catch (e) {
            this.showNotification('Unable to save progress data');
        }
    }

    updateDisplay() {
        if (!this.display) return;
        
        const totalSeconds = Math.ceil(this.remainingTime / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        this.display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    updateProgress(progress) {
        if (!this.progressRing) return;
        
        const offset = this.circumference - (progress * this.circumference);
        this.progressRing.style.strokeDashoffset = offset;
    }

    updatePhaseDisplay() {
        if (!this.phaseDisplay) return;
        
        const phaseText = this.currentPhase === 'work' ? 'Work Time' :
                         this.currentPhase === 'shortBreak' ? 'Short Break' : 'Long Break';
        this.phaseDisplay.textContent = phaseText;
    }

    updateStats() {
        if (this.completedPomodorosDisplay) {
            this.completedPomodorosDisplay.textContent = this.completedPomodoros;
        }
        if (this.totalFocusTimeDisplay) {
            this.totalFocusTimeDisplay.textContent = this.formatFocusTime(this.totalFocusTime);
        }
        if (this.currentStreakDisplay) {
            this.currentStreakDisplay.textContent = this.currentStreak;
        }

        // Save stats
        try {
            localStorage.setItem('pomodoroStats', JSON.stringify({
                completedPomodoros: this.completedPomodoros,
                totalFocusTime: this.totalFocusTime,
                currentStreak: this.currentStreak
            }));
        } catch (e) {
            this.showNotification('Unable to save timer stats');
        }
    }

    formatFocusTime(minutes) {
        if (minutes < 60) {
            return `${minutes} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
        }
    }

    loadYoutubeVideo() {
        if (!this.youtubeInput || !this.youtubeContainer) return;
        
        const url = this.youtubeInput.value;
        const videoId = this.extractVideoId(url);
        
        if (videoId) {
            this.youtubeContainer.innerHTML = `
                <iframe
                    id="youtube-player"
                    src="https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&controls=1"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                ></iframe>
            `;
            this.youtubeContainer.classList.add('active');
            this.initializeYouTubeAPI();
        } else {
            this.showNotification('Invalid YouTube URL');
        }
    }

    initializeYouTubeAPI() {
        if (typeof YT !== 'undefined' && YT.Player) {
            this.createYouTubePlayer();
        } else {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = () => this.createYouTubePlayer();
        }
    }

    createYouTubePlayer() {
        const playerElement = document.getElementById('youtube-player');
        if (playerElement) {
            this.player = new YT.Player('youtube-player', {
                events: {
                    onReady: (event) => {
                        const initialVolume = this.volumeSlider ? parseInt(this.volumeSlider.value) : 50;
                        event.target.setVolume(initialVolume);
                    }
                }
            });
        }
    }

    updateVolume(value) {
        const volumeLevel = Math.floor(Number(value));
        if (this.player && typeof this.player.setVolume === 'function') {
            this.player.setVolume(volumeLevel);
        }
    }

    extractVideoId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    showNotification(message) {
        if (!this.notification) {
            return;
        }

        this.notification.textContent = message;
        this.notification.classList.add('show');

        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }
    
    playNotificationSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PurWYcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DstmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BeGQc+ltryxnMpBSl+zPLaizsIGGS57OihUBELTKXh765qHgU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zd77lxJAUuhM/z1YU2Bxtqvu7mnEoODlOq5vCzYRoGPJPY88p2KwUme8rx3I4+CRZiturqpVITC0mi4O+ybSAFM4nU89GAPAYeb8Lv45xMDw9WrOfte2IdBiqDz/PXiDkHGWe87emjURIKSqPg77FtIAUxiNPz04Q+Bhxswe/mnk4PD1Sp5PC1YxwGOpDY89F6LgUkedDy3pJCChVfsOnrrFcXCEGa3vC8dSYFL4PP89qLPQcZar7u6KBQEAxQp+TxuGYeBjqQ2PPTfDAFI3fO8uCWRgsUXLLo7a5aGQdAlN3wvngnBS2BzvPcjz8HF2i87+qjUxEMTaTi8LVpIAY3jdbz1oM0BSBxze/kmEoOElqw6O+xXRoGPZjb8MF8KQUrgc3z3pJCChVesenrsF4cBzWL1fPYhjcGH27C7+adTQ8OVKrk8bdnHwY4j9fz1X8yBSF3zPLimUwOEVeu5/CzYBwGN4zW89qJOwYba8Dv6KFQEQxPpuPwtmsgBTaJ1PPahzgGHmzB7+ihUBEMTqXj8LdoIAU2i9Tz2ok6BhpswO/po1IRDEyl4/C4ayAFNYrV89qKOgYabcDv6aJREQxLpePwuGwgBTaL1fPaiToGGmzA7+mjUhEMTKXj8LhrIAU1itXz2oo6BhptwO/polERDEul4/C4bCAFNovV89qJOgYabMDv6aNSEQxMpePwuGsgBTWK1fPaijoGGm3A7+miUREMS6Xj8LhsIAU2i9Xz2ok6BhpswO/po1IRDEyl4/C4ayAFNYrV89qKOgYabcDv6aJREQxLpePwuGwgBTaL1fPaiToGGmzA7+mjUhEMTKXj8LhrIAU1itXz2oo6BhptwO/polERDEul4/C4bCAFNovV89qJOgYabMDv6aNSEQxMpePwuGsgBTWK1fPaijoGGm3A7+miUREMS6Xj8LhsIAU2i9Xz2ok6BhpswO/po1IRDEyl4/C4ayAFNYrV89qKOgYabcDv6aJREQxLpePwuGwgBTaL1fPaiToGGmzA7+mjUhEMTKXj8LhrIAU1itXz2oo6BhptwO/polERDEul');
        audio.play();
    }
}

// Feedback button ripple effect
document.addEventListener('DOMContentLoaded', () => {
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
            ripple.style.left = `${e.clientX - e.target.getBoundingClientRect().left}px`;
            ripple.style.top = `${e.clientY - e.target.getBoundingClientRect().top}px`;

            feedbackLink.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    }

    // Add ripple animation
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

    // Initialize the timer
    window.timer = new PomodoroTimer();

});

// Create a back button for the fullscreen timer mode
document.addEventListener('DOMContentLoaded', function() {
    const backBtn = document.createElement('button');
    backBtn.id = 'backBtn';
    backBtn.innerHTML = '&larr;';
    backBtn.setAttribute('aria-label', 'Back to normal view');
    backBtn.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 10001;
        height: 44px;
        width: 44px;
        border-radius: 50%;
        background-color: rgba(0, 157, 255, 0.3);
        color: white;
        border: 2px solid var(--primary-color);
        font-size: 20px;
        cursor: pointer;
        display: none;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    `;
    
    document.body.appendChild(backBtn);
    
    // Show back button when in timer mode
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                if (document.body.classList.contains('timer-active')) {
                    backBtn.style.display = 'flex';
                } else {
                    backBtn.style.display = 'none';
                }
            }
        });
    });
    
    observer.observe(document.body, { attributes: true });
    
    // Exit fullscreen timer mode when back button is clicked
    backBtn.addEventListener('click', function() {
        if (window.timer && window.timer.isRunning) {
            window.timer.pauseTimer();
        }
        document.body.classList.remove('timer-active');
    });
});