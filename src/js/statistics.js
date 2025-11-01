/* ==========================================================================
   GemsBlast Game - Statistics Tracking System
   ========================================================================== */

/**
 * Statistics Manager
 * Tracks player statistics across all games
 */
class StatisticsManager {
    constructor() {
        this.stats = this.loadStats();
        this.currentSession = this.initializeSession();
    }

    /**
     * Initialize session statistics
     */
    initializeSession() {
        return {
            startTime: Date.now(),
            totalMatches: 0,
            specialGemsCreated: 0,
            powerUpsUsed: 0,
            maxCombo: 0,
            totalScore: 0
        };
    }

    /**
     * Load statistics from localStorage
     */
    loadStats() {
        const defaultStats = {
            // Global stats
            totalGamesPlayed: 0,
            totalGamesWon: 0,
            totalScore: 0,
            totalMatches: 0,
            totalSpecialGems: 0,
            totalPowerUpsUsed: 0,
            totalPlayTime: 0, // in seconds
            maxComboEver: 0,

            // Per-level stats
            levelStats: {
                // Format: levelNumber: { highScore, bestTime, stars, completions, totalScore }
            },

            // Per-mode stats
            modeStats: {
                classic: { wins: 0, totalScore: 0, gamesPlayed: 0 },
                plates: { wins: 0, totalScore: 0, gamesPlayed: 0 },
                palette: { wins: 0, totalScore: 0, gamesPlayed: 0 },
                stargazer: { wins: 0, totalScore: 0, gamesPlayed: 0 }
            },

            // Special gem statistics
            specialGemStats: {
                rockets: 0,
                bombs: 0,
                rainbows: 0
            },

            // Records
            records: {
                highestScore: 0,
                highestScoreLevel: null,
                fastestCompletion: null,
                fastestCompletionLevel: null,
                longestCombo: 0
            }
        };

        try {
            const saved = localStorage.getItem('gemsblast_statistics');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to ensure all properties exist
                return { ...defaultStats, ...parsed };
            }
        } catch (e) {
            console.error('Error loading statistics:', e);
        }

