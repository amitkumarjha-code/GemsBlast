/* ==========================================================================
   GemsBlast Game - Power-ups & Boosters System
   ========================================================================== */

/**
 * Power-up Types Enumeration
 */
const PowerUpType = {
    // In-game power-ups (usable during gameplay)
    HAMMER: 'hammer',           // Remove a single gem
    SHUFFLE: 'shuffle',         // Shuffle the board
    COLOR_BOMB: 'color_bomb',   // Remove all gems of a color
    ROCKET: 'rocket',           // Add a rocket gem to board
    BOMB: 'bomb',               // Add a bomb gem to board
    RAINBOW: 'rainbow',         // Add a rainbow gem to board

    // Pre-game boosters
    EXTRA_MOVES: 'extra_moves', // Start with extra moves
    SCORE_BOOST: 'score_boost', // 2x score multiplier
    START_ROCKET: 'start_rocket', // Start with rocket gems on board
    START_BOMB: 'start_bomb'    // Start with bomb gems on board
};

/**
 * Base PowerUp class
 */
class PowerUp {
    constructor(config = {}) {
        this.type = config.type || PowerUpType.HAMMER;
        this.name = config.name || 'Power-up';
        this.description = config.description || 'A helpful power-up';
        this.icon = config.icon || '⚡';
        this.cost = config.cost || 0;
        this.isPreGame = config.isPreGame || false;
        this.isActive = false;
        this.cooldown = config.cooldown || 0;
        this.lastUsed = 0;
    }

    /**
     * Check if power-up can be used
     * @param {TreasureBoxGame} game - The game instance
     * @returns {boolean}
     */
    canUse(game) {
        if (!game || !game.gameRunning) return false;

        // Check cooldown
        const now = Date.now();
        if (now - this.lastUsed < this.cooldown) {
            return false;
        }

        return true;
    }

    /**
     * Activate the power-up
     * @param {TreasureBoxGame} game - The game instance
     * @param {Object} params - Additional parameters
     */
    activate(game, params = {}) {
        if (!this.canUse(game)) {
            console.warn(`Cannot use power-up: ${this.name}`);
            return false;
        }

        this.isActive = true;
        this.lastUsed = Date.now();

        // Override in subclasses
        this.onActivate(game, params);

        // Visual feedback
        if (game.ui) {
            game.ui.showPowerUpActivation(this);
        }

        return true;
    }

    /**
     * Power-up activation logic (override in subclasses)
     * @param {TreasureBoxGame} game - The game instance
     * @param {Object} params - Additional parameters
     */
    onActivate(game, params = {}) {
        console.log(`Power-up activated: ${this.name}`);
    }

    /**
     * Deactivate the power-up
     */
    deactivate() {
        this.isActive = false;
    }

    /**
     * Get power-up info for UI
     * @returns {Object}
     */
    getInfo() {
        return {
            type: this.type,
            name: this.name,
            description: this.description,
            icon: this.icon,
            cost: this.cost,
            isPreGame: this.isPreGame,
            isActive: this.isActive
        };
    }
}

/**
 * Hammer Power-up - Remove a single gem
 */
class HammerPowerUp extends PowerUp {
    constructor() {
        super({
            type: PowerUpType.HAMMER,
            name: 'Hammer',
            description: 'Click to remove any gem from the board',
            icon: '🔨',
            cost: 100,
            isPreGame: false
        });
        this.selectedGem = null;
    }

    onActivate(game, params = {}) {
        console.log('Hammer activated - Click a gem to remove it');

        // Set board to hammer mode
        if (game.board) {
            game.board.hammerMode = true;
            game.board.activePowerUp = this;
        }
    }

