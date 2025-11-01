/* ==========================================================================
   GemsBlast Game - Main Entry Point
   ========================================================================== */

/**
 * Main application entry point
 */
class GemsBlastApp {
    constructor() {
        this.game = null;
        this.initialized = false;

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('Initializing GemsBlast Game...');

            const loadingSteps = [
                { progress: 10, message: 'Loading game engine...' },
                { progress: 25, message: 'Initializing gems and magic...' },
                { progress: 40, message: 'Loading special powers...' },
                { progress: 55, message: 'Preparing game modes...' },
                { progress: 70, message: 'Loading sound effects...' },
                { progress: 85, message: 'Setting up achievements...' },
                { progress: 95, message: 'Almost ready...' },
                { progress: 100, message: 'Starting your adventure!' }
            ];

            // Show loading progress
            for (const step of loadingSteps) {
                await this.updateLoadingProgress(step.progress, step.message);
                await Utils.delay(300);
            }

            // Create and initialize the game
            this.game = new GemsBlastGame();

            // Small delay before hiding loading screen
            await Utils.delay(500);

            // Hide loading screen with fade out
            this.hideLoadingScreen();

            // Show mode selection instead of starting directly
            if (this.game.ui) {
                setTimeout(() => {
                    this.game.ui.showModeSelectionModal();
                }, 300);
            }

            this.initialized = true;
            console.log('GemsBlast Game initialized successfully!');
            console.log('Phase 3: Game Modes & Objectives - Ready!');

        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showError('Failed to load the game. Please refresh the page.');
        }
    }

    /**
     * Update loading progress bar
     */
    async updateLoadingProgress(percentage, message) {
        const progressFill = document.getElementById('loading-progress-fill');
        const loadingText = document.getElementById('loading-text');
        const loadingPercent = document.getElementById('loading-percent');

        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }

        if (loadingText) {
            loadingText.textContent = message;
        }

        if (loadingPercent) {
            loadingPercent.textContent = `${percentage}%`;
        }
    }

    /**
     * Hide loading screen with animation
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const gameContainer = document.getElementById('game-container');

        if (loadingScreen) {
            loadingScreen.style.transition = 'opacity 0.5s ease-out';
            loadingScreen.style.opacity = '0';

            setTimeout(() => {
                loadingScreen.style.display = 'none';

                if (gameContainer) {
                    gameContainer.classList.remove('hidden');
                    gameContainer.style.opacity = '0';
                    gameContainer.style.transition = 'opacity 0.5s ease-in';

                    setTimeout(() => {
                        gameContainer.style.opacity = '1';
                    }, 50);
                }
            }, 500);
        }
    }

    /**
     * Update loading progress
     */
    showLoadingProgress(message) {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const loadingContent = document.querySelector('.loading-content');
        if (loadingContent) {
            loadingContent.innerHTML = `
                <h1 class="loading-title" style="color: #ff4444;">Error</h1>
                <p class="loading-text" style="color: #ff6666;">${message}</p>
                <button onclick="window.location.reload()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: var(--accent-color);
                    color: var(--background-color);
                    border: none;
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    font-size: 1rem;
                ">Retry</button>
            `;
        }
    }

    /**
     * Handle application errors
     */
    handleError(error, errorInfo) {
        console.error('Application error:', error, errorInfo);

        // Log error for debugging
        if (typeof error === 'object') {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                errorInfo
            });
        }

        // Show user-friendly error message
        this.showError('Something went wrong. Please refresh the page to continue.');
    }

    /**
     * Cleanup application resources
     */
    cleanup() {
        if (this.game) {
            this.game.cleanup();
            this.game = null;
        }
        this.initialized = false;
    }
}

/**
 * Global error handling
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.gemsBlastApp) {
        window.gemsBlastApp.handleError(event.error, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.gemsBlastApp) {
        window.gemsBlastApp.handleError(event.reason, {
            type: 'unhandledrejection'
        });
    }
});

/**
 * Application lifecycle management
 */