        return defaultStats;
    }

    /**
     * Save statistics to localStorage
     */
    saveStats() {
        try {
            localStorage.setItem('gemsblast_statistics', JSON.stringify(this.stats));
        } catch (e) {
            console.error('Error saving statistics:', e);
        }
    }

    /**
     * Record a match
     */
    recordMatch(matchSize = 3) {
        this.currentSession.totalMatches++;
        this.stats.totalMatches++;
    }

    /**
     * Record special gem creation
     */
    recordSpecialGem(gemType) {
        this.currentSession.specialGemsCreated++;
        this.stats.totalSpecialGems++;

        const typeMap = {
            'rocket': 'rockets',
            'bomb': 'bombs',
            'rainbow': 'rainbows'
        };

        const statKey = typeMap[gemType];
        if (statKey && this.stats.specialGemStats[statKey] !== undefined) {
            this.stats.specialGemStats[statKey]++;
        }
    }

    /**
     * Record power-up usage
     */
    recordPowerUpUsed() {
        this.currentSession.powerUpsUsed++;
        this.stats.totalPowerUpsUsed++;
    }

    /**
     * Record combo
     */
    recordCombo(comboCount) {
        this.currentSession.maxCombo = Math.max(this.currentSession.maxCombo, comboCount);
        this.stats.maxComboEver = Math.max(this.stats.maxComboEver, comboCount);

        if (comboCount > this.stats.records.longestCombo) {
            this.stats.records.longestCombo = comboCount;
        }
    }

    /**
     * Record level completion
     */
    recordLevelCompletion(levelNumber, score, timeTaken, stars, mode) {
        // Initialize level stats if not exists
        if (!this.stats.levelStats[levelNumber]) {
            this.stats.levelStats[levelNumber] = {
                highScore: 0,
                bestTime: null,
                stars: 0,
                completions: 0,
                totalScore: 0
            };
        }

        const levelStat = this.stats.levelStats[levelNumber];

        // Update level stats
        levelStat.completions++;
        levelStat.totalScore += score;
        levelStat.stars = Math.max(levelStat.stars, stars);

        if (score > levelStat.highScore) {
            levelStat.highScore = score;
        }

        if (levelStat.bestTime === null || timeTaken < levelStat.bestTime) {
            levelStat.bestTime = timeTaken;
        }

        // Update global stats
        this.stats.totalGamesWon++;
        this.stats.totalScore += score;

        // Update records
        if (score > this.stats.records.highestScore) {
            this.stats.records.highestScore = score;
            this.stats.records.highestScoreLevel = levelNumber;
        }

        if (this.stats.records.fastestCompletion === null ||
            timeTaken < this.stats.records.fastestCompletion) {
            this.stats.records.fastestCompletion = timeTaken;
            this.stats.records.fastestCompletionLevel = levelNumber;
        }

        // Update mode stats
        if (mode && this.stats.modeStats[mode]) {
            this.stats.modeStats[mode].wins++;
            this.stats.modeStats[mode].totalScore += score;
            this.stats.modeStats[mode].gamesPlayed++;
        }

        this.saveStats();
    }

    /**
     * Record game start
     */
    recordGameStart(mode) {
        this.stats.totalGamesPlayed++;

        if (mode && this.stats.modeStats[mode]) {
            this.stats.modeStats[mode].gamesPlayed++;
        }

        this.currentSession = this.initializeSession();
        this.saveStats();
    }

    /**
     * Record game end (without completion)
     */
    recordGameEnd(score) {
        const sessionDuration = (Date.now() - this.currentSession.startTime) / 1000;
        this.stats.totalPlayTime += sessionDuration;
        this.stats.totalScore += score;

        this.saveStats();
    }

    /**
     * Get statistics for a specific level
     */
    getLevelStats(levelNumber) {
        return this.stats.levelStats[levelNumber] || null;
    }

    /**
     * Get mode statistics
     */
    getModeStats(mode) {
        return this.stats.modeStats[mode] || null;
    }

    /**
     * Get all statistics
     */
    getAllStats() {
        return {
            ...this.stats,
            currentSession: this.currentSession
        };
    }

    /**
     * Get formatted statistics for display
     */
    getFormattedStats() {
        const playTimeHours = Math.floor(this.stats.totalPlayTime / 3600);
        const playTimeMinutes = Math.floor((this.stats.totalPlayTime % 3600) / 60);

        const winRate = this.stats.totalGamesPlayed > 0
            ? ((this.stats.totalGamesWon / this.stats.totalGamesPlayed) * 100).toFixed(1)
            : 0;

        const avgScore = this.stats.totalGamesPlayed > 0
            ? Math.floor(this.stats.totalScore / this.stats.totalGamesPlayed)
            : 0;

        return {
            overview: {
                totalGamesPlayed: this.stats.totalGamesPlayed,
                totalGamesWon: this.stats.totalGamesWon,
                winRate: `${winRate}%`,
                totalPlayTime: `${playTimeHours}h ${playTimeMinutes}m`,
                averageScore: avgScore
            },
            totals: {
                totalScore: this.stats.totalScore,
                totalMatches: this.stats.totalMatches,
                totalSpecialGems: this.stats.totalSpecialGems,
                totalPowerUpsUsed: this.stats.totalPowerUpsUsed
            },
            specialGems: this.stats.specialGemStats,
            records: {
                highestScore: this.stats.records.highestScore,
                highestScoreLevel: this.stats.records.highestScoreLevel,
                fastestCompletion: this.stats.records.fastestCompletion
                    ? `${Math.floor(this.stats.records.fastestCompletion / 60)}:${(this.stats.records.fastestCompletion % 60).toString().padStart(2, '0')}`
                    : 'N/A',
                fastestCompletionLevel: this.stats.records.fastestCompletionLevel,
                longestCombo: this.stats.records.longestCombo
            },
            modes: this.stats.modeStats
        };
    }

    /**
     * Reset all statistics
     */
    resetStats() {
        if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
            this.stats = this.loadStats();
            this.currentSession = this.initializeSession();
            localStorage.removeItem('gemsblast_statistics');
            this.saveStats();
            return true;
        }
        return false;
    }
}
