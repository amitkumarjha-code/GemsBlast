/**
 * Plates Mode - Clear plates beneath gems by making matches on top
 */
class PlatesMode extends GameMode {
    constructor(config = {}) {
        super({
            name: 'Plates',
            description: 'Clear all the golden plates by making matches on top of them!',
            moves: 25,
            targetScore: 3000,
            scoreMultiplier: 1.2,
            ...config
        });

        // Track plates on the board
        this.plates = [];
        this.totalPlates = 0;
        this.clearedPlates = 0;

        this.objectives = [
            {
                type: 'plates',
                description: 'Clear all plates',
                target: 0, // Will be set after board initialization
                current: 0,
                icon: '🟨'
            }
        ];
    }

    setupMode() {
        this.generatePlates();
        this.objectives[0].target = this.totalPlates;
    }

    /**
     * Generate plates on random positions
     */
    generatePlates() {
        if (!this.board) return;

        // Create a 2D array to track plates
        this.plates = Array(this.board.height).fill().map(() => Array(this.board.width).fill(false));

        // Generate plates in a pattern - roughly 30-40% of the board
        const plateCount = Math.floor(this.board.width * this.board.height * 0.35);
        this.totalPlates = plateCount;

        // Place plates in clusters for better gameplay
        const clusters = 3;
        const platesPerCluster = Math.floor(plateCount / clusters);

        for (let cluster = 0; cluster < clusters; cluster++) {
            // Random center for each cluster
            const centerX = Math.floor(Math.random() * this.board.width);
            const centerY = Math.floor(Math.random() * this.board.height);

            let placedInCluster = 0;
            let attempts = 0;

            while (placedInCluster < platesPerCluster && attempts < 50) {
                // Random position near cluster center
                const x = Math.max(0, Math.min(this.board.width - 1,
                    centerX + Math.floor(Math.random() * 5) - 2));
                const y = Math.max(0, Math.min(this.board.height - 1,
                    centerY + Math.floor(Math.random() * 5) - 2));

                if (!this.plates[y][x]) {
                    this.plates[y][x] = true;
                    placedInCluster++;
                }
                attempts++;
            }
        }

        // Fill remaining plates randomly
        let remainingPlates = plateCount - (platesPerCluster * clusters);
        let attempts = 0;

        while (remainingPlates > 0 && attempts < 100) {
            const x = Math.floor(Math.random() * this.board.width);
            const y = Math.floor(Math.random() * this.board.height);

            if (!this.plates[y][x]) {
                this.plates[y][x] = true;
                remainingPlates--;
            }
            attempts++;
        }
    }

    /**
     * Check if there's a plate at the given position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean}
     */
    hasPlate(x, y) {
        if (y < 0 || y >= this.plates.length || x < 0 || x >= this.plates[0].length) {
            return false;
        }
        return this.plates[y][x];
    }

    /**
     * Clear a plate at the given position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    clearPlate(x, y) {
        if (this.hasPlate(x, y)) {
            this.plates[y][x] = false;
            this.clearedPlates++;

            // Create particle effect for plate clearing
            if (this.board.particleSystem) {
                const worldX = this.board.offsetX + x * this.board.cellSize + this.board.cellSize / 2;
                const worldY = this.board.offsetY + y * this.board.cellSize + this.board.cellSize / 2;
                this.board.particleSystem.createExplosion(worldX, worldY, '#FFD700', 8);
            }
        }
    }

    /**
     * Update objectives when matches are made
     * @param {Array} matches - Array of matched gems
     */
    updateObjectives(matches) {
        // Clear plates beneath matched gems
        matches.forEach(gem => {
            if (this.hasPlate(gem.x, gem.y)) {
                this.clearPlate(gem.x, gem.y);
            }
        });

        // Update objective progress
        this.objectives[0].current = this.clearedPlates;
    }

    /**
     * Check if all plates are cleared
     * @returns {boolean}
     */
    isCompleted() {
        return this.clearedPlates >= this.totalPlates;
    }

    /**
     * Get mode-specific hint
     * @returns {string}
     */
    getHint() {
        const remaining = this.totalPlates - this.clearedPlates;
        return `Clear plates by making matches on top of them. ${remaining} plates remaining.`;
    }