window.addEventListener('beforeunload', () => {
    if (window.gemsBlastApp && window.gemsBlastApp.game) {
        // Save game state before leaving
        window.gemsBlastApp.game.saveGame();
        window.gemsBlastApp.cleanup();
    }
});

/**
 * Handle visibility changes (tab switching)
 */
document.addEventListener('visibilitychange', () => {
    if (window.gemsBlastApp && window.gemsBlastApp.game) {
        if (document.hidden) {
            // Auto-save when tab becomes hidden
            window.gemsBlastApp.game.saveGame();
        }
    }
});

/**
 * Handle page resize
 */
window.addEventListener('resize', Utils.debounce(() => {
    if (window.gemsBlastApp && window.gemsBlastApp.game) {
        window.gemsBlastApp.game.handleResize();

        if (window.gemsBlastApp.game.ui) {
            window.gemsBlastApp.game.ui.handleResize();
        }
    }
}, 250));

/**
 * Initialize application when script loads
 */
(() => {
    console.log('GemsBlast Game - Version 1.0.0');
    console.log('Phase 1: Foundation & Core Setup - Complete');

    // Create global app instance
    window.gemsBlastApp = new GemsBlastApp();

    // Development helpers (remove in production)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.DEBUG = {
            game: () => window.gemsBlastApp.game,
            board: () => window.gemsBlastApp.game?.board,
            tutorial: () => window.gemsBlastApp.game?.tutorial,
            powerUps: () => window.gemsBlastApp.game?.powerUpManager,
            rewards: () => window.gemsBlastApp.game?.rewardSystem,
            levels: () => window.gemsBlastApp.game?.levelManager,
            audio: () => window.gemsBlastApp.game?.audioManager,
            utils: Utils,
            gems: { Gem, GemType, GemColor },

            // Quick test functions
            showHint: () => window.gemsBlastApp.game?.showHint(),
            shuffle: () => window.gemsBlastApp.game?.shuffleBoard(),
            addScore: (points) => window.gemsBlastApp.game?.addScore(points),
            skipLevel: () => window.gemsBlastApp.game?.endGame(true),

            // Power-up functions
            addPowerUp: (type, count = 5) => {
                window.gemsBlastApp.game?.powerUpManager?.add(type, count);
                window.gemsBlastApp.game?.ui?.updateTools();
                console.log(`Added ${count} ${type} power-ups`);
            },
            usePowerUp: (type) => window.gemsBlastApp.game?.powerUpManager?.use(type, window.gemsBlastApp.game),
            resetPowerUps: () => {
                const pm = window.gemsBlastApp.game?.powerUpManager;
                if (pm) {
                    Object.keys(pm.availablePowerUps).forEach(type => pm.add(type, 5));
                    window.gemsBlastApp.game?.ui?.updateTools();
                    console.log('All power-ups reset to 5');
                }
            },

            // Tutorial functions
            showTutorial: (mode) => window.gemsBlastApp.game?.tutorial?.forceShow(mode),
            resetTutorials: () => window.gemsBlastApp.game?.tutorial?.resetProgress(),

            // Reward functions
            simulateWin: (score = 8000, moves = 10) => {
                const rewards = window.gemsBlastApp.game?.rewardSystem?.onLevelComplete(score, moves);
                if (rewards && rewards.length > 0) {
                    window.gemsBlastApp.game?.ui?.showRewardNotification(rewards);
                    console.log('Rewards:', rewards);
                }
            },
            checkDailyReward: () => {
                const reward = window.gemsBlastApp.game?.rewardSystem?.checkDailyReward();
                if (reward) {
                    window.gemsBlastApp.game?.ui?.showRewardNotification([reward]);
                    console.log('Daily reward:', reward);
                } else {
                    console.log('Daily reward already claimed today');
                }
            },
            resetDailyReward: () => {
                localStorage.removeItem('gemsblast_daily_reward');
                console.log('Daily reward reset - call checkDailyReward() to claim');
            },

            // Level functions
            loadLevel: (levelNum) => {
                const lm = window.gemsBlastApp.game?.levelManager;
                if (lm && lm.setCurrentLevel(levelNum)) {
                    const level = lm.currentLevel;
                    console.log(`Loaded Level ${levelNum}:`, level.name);
                    console.log('Mode:', level.mode, 'Moves:', level.moves, 'Objectives:', level.objectives);
                    return level;
                }
                console.error(`Cannot load level ${levelNum}`);
            },
            completeLevel: (levelNum, score = 10000) => {
                const lm = window.gemsBlastApp.game?.levelManager;
                if (lm) {
                    const result = lm.completeLevel(levelNum, score, true);
                    console.log('Level completed:', result);
                    return result;
                }
            },
            showProgress: () => {
                const lm = window.gemsBlastApp.game?.levelManager;
                if (lm) {
                    console.log(lm.getProgressSummary());
                    console.table(Object.entries(lm.progress.levels).map(([num, data]) => ({
                        Level: num,
                        Stars: data.stars || 0,
                        'Best Score': data.bestScore || 0,
                        Completed: data.completed ? '✓' : '✗'
                    })));
                }
            },
            resetLevels: () => {
                const lm = window.gemsBlastApp.game?.levelManager;
                if (lm) {
                    lm.resetProgress();
                    console.log('Level progress reset');
                }
            },

            // Audio functions
            playSound: (soundName) => {
                window.gemsBlastApp.game?.audioManager?.playSFX(soundName);
                console.log('Playing sound:', soundName);
            },
            testSounds: () => {
                const sounds = Object.values(SoundEffect);
                console.log('Testing all sounds...');
                sounds.forEach((sound, index) => {
                    setTimeout(() => {
                        console.log(`Playing: ${sound}`);
                        window.gemsBlastApp.game?.audioManager?.playSFX(sound);
                    }, index * 500);
                });
            },
            muteAll: () => {
                const am = window.gemsBlastApp.game?.audioManager;
                if (am) {
                    am.toggleSFXMute();
                    am.toggleMusicMute();
                    console.log('All audio muted');
                }
            },

            // Debug logging
            enableDebug: () => {
                window.DEBUG_LOGGING = true;
                console.log('Debug logging enabled');
            },

            disableDebug: () => {
                window.DEBUG_LOGGING = false;
                console.log('Debug logging disabled');
            }
        };

        console.log('Debug tools available in window.DEBUG');
        console.log('Power-ups: DEBUG.addPowerUp("hammer", 5), DEBUG.resetPowerUps()');
        console.log('Rewards: DEBUG.simulateWin(), DEBUG.checkDailyReward()');
        console.log('Levels: DEBUG.loadLevel(1), DEBUG.showProgress(), DEBUG.resetLevels()');
        console.log('Audio: DEBUG.playSound("match"), DEBUG.testSounds(), DEBUG.muteAll()');
        console.log('Tutorials: DEBUG.showTutorial("powerups"), DEBUG.resetTutorials()');
    }
})();

/**
 * Service Worker registration (for future PWA features)
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Register service worker when available
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered:', registration))
        //     .catch(error => console.log('SW registration failed:', error));
    });
}

/**
 * Performance monitoring
 */
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                console.log('Page load performance:', {
                    loadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
                    domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
                    firstByte: Math.round(perfData.responseStart - perfData.fetchStart)
                });
            }
        }, 0);
    });
}

/**
 * Analytics placeholder (for future implementation)
 */
window.TreasureBoxAnalytics = {
    track: (event, data) => {
        if (window.DEBUG_LOGGING) {
            console.log('Analytics:', event, data);
        }
        // Implement analytics tracking here
    },

    trackGameStart: (level) => {
        window.TreasureBoxAnalytics.track('game_start', { level });
    },

    trackGameEnd: (level, success, score, time) => {
        window.TreasureBoxAnalytics.track('game_end', {
            level, success, score, time
        });
    },

    trackMove: (moveCount, matchSize) => {
        window.TreasureBoxAnalytics.track('player_move', {
            moveCount, matchSize
        });
    }
};