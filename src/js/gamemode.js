/**
 * Base GameMode class - provides common functionality for all game modes
 */
class GameMode {
    constructor(config = {}) {
        this.name = config.name || 'Default';
        this.description = config.description || 'A treasure box game mode';
        this.moves = config.moves || 30;
        this.initialMoves = this.moves;
        this.targetScore = config.targetScore || 1000;
        this.objectives = config.objectives || [];
        this.completed = false;
        this.failed = false;
        this.scoreMultiplier = config.scoreMultiplier || 1;
        this.specialRules = config.specialRules || {};
    }

    /**
     * Initialize the game mode
     * @param {GameBoard} board - The game board
     * @param {TreasureBoxGame} game - The main game instance
     */
    initialize(board, game) {
        this.board = board;
        this.game = game;
        this.setupMode();
    }

    /**
     * Setup mode-specific configurations
     * Override in subclasses
     */
    setupMode() {
        // Base implementation - to be overridden
    }

    /**
     * Process a match made by the player
     * @param {Array} matches - Array of matched gems
     * @param {number} baseScore - Base score for the match
     * @returns {number} - Modified score
     */
    processMatch(matches, baseScore) {
        // Apply score multiplier
        const modifiedScore = Math.floor(baseScore * this.scoreMultiplier);

        // Update objectives based on matches
        this.updateObjectives(matches);

        // Check win/lose conditions
        this.checkGameState();

        return modifiedScore;
    }

    /**
     * Update objectives based on player actions
     * Override in subclasses
     * @param {Array} matches - Array of matched gems
     */
    updateObjectives(matches) {
        // Base implementation - to be overridden
    }

    /**
     * Process a move made by the player
     */
    onMove() {
        this.moves--;
        this.checkGameState();
    }

    /**
     * Check if the game should end (win/lose)
     */
    checkGameState() {
        // Check lose condition (no moves left)
        if (this.moves <= 0 && !this.isCompleted()) {
            this.failed = true;
            this.game.onGameOver(false);
            return;
        }

        // Check win condition (all objectives completed)
        if (this.isCompleted()) {
            this.completed = true;
            this.game.onGameOver(true);
            return;
        }
    }

    /**
     * Check if all objectives are completed
     * @returns {boolean}
     */
    isCompleted() {
        return this.objectives.every(objective => objective.current >= objective.target);
    }

    /**
     * Get the current progress for UI display
     * @returns {Object}
     */
    getProgress() {
        return {
            moves: this.moves,
            initialMoves: this.initialMoves,
            objectives: this.objectives,
            completed: this.completed,
            failed: this.failed,
            targetScore: this.targetScore
        };
    }

    /**
     * Reset the game mode
     */
    reset() {
        this.moves = this.initialMoves;
        this.completed = false;
        this.failed = false;
        this.objectives.forEach(objective => {
            objective.current = 0;
        });
    }

    /**
     * Get mode-specific hint or help text
     * @returns {string}
     */
    getHint() {
        return `Make matches to complete objectives. ${this.moves} moves remaining.`;
    }

    /**
     * Handle special gem creation for this mode
     * @param {Array} matches - The matches that created the special gem
     * @param {string} gemType - Type of special gem created
     */
    onSpecialGemCreated(matches, gemType) {
        // Base implementation - can be overridden
        console.log(`Special gem created: ${gemType}`);
    }

    /**
     * Handle special gem activation for this mode
     * @param {Gem} specialGem - The special gem that was activated
     * @param {Array} affectedGems - Gems affected by the activation
     */
    onSpecialGemActivated(specialGem, affectedGems) {
        // Base implementation - can be overridden
        console.log(`Special gem activated: ${specialGem.type}`);
    }
}

/**
 * Classic Mode - Traditional match-3 gameplay
 */
class ClassicMode extends GameMode {
    constructor(config = {}) {
        super({
            name: 'Classic',
            description: 'Traditional match-3 gameplay. Reach the target score!',
            moves: 30,
            targetScore: 5000,
            scoreMultiplier: 1,
            ...config
        });

        this.objectives = [
            {
                type: 'score',
                description: 'Reach target score',
                target: this.targetScore,
                current: 0,
                icon: '⭐'
            }
        ];
    }

    updateObjectives(matches) {
        // Score objective is handled by the main game
        this.objectives[0].current = this.game.score;
    }

    isCompleted() {
        return this.game.score >= this.targetScore;
    }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameMode, ClassicMode };
}