    /**
     * Render plates beneath gems
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} offsetX - Board X offset
     * @param {number} offsetY - Board Y offset
     * @param {number} cellSize - Size of each cell
     */
    renderPlates(ctx, offsetX, offsetY, cellSize) {
        ctx.save();

        for (let y = 0; y < this.plates.length; y++) {
            for (let x = 0; x < this.plates[y].length; x++) {
                if (this.plates[y][x]) {
                    const drawX = offsetX + x * cellSize;
                    const drawY = offsetY + y * cellSize;

                    // Draw golden plate background
                    const gradient = ctx.createRadialGradient(
                        drawX + cellSize / 2, drawY + cellSize / 2, 0,
                        drawX + cellSize / 2, drawY + cellSize / 2, cellSize / 2
                    );
                    gradient.addColorStop(0, '#FFD700');
                    gradient.addColorStop(0.7, '#FFA500');
                    gradient.addColorStop(1, '#DAA520');

                    ctx.fillStyle = gradient;
                    ctx.fillRect(drawX + 2, drawY + 2, cellSize - 4, cellSize - 4);

                    // Add decorative border
                    ctx.strokeStyle = '#B8860B';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(drawX + 2, drawY + 2, cellSize - 4, cellSize - 4);

                    // Add inner highlight
                    ctx.strokeStyle = '#FFFF99';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(drawX + 4, drawY + 4, cellSize - 8, cellSize - 8);
                }
            }
        }

        ctx.restore();
    }

    /**
     * Reset the mode
     */
    reset() {
        super.reset();
        this.clearedPlates = 0;
        this.generatePlates();
        this.objectives[0].target = this.totalPlates;
        this.objectives[0].current = 0;
    }
}

/**
 * Palette Mode - Collect specific amounts of colored gems
 */
class PaletteMode extends GameMode {
    constructor(config = {}) {
        super({
            name: 'Palette',
            description: 'Collect the required amounts of each colored gem!',
            moves: 35,
            targetScore: 2000,
            scoreMultiplier: 1,
            ...config
        });

        // Track gem collection
        this.gemCollections = {};
        this.targetCollections = {};

        this.setupCollectionTargets();
    }

    setupCollectionTargets() {
        // Define target collections for different gem colors
        const gemColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];

        // Randomly select 3-4 colors to collect
        const selectedColors = gemColors.sort(() => 0.5 - Math.random()).slice(0, 4);

        selectedColors.forEach(color => {
            const target = 15 + Math.floor(Math.random() * 10); // 15-25 gems
            this.targetCollections[color] = target;
            this.gemCollections[color] = 0;
        });

        // Create objectives
        this.objectives = Object.keys(this.targetCollections).map(color => ({
            type: 'collection',
            description: `Collect ${color} gems`,
            target: this.targetCollections[color],
            current: 0,
            color: color,
            icon: '💎'
        }));
    }

    /**
     * Update objectives when matches are made
     * @param {Array} matches - Array of matched gems
     */
    updateObjectives(matches) {
        matches.forEach(gem => {
            if (this.targetCollections.hasOwnProperty(gem.color)) {
                this.gemCollections[gem.color]++;
            }
        });

        // Update objective progress
        this.objectives.forEach(objective => {
            objective.current = this.gemCollections[objective.color] || 0;
        });
    }

    /**
     * Check if all collection targets are met
     * @returns {boolean}
     */
    isCompleted() {
        return Object.keys(this.targetCollections).every(color =>
            this.gemCollections[color] >= this.targetCollections[color]
        );
    }

    /**
     * Get mode-specific hint
     * @returns {string}
     */
    getHint() {
        const incomplete = this.objectives.filter(obj => obj.current < obj.target);
        if (incomplete.length > 0) {
            const next = incomplete[0];
            const remaining = next.target - next.current;
            return `Collect ${remaining} more ${next.color} gems to complete objective.`;
        }
        return super.getHint();
    }

    /**
     * Reset the mode
     */
    reset() {
        super.reset();
        Object.keys(this.gemCollections).forEach(color => {
            this.gemCollections[color] = 0;
        });
        this.setupCollectionTargets();
    }
}