    /**
     * Use hammer on a specific gem
     * @param {GameBoard} board - The game board
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    useOnGem(board, x, y) {
        const gem = board.getGem(x, y);
        if (!gem) return;

        // Remove the gem with animation
        gem.animateOut();
        board.setGem(x, y, null);

        // Create particle effect
        if (board.particleSystem) {
            const worldX = board.offsetX + x * board.cellSize + board.cellSize / 2;
            const worldY = board.offsetY + y * board.cellSize + board.cellSize / 2;
            board.particleSystem.createExplosion(worldX, worldY, '#FFD700', 12);
        }

        // Apply gravity after a delay
        setTimeout(() => {
            board.applyGravity();
        }, 300);

        // Deactivate hammer mode
        board.hammerMode = false;
        board.activePowerUp = null;
        this.deactivate();
    }
}

/**
 * Shuffle Power-up - Shuffle the board
 */
class ShufflePowerUp extends PowerUp {
    constructor() {
        super({
            type: PowerUpType.SHUFFLE,
            name: 'Shuffle',
            description: 'Shuffle all gems on the board',
            icon: '🔀',
            cost: 150,
            isPreGame: false,
            cooldown: 5000 // 5 second cooldown
        });
    }

    onActivate(game, params = {}) {
        if (game.board) {
            game.board.shuffle();
            console.log('Board shuffled!');
        }
        this.deactivate();
    }
}

/**
 * Color Bomb Power-up - Remove all gems of a selected color
 */
class ColorBombPowerUp extends PowerUp {
    constructor() {
        super({
            type: PowerUpType.COLOR_BOMB,
            name: 'Color Bomb',
            description: 'Click a gem to remove all gems of that color',
            icon: '💣',
            cost: 200,
            isPreGame: false
        });
    }

    onActivate(game, params = {}) {
        console.log('Color Bomb activated - Click a gem to remove all of that color');

        if (game.board) {
            game.board.colorBombMode = true;
            game.board.activePowerUp = this;
        }
    }

    /**
     * Use color bomb on a specific color
     * @param {GameBoard} board - The game board
     * @param {string} color - The color to remove
     */
    useOnColor(board, color) {
        const gemsToRemove = [];

        // Find all gems of the selected color
        for (let y = 0; y < board.height; y++) {
            for (let x = 0; x < board.width; x++) {
                const gem = board.getGem(x, y);
                if (gem && gem.color === color) {
                    gemsToRemove.push({ x, y, gem });
                }
            }
        }

        // Remove all gems with animation
        gemsToRemove.forEach(({ x, y, gem }, index) => {
            setTimeout(() => {
                gem.animateOut();
                board.setGem(x, y, null);

                // Create particle effect
                if (board.particleSystem) {
                    const worldX = board.offsetX + x * board.cellSize + board.cellSize / 2;
                    const worldY = board.offsetY + y * board.cellSize + board.cellSize / 2;
                    board.particleSystem.createExplosion(worldX, worldY, gem.color, 8);
                }
            }, index * 50);
        });

        // Apply gravity after all removed
        setTimeout(() => {
            board.applyGravity();
        }, gemsToRemove.length * 50 + 300);

        // Deactivate color bomb mode
        board.colorBombMode = false;
        board.activePowerUp = null;
        this.deactivate();
    }
}

/**
 * Extra Moves Booster - Start with extra moves
 */
class ExtraMovesPowerUp extends PowerUp {
    constructor() {
        super({
            type: PowerUpType.EXTRA_MOVES,
            name: 'Extra Moves',
            description: 'Start the game with +5 moves',
            icon: '➕',
            cost: 100,
            isPreGame: true
        });
        this.extraMoves = 5;
    }

    onActivate(game, params = {}) {
        if (game.currentGameMode) {
            game.currentGameMode.moves += this.extraMoves;
            game.currentGameMode.initialMoves += this.extraMoves;
            console.log(`Added ${this.extraMoves} extra moves!`);
        }
        this.deactivate();
    }
}

/**
 * Score Boost Booster - 2x score multiplier
 */
class ScoreBoostPowerUp extends PowerUp {
    constructor() {
        super({
            type: PowerUpType.SCORE_BOOST,
            name: 'Score Boost',
            description: '2x score multiplier for this game',
            icon: '⭐',
            cost: 150,
            isPreGame: true
        });
    }

