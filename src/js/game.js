/* ==========================================================================
   GemsBlast Game - Core Game Logic
   ========================================================================== */

/**
 * Game States Enumeration
 */
const GameState = {
    LOADING: 'loading',
    MENU: 'menu',
    MODE_SELECT: 'mode_select',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    LEVEL_COMPLETE: 'level_complete'
};

/**
 * Main game controller
 */
class GemsBlastGame {
    constructor() {
        this.state = GameState.LOADING;

        // Game elements
        this.canvas = null;
        this.board = null;
        this.ui = null;
        this.tutorial = null;
        this.powerUpManager = null;
        this.rewardSystem = null;
        this.levelManager = null;
        this.audioManager = null;
        this.statisticsManager = null;
        this.settingsManager = null;
        this.performanceMonitor = null;

        // Game mode system
        this.currentGameMode = null;
        this.availableGameModes = {
            classic: ClassicMode,
            plates: PlatesMode,
            palette: PaletteMode,
            stargazer: StargazerMode
        };

        // Game state
        this.score = 0;
        this.level = 1;
        this.gameRunning = false;

        // Combo system
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimeout = null;
        this.comboResetDelay = 2000; // ms before combo resets
        this.isAutoMatch = false; // Track if match is from cascading

        // Screen shake effect
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;

        // Game settings
        this.config = {
            boardWidth: 8,
            boardHeight: 8,
            targetScore: 1000,
            enableTimer: true,
            enableMoves: false,
            initialTime: 180, // 3 minutes default
            initialMoves: 30
        };

        // Game objectives
        this.objectives = {};
        this.progress = {};

        // Animation frame
        this.lastTime = 0;
        this.animationId = null;

        // Event listeners cleanup
        this.cleanupFunctions = [];

        // Initialize the game
        this.initialize();
    }

    /**
     * Initialize the game
     */
    async initialize() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize canvas
            this.canvas = document.getElementById('game-canvas');
            if (!this.canvas) {
                throw new Error('Game canvas not found');
            }

            // Initialize board
            this.board = new GameBoard(
                this.config.boardWidth,
                this.config.boardHeight,
                this.canvas
            );

            // Initialize UI
            this.ui = new GameUI(this);

            // Initialize tutorial system
            this.tutorial = new TutorialSystem();

            // Initialize power-up manager
            this.powerUpManager = new PowerUpManager();

            // Initialize level manager (if available)
            if (typeof LevelManager !== 'undefined') {
                this.levelManager = new LevelManager();
                console.log('Level Manager initialized:', this.levelManager.getProgressSummary());
            }

            // Initialize audio manager (if available)
            if (typeof AudioManager !== 'undefined') {
                this.audioManager = new AudioManager();
                console.log('Audio Manager initialized');
            }

            // Initialize settings manager (if available)
            if (typeof SettingsManager !== 'undefined') {
                this.settingsManager = new SettingsManager();

                // Apply volume settings to audio manager
                if (this.audioManager) {
                    this.audioManager.setSFXVolume(this.settingsManager.getSFXVolume());
                    this.audioManager.setMusicVolume(this.settingsManager.getMusicVolume());
                }

                console.log('Settings Manager initialized');
            }

            // Initialize statistics manager (if available)
            if (typeof StatisticsManager !== 'undefined') {
                this.statisticsManager = new StatisticsManager();
                console.log('Statistics Manager initialized');
            }

            // Initialize performance monitor (if available)
            if (typeof PerformanceMonitor !== 'undefined') {
                this.performanceMonitor = new PerformanceMonitor();
                // Enable in development mode (can be toggled with Ctrl+Shift+P)
                this.performanceMonitor.setEnabled(false);
                console.log('Performance Monitor initialized');
            }

            // Initialize reward system (if available)
            if (typeof RewardSystem !== 'undefined') {
                this.rewardSystem = new RewardSystem(this);

                // Check daily reward
                const dailyReward = this.rewardSystem.checkDailyReward();
                if (dailyReward) {
                    setTimeout(() => {
                        this.ui.showRewardNotification([dailyReward]);
                    }, 1000);
                }
            } else {
                console.warn('RewardSystem not available');
            }

