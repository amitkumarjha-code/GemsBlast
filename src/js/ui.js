/* ==========================================================================
   GemsBlast Game - User Interface Management
   ========================================================================== */

/**
 * Game UI class managing all user interface interactions
 */
class GameUI {
    constructor(game) {
        this.game = game;

        // UI elements
        this.elements = {};
        this.modals = {};

        // Animation states
        this.animations = new Map();

        // Initialize UI
        this.initializeElements();
        this.setupEventListeners();
        this.updateDisplay();
    }

    /**
     * Initialize UI elements
     */
    initializeElements() {
        // Header elements
        this.elements.scoreValue = document.getElementById('score-value');
        this.elements.timerDisplay = document.getElementById('timer-display');
        this.elements.movesDisplay = document.getElementById('moves-display');
        this.elements.objectiveDisplay = document.getElementById('objective-display');
        this.elements.progressFill = document.getElementById('progress-fill');
        this.elements.progressText = document.getElementById('progress-text');

        // Control buttons
        this.elements.pauseBtn = document.getElementById('pause-btn');
        this.elements.hintBtn = document.getElementById('hint-btn');
        this.elements.shuffleBtn = document.getElementById('shuffle-btn');
        this.elements.restartBtn = document.getElementById('restart-btn');
        this.elements.sfxToggleBtn = document.getElementById('sfx-toggle-btn');
        this.elements.musicToggleBtn = document.getElementById('music-toggle-btn');

        // Tool buttons
        this.elements.rocketTool = document.getElementById('rocket-tool');
        this.elements.timeTool = document.getElementById('time-tool');
        this.elements.gloveTool = document.getElementById('glove-tool');
        this.elements.arrowTool = document.getElementById('arrow-tool');

        // Modal elements
        this.modals.overlay = document.getElementById('modal-overlay');
        this.modals.pause = document.getElementById('pause-modal');
        this.modals.gameOver = document.getElementById('game-over-modal');
        this.modals.modeSelection = document.getElementById('mode-selection-modal');
        this.modals.levelSelection = document.getElementById('level-selection-modal');

        // Modal buttons
        this.elements.resumeBtn = document.getElementById('resume-btn');
        this.elements.restartGameBtn = document.getElementById('restart-game-btn');
        this.elements.mainMenuBtn = document.getElementById('main-menu-btn');
        this.elements.nextLevelBtn = document.getElementById('next-level-btn');
        this.elements.replayLevelBtn = document.getElementById('replay-level-btn');
        this.elements.levelMenuBtn = document.getElementById('level-menu-btn');
        this.elements.showLevelsBtn = document.getElementById('show-levels-btn');
        this.elements.closeLevelSelectBtn = document.getElementById('close-level-select-btn');

        // Level selection elements
        this.elements.levelGrid = document.getElementById('level-grid');
        this.elements.totalStarsDisplay = document.getElementById('total-stars-display');
        this.elements.levelsCompletedDisplay = document.getElementById('levels-completed-display');

        // Mode selection cards
        this.elements.modeCards = document.querySelectorAll('.mode-card');

        // Results elements
        this.elements.gameResultTitle = document.getElementById('game-result-title');
        this.elements.finalScore = document.getElementById('final-score');
        this.elements.starRating = document.getElementById('star-rating');
    }

    /**
     * Setup event listeners for UI interactions
     */
    setupEventListeners() {
        // Control buttons
        if (this.elements.pauseBtn) {
            this.elements.pauseBtn.addEventListener('click', () => {
                this.playSound(SoundEffect.BUTTON_CLICK);
                this.game.pauseGame();
            });
        }

        if (this.elements.hintBtn) {
            this.elements.hintBtn.addEventListener('click', () => {
                this.playSound(SoundEffect.BUTTON_CLICK);
                this.game.showHint();
            });
        }

        if (this.elements.shuffleBtn) {
            this.elements.shuffleBtn.addEventListener('click', () => {
                this.playSound(SoundEffect.BUTTON_CLICK);
                this.game.shuffleBoard();
            });
        }

        if (this.elements.restartBtn) {
            this.elements.restartBtn.addEventListener('click', () => {
                this.playSound(SoundEffect.BUTTON_CLICK);
                this.confirmRestart();
            });
        }

        // Audio control buttons
        if (this.elements.sfxToggleBtn) {
            this.elements.sfxToggleBtn.addEventListener('click', () => {
                if (this.game.audioManager) {
                    const muted = this.game.audioManager.toggleSFXMute();
                    this.elements.sfxToggleBtn.textContent = muted ? '🔇' : '🔊';
                    this.elements.sfxToggleBtn.title = muted ? 'Unmute Sound Effects' : 'Mute Sound Effects';
                }
            });

            // Set initial state
            if (this.game.audioManager && this.game.audioManager.sfxMuted) {
                this.elements.sfxToggleBtn.textContent = '🔇';
            }
        }

        if (this.elements.musicToggleBtn) {
            this.elements.musicToggleBtn.addEventListener('click', () => {
                if (this.game.audioManager) {
                    const muted = this.game.audioManager.toggleMusicMute();
                    this.elements.musicToggleBtn.textContent = muted ? '🔇' : '🎵';
                    this.elements.musicToggleBtn.title = muted ? 'Unmute Music' : 'Mute Music';
                }
            });

            // Set initial state
            if (this.game.audioManager && this.game.audioManager.musicMuted) {
                this.elements.musicToggleBtn.textContent = '🔇';
            }
        }

        // Modal buttons
        if (this.elements.resumeBtn) {
            this.elements.resumeBtn.addEventListener('click', () => this.game.resumeGame());
        }

        // Settings button in header
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }

        // Settings modal event listeners
        this.setupSettingsListeners();

        // Statistics button in pause menu
        const statsBtn = document.getElementById('stats-btn');
        if (statsBtn) {
            statsBtn.addEventListener('click', () => {
                this.showStatisticsModal();
            });
        }

        // Statistics modal buttons
        const closeStatsBtn = document.getElementById('close-stats-btn');
        if (closeStatsBtn) {
            closeStatsBtn.addEventListener('click', () => {
                this.hideStatisticsModal();
            });
        }

        const resetStatsBtn = document.getElementById('reset-stats-btn');
        if (resetStatsBtn) {
            resetStatsBtn.addEventListener('click', () => {
                this.resetStatistics();
            });
        }

