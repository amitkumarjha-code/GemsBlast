/* ==========================================================================
   GemsBlast Game - Level System
   ========================================================================== */

/**
 * Level difficulty enumeration
 */
const LevelDifficulty = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
    EXPERT: 'expert'
};

/**
 * Level objective types
 */
const LevelObjectiveType = {
    SCORE: 'score',
    COLLECT_COLORS: 'collect_colors',
    CLEAR_PLATES: 'clear_plates',
    CREATE_SPECIALS: 'create_specials',
    STARGAZER: 'stargazer'
};

/**
 * Level class representing a single game level
 */
class Level {
    constructor(config) {
        this.id = config.id;
        this.number = config.number;
        this.name = config.name || `Level ${config.number}`;
        this.difficulty = config.difficulty || LevelDifficulty.EASY;
        this.mode = config.mode || 'classic';

        // Objectives
        this.objectives = config.objectives || {};
        this.objectiveType = config.objectiveType || LevelObjectiveType.SCORE;

        // Constraints
        this.moves = config.moves || 30;
        this.timeLimit = config.timeLimit || null; // null = no time limit

        // Star requirements (score thresholds)
        this.starThresholds = config.starThresholds || [
            config.objectives.score * 0.5,  // 1 star
            config.objectives.score * 0.75, // 2 stars
            config.objectives.score         // 3 stars
        ];

        // Special features
        this.blockedCells = config.blockedCells || []; // Cells that can't have gems
        this.plateCells = config.plateCells || [];    // Cells with plates to clear
        this.initialSpecials = config.initialSpecials || []; // Start with special gems

        // Rewards
        this.rewards = config.rewards || {
            completion: { coins: 100 },
            stars: {
                1: { powerUp: 'hammer', amount: 1 },
                2: { powerUp: 'shuffle', amount: 1 },
                3: { powerUp: 'colorBomb', amount: 1 }
            }
        };

        // Unlock requirements
        this.unlockRequirements = config.unlockRequirements || {
            previousLevel: config.number - 1,
            minStars: 0
        };
    }

    /**
     * Check if level is unlocked based on progress
     * @param {Object} progress - Player progress data
     * @returns {boolean}
     */
    isUnlocked(progress) {
        if (this.number === 1) return true;

        const prevLevel = this.unlockRequirements.previousLevel;
        const prevLevelProgress = progress.levels[prevLevel];

        if (!prevLevelProgress || !prevLevelProgress.completed) {
            return false;
        }

        const totalStars = Object.values(progress.levels)
            .reduce((sum, level) => sum + (level.stars || 0), 0);

        return totalStars >= this.unlockRequirements.minStars;
    }

    /**
     * Calculate stars earned based on score
     * @param {number} score - Final score
     * @returns {number} - Stars earned (1-3)
     */
    calculateStars(score) {
        if (score >= this.starThresholds[2]) return 3;
        if (score >= this.starThresholds[1]) return 2;
        if (score >= this.starThresholds[0]) return 1;
        return 0;
    }

    /**
     * Get level configuration for game mode
     * @returns {Object}
     */
    getGameConfig() {
        return {
            mode: this.mode,
            moves: this.moves,
            timeLimit: this.timeLimit,
            objectives: this.objectives,
            objectiveType: this.objectiveType,
            blockedCells: this.blockedCells,
            plateCells: this.plateCells,
            initialSpecials: this.initialSpecials
        };
    }
}

/**
 * Level Manager class handling all levels
 */
class LevelManager {
    constructor() {
        this.levels = [];
        this.currentLevel = null;
        this.progress = this.loadProgress();

        this.initializeLevels();
    }