            // Setup event listeners
            this.setupEventListeners();

            // Setup initial level
            this.setupLevel(this.level);

            // Hide loading screen and show game
            this.hideLoadingScreen();

            // Start game loop
            this.startGameLoop();

            console.log('GemsBlast Game initialized successfully');

        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to load game. Please refresh the page.');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Window resize
        const resizeHandler = () => this.handleResize();
        window.addEventListener('resize', resizeHandler);
        this.cleanupFunctions.push(() => window.removeEventListener('resize', resizeHandler));

        // Keyboard shortcuts
        const keyHandler = (event) => this.handleKeyPress(event);
        document.addEventListener('keydown', keyHandler);
        this.cleanupFunctions.push(() => document.removeEventListener('keydown', keyHandler));

        // Visibility change (pause when tab is hidden)
        const visibilityHandler = () => this.handleVisibilityChange();
        document.addEventListener('visibilitychange', visibilityHandler);
        this.cleanupFunctions.push(() => document.removeEventListener('visibilitychange', visibilityHandler));

        // Mobile-specific: Prevent pull-to-refresh and overscroll
        if (Utils.isTouchDevice()) {
            const preventPullToRefresh = (event) => {
                // Prevent pull-to-refresh on the game canvas and body
                if (event.target === this.canvas || event.target === document.body) {
                    event.preventDefault();
                }
            };

            document.body.addEventListener('touchmove', preventPullToRefresh, { passive: false });
            this.cleanupFunctions.push(() => document.body.removeEventListener('touchmove', preventPullToRefresh));

            // Prevent pinch-to-zoom on the canvas
            const preventPinchZoom = (event) => {
                if (event.touches && event.touches.length > 1) {
                    event.preventDefault();
                }
            };

            this.canvas.addEventListener('touchmove', preventPinchZoom, { passive: false });
            this.cleanupFunctions.push(() => this.canvas.removeEventListener('touchmove', preventPinchZoom));
        }
    }

    /**
     * Setup level configuration
     */
    setupLevel(levelNumber) {
        this.level = levelNumber;

        // Reset game state
        this.score = 0;

        // Randomize limits based on config
        if (this.config.enableMoves) {
            // Random move limit between 20-60
            this.moves = Math.floor(Math.random() * 41) + 20; // 20 to 60
            this.config.initialMoves = this.moves;
        } else {
            this.moves = this.config.initialMoves;
        }

        if (this.config.enableTimer) {
            // Random time limit between 60-120 seconds (1-2 minutes)
            this.timeRemaining = Math.floor(Math.random() * 61) + 60; // 60 to 120
            this.config.initialTime = this.timeRemaining;
        } else {
            this.timeRemaining = this.config.initialTime;
        }

        // Configure objectives based on level and mode
        this.setupObjectives();

        // Update UI
        this.ui.updateDisplay();

        console.log(`Level ${levelNumber} setup complete`);
    }

    /**
     * Setup game objectives based on mode and level
     */
    setupObjectives() {
        this.objectives = {};
        this.progress = {};

        switch (this.mode) {
            case GameMode.PALETTE:
                // Collect specific amounts of colored gems
                this.objectives = {
                    [GemColor.RED]: Math.min(10 + this.level * 2, 25),
                    [GemColor.BLUE]: Math.min(8 + this.level * 2, 20),
                    [GemColor.GREEN]: Math.min(6 + this.level * 2, 15)
                };

                this.progress = {
                    [GemColor.RED]: 0,
                    [GemColor.BLUE]: 0,
                    [GemColor.GREEN]: 0
                };
                break;

            case GameMode.PLATES:
                // Remove all plates (implement in Phase 3)
                this.objectives = { plates: 20 + this.level * 5 };
                this.progress = { plates: 0 };
                break;

            case GameMode.STARGAZER:
                // Move special pieces (implement in Phase 3)
                this.objectives = { starPieces: 3 };
                this.progress = { starPieces: 0 };
                break;
        }
    }

    /**
     * Set the game mode
     * @param {string} modeName - Name of the game mode (classic, plates, palette, stargazer)
     */
    setGameMode(modeName) {
        const ModeClass = this.availableGameModes[modeName];
        if (ModeClass) {
            this.currentGameMode = new ModeClass();

            // Initialize mode with game and board references
            if (this.currentGameMode.initialize) {
                this.currentGameMode.initialize(this.board, this);
            }

            // Also set mode on board
            if (this.board) {
                this.board.setGameMode(this.currentGameMode);
            }

            console.log(`Game mode set to: ${modeName}`);
            return true;
        }
        console.error(`Game mode not found: ${modeName}`);
        return false;
    }

    /**
     * Start the game with the current mode
     */
    startGame() {
        // Initialize default mode if none selected
        if (!this.currentGameMode) {
            this.setGameMode('classic');
        }

        this.state = GameState.PLAYING;
        this.gameRunning = true;

        // Reset score and combo
        this.score = 0;
        this.resetCombo();
        this.isAutoMatch = false;

        // Record game start in statistics
        if (this.statisticsManager && this.currentGameMode) {
            const modeName = Object.keys(this.availableGameModes).find(
                key => this.availableGameModes[key] === this.currentGameMode.constructor
            );
            this.statisticsManager.recordGameStart(modeName);
        }

        // Play gameplay music
        if (this.audioManager) {
            this.audioManager.resumeAudioContext();
            this.audioManager.playMusic(MusicTrack.GAMEPLAY);
        }

        // Start the timer if enabled
        if (this.config.enableTimer) {
            this.startTimer();
        }

        // Update UI with mode objectives
        if (this.ui && this.currentGameMode) {
            this.ui.updateObjectives(this.currentGameMode.getProgress());
        }

        // Show tutorial for the selected mode
        if (this.tutorial && this.currentGameMode) {
            const modeName = Object.keys(this.availableGameModes).find(
                key => this.availableGameModes[key] === this.currentGameMode.constructor
            );
            if (modeName) {
                // Small delay to let the UI settle before showing tutorial
                setTimeout(() => {
                    this.tutorial.show(modeName);
                }, 500);
            }
        }

        console.log('Game started - gameRunning:', this.gameRunning, 'mode:', this.currentGameMode?.name);
    }

    /**
     * Pause the game
     */
    pauseGame() {
        if (this.state === GameState.PLAYING) {
            this.state = GameState.PAUSED;
            this.gameRunning = false;
            this.ui.showPauseModal();
        }
    }

    /**
     * Resume the game
     */
    resumeGame() {
        if (this.state === GameState.PAUSED) {
            this.state = GameState.PLAYING;
            this.gameRunning = true;
            this.ui.hidePauseModal();
        }
    }

    /**
     * End the game - called by game mode
     * @param {boolean} success - Whether the game was won or lost
     */
    endGame(success = false) {
        this.gameRunning = false;

        // Stop the timer
        this.stopTimer();

        if (this.audioManager) {
            this.audioManager.stopMusic();
        }

        if (success) {
            this.state = GameState.LEVEL_COMPLETE;

            // Play victory sound
            if (this.audioManager) {
                this.audioManager.playSFX(SoundEffect.LEVEL_COMPLETE);
            }

            // Save level completion if using level system
            let levelCompletion = null;
            if (this.levelManager && this.levelManager.currentLevel) {
                levelCompletion = this.levelManager.completeLevel(
                    this.levelManager.currentLevel.number,
                    this.score,
                    true
                );
                console.log('Level completed:', levelCompletion);

                // Record level completion in statistics
                if (this.statisticsManager) {
                    const modeName = Object.keys(this.availableGameModes).find(
                        key => this.availableGameModes[key] === this.currentGameMode?.constructor
                    );
                    const timeTaken = this.currentGameMode?.getElapsedTime ? this.currentGameMode.getElapsedTime() : 0;
                    this.statisticsManager.recordLevelCompletion(
                        this.levelManager.currentLevel.number,
                        this.score,
                        timeTaken,
                        levelCompletion.stars,
                        modeName
                    );
                }

                // Play star sounds
                if (levelCompletion.stars > 0 && this.audioManager) {
                    for (let i = 0; i < levelCompletion.stars; i++) {
                        setTimeout(() => {
                            this.audioManager.playSFX(SoundEffect.STAR_EARNED);
                        }, i * 300);
                    }
                }
            }

            // Process rewards for completing level
            if (this.rewardSystem) {
                const movesRemaining = this.currentGameMode?.movesRemaining || 0;
                const rewards = this.rewardSystem.onLevelComplete(this.score, movesRemaining);

                // Check achievements
                const achievements = this.rewardSystem.checkAchievements();
                achievements.forEach(achievement => {
                    this.rewardSystem.awardAchievement(achievement);
                    rewards.push({
                        type: achievement.reward.type,
                        amount: achievement.reward.amount,
                        reason: achievement.name
                    });
                });

                // Increment mode wins
                const modeName = Object.keys(this.availableGameModes).find(
                    key => this.availableGameModes[key] === this.currentGameMode?.constructor
                );
                if (modeName) {
                    this.rewardSystem.incrementModeWins(modeName);
                }

                // Add level completion rewards
                if (levelCompletion && levelCompletion.rewards) {
                    levelCompletion.rewards.forEach(reward => {
                        if (reward.powerUp) {
                            this.powerUpManager.add(reward.powerUp, reward.amount);
                            rewards.push({
                                type: reward.powerUp,
                                amount: reward.amount,
                                reason: reward.type === 'star' ? `${reward.starLevel} Star Bonus` : 'Level Complete'
                            });
                        }
                    });
                }

                // Show rewards with level complete modal
                setTimeout(() => {
                    if (rewards.length > 0) {
                        this.ui.showRewardNotification(rewards);
                    }
                }, 500);
            }

            this.ui.showLevelCompleteModal(levelCompletion);
        } else {
            this.state = GameState.GAME_OVER;

            // Play defeat sound
            if (this.audioManager) {
                this.audioManager.playSFX(SoundEffect.LEVEL_FAILED);
            }

            // Record game end (loss) in statistics
            if (this.statisticsManager) {
                this.statisticsManager.recordGameEnd(false);
            }

            // Save failed attempt if using level system
            if (this.levelManager && this.levelManager.currentLevel) {
                this.levelManager.completeLevel(
                    this.levelManager.currentLevel.number,
                    this.score,
                    false
                );
            }

            // Break combo streak on loss
            if (this.rewardSystem) {
                this.rewardSystem.onComboBreak();
            }

            this.ui.showGameOverModal();
        }

        // Save high score
        this.saveHighScore();
    }

    /**
     * Called by game mode when game is over
     * @param {boolean} won - Whether the player won
     */
    onGameOver(won) {
        this.endGame(won);
    }

    /**
     * Restart current level
     */
    restartLevel() {
        if (this.currentGameMode) {
            this.currentGameMode.reset();
        }
        this.score = 0;

        // Reset timer and moves to initial values
        if (this.config.enableMoves) {
            this.moves = this.config.initialMoves;
        }
        if (this.config.enableTimer) {
            this.timeRemaining = this.config.initialTime;
        }

        this.board.initializeBoard();
        this.startGame();
    }

    /**
     * Move to next level
     */
    nextLevel() {
        this.setupLevel(this.level + 1);
        this.board.initializeBoard();
        this.startGame();
    }

    /**
     * Process a successful move
     */
    processMove(matches) {
        if (!this.gameRunning) return;

        // Decrement moves if move limit is enabled
        if (this.config.enableMoves && this.moves > 0) {
            this.moves--;
            this.ui.updateMoves();

            // Play warning sound for last 3 moves
            if (this.moves <= 3 && this.moves > 0) {
                this.audioManager.playSFX(SoundEffect.TIMER_WARNING);
            }
        }

        // Reset combo for new player move
        this.resetCombo();
        this.isAutoMatch = false;

        // Increment combo for the initial match
        this.incrementCombo();

        // Notify game mode about the move
        if (this.currentGameMode) {
            this.currentGameMode.onMove();
        }

        // Notify reward system about match
        if (this.rewardSystem) {
            this.rewardSystem.onMatch(matches.length);
        }

        // Track matches in statistics
        if (this.statisticsManager) {
            matches.forEach(match => {
                this.statisticsManager.recordMatch(match.gems.length);
            });
        }

        // Process matches and update score
        let totalScore = 0;
        let gemsCollected = {};

        matches.forEach(match => {
            const baseScore = match.gems.length * 10;
            const multiplier = this.getScoreMultiplier(match);
            const matchScore = baseScore * multiplier;

            totalScore += matchScore;

            // Track gem collection
            match.gems.forEach(gemData => {
                const color = gemData.gem ? gemData.gem.color : gemData.color;
                gemsCollected[color] = (gemsCollected[color] || 0) + 1;
            });

            // Check for special gem creation
            if (match.specialType) {
                if (this.rewardSystem) {
                    this.rewardSystem.onSpecialGemCreated(match.specialType);
                }
                // Track special gem creation in statistics
                if (this.statisticsManager) {
                    this.statisticsManager.recordSpecialGem(match.specialType);
                }
            }
        });

        // Let game mode process the match and modify score
        if (this.currentGameMode) {
            const allMatchedGems = matches.flatMap(m => m.gems);
            totalScore = this.currentGameMode.processMatch(allMatchedGems, totalScore);
        }

        // Update score
        this.addScore(totalScore);

        // Update UI with mode progress
        if (this.ui && this.currentGameMode) {
            this.ui.updateObjectives(this.currentGameMode.getProgress());
            this.ui.updateDisplay();
        }
    }

    /**
     * Process special gem activation
     */
    processSpecialActivation(affectedGems) {
        if (!this.gameRunning) return;

        // Calculate score from special activation
        let totalScore = 0;
        let gemsCollected = {};

        affectedGems.forEach(gemData => {
            totalScore += 15; // Special gems give bonus points

            const color = gemData.gem.color;
            gemsCollected[color] = (gemsCollected[color] || 0) + 1;
        });

        // Add special activation bonus
        const bonusMultiplier = Math.min(affectedGems.length / 5, 5); // Up to 5x bonus
        totalScore = Math.floor(totalScore * bonusMultiplier);

        // Update score
        this.addScore(totalScore);

        // Update objectives progress
        this.updateObjectivesProgress(gemsCollected);

        // Check win conditions
        this.checkWinConditions();

        // Check lose conditions
        this.checkLoseConditions();

        // Update UI
        this.ui.updateDisplay();

        // Trigger cascade check after special activation
        setTimeout(() => {
            if (this.board) {
                this.board.applyGravity();
            }
        }, 500);
    }

    /**
     * Get score multiplier based on match type
     */
    getScoreMultiplier(match) {
        let multiplier = 1;

        // Length bonus
        if (match.length >= 5) {
            multiplier *= 3;
        } else if (match.length === 4) {
            multiplier *= 2;
        }

        // Special gem creation bonus
        if (match.specialType) {
            switch (match.specialType) {
                case 'rocket':
                    multiplier *= 1.5;
                    break;
                case 'bomb':
                case 'tshape':
                    multiplier *= 2;
                    break;
                case 'rainbow':
                    multiplier *= 3;
                    break;
            }
        }

        return multiplier;
    }

    /**
     * Add score with visual feedback and combo multiplier
     */
    addScore(points) {
        // Apply combo multiplier
        const comboMultiplier = this.getComboMultiplier();
        const finalPoints = Math.floor(points * comboMultiplier);

        this.score += finalPoints;

        // Trigger score animation with combo info
        this.ui.animateScoreIncrease(finalPoints, this.combo, comboMultiplier);
    }

    /**
     * Get combo multiplier based on current combo
     */
    getComboMultiplier() {
        if (this.combo <= 1) return 1.0;
        if (this.combo === 2) return 1.5;
        if (this.combo === 3) return 2.0;
        if (this.combo === 4) return 2.5;
        return 3.0; // Max 3x for 5+ combo
    }

    /**
     * Increment combo counter
     */
    incrementCombo() {
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);

        // Track combo in statistics
        if (this.statisticsManager && this.combo > 1) {
            this.statisticsManager.recordCombo(this.combo);
        }

        // Clear any existing reset timer
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
            this.comboTimeout = null;
        }

        // Play combo sound
        if (this.audioManager && this.combo > 1) {
            this.audioManager.playSFX(SoundEffect.COMBO);
        }

        // Screen shake for high combos
        if (this.combo >= 3) {
            const shakeIntensity = Math.min(5 + (this.combo * 2), 20);
            this.screenShake(shakeIntensity);
        }

        // Show combo UI
        if (this.ui && this.combo > 1) {
            this.ui.showComboText(this.combo, this.getComboMultiplier());
        }
    }

    /**
     * Reset combo after delay
     */
    scheduleComboReset() {
        // Clear existing timer
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
        }

        // Schedule reset
        this.comboTimeout = setTimeout(() => {
            this.resetCombo();
        }, this.comboResetDelay);
    }

    /**
     * Reset combo counter
     */
    resetCombo() {
        if (this.combo > 0 && this.ui) {
            this.ui.hideComboText();
        }
        this.combo = 0;
        this.comboTimeout = null;
    }

    /**
     * Update objectives progress
     */
    updateObjectivesProgress(gemsCollected) {
        for (const color in gemsCollected) {
            if (this.progress.hasOwnProperty(color)) {
                this.progress[color] += gemsCollected[color];

                // Cap at objective limit
                if (this.objectives[color]) {
                    this.progress[color] = Math.min(this.progress[color], this.objectives[color]);
                }
            }
        }
    }

    /**
     * Check if win conditions are met
     */
    checkWinConditions() {
        let allObjectivesMet = true;

        for (const key in this.objectives) {
            if (this.progress[key] < this.objectives[key]) {
                allObjectivesMet = false;
                break;
            }
        }

        if (allObjectivesMet) {
            this.endGame(true);
        }
    }

    /**
     * Check if lose conditions are met
     */
    checkLoseConditions() {
        // Check time limit
        if (this.config.enableTimer && this.timeRemaining <= 0) {
            this.endGame(false);
            return;
        }

        // Check move limit
        if (this.config.enableMoves && this.moves <= 0) {
            // Game over - out of moves
            this.endGame(false);
            return;
        }
    }

    /**
     * Start the game timer
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.gameRunning && this.timeRemaining > 0) {
                this.timeRemaining--;
                this.ui.updateTimer();

                // Play warning sound for last 5 seconds
                if (this.timeRemaining <= 5 && this.timeRemaining > 0) {
                    this.audioManager.playSFX(SoundEffect.TIMER_WARNING);
                }

                // Warning at 30 seconds
                if (this.timeRemaining === 30) {
                    this.ui.showTimerWarning();
                }

                if (this.timeRemaining <= 0) {
                    this.checkLoseConditions();
                }
            }
        }, 1000);
    }

    /**
     * Stop the game timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (this.board) {
            this.board.resize();
        }
    }

    /**
     * Handle key press events
     */
    handleKeyPress(event) {
        // Toggle performance HUD (Ctrl+Shift+P)
        if (event.code === 'KeyP' && event.ctrlKey && event.shiftKey) {
            event.preventDefault();
            if (this.performanceMonitor) {
                this.performanceMonitor.setEnabled(!this.performanceMonitor.enabled);
                this.performanceMonitor.toggleHUD();
            }
            return;
        }

        switch (event.code) {
            case 'Space':
                event.preventDefault();
                if (this.state === GameState.PLAYING) {
                    this.pauseGame();
                } else if (this.state === GameState.PAUSED) {
                    this.resumeGame();
                }
                break;

            case 'KeyH':
                if (this.state === GameState.PLAYING) {
                    this.showHint();
                }
                break;

            case 'KeyS':
                if (this.state === GameState.PLAYING) {
                    this.shuffleBoard();
                }
                break;

            case 'KeyR':
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    this.restartLevel();
                }
                break;
        }
    }

    /**
     * Handle visibility change (pause when tab is hidden)
     */
    handleVisibilityChange() {
        if (document.hidden && this.state === GameState.PLAYING) {
            this.pauseGame();
        }
    }

    /**
     * Show hint to player
     */
    showHint() {
        if (this.board) {
            this.board.showHint();
        }
    }

    /**
     * Shuffle the board
     */
    shuffleBoard() {
        if (this.board) {
            this.board.shuffle();
        }
    }

    /**
     * Main game loop
     */
    gameLoop(currentTime) {
        // Start performance tracking
        if (this.performanceMonitor) {
            this.performanceMonitor.startFrame();
        }

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update game state
        const updateStart = performance.now();
        this.update(deltaTime);
        const updateTime = performance.now() - updateStart;

        // Render game
        const renderStart = performance.now();
        this.render();
        const renderTime = performance.now() - renderStart;

        // Track performance metrics
        if (this.performanceMonitor) {
            this.performanceMonitor.trackUpdateTime(updateTime);
            this.performanceMonitor.trackRenderTime(renderTime);
            this.performanceMonitor.endFrame();
        }

        // Continue loop
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        if (this.board) {
            this.board.update(deltaTime);

            // Check for new matches after animations complete
            if (!this.board.animating && this.gameRunning) {
                const matches = this.board.findMatches();
                if (matches.length > 0) {
                    console.log('Matches found:', matches.length, 'groups');
                    this.processMatches(matches);
                }
            }
        }
    }

    /**
     * Process matches with cascading effects
     */
    async processMatches(matches, isCascade = false) {
        this.board.animating = true;

        // Track cascade for combo system
        if (isCascade) {
            this.isAutoMatch = true;
            this.incrementCombo();
        }

        // Remove matched gems
        const removedGems = this.board.removeMatches(matches);

        // Clear swap position after first match is processed
        if (!isCascade) {
            this.board.lastSwapPosition = null;
        }

        // Process the move (only call this for initial match, not cascades)
        if (!isCascade) {
            this.processMove(matches);
        } else {
            // For cascades, still process scoring but as auto-match
            this.processCascadeMatches(matches);
        }

        // Wait for removal animation
        await Utils.delay(400);

        // Apply gravity
        this.board.applyGravity();

        // Wait for falling animation
        await Utils.delay(800);

        // Check for collectibles reaching bottom (Stargazer mode)
        if (this.currentGameMode && this.currentGameMode.name === 'Stargazer') {
            this.currentGameMode.updateObjectives([]);
            this.ui.updateDisplay();
        }

        // Check for new matches
        const newMatches = this.board.findMatches();
        if (newMatches.length > 0) {
            // Recursive cascading
            await this.processMatches(newMatches, true);
        } else {
            this.board.animating = false;
            // Schedule combo reset after cascades complete
            this.scheduleComboReset();
        }
    }

    /**
     * Process cascade matches (auto-matches from gravity)
     */
    processCascadeMatches(matches) {
        if (!this.gameRunning) return;

        // Notify reward system
        if (this.rewardSystem) {
            this.rewardSystem.onMatch(matches.length);
        }

        // Calculate score
        let totalScore = 0;
        let gemsCollected = {};

        matches.forEach(match => {
            const baseScore = match.gems.length * 10;
            const multiplier = this.getScoreMultiplier(match);
            const matchScore = baseScore * multiplier;

            totalScore += matchScore;

            // Track gem collection
            match.gems.forEach(gemData => {
                const color = gemData.gem ? gemData.gem.color : gemData.color;
                gemsCollected[color] = (gemsCollected[color] || 0) + 1;
            });

            // Check for special gem creation
            if (match.specialType && this.rewardSystem) {
                this.rewardSystem.onSpecialGemCreated(match.specialType);
            }
        });

        // Let game mode process the match
        if (this.currentGameMode) {
            const allMatchedGems = matches.flatMap(m => m.gems);
            totalScore = this.currentGameMode.processMatch(allMatchedGems, totalScore);
        }

        // Update score (will apply combo multiplier)
        this.addScore(totalScore);

        // Update UI
        if (this.ui && this.currentGameMode) {
            this.ui.updateObjectives(this.currentGameMode.getProgress());
            this.ui.updateDisplay();
        }
    }

    /**
     * Render game
     */
    render() {
        if (this.board) {
            // Apply screen shake if active
            if (this.shakeIntensity > 0.1) {
                this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity;
                this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity;
                this.canvas.style.transform = `translate(${this.shakeOffsetX}px, ${this.shakeOffsetY}px)`;

                // Decay shake
                this.shakeIntensity *= this.shakeDecay;
            } else {
                // Reset position
                this.canvas.style.transform = 'translate(0, 0)';
                this.shakeIntensity = 0;
            }

            this.board.render();
        }
    }

    /**
     * Trigger screen shake effect
     * @param {number} intensity - Shake intensity (pixels)
     */
    screenShake(intensity = 10) {
        // Only apply shake if enabled in settings
        if (this.settingsManager && !this.settingsManager.shakeEnabled()) {
            return;
        }
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    /**
     * Start the game loop
     */
    startGameLoop() {
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    /**
     * Stop the game loop
     */
    stopGameLoop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const gameContainer = document.getElementById('game-container');

        if (loadingScreen) {
            loadingScreen.classList.add('animate-fadeOut');
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 300);
        }

        if (gameContainer) {
            gameContainer.classList.remove('hidden');
            gameContainer.classList.add('animate-fadeIn');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        // Create error modal or update loading screen
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
            loadingText.style.color = '#ff4444';
        }
    }

    /**
     * Save high score
     */
    saveHighScore() {
        const savedScore = Utils.loadFromStorage('gemsBlast_highScore', 0);
        if (this.score > savedScore) {
            Utils.saveToStorage('gemsBlast_highScore', this.score);
        }

        // Save level progress
        const savedLevel = Utils.loadFromStorage('gemsBlast_maxLevel', 1);
        if (this.level > savedLevel && this.state === GameState.LEVEL_COMPLETE) {
            Utils.saveToStorage('gemsBlast_maxLevel', this.level);
        }
    }

    /**
     * Get high score
     */
    getHighScore() {
        return Utils.loadFromStorage('gemsBlast_highScore', 0);
    }

    /**
     * Get max level reached
     */
    getMaxLevel() {
        return Utils.loadFromStorage('gemsBlast_maxLevel', 1);
    }

    /**
     * Save game state
     */
    saveGame() {
        const gameState = {
            level: this.level,
            score: this.score,
            moves: this.moves,
            timeRemaining: this.timeRemaining,
            objectives: this.objectives,
            progress: this.progress,
            board: this.board.getState(),
            timestamp: Date.now()
        };

        Utils.saveToStorage('gemsBlast_saveGame', gameState);
    }

    /**
     * Load game state
     */
    loadGame() {
        const gameState = Utils.loadFromStorage('gemsBlast_saveGame');
        if (gameState) {
            this.level = gameState.level;
            this.score = gameState.score;
            this.moves = gameState.moves;
            this.timeRemaining = gameState.timeRemaining;
            this.objectives = gameState.objectives;
            this.progress = gameState.progress;

            if (this.board && gameState.board) {
                this.board.loadState(gameState.board);
            }

            this.ui.updateDisplay();
            return true;
        }
        return false;
    }

    /**
     * Clear saved game
     */
    clearSaveGame() {
        Utils.clearStorage('gemsBlast_saveGame');
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Stop game loop
        this.stopGameLoop();

        // Stop timer
        this.stopTimer();

        // Clean up event listeners
        this.cleanupFunctions.forEach(cleanup => cleanup());
        this.cleanupFunctions = [];

        console.log('Game cleanup completed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GemsBlastGame, GameState, GameMode };
}