        if (this.elements.restartGameBtn) {
            this.elements.restartGameBtn.addEventListener('click', () => {
                this.hideAllModals();
                this.game.restartLevel();
            });
        }

        if (this.elements.nextLevelBtn) {
            this.elements.nextLevelBtn.addEventListener('click', () => {
                this.hideAllModals();

                // Load next level if using level system
                if (this.game.levelManager && this.game.levelManager.currentLevel) {
                    const nextLevelNum = this.game.levelManager.currentLevel.number + 1;
                    const nextLevel = this.game.levelManager.getLevel(nextLevelNum);

                    if (nextLevel && nextLevel.isUnlocked(this.game.levelManager.progress)) {
                        this.selectLevel(nextLevel);
                    } else {
                        // Show level selection if next level doesn't exist or is locked
                        this.showLevelSelectionModal();
                    }
                } else {
                    // Fallback to old behavior
                    this.game.nextLevel();
                }
            });
        }

        if (this.elements.replayLevelBtn) {
            this.elements.replayLevelBtn.addEventListener('click', () => {
                this.hideAllModals();
                this.game.restartLevel();
            });
        }

        // Tool buttons (power-ups)
        if (this.elements.rocketTool) {
            this.elements.rocketTool.addEventListener('click', () => this.usePowerUp(PowerUpType.HAMMER));
        }

        if (this.elements.timeTool) {
            this.elements.timeTool.addEventListener('click', () => this.usePowerUp(PowerUpType.SHUFFLE));
        }

        if (this.elements.gloveTool) {
            this.elements.gloveTool.addEventListener('click', () => this.usePowerUp(PowerUpType.COLOR_BOMB));
        }

        if (this.elements.arrowTool) {
            this.elements.arrowTool.addEventListener('click', () => this.usePowerUp(PowerUpType.EXTRA_MOVES));
        }

        // Power-up help button
        const powerupHelpBtn = document.getElementById('powerup-help-btn');
        if (powerupHelpBtn) {
            powerupHelpBtn.addEventListener('click', () => {
                if (this.game.tutorial) {
                    this.game.tutorial.show('powerups');
                }
            });
        }

        // Level selection buttons
        if (this.elements.showLevelsBtn) {
            this.elements.showLevelsBtn.addEventListener('click', () => {
                this.showLevelSelectionModal();
            });
        }

        if (this.elements.closeLevelSelectBtn) {
            this.elements.closeLevelSelectBtn.addEventListener('click', () => {
                this.hideLevelSelectionModal();
                this.showModeSelectionModal();
            });
        }

        // Mode selection cards
        if (this.elements.modeCards) {
            this.elements.modeCards.forEach(card => {
                card.addEventListener('click', () => {
                    const mode = card.getAttribute('data-mode');
                    this.selectGameMode(mode);
                });
            });
        }