    /**
     * Initialize all game levels
     */
    initializeLevels() {
        this.levels = [
            // ========== Tutorial Levels (1-3) ==========
            new Level({
                id: 'level_1',
                number: 1,
                name: 'First Steps',
                difficulty: LevelDifficulty.EASY,
                mode: 'classic',
                moves: 20,
                objectives: { score: 2000 },
                objectiveType: LevelObjectiveType.SCORE,
                starThresholds: [2000, 3000, 4000]
            }),

            new Level({
                id: 'level_2',
                number: 2,
                name: 'Color Master',
                difficulty: LevelDifficulty.EASY,
                mode: 'palette',
                moves: 25,
                objectives: {
                    red: 15,
                    blue: 15,
                    green: 10
                },
                objectiveType: LevelObjectiveType.COLLECT_COLORS,
                starThresholds: [2500, 4000, 6000]
            }),

            new Level({
                id: 'level_3',
                number: 3,
                name: 'Golden Plates',
                difficulty: LevelDifficulty.EASY,
                mode: 'plates',
                moves: 20,
                objectives: { plates: 15 },
                objectiveType: LevelObjectiveType.CLEAR_PLATES,
                starThresholds: [2000, 3500, 5000],
                plateCells: [
                    { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
                    { row: 3, col: 2 }, { row: 3, col: 5 },
                    { row: 4, col: 2 }, { row: 4, col: 5 },
                    { row: 5, col: 2 }, { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 }
                ]
            }),

            // ========== Classic Levels (4-10) ==========
            new Level({
                id: 'level_4',
                number: 4,
                name: 'Rising Challenge',
                difficulty: LevelDifficulty.MEDIUM,
                mode: 'classic',
                moves: 25,
                objectives: { score: 5000 },
                objectiveType: LevelObjectiveType.SCORE,
                starThresholds: [5000, 7000, 9000]
            }),

            new Level({
                id: 'level_5',
                number: 5,
                name: 'Special Training',
                difficulty: LevelDifficulty.MEDIUM,
                mode: 'classic',
                moves: 20,
                objectives: { score: 6000, specialGems: 3 },
                objectiveType: LevelObjectiveType.CREATE_SPECIALS,
                starThresholds: [6000, 8000, 10000]
            }),

            new Level({
                id: 'level_6',
                number: 6,
                name: 'Rainbow Quest',
                difficulty: LevelDifficulty.MEDIUM,
                mode: 'palette',
                moves: 30,
                objectives: {
                    red: 20,
                    blue: 20,
                    green: 15,
                    yellow: 15,
                    purple: 10
                },
                objectiveType: LevelObjectiveType.COLLECT_COLORS,
                starThresholds: [5000, 7500, 10000]
            }),

            new Level({
                id: 'level_7',
                number: 7,
                name: 'Plate Puzzle',
                difficulty: LevelDifficulty.MEDIUM,
                mode: 'plates',
                moves: 25,
                objectives: { plates: 20 },
                objectiveType: LevelObjectiveType.CLEAR_PLATES,
                starThresholds: [4000, 6000, 8000],
                plateCells: this.generatePlatePattern('cross')
            }),

            new Level({
                id: 'level_8',
                number: 8,
                name: 'Constellation',
                difficulty: LevelDifficulty.MEDIUM,
                mode: 'stargazer',
                moves: 35,
                objectives: { constellations: 3 },
                objectiveType: LevelObjectiveType.STARGAZER,
                starThresholds: [5000, 7500, 10000]
            }),

            new Level({
                id: 'level_9',
                number: 9,
                name: 'Speed Run',
                difficulty: LevelDifficulty.HARD,
                mode: 'classic',
                moves: 18,
                objectives: { score: 7000 },
                objectiveType: LevelObjectiveType.SCORE,
                starThresholds: [7000, 9000, 12000]
            }),

            new Level({
                id: 'level_10',
                number: 10,
                name: 'Master Test',
                difficulty: LevelDifficulty.HARD,
                mode: 'palette',
                moves: 25,
                objectives: {
                    red: 25,
                    blue: 25,
                    green: 20,
                    yellow: 20
                },
                objectiveType: LevelObjectiveType.COLLECT_COLORS,
                starThresholds: [6000, 9000, 12000]
            }),

            // ========== Advanced Levels (11-15) ==========
            new Level({
                id: 'level_11',
                number: 11,
                name: 'Expert Challenge',
                difficulty: LevelDifficulty.HARD,
                mode: 'classic',
                moves: 20,
                objectives: { score: 10000 },
                objectiveType: LevelObjectiveType.SCORE,
                starThresholds: [10000, 13000, 16000],
                unlockRequirements: { previousLevel: 10, minStars: 15 }
            }),

            new Level({
                id: 'level_12',
                number: 12,
                name: 'Plate Master',
                difficulty: LevelDifficulty.HARD,
                mode: 'plates',
                moves: 22,
                objectives: { plates: 30 },
                objectiveType: LevelObjectiveType.CLEAR_PLATES,
                starThresholds: [6000, 9000, 12000],
                plateCells: this.generatePlatePattern('checkerboard')
            }),

            new Level({
                id: 'level_13',
                number: 13,
                name: 'Star Hunter',
                difficulty: LevelDifficulty.HARD,
                mode: 'stargazer',
                moves: 30,
                objectives: { constellations: 5 },
                objectiveType: LevelObjectiveType.STARGAZER,
                starThresholds: [7000, 10000, 13000]
            }),

            new Level({
                id: 'level_14',
                number: 14,
                name: 'Limited Moves',
                difficulty: LevelDifficulty.EXPERT,
                mode: 'classic',
                moves: 15,
                objectives: { score: 8000 },
                objectiveType: LevelObjectiveType.SCORE,
                starThresholds: [8000, 11000, 14000]
            }),

            new Level({
                id: 'level_15',
                number: 15,
                name: 'Ultimate Test',
                difficulty: LevelDifficulty.EXPERT,
                mode: 'palette',
                moves: 30,
                objectives: {
                    red: 30,
                    blue: 30,
                    green: 25,
                    yellow: 25,
                    purple: 20,
                    orange: 15
                },
                objectiveType: LevelObjectiveType.COLLECT_COLORS,
                starThresholds: [10000, 14000, 18000],
                unlockRequirements: { previousLevel: 14, minStars: 30 }
            })
        ];
    }

    /**
     * Generate plate patterns for levels
     * @param {string} pattern - Pattern type
     * @returns {Array} - Array of {row, col} positions
     */
    generatePlatePattern(pattern) {
        const cells = [];

        switch (pattern) {
            case 'cross':
                // Vertical line
                for (let row = 1; row < 7; row++) {
                    cells.push({ row, col: 3 });
                    cells.push({ row, col: 4 });
                }
                // Horizontal line
                for (let col = 1; col < 7; col++) {
                    cells.push({ row: 3, col });
                    cells.push({ row: 4, col });
                }
                break;

            case 'checkerboard':
                for (let row = 0; row < 8; row++) {
                    for (let col = 0; col < 8; col++) {
                        if ((row + col) % 2 === 0) {
                            cells.push({ row, col });
                        }
                    }
                }
                break;

            case 'border':
                for (let i = 0; i < 8; i++) {
                    cells.push({ row: 0, col: i });
                    cells.push({ row: 7, col: i });
                    cells.push({ row: i, col: 0 });
                    cells.push({ row: i, col: 7 });
                }
                break;
        }

        return cells;
    }

    /**
     * Get level by number
     * @param {number} levelNumber
     * @returns {Level|null}
     */
    getLevel(levelNumber) {
        return this.levels.find(level => level.number === levelNumber) || null;
    }

    /**
     * Get all unlocked levels
     * @returns {Array<Level>}
     */
    getUnlockedLevels() {
        return this.levels.filter(level => level.isUnlocked(this.progress));
    }

    /**
     * Set current level
     * @param {number} levelNumber
     * @returns {boolean} - Success
     */
    setCurrentLevel(levelNumber) {
        const level = this.getLevel(levelNumber);
        if (level && level.isUnlocked(this.progress)) {
            this.currentLevel = level;
            return true;
        }
        return false;
    }

    /**
     * Complete a level and save progress
     * @param {number} levelNumber
     * @param {number} score
     * @param {boolean} completed
     * @returns {Object} - Completion data with stars and rewards
     */
    completeLevel(levelNumber, score, completed = true) {
        const level = this.getLevel(levelNumber);
        if (!level) return null;

        const stars = completed ? level.calculateStars(score) : 0;
        const previousStars = this.progress.levels[levelNumber]?.stars || 0;

        // Update progress
        if (!this.progress.levels[levelNumber]) {
            this.progress.levels[levelNumber] = {};
        }

        this.progress.levels[levelNumber] = {
            completed: completed,
            stars: Math.max(stars, previousStars), // Keep best stars
            bestScore: Math.max(score, this.progress.levels[levelNumber].bestScore || 0),
            attempts: (this.progress.levels[levelNumber].attempts || 0) + 1,
            lastPlayed: Date.now()
        };

        // Update total stats
        this.progress.totalStars = Object.values(this.progress.levels)
            .reduce((sum, level) => sum + (level.stars || 0), 0);
        this.progress.totalScore += score;
        this.progress.levelsCompleted = Object.values(this.progress.levels)
            .filter(level => level.completed).length;

        this.saveProgress();

        // Calculate rewards
        const rewards = this.calculateRewards(level, stars, previousStars);

        return {
            level: levelNumber,
            score: score,
            stars: stars,
            newStars: stars > previousStars,
            rewards: rewards,
            nextLevelUnlocked: this.getLevel(levelNumber + 1)?.isUnlocked(this.progress)
        };
    }

    /**
     * Calculate rewards for level completion
     * @param {Level} level
     * @param {number} stars
     * @param {number} previousStars
     * @returns {Array}
     */
    calculateRewards(level, stars, previousStars) {
        const rewards = [];

        // First time completion reward
        if (previousStars === 0 && stars > 0) {
            rewards.push({
                type: 'completion',
                ...level.rewards.completion
            });
        }

        // Star rewards (only for new stars)
        for (let i = previousStars + 1; i <= stars; i++) {
            if (level.rewards.stars[i]) {
                rewards.push({
                    type: 'star',
                    starLevel: i,
                    ...level.rewards.stars[i]
                });
            }
        }

        return rewards;
    }

    /**
     * Load progress from storage
     * @returns {Object}
     */
    loadProgress() {
        const defaultProgress = {
            levels: {},
            totalStars: 0,
            totalScore: 0,
            levelsCompleted: 0,
            currentLevel: 1
        };

        return Utils.loadFromStorage('gemsBlast_levelProgress', defaultProgress);
    }

    /**
     * Save progress to storage
     */
    saveProgress() {
        Utils.saveToStorage('gemsBlast_levelProgress', this.progress);
    }

    /**
     * Get progress summary
     * @returns {Object}
     */
    getProgressSummary() {
        return {
            totalLevels: this.levels.length,
            levelsCompleted: this.progress.levelsCompleted,
            totalStars: this.progress.totalStars,
            maxStars: this.levels.length * 3,
            totalScore: this.progress.totalScore,
            unlockedLevels: this.getUnlockedLevels().length
        };
    }

    /**
     * Reset all progress
     */
    resetProgress() {
        this.progress = {
            levels: {},
            totalStars: 0,
            totalScore: 0,
            levelsCompleted: 0,
            currentLevel: 1
        };
        this.saveProgress();
    }
}