/**
 * Stargazer Mode - Connect gems to form constellation patterns
 */
class StargazerMode extends GameMode {
    constructor(config = {}) {
        super({
            name: 'Stargazer',
            description: 'Collect stars, suns, and moons by bringing them to the bottom!',
            moves: 40,
            targetScore: 4000,
            scoreMultiplier: 1.5,
            ...config
        });

        // Track collectibles
        this.collected = {
            stars: 0,
            suns: 0,
            moons: 0
        };
        
        this.targets = {
            stars: 3,
            suns: 2,
            moons: 2
        };

        this.objectives = [
            {
                type: 'stars',
                description: 'Collect Stars',
                target: this.targets.stars,
                current: 0,
                icon: '⭐'
            },
            {
                type: 'suns',
                description: 'Collect Suns',
                target: this.targets.suns,
                current: 0,
                icon: '☀️'
            },
            {
                type: 'moons',
                description: 'Collect Moons',
                target: this.targets.moons,
                current: 0,
                icon: '🌙'
            }
        ];
    }

    /**
     * Add collectibles to board
     */
    addCollectibles(board) {
        this.board = board;
        
        // Spawn initial collectibles in top rows
        const collectibleTypes = [
            { type: 'star', count: this.targets.stars },
            { type: 'sun', count: this.targets.suns },
            { type: 'moon', count: this.targets.moons }
        ];
        
        collectibleTypes.forEach(({ type, count }) => {
            for (let i = 0; i < count; i++) {
                // Place in top 2 rows randomly
                const x = Math.floor(Math.random() * board.width);
                const y = Math.floor(Math.random() * 2);
                
                // Create collectible gem
                const GemType = window.GemType || { STAR: 'star', SUN: 'sun', MOON: 'moon' };
                const gemType = type === 'star' ? GemType.STAR : 
                               type === 'sun' ? GemType.SUN : GemType.MOON;
                
                const collectible = new Gem(x, y, 0, gemType);
                board.setGem(x, y, collectible);
            }
        });
    }

    /**
     * Update objectives when gems reach bottom
     */
    updateObjectives(matches) {
        // Check if any collectibles reached the bottom row
        if (!this.board) return;
        
        const bottomRow = this.board.height - 1;
        
        for (let x = 0; x < this.board.width; x++) {
            const gem = this.board.getGem(x, bottomRow);
            if (!gem) continue;
            
            const GemType = window.GemType || { STAR: 'star', SUN: 'sun', MOON: 'moon' };
            
            if (gem.type === GemType.STAR && this.collected.stars < this.targets.stars) {
                this.collected.stars++;
                this.objectives[0].current = this.collected.stars;
                this.board.setGem(x, bottomRow, null);
                
                // Particle effect
                if (this.board.particleSystem) {
                    const worldX = this.board.offsetX + x * this.board.cellSize + this.board.cellSize / 2;
                    const worldY = this.board.offsetY + bottomRow * this.board.cellSize + this.board.cellSize / 2;
                    this.board.particleSystem.createExplosion(worldX, worldY, 'star', 30);
                }
            }
            else if (gem.type === GemType.SUN && this.collected.suns < this.targets.suns) {
                this.collected.suns++;
                this.objectives[1].current = this.collected.suns;
                this.board.setGem(x, bottomRow, null);
                
                if (this.board.particleSystem) {
                    const worldX = this.board.offsetX + x * this.board.cellSize + this.board.cellSize / 2;
                    const worldY = this.board.offsetY + bottomRow * this.board.cellSize + this.board.cellSize / 2;
                    this.board.particleSystem.createExplosion(worldX, worldY, 'orange', 30);
                }
            }
            else if (gem.type === GemType.MOON && this.collected.moons < this.targets.moons) {
                this.collected.moons++;
                this.objectives[2].current = this.collected.moons;
                this.board.setGem(x, bottomRow, null);
                
                if (this.board.particleSystem) {
                    const worldX = this.board.offsetX + x * this.board.cellSize + this.board.cellSize / 2;
                    const worldY = this.board.offsetY + bottomRow * this.board.cellSize + this.board.cellSize / 2;
                    this.board.particleSystem.createExplosion(worldX, worldY, 'purple', 30);
                }
            }
        }
    }