        // Modal overlay click to close
        if (this.modals.overlay) {
            this.modals.overlay.addEventListener('click', (event) => {
                if (event.target === this.modals.overlay) {
                    this.hideAllModals();
                    this.game.resumeGame();
                }
            });
        }
    }

    /**
     * Select a game mode and start the game
     * @param {string} modeName - Name of the mode to select
     */
    selectGameMode(modeName) {
        // Get the selected limit type
        const limitTimeRadio = document.getElementById('limit-time');
        const limitMovesRadio = document.getElementById('limit-moves');

        let enableTimer = true;
        let enableMoves = false;

        if (limitMovesRadio && limitMovesRadio.checked) {
            enableTimer = false;
            enableMoves = true;
        } else if (limitTimeRadio && limitTimeRadio.checked) {
            enableTimer = true;
            enableMoves = false;
        }

        // Update game config
        this.game.config.enableTimer = enableTimer;
        this.game.config.enableMoves = enableMoves;

        if (this.game.setGameMode(modeName)) {
            this.hideModeSelectionModal();
            this.game.startGame();
        }
    }

    /**
     * Show mode selection modal
     */
    showModeSelectionModal() {
        if (this.modals.modeSelection && this.modals.overlay) {
            this.modals.modeSelection.classList.remove('hidden');
            this.modals.overlay.classList.remove('hidden');
        }
    }

    /**
     * Hide mode selection modal
     */
    hideModeSelectionModal() {
        if (this.modals.modeSelection && this.modals.overlay) {
            this.modals.modeSelection.classList.add('hidden');
            this.modals.overlay.classList.add('hidden');
        }
    }

    /**
     * Show level selection modal
     */
    showLevelSelectionModal() {
        if (this.modals.levelSelection && this.modals.overlay) {
            this.hideModeSelectionModal();
            this.renderLevelGrid();
            this.updateLevelProgress();
            this.modals.levelSelection.classList.remove('hidden');
            this.modals.overlay.classList.remove('hidden');
        }
    }

    /**
     * Hide level selection modal
     */
    hideLevelSelectionModal() {
        if (this.modals.levelSelection) {
            this.modals.levelSelection.classList.add('hidden');
        }
    }

    /**
     * Render level grid
     */
    renderLevelGrid() {
        if (!this.elements.levelGrid || !this.game.levelManager) return;

        this.elements.levelGrid.innerHTML = '';
        const levels = this.game.levelManager.levels;
        const progress = this.game.levelManager.progress;

        levels.forEach(level => {
            const levelCard = this.createLevelCard(level, progress);
            this.elements.levelGrid.appendChild(levelCard);
        });
    }

    /**
     * Create a level card element
     * @param {Level} level - Level data
     * @param {Object} progress - Player progress
     * @returns {HTMLElement}
     */
    createLevelCard(level, progress) {
        const card = document.createElement('div');
        const isUnlocked = level.isUnlocked(progress);
        const levelProgress = progress.levels[level.number] || {};

        card.className = `level-card ${!isUnlocked ? 'locked' : ''}`;

        // Mode icon
        const modeIcons = {
            classic: '⭐',
            plates: '🟨',
            palette: '💎',
            stargazer: '🌟'
        };

        const modeIcon = document.createElement('div');
        modeIcon.className = 'level-mode-icon';
        modeIcon.textContent = modeIcons[level.mode] || '⭐';
        card.appendChild(modeIcon);

        // Level number
        const levelNum = document.createElement('div');
        levelNum.className = 'level-number';
        levelNum.textContent = level.number;
        card.appendChild(levelNum);

        // Level name
        const levelName = document.createElement('div');
        levelName.className = 'level-name';
        levelName.textContent = level.name;
        card.appendChild(levelName);

        // Difficulty badge
        const difficulty = document.createElement('div');
        difficulty.className = `level-difficulty ${level.difficulty}`;
        difficulty.textContent = level.difficulty;
        card.appendChild(difficulty);

        // Stars (if unlocked)
        if (isUnlocked) {
            const stars = document.createElement('div');
            stars.className = 'level-stars';
            const earnedStars = levelProgress.stars || 0;

            for (let i = 1; i <= 3; i++) {
                const star = document.createElement('span');
                star.className = i <= earnedStars ? 'star' : 'star empty';
                star.textContent = '★';
                stars.appendChild(star);
            }
            card.appendChild(stars);

            // Best score (if completed)
            if (levelProgress.bestScore) {
                const bestScore = document.createElement('div');
                bestScore.className = 'level-best-score';
                bestScore.textContent = `Best: ${Utils.formatScore(levelProgress.bestScore)}`;
                card.appendChild(bestScore);
            }

            // Click handler
            card.addEventListener('click', () => {
                this.selectLevel(level);
            });
        } else {
            // Lock icon for locked levels
            const lockIcon = document.createElement('div');
            lockIcon.className = 'level-lock-icon';
            lockIcon.textContent = '🔒';
            card.appendChild(lockIcon);
        }

        return card;
    }

    /**
     * Select a level to play
     * @param {Level} level - Selected level
     */
    selectLevel(level) {
        if (this.game.levelManager.setCurrentLevel(level.number)) {
            // Set game mode
            this.game.setGameMode(level.mode);

            // Configure game with level settings
            const config = level.getGameConfig();
            if (this.game.currentGameMode) {
                // Apply level-specific configuration
                this.game.currentGameMode.movesRemaining = config.moves;
            }

            // Hide modals and start game
            this.hideLevelSelectionModal();
            this.hideAllModals();
            this.game.startGame();

            console.log(`Starting Level ${level.number}: ${level.name}`);
        }
    }

    /**
     * Update level progress display
     */
    updateLevelProgress() {
        if (!this.game.levelManager) return;

        const summary = this.game.levelManager.getProgressSummary();

        if (this.elements.totalStarsDisplay) {
            this.elements.totalStarsDisplay.textContent =
                `${summary.totalStars}/${summary.maxStars}`;
        }

        if (this.elements.levelsCompletedDisplay) {
            this.elements.levelsCompletedDisplay.textContent =
                `${summary.levelsCompleted}/${summary.totalLevels}`;
        }
    }

    /**
     * Play a sound effect
     * @param {string} soundName - Name of the sound effect
     */
    playSound(soundName) {
        if (this.game.audioManager) {
            this.game.audioManager.playSFX(soundName);
        }
    }

    /**
     * Update all UI displays
     */
    updateDisplay() {
        this.updateScore();
        this.updateTimer();
        this.updateMoves();
        this.updateObjectives();
        this.updateProgress();
        this.updateTools();
    }

    /**
     * Update score display
     */
    updateScore() {
        if (this.elements.scoreValue) {
            this.elements.scoreValue.textContent = Utils.formatScore(this.game.score);
        }
    }

    /**
     * Update timer display
     */
    updateTimer() {
        const timerContainer = document.querySelector('.timer-container');

        if (this.game.config.enableTimer) {
            // Show timer
            if (timerContainer) {
                timerContainer.style.display = 'flex';
            }

            if (this.elements.timerDisplay) {
                this.elements.timerDisplay.textContent = Utils.formatTime(this.game.timeRemaining);

                // Add warning class if time is low
                if (this.game.timeRemaining <= 30) {
                    this.elements.timerDisplay.classList.add('animate-timerWarning');
                } else {
                    this.elements.timerDisplay.classList.remove('animate-timerWarning');
                }
            }
        } else {
            // Hide timer
            if (timerContainer) {
                timerContainer.style.display = 'none';
            }
        }
    }

    /**
     * Update moves display
     */
    updateMoves() {
        const movesContainer = document.querySelector('.moves-container');

        if (this.game.config.enableMoves) {
            // Show moves
            if (movesContainer) {
                movesContainer.style.display = 'flex';
            }

            if (this.elements.movesDisplay) {
                this.elements.movesDisplay.textContent = this.game.moves;

                // Add warning class if moves are low
                if (this.game.moves <= 5) {
                    this.elements.movesDisplay.classList.add('animate-timerWarning');
                } else {
                    this.elements.movesDisplay.classList.remove('animate-timerWarning');
                }
            }
        } else {
            // Hide moves
            if (movesContainer) {
                movesContainer.style.display = 'none';
            }
        }
    }

    /**
     * Update objectives display with game mode data
     * @param {Object} progress - Progress object from game mode
     */
    updateObjectives(progress) {
        if (!progress) return;

        // Update moves display with color coding
        if (this.elements.movesDisplay && progress.moves !== undefined) {
            this.elements.movesDisplay.textContent = progress.moves;

            // Color code based on remaining moves
            const movesDisplay = this.elements.movesDisplay.parentElement;
            if (movesDisplay) {
                movesDisplay.classList.remove('moves-low', 'moves-critical');
                if (progress.moves <= 5 && progress.moves > 2) {
                    movesDisplay.classList.add('moves-low');
                } else if (progress.moves <= 2) {
                    movesDisplay.classList.add('moves-critical');
                }
            }
        }

        // Update objectives with individual progress bars
        if (this.elements.objectiveDisplay && progress.objectives) {
            let objectiveHTML = '';

            progress.objectives.forEach(obj => {
                const icon = obj.icon || '💎';
                const percentage = obj.target > 0 ? Math.min(100, (obj.current / obj.target) * 100) : 0;
                const isComplete = obj.current >= obj.target;

                objectiveHTML += `
                    <div class="objective-item ${isComplete ? 'objective-complete' : ''}">
                        <div class="objective-header">
                            <span class="objective-icon">${icon}</span>
                            <span class="objective-text">${obj.description}</span>
                            <span class="objective-count">${obj.current}/${obj.target}</span>
                        </div>
                        <div class="objective-progress-bar">
                            <div class="objective-progress-fill ${isComplete ? 'complete' : ''}" 
                                 style="width: ${percentage}%">
                                <span class="objective-percentage">${Math.round(percentage)}%</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            this.elements.objectiveDisplay.innerHTML = objectiveHTML;
        }

        // Update progress bar
        if (this.elements.progressFill && this.elements.progressText && progress.objectives) {
            let totalCurrent = 0;
            let totalTarget = 0;

            progress.objectives.forEach(obj => {
                totalCurrent += obj.current;
                totalTarget += obj.target;
            });

            const percentage = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
            this.elements.progressFill.style.width = `${Math.min(100, percentage)}%`;
            this.elements.progressText.textContent = `${totalCurrent} / ${totalTarget} completed`;

            // Add color coding for overall progress
            this.elements.progressFill.classList.remove('progress-low', 'progress-medium', 'progress-high');
            if (percentage < 33) {
                this.elements.progressFill.classList.add('progress-low');
            } else if (percentage < 66) {
                this.elements.progressFill.classList.add('progress-medium');
            } else {
                this.elements.progressFill.classList.add('progress-high');
            }
        }
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        if (this.elements.progressFill && this.elements.progressText) {
            let totalProgress = 0;
            let totalObjectives = 0;

            for (const key in this.game.objectives) {
                totalProgress += this.game.progress[key] || 0;
                totalObjectives += this.game.objectives[key] || 0;
            }

            const percentage = totalObjectives > 0 ? (totalProgress / totalObjectives) * 100 : 0;

            this.elements.progressFill.style.width = `${percentage}%`;
            this.elements.progressText.textContent = `${totalProgress} / ${totalObjectives} collected`;

            // Animate progress increase
            if (percentage > 0) {
                this.elements.progressFill.classList.add('animate-pulse');
                setTimeout(() => {
                    this.elements.progressFill.classList.remove('animate-pulse');
                }, 400);
            }
        }
    }

    /**
     * Update tool displays
     */
    updateTools() {
        if (!this.game.powerUpManager) return;

        const inventory = this.game.powerUpManager.getInventoryStatus();

        // Map power-ups to tool buttons
        const toolMapping = {
            rocketTool: PowerUpType.HAMMER,
            timeTool: PowerUpType.SHUFFLE,
            gloveTool: PowerUpType.COLOR_BOMB,
            arrowTool: PowerUpType.EXTRA_MOVES
        };

        // Update tool button states
        Object.keys(toolMapping).forEach(toolKey => {
            const button = this.elements[toolKey];
            const powerUpType = toolMapping[toolKey];

            if (button) {
                const count = inventory[powerUpType] || 0;
                const countElement = button.querySelector('.tool-count');

                if (countElement) {
                    countElement.textContent = count;
                }

                // Enable/disable button based on count
                button.disabled = count <= 0;
            }
        });
    }

    /**
     * Use a power-up
     * @param {string} powerUpType - Type of power-up to use
     */
    usePowerUp(powerUpType) {
        if (!this.game.powerUpManager) return;

        const powerUp = this.game.powerUpManager.use(powerUpType, this.game);

        if (powerUp) {
            // Track power-up usage in statistics
            if (this.game.statisticsManager) {
                this.game.statisticsManager.recordPowerUpUsed(powerUpType);
            }

            // Update tool display
            this.updateTools();

            // Show activation message
            this.showNotification(`${powerUp.name} activated!`, 'success');
        } else {
            this.showNotification(`No ${powerUpType} available!`, 'error');
        }
    }

    /**
     * Animate score increase
     */
    animateScoreIncrease(points, combo = 0, multiplier = 1.0) {
        if (this.elements.scoreValue) {
            // Add animation class
            this.elements.scoreValue.classList.add('animate-scorePopup');

            // Create floating score text with multiplier info
            let scoreText = `+${Utils.formatScore(points)}`;
            if (multiplier > 1.0) {
                scoreText += ` (x${multiplier.toFixed(1)})`;
            }
            this.createFloatingText(scoreText, this.elements.scoreValue);

            // Remove animation class
            setTimeout(() => {
                this.elements.scoreValue.classList.remove('animate-scorePopup');
            }, 600);
        }
    }

    /**
     * Show combo text overlay
     */
    showComboText(combo, multiplier) {
        // Find or create combo display element
        let comboDisplay = document.getElementById('combo-display');
        if (!comboDisplay) {
            comboDisplay = document.createElement('div');
            comboDisplay.id = 'combo-display';
            comboDisplay.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 3rem;
                font-weight: bold;
                color: #FFD700;
                text-shadow: 0 0 20px rgba(255, 215, 0, 0.8),
                            0 0 40px rgba(255, 215, 0, 0.5);
                pointer-events: none;
                z-index: 9999;
                animation: comboText 0.6s ease-out;
            `;
            document.body.appendChild(comboDisplay);
        }

        // Update combo text
        const comboLevel = combo >= 5 ? 'MEGA' : combo >= 3 ? 'SUPER' : '';
        comboDisplay.innerHTML = `
            <div style="text-align: center;">
                <div style="font-size: 2rem; color: #FFA500;">${comboLevel} COMBO!</div>
                <div style="font-size: 3.5rem; margin: 10px 0;">${combo}x</div>
                <div style="font-size: 1.5rem; color: #FFEB3B;">×${multiplier.toFixed(1)} Score</div>
            </div>
        `;

        // Reset animation
        comboDisplay.style.animation = 'none';
        setTimeout(() => {
            comboDisplay.style.animation = 'comboText 0.6s ease-out';
        }, 10);
    }

    /**
     * Hide combo text overlay
     */
    hideComboText() {
        const comboDisplay = document.getElementById('combo-display');
        if (comboDisplay) {
            comboDisplay.style.animation = 'fadeOut 0.5s ease-out';
            setTimeout(() => {
                if (comboDisplay.parentNode) {
                    comboDisplay.parentNode.removeChild(comboDisplay);
                }
            }, 500);
        }
    }

    /**
     * Create floating text animation
     */
    createFloatingText(text, nearElement) {
        const floatingText = document.createElement('div');
        floatingText.textContent = text;
        floatingText.className = 'floating-score animate-scorePopup';
        floatingText.style.cssText = `
            position: absolute;
            color: #FFD700;
            font-weight: bold;
            font-size: 1.2rem;
            pointer-events: none;
            z-index: 1000;
        `;

        // Position near the element
        const rect = nearElement.getBoundingClientRect();
        floatingText.style.left = `${rect.left + rect.width / 2}px`;
        floatingText.style.top = `${rect.top}px`;

        document.body.appendChild(floatingText);

        // Remove after animation
        setTimeout(() => {
            if (floatingText.parentNode) {
                floatingText.parentNode.removeChild(floatingText);
            }
        }, 1000);
    }

    /**
     * Show timer warning
     */
    showTimerWarning() {
        if (this.elements.timerDisplay) {
            this.elements.timerDisplay.classList.add('animate-timerWarning');

            // Optional: Add screen flash or notification
            this.showNotification('Time is running out!', 'warning');
        }
    }

    /**
     * Show pause modal
     */
    showPauseModal() {
        this.showModal(this.modals.pause);
    }

    /**
     * Hide pause modal
     */
    hidePauseModal() {
        this.hideModal(this.modals.pause);
    }

    /**
     * Show level complete modal
     * @param {Object} levelCompletion - Level completion data from LevelManager
     */
    showLevelCompleteModal(levelCompletion = null) {
        if (this.elements.gameResultTitle) {
            this.elements.gameResultTitle.textContent = levelCompletion
                ? `Level ${levelCompletion.level} Complete!`
                : 'Level Complete!';
        }

        this.updateResultsModal(levelCompletion);
        this.showModal(this.modals.gameOver);
    }

    /**
     * Show game over modal
     */
    showGameOverModal() {
        if (this.elements.gameResultTitle) {
            this.elements.gameResultTitle.textContent = 'Game Over';
        }

        this.updateResultsModal();
        this.showModal(this.modals.gameOver);
    }

    /**
     * Update results modal content
     * @param {Object} levelCompletion - Level completion data
     */
    updateResultsModal(levelCompletion = null) {
        if (this.elements.finalScore) {
            this.elements.finalScore.textContent = Utils.formatScore(this.game.score);
            this.elements.finalScore.style.animation = 'scorePopup 0.8s ease-out';
        }

        // Update star rating based on level completion or performance
        if (this.elements.starRating) {
            const stars = levelCompletion ? levelCompletion.stars : this.calculateStarRating();
            this.updateStarDisplay(stars);

            // Show "New Best!" if player improved
            if (levelCompletion && levelCompletion.newStars && this.elements.starRating) {
                const newBest = document.createElement('div');
                newBest.textContent = '✨ New Best! ✨';
                newBest.style.cssText = `
                    color: #ffd700;
                    font-size: 1.2rem;
                    font-weight: bold;
                    margin-top: 0.5rem;
                    animation: victoryBounce 1s ease-in-out infinite;
                `;
                this.elements.starRating.appendChild(newBest);
            }
        }

        // Add victory/defeat animations
        if (this.game.state === GameState.LEVEL_COMPLETE || this.game.state === GameState.WON) {
            this.createConfettiEffect();
            if (this.elements.gameResultTitle) {
                this.elements.gameResultTitle.style.animation = 'victoryBounce 1s ease-in-out infinite';
            }
        } else if (this.game.state === GameState.GAME_OVER || this.game.state === GameState.LOST) {
            if (this.elements.gameResultTitle) {
                this.elements.gameResultTitle.style.animation = 'defeatShake 0.5s ease-in-out 3';
            }
        }

        // Show/hide next level button
        if (this.elements.nextLevelBtn) {
            const showNext = this.game.state === GameState.LEVEL_COMPLETE &&
                (!levelCompletion || levelCompletion.nextLevelUnlocked !== false);
            this.elements.nextLevelBtn.style.display = showNext ? 'block' : 'none';
        }
    }

    /**
     * Create confetti particle effect for victory
     */
    createConfettiEffect() {
        const colors = ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#9370DB', '#32CD32'];
        const confettiCount = 50;

        for (let i = 0; i < confettiCount; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.style.cssText = `
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    left: ${Math.random() * 100}vw;
                    top: -20px;
                    opacity: 1;
                    z-index: 10001;
                    transform: rotate(${Math.random() * 360}deg);
                    pointer-events: none;
                `;

                document.body.appendChild(confetti);

                // Animate confetti falling
                const duration = 2000 + Math.random() * 1000;
                const startTime = performance.now();

                const animate = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = elapsed / duration;

                    if (progress < 1) {
                        confetti.style.top = `${progress * 100}vh`;
                        confetti.style.transform = `rotate(${progress * 720}deg)`;
                        confetti.style.opacity = 1 - progress;
                        requestAnimationFrame(animate);
                    } else {
                        if (confetti.parentNode) {
                            confetti.parentNode.removeChild(confetti);
                        }
                    }
                };

                requestAnimationFrame(animate);
            }, i * 50);
        }
    }

    /**
     * Calculate star rating based on performance
     */
    calculateStarRating() {
        let stars = 1; // Minimum one star for completing

        if (this.game.state === GameState.LEVEL_COMPLETE) {
            // Additional stars based on time remaining and moves used
            if (this.game.timeRemaining > 60) stars++;
            if (this.game.moves > 10) stars++;
        }

        return Math.min(stars, 3);
    }

    /**
     * Update star display
     */
    updateStarDisplay(starCount) {
        if (this.elements.starRating) {
            const stars = this.elements.starRating.querySelectorAll('.star');
            stars.forEach((star, index) => {
                if (index < starCount) {
                    star.classList.add('active');
                    // Staggered star animation
                    star.style.animation = `starEarn 0.6s ease-out ${index * 0.3}s both`;
                } else {
                    star.classList.remove('active');
                    star.style.animation = 'none';
                }
            });
        }
    }

    /**
     * Show modal with animation
     */
    showModal(modal) {
        if (this.modals.overlay && modal) {
            this.modals.overlay.classList.remove('hidden');
            modal.classList.remove('hidden');

            // Trigger animation
            this.modals.overlay.classList.add('animate-fadeIn');
            modal.classList.add('animate-modalSlideIn');
        }
    }

    /**
     * Hide modal with animation
     */
    hideModal(modal) {
        if (this.modals.overlay && modal) {
            this.modals.overlay.classList.add('animate-fadeOut');
            modal.classList.add('animate-fadeOut');

            setTimeout(() => {
                this.modals.overlay.classList.add('hidden');
                modal.classList.add('hidden');
                this.modals.overlay.classList.remove('animate-fadeIn', 'animate-fadeOut');
                modal.classList.remove('animate-modalSlideIn', 'animate-fadeOut');
            }, 300);
        }
    }

    /**
     * Hide all modals
     */
    hideAllModals() {
        Object.values(this.modals).forEach(modal => {
            if (modal && modal !== this.modals.overlay) {
                this.hideModal(modal);
            }
        });
    }

    /**
     * Activate a tool
     */
    activateTool(toolType) {
        // Placeholder for tool activation (implement in Phase 5)
        console.log(`Activating tool: ${toolType}`);

        // Add visual feedback
        const button = this.elements[`${toolType}Tool`];
        if (button) {
            button.classList.add('tool-activate');
            setTimeout(() => {
                button.classList.remove('tool-activate');
            }, 300);
        }
    }

    /**
     * Confirm restart action
     */
    confirmRestart() {
        if (confirm('Are you sure you want to restart the level? Your progress will be lost.')) {
            this.game.restartLevel();
        }
    }

    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} animate-slideInDown`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--surface-color);
            color: var(--text-primary);
            padding: 1rem 2rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 2000;
            border: 2px solid var(--border-color);
        `;

        if (type === 'warning') {
            notification.style.borderColor = '#ff6b35';
            notification.style.background = 'rgba(255, 107, 53, 0.1)';
        } else if (type === 'success') {
            notification.style.borderColor = '#4ade80';
            notification.style.background = 'rgba(74, 222, 128, 0.1)';
        } else if (type === 'error') {
            notification.style.borderColor = '#f87171';
            notification.style.background = 'rgba(248, 113, 113, 0.1)';
        }

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('animate-slideInUp');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Show reward notification with power-up icons
     * @param {Array} rewards - Array of reward objects {type, amount, reason}
     */
    showRewardNotification(rewards) {
        if (!rewards || rewards.length === 0) return;

        const powerUpIcons = {
            hammer: '🔨',
            shuffle: '🔀',
            colorBomb: '💣',
            extraMoves: '➕',
            scoreBoost: '⭐'
        };

        const modal = document.createElement('div');
        modal.className = 'reward-modal animate-scaleIn';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--surface-color);
            color: var(--text-primary);
            padding: 2rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-xl);
            z-index: 2500;
            border: 3px solid #ffd700;
            max-width: 400px;
            text-align: center;
        `;

        const title = document.createElement('h2');
        title.textContent = '🎉 Rewards Earned! 🎉';
        title.style.cssText = `
            margin-bottom: 1.5rem;
            color: #ffd700;
            font-size: 1.5rem;
        `;
        modal.appendChild(title);

        const rewardList = document.createElement('div');
        rewardList.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 1.5rem;
        `;

        rewards.forEach(reward => {
            const rewardItem = document.createElement('div');
            rewardItem.className = 'animate-bounceIn';
            rewardItem.style.cssText = `
                background: rgba(255, 215, 0, 0.1);
                padding: 1rem;
                border-radius: 8px;
                border: 1px solid rgba(255, 215, 0, 0.3);
                display: flex;
                align-items: center;
                gap: 1rem;
            `;

            const icon = document.createElement('div');
            icon.textContent = powerUpIcons[reward.type] || '🎁';
            icon.style.cssText = `
                font-size: 2rem;
                animation: powerUpPulse 1s ease-in-out infinite;
            `;

            const details = document.createElement('div');
            details.style.textAlign = 'left';

            const powerUpName = reward.type.replace(/([A-Z])/g, ' $1').trim();
            const itemName = document.createElement('div');
            itemName.textContent = `${powerUpName} x${reward.amount}`;
            itemName.style.cssText = `
                font-weight: 600;
                font-size: 1.1rem;
                text-transform: capitalize;
            `;

            const reason = document.createElement('div');
            reason.textContent = reward.reason;
            reason.style.cssText = `
                color: var(--text-secondary);
                font-size: 0.9rem;
            `;

            details.appendChild(itemName);
            details.appendChild(reason);

            rewardItem.appendChild(icon);
            rewardItem.appendChild(details);
            rewardList.appendChild(rewardItem);

            // Add slight delay for each item animation
            setTimeout(() => {
                rewardItem.style.animationDelay = `${rewards.indexOf(reward) * 0.1}s`;
            }, 10);
        });

        modal.appendChild(rewardList);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Awesome!';
        closeBtn.className = 'btn btn-primary';
        closeBtn.style.cssText = `
            padding: 0.75rem 2rem;
            font-size: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            transition: transform 0.2s;
        `;
        closeBtn.onmouseover = () => closeBtn.style.transform = 'scale(1.05)';
        closeBtn.onmouseout = () => closeBtn.style.transform = 'scale(1)';
        closeBtn.onclick = () => {
            modal.classList.add('animate-scaleOut');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        };

        modal.appendChild(closeBtn);

        // Add overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 2400;
        `;
        overlay.onclick = closeBtn.onclick;

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        // Update power-up display after showing rewards
        setTimeout(() => {
            this.updateTools();
        }, 500);
    }

    /**
     * Show power-up activation visual effect
     * @param {PowerUp} powerUp - The activated power-up
     */
    showPowerUpActivation(powerUp) {
        // Create center screen effect
        const effect = document.createElement('div');
        effect.className = 'power-up-activation';
        effect.innerHTML = `
            <div class="power-up-icon">${powerUp.icon}</div>
            <div class="power-up-name">${powerUp.name}</div>
        `;
        effect.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 5000;
            animation: powerUpPulse 1s ease-out;
        `;

        const iconStyle = effect.querySelector('.power-up-icon');
        if (iconStyle) {
            iconStyle.style.cssText = `
                font-size: 4rem;
                margin-bottom: 1rem;
                animation: powerUpSpin 0.5s ease-out;
            `;
        }

        const nameStyle = effect.querySelector('.power-up-name');
        if (nameStyle) {
            nameStyle.style.cssText = `
                font-size: 1.5rem;
                color: var(--accent-color);
                font-weight: bold;
                text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
            `;
        }

        document.body.appendChild(effect);

        // Remove after animation
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 1000);
    }

    /**
     * Show loading state for async operations
     */
    showLoading(message = 'Loading...') {
        // Create or show loading overlay
        let loadingOverlay = document.getElementById('ui-loading-overlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.id = 'ui-loading-overlay';
            loadingOverlay.className = 'modal-overlay';
            loadingOverlay.innerHTML = `
                <div class="modal-content">
                    <div class="loading-spinner"></div>
                    <p>${message}</p>
                </div>
            `;
            document.body.appendChild(loadingOverlay);
        }

        loadingOverlay.classList.remove('hidden');
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('ui-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    /**
     * Update UI theme (for future customization)
     */
    updateTheme(themeName) {
        document.body.className = `theme-${themeName}`;
    }

    /**
     * Handle responsive design changes
     */
    handleResize() {
        // Adjust UI layout for different screen sizes
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            document.body.classList.add('mobile-layout');
        } else {
            document.body.classList.remove('mobile-layout');
        }
    }

    /**
     * Cleanup UI resources
     */
    cleanup() {
        // Clear any running animations
        this.animations.clear();

        // Remove dynamically created elements
        const dynamicElements = document.querySelectorAll('.floating-score, .notification, #ui-loading-overlay');
        dynamicElements.forEach(element => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        });
    }

    /**
     * Show statistics modal
     */
    showStatisticsModal() {
        if (!this.game.statisticsManager) return;

        const modal = document.getElementById('statistics-modal');
        const display = document.getElementById('statistics-display');

        if (!modal || !display) return;

        // Get formatted statistics
        const stats = this.game.statisticsManager.getFormattedStats();

        // Build statistics HTML
        let html = '';

        // Overall Stats Section
        html += '<div class="stats-section">';
        html += '<h3>🎮 Overall Statistics</h3>';
        html += '<div class="stats-grid">';
        html += `<div class="stat-item">
            <span class="stat-label">Games Played</span>
            <span class="stat-value highlight">${stats.gamesPlayed}</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-label">Games Won</span>
            <span class="stat-value success">${stats.gamesWon}</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-label">Win Rate</span>
            <span class="stat-value">${stats.winRate}</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-label">Total Score</span>
            <span class="stat-value highlight">${Utils.formatScore(stats.totalScore)}</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-label">Average Score</span>
            <span class="stat-value">${stats.averageScore}</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-label">Play Time</span>
            <span class="stat-value">${stats.playTime}</span>
        </div>`;
        html += '</div></div>';

        // Game Actions Section
        html += '<div class="stats-section">';
        html += '<h3>💎 Game Actions</h3>';
        html += '<div class="stats-grid">';
        html += `<div class="stat-item">
            <span class="stat-label">Total Matches</span>
            <span class="stat-value highlight">${stats.totalMatches}</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-label">Special Gems Created</span>
            <span class="stat-value success">${stats.specialGemsCreated}</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-label">Rockets</span>
            <span class="stat-value">🚀 ${stats.rockets}</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-label">Bombs</span>
            <span class="stat-value">💣 ${stats.bombs}</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-label">Rainbows</span>
            <span class="stat-value">🌈 ${stats.rainbows}</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-label">Power-Ups Used</span>
            <span class="stat-value warning">${stats.powerUpsUsed}</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-label">Max Combo</span>
            <span class="stat-value highlight">${stats.maxCombo}x</span>
        </div>`;
        html += '</div></div>';

        // Records Section
        html += '<div class="stats-section">';
        html += '<h3>🏆 Records</h3>';
        html += '<div class="stats-grid">';
        html += `<div class="stat-item">
            <span class="stat-label">Highest Score</span>
            <span class="stat-value highlight">${Utils.formatScore(stats.highestScore)}</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-label">Highest Level</span>
            <span class="stat-value success">Level ${stats.highestLevel}</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-label">Fastest Completion</span>
            <span class="stat-value">${stats.fastestTime}</span>
        </div>`;
        html += `<div class="stat-item">
            <span class="stat-label">Longest Combo</span>
            <span class="stat-value highlight">${stats.longestCombo}x</span>
        </div>`;
        html += '</div></div>';

        // Mode Stats Section
        const modeStats = this.game.statisticsManager.getAllStats().modes;
        if (modeStats && Object.keys(modeStats).length > 0) {
            html += '<div class="stats-section">';
            html += '<h3>🎯 Mode Statistics</h3>';
            html += '<table class="stats-table">';
            html += '<thead><tr><th>Mode</th><th>Wins</th><th>Games</th><th>Total Score</th></tr></thead>';
            html += '<tbody>';

            const modeNames = {
                classic: 'Classic Match',
                plates: 'Collector\'s Plates',
                palette: 'Palette Collection',
                stargazer: 'Stargazer'
            };

            for (const [mode, data] of Object.entries(modeStats)) {
                const name = modeNames[mode] || mode;
                html += `<tr>
                    <td>${name}</td>
                    <td>${data.wins}</td>
                    <td>${data.gamesPlayed}</td>
                    <td>${Utils.formatScore(data.totalScore)}</td>
                </tr>`;
            }
            html += '</tbody></table>';
            html += '</div>';
        }

        display.innerHTML = html;

        // Show modal
        this.modals.overlay.classList.remove('hidden');
        modal.classList.remove('hidden');
        this.playSound(SoundEffect.BUTTON_CLICK);
    }

    /**
     * Hide statistics modal
     */
    hideStatisticsModal() {
        const modal = document.getElementById('statistics-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.playSound(SoundEffect.BUTTON_CLICK);
        }

        // Check if any other modals are open
        const allModals = document.querySelectorAll('.modal');
        const anyVisible = Array.from(allModals).some(m => !m.classList.contains('hidden'));
        if (!anyVisible) {
            this.modals.overlay.classList.add('hidden');
        }
    }

    /**
     * Reset statistics with confirmation
     */
    resetStatistics() {
        if (!this.game.statisticsManager) return;

        const confirmed = confirm('Are you sure you want to reset all statistics? This cannot be undone.');

        if (confirmed) {
            this.game.statisticsManager.resetStats();
            this.showNotification('Statistics have been reset', 'success');
            this.hideStatisticsModal();
            this.playSound(SoundEffect.BUTTON_CLICK);
        }
    }

    /**
     * Setup settings modal event listeners
     */
    setupSettingsListeners() {
        // SFX Volume
        const sfxVolumeSlider = document.getElementById('sfx-volume');
        const sfxVolumeValue = document.getElementById('sfx-volume-value');
        if (sfxVolumeSlider && sfxVolumeValue) {
            sfxVolumeSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                sfxVolumeValue.textContent = value + '%';
                if (this.game.settingsManager) {
                    this.game.settingsManager.set('sfxVolume', value);
                    if (this.game.audioManager) {
                        this.game.audioManager.setSFXVolume(value / 100);
                    }
                }
            });
        }

        // Music Volume
        const musicVolumeSlider = document.getElementById('music-volume');
        const musicVolumeValue = document.getElementById('music-volume-value');
        if (musicVolumeSlider && musicVolumeValue) {
            musicVolumeSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                musicVolumeValue.textContent = value + '%';
                if (this.game.settingsManager) {
                    this.game.settingsManager.set('musicVolume', value);
                    if (this.game.audioManager) {
                        this.game.audioManager.setMusicVolume(value / 100);
                    }
                }
            });
        }

        // Animation Speed
        const animSpeedSlider = document.getElementById('animation-speed');
        const animSpeedValue = document.getElementById('animation-speed-value');
        if (animSpeedSlider && animSpeedValue) {
            animSpeedSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                animSpeedValue.textContent = value + '%';
                if (this.game.settingsManager) {
                    this.game.settingsManager.set('animationSpeed', value);
                }
            });
        }

        // Particle Effects Toggle
        const particleToggle = document.getElementById('particle-effects');
        if (particleToggle) {
            particleToggle.addEventListener('change', (e) => {
                if (this.game.settingsManager) {
                    this.game.settingsManager.set('particleEffects', e.target.checked);
                }
            });
        }

        // Screen Shake Toggle
        const shakeToggle = document.getElementById('screen-shake');
        if (shakeToggle) {
            shakeToggle.addEventListener('change', (e) => {
                if (this.game.settingsManager) {
                    this.game.settingsManager.set('screenShake', e.target.checked);
                }
            });
        }

        // Color-Blind Mode Toggle
        const colorblindToggle = document.getElementById('colorblind-mode');
        if (colorblindToggle) {
            colorblindToggle.addEventListener('change', (e) => {
                if (this.game.settingsManager) {
                    this.game.settingsManager.set('colorblindMode', e.target.checked);
                }
            });
        }

        // Board Theme Selector
        const boardThemeSelect = document.getElementById('board-theme');
        if (boardThemeSelect) {
            boardThemeSelect.addEventListener('change', (e) => {
                if (this.game.settingsManager) {
                    this.game.settingsManager.set('boardTheme', e.target.value);
                }
            });
        }

        // Close Settings Button
        const closeSettingsBtn = document.getElementById('close-settings-btn');
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => {
                this.hideSettingsModal();
            });
        }

        // Reset Settings Button
        const resetSettingsBtn = document.getElementById('reset-settings-btn');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }
    }

    /**
     * Show settings modal
     */
    showSettingsModal() {
        if (!this.game.settingsManager) return;

        const modal = document.getElementById('settings-modal');
        if (!modal) return;

        // Load current settings into UI
        const settings = this.game.settingsManager.getAll();

        const sfxVolumeSlider = document.getElementById('sfx-volume');
        const sfxVolumeValue = document.getElementById('sfx-volume-value');
        if (sfxVolumeSlider && sfxVolumeValue) {
            sfxVolumeSlider.value = settings.sfxVolume;
            sfxVolumeValue.textContent = settings.sfxVolume + '%';
        }

        const musicVolumeSlider = document.getElementById('music-volume');
        const musicVolumeValue = document.getElementById('music-volume-value');
        if (musicVolumeSlider && musicVolumeValue) {
            musicVolumeSlider.value = settings.musicVolume;
            musicVolumeValue.textContent = settings.musicVolume + '%';
        }

        const animSpeedSlider = document.getElementById('animation-speed');
        const animSpeedValue = document.getElementById('animation-speed-value');
        if (animSpeedSlider && animSpeedValue) {
            animSpeedSlider.value = settings.animationSpeed;
            animSpeedValue.textContent = settings.animationSpeed + '%';
        }

        const particleToggle = document.getElementById('particle-effects');
        if (particleToggle) {
            particleToggle.checked = settings.particleEffects;
        }

        const shakeToggle = document.getElementById('screen-shake');
        if (shakeToggle) {
            shakeToggle.checked = settings.screenShake;
        }

        const colorblindToggle = document.getElementById('colorblind-mode');
        if (colorblindToggle) {
            colorblindToggle.checked = settings.colorblindMode;
        }

        const boardThemeSelect = document.getElementById('board-theme');
        if (boardThemeSelect) {
            boardThemeSelect.value = settings.boardTheme;
        }

        // Show modal
        this.modals.overlay.classList.remove('hidden');
        modal.classList.remove('hidden');
        this.playSound(SoundEffect.BUTTON_CLICK);
    }

    /**
     * Hide settings modal
     */
    hideSettingsModal() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.playSound(SoundEffect.BUTTON_CLICK);
        }

        // Check if any other modals are open
        const allModals = document.querySelectorAll('.modal');
        const anyVisible = Array.from(allModals).some(m => !m.classList.contains('hidden'));
        if (!anyVisible) {
            this.modals.overlay.classList.add('hidden');
        }
    }

    /**
     * Reset settings to default
     */
    resetSettings() {
        if (!this.game.settingsManager) return;

        const confirmed = confirm('Reset all settings to default values?');

        if (confirmed) {
            const defaults = this.game.settingsManager.reset();

            // Update audio manager volumes
            if (this.game.audioManager) {
                this.game.audioManager.setSFXVolume(defaults.sfxVolume / 100);
                this.game.audioManager.setMusicVolume(defaults.musicVolume / 100);
            }

            // Refresh the settings modal display
            this.hideSettingsModal();
            this.showSettingsModal();

            this.showNotification('Settings reset to default', 'success');
            this.playSound(SoundEffect.BUTTON_CLICK);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameUI;
}