    onActivate(game, params = {}) {
        if (game.currentGameMode) {
            game.currentGameMode.scoreMultiplier *= 2;
            console.log('Score multiplier doubled!');
        }
        // Don't deactivate - stays active for whole game
    }
}

/**
 * Power-up Manager - Manages player's power-up inventory
 */
class PowerUpManager {
    constructor() {
        this.inventory = {};
        this.activeBoosters = [];

        // Initialize available power-ups
        this.availablePowerUps = {
            [PowerUpType.HAMMER]: HammerPowerUp,
            [PowerUpType.SHUFFLE]: ShufflePowerUp,
            [PowerUpType.COLOR_BOMB]: ColorBombPowerUp,
            [PowerUpType.EXTRA_MOVES]: ExtraMovesPowerUp,
            [PowerUpType.SCORE_BOOST]: ScoreBoostPowerUp
        };

        this.loadInventory();
    }

    /**
     * Load inventory from storage
     */
    loadInventory() {
        const saved = Utils.loadFromStorage('gemsBlast_powerups', {});

        // Initialize with default counts if new
        this.inventory = {
            [PowerUpType.HAMMER]: saved[PowerUpType.HAMMER] || 3,
            [PowerUpType.SHUFFLE]: saved[PowerUpType.SHUFFLE] || 2,
            [PowerUpType.COLOR_BOMB]: saved[PowerUpType.COLOR_BOMB] || 1,
            [PowerUpType.EXTRA_MOVES]: saved[PowerUpType.EXTRA_MOVES] || 2,
            [PowerUpType.SCORE_BOOST]: saved[PowerUpType.SCORE_BOOST] || 1
        };
    }

    /**
     * Save inventory to storage
     */
    saveInventory() {
        Utils.saveToStorage('gemsBlast_powerups', this.inventory);
    }

    /**
     * Get power-up count
     * @param {string} type - Power-up type
     * @returns {number}
     */
    getCount(type) {
        return this.inventory[type] || 0;
    }

    /**
     * Add power-ups to inventory
     * @param {string} type - Power-up type
     * @param {number} count - Number to add
     */
    add(type, count = 1) {
        this.inventory[type] = (this.inventory[type] || 0) + count;
        this.saveInventory();
    }

    /**
     * Use a power-up
     * @param {string} type - Power-up type
     * @param {TreasureBoxGame} game - Game instance
     * @param {Object} params - Additional parameters
     * @returns {PowerUp|null}
     */
    use(type, game, params = {}) {
        if (this.getCount(type) <= 0) {
            console.warn(`No ${type} power-ups available`);
            return null;
        }

        const PowerUpClass = this.availablePowerUps[type];
        if (!PowerUpClass) {
            console.error(`Unknown power-up type: ${type}`);
            return null;
        }

        const powerUp = new PowerUpClass();

        if (powerUp.activate(game, params)) {
            this.inventory[type]--;
            this.saveInventory();

            if (powerUp.isPreGame) {
                this.activeBoosters.push(powerUp);
            }

            return powerUp;
        }

        return null;
    }

    /**
     * Clear active boosters (called at game end)
     */
    clearActiveBoosters() {
        this.activeBoosters.forEach(booster => booster.deactivate());
        this.activeBoosters = [];
    }

    /**
     * Get all power-up counts for UI
     * @returns {Object}
     */
    getInventoryStatus() {
        return { ...this.inventory };
    }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PowerUpType,
        PowerUp,
        HammerPowerUp,
        ShufflePowerUp,
        ColorBombPowerUp,
        ExtraMovesPowerUp,
        ScoreBoostPowerUp,
        PowerUpManager
    };
}