    /**
     * Check if objectives are complete
     */
    checkCompletion() {
        return this.collected.stars >= this.targets.stars &&
               this.collected.suns >= this.targets.suns &&
               this.collected.moons >= this.targets.moons;
    }

    /**
     * Check if all objectives are completed
     * @returns {boolean}
     */
    isCompleted() {
        return this.checkCompletion();
    }

    /**
     * Render constellation stars on the board
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} offsetX - Board X offset
     * @param {number} offsetY - Board Y offset
     * @param {number} cellSize - Size of each cell
     */
    renderStars(ctx, offsetX, offsetY, cellSize) {
        if (!this.constellations) return;

        const now = Date.now();

        // Draw constellation guide patterns
        this.constellations.forEach((constellation, index) => {
            if (constellation.completed) return;

            // Choose a position to display the constellation hint
            // Display in top corners of the board
            const baseX = index === 0 ? 1 : index === 1 ? 5 : 3;
            const baseY = index === 0 ? 1 : index === 1 ? 1 : 5;

            // Draw constellation pattern with animated stars
            constellation.pattern.forEach(([px, py]) => {
                const x = baseX + px;
                const y = baseY + py;

                if (x >= 0 && x < 8 && y >= 0 && y < 8) {
                    const centerX = offsetX + x * cellSize + cellSize / 2;
                    const centerY = offsetY + y * cellSize + cellSize / 2;

                    // Draw twinkling star
                    const twinkle = Math.sin(now / 500 + x + y) * 0.3 + 0.7;
                    ctx.save();
                    ctx.globalAlpha = twinkle * 0.4;

                    // Draw star glow
                    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, cellSize * 0.4);
                    gradient.addColorStop(0, '#FFD700');
                    gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
                    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, cellSize * 0.4, 0, Math.PI * 2);
                    ctx.fill();

                    // Draw 5-point star
                    ctx.fillStyle = '#FFD700';
                    ctx.strokeStyle = '#FFF';
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = twinkle * 0.6;

                    this.drawStar(ctx, centerX, centerY, 5, cellSize * 0.15, cellSize * 0.07);

                    ctx.restore();

                    // Draw connecting lines for pattern
                    if (constellation.pattern.length > 1) {
                        ctx.save();
                        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([3, 3]);

                        constellation.pattern.forEach(([px2, py2]) => {
                            const x2 = baseX + px2;
                            const y2 = baseY + py2;
                            if (Math.abs(px - px2) + Math.abs(py - py2) === 1) {
                                const centerX2 = offsetX + x2 * cellSize + cellSize / 2;
                                const centerY2 = offsetY + y2 * cellSize + cellSize / 2;
                                ctx.beginPath();
                                ctx.moveTo(centerX, centerY);
                                ctx.lineTo(centerX2, centerY2);
                                ctx.stroke();
                            }
                        });

                        ctx.restore();
                    }
                }
            });
        });
    }

    /**
     * Draw a 5-point star
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} x - Center X
     * @param {number} y - Center Y
     * @param {number} points - Number of points
     * @param {number} outerRadius - Outer radius
     * @param {number} innerRadius - Inner radius
     */
    drawStar(ctx, x, y, points, outerRadius, innerRadius) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;

            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    /**
     * Get mode-specific hint
     * @returns {string}
     */
    getHint() {
        const remaining = this.targetConstellations - this.completedConstellations;
        const nextConstellation = this.constellations.find(c => !c.completed);
        if (nextConstellation) {
            return `Form a ${nextConstellation.name} pattern with ${nextConstellation.color} gems. ${remaining} constellations remaining.`;
        }
        return super.getHint();
    }

    /**
     * Reset the mode
     */
    reset() {
        super.reset();
        this.completedConstellations = 0;
        this.constellations.forEach(constellation => {
            constellation.completed = false;
        });
        this.objectives[0].current = 0;
    }
}

// Export classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlatesMode, PaletteMode, StargazerMode };
}