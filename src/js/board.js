/* ==========================================================================
   GemsBlast Game - Board System
   ========================================================================== */

/**
 * Game Board class managing the grid of gems
 */
class GameBoard {
    constructor(width = 8, height = 8, canvas) {
        this.width = width;
        this.height = height;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Board state
        this.grid = [];
        this.selectedGem = null;
        this.animating = false;
        this.hints = [];
        this.lastSwapPosition = null; // Track where user moved a gem

        // Game mode support
        this.gameMode = null;

        // Power-up modes
        this.hammerMode = false;
        this.colorBombMode = false;
        this.activePowerUp = null;

        // Visual properties
        this.cellSize = Math.min(canvas.width / width, canvas.height / height);
        this.offsetX = (canvas.width - (width * this.cellSize)) / 2;
        this.offsetY = (canvas.height - (height * this.cellSize)) / 2;

        // Initialize gem renderer
        this.gemRenderer = new GemRenderer(canvas, this.cellSize);

        // Initialize particle system
        this.particleSystem = new ParticleSystem(canvas);

        // Initialize empty board
        this.initializeBoard();

        // Event handling
        this.setupEventListeners();

        // Match detection
        this.possibleMoves = [];
        this.updatePossibleMoves();
    }

    /**
     * Initialize the board with random gems
     */
    initializeBoard() {
        this.grid = [];

        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                let gem;
                let attempts = 0;

                // Ensure no initial matches
                do {
                    gem = Gem.createRandom(x, y);
                    attempts++;
                } while (this.wouldCreateMatch(x, y, gem.color) && attempts < 10);

                this.grid[y][x] = gem;
            }
        }
        
        // Add collectibles if in Stargazer mode
        if (this.gameMode && this.gameMode.name === 'Stargazer' && typeof this.gameMode.addCollectibles === 'function') {
            this.gameMode.addCollectibles(this);
        }
    }

    /**
     * Check if placing a gem would create an initial match
     */
    wouldCreateMatch(x, y, color) {
        // Check horizontal match
        let horizontalCount = 1;

        // Check left
        for (let i = x - 1; i >= 0; i--) {
            if (this.grid[y] && this.grid[y][i] && this.grid[y][i].color === color) {
                horizontalCount++;
            } else {
                break;
            }
        }

        // Check right
        for (let i = x + 1; i < this.width; i++) {
            if (this.grid[y] && this.grid[y][i] && this.grid[y][i].color === color) {
                horizontalCount++;
            } else {
                break;
            }
        }

        if (horizontalCount >= 3) return true;

        // Check vertical match
        let verticalCount = 1;

        // Check up
        for (let i = y - 1; i >= 0; i--) {
            if (this.grid[i] && this.grid[i][x] && this.grid[i][x].color === color) {
                verticalCount++;
            } else {
                break;
            }
        }

        // Check down
        for (let i = y + 1; i < this.height; i++) {
            if (this.grid[i] && this.grid[i][x] && this.grid[i][x].color === color) {
                verticalCount++;
            } else {
                break;
            }
        }

        return verticalCount >= 3;
    }

    /**
     * Get gem at specific grid position
     */
    getGem(x, y) {
        if (!Utils.isValidGridPosition(x, y, this.width, this.height)) {
            return null;
        }
        return this.grid[y][x];
    }

    /**
     * Set gem at specific grid position
     */
    setGem(x, y, gem) {
        if (!Utils.isValidGridPosition(x, y, this.width, this.height)) {
            return false;
        }

        if (gem) {
            gem.x = x;
            gem.y = y;
            gem.setTargetPosition(x, y);
        }

        this.grid[y][x] = gem;
        return true;
    }

    /**
     * Swap two gems
     */
    swapGems(x1, y1, x2, y2) {
        if (!Utils.isValidGridPosition(x1, y1, this.width, this.height) ||
            !Utils.isValidGridPosition(x2, y2, this.width, this.height)) {
            return false;
        }

        const gem1 = this.grid[y1][x1];
        const gem2 = this.grid[y2][x2];

        // Update grid
        this.grid[y1][x1] = gem2;
        this.grid[y2][x2] = gem1;

        // Update gem positions
        if (gem1) {
            gem1.x = x2;
            gem1.y = y2;
            gem1.setTargetPosition(x2, y2);
        }

        if (gem2) {
            gem2.x = x1;
            gem2.y = y1;
            gem2.setTargetPosition(x1, y1);
        }

        return true;
    }

    /**
     * Find all matches on the board
     */
    findMatches() {
        const matches = [];
        const visited = Array(this.height).fill().map(() => Array(this.width).fill(false));

        // Find horizontal matches first
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width - 2; x++) {
                const gem = this.getGem(x, y);
                if (!gem || visited[y][x]) continue;
                
                // Skip collectibles - they don't participate in matches
                const GemType = window.GemType || { STAR: 'star', SUN: 'sun', MOON: 'moon' };
                if (gem.type === GemType.STAR || gem.type === GemType.SUN || gem.type === GemType.MOON) {
                    continue;
                }

                const match = this.findHorizontalMatch(x, y);
                if (match.length >= 3) {
                    const matchData = {
                        type: 'horizontal',
                        gems: match,
                        color: gem.color,
                        length: match.length,
                        specialType: this.determineSpecialType(match, 'horizontal')
                    };
                    matches.push(matchData);

                    // Mark as visited
                    match.forEach(pos => {
                        visited[pos.y][pos.x] = true;
                    });
                }
            }
        }

        // Find vertical matches
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height - 2; y++) {
                const gem = this.getGem(x, y);
                if (!gem || visited[y][x]) continue;
                
                // Skip collectibles - they don't participate in matches
                const GemType = window.GemType || { STAR: 'star', SUN: 'sun', MOON: 'moon' };
                if (gem.type === GemType.STAR || gem.type === GemType.SUN || gem.type === GemType.MOON) {
                    continue;
                }

                const match = this.findVerticalMatch(x, y);
                if (match.length >= 3) {
                    const matchData = {
                        type: 'vertical',
                        gems: match,
                        color: gem.color,
                        length: match.length,
                        specialType: this.determineSpecialType(match, 'vertical')
                    };
                    matches.push(matchData);

                    // Mark as visited
                    match.forEach(pos => {
                        visited[pos.y][pos.x] = true;
                    });
                }
            }
        }

        // Now check if any matches can be combined into L/T shapes for bomb creation
        // This should only happen if we have TWO separate matches that intersect
        const enhancedMatches = this.enhanceMatchesWithLAndT(matches);

        return enhancedMatches;
    }

    /**
     * Find horizontal match starting from position
     */
    findHorizontalMatch(startX, startY) {
        const match = [];
        const startGem = this.getGem(startX, startY);
        if (!startGem) return match;

        for (let x = startX; x < this.width; x++) {
            const gem = this.getGem(x, startY);
            if (gem && gem.canMatchWith(startGem)) {
                match.push({ x, y: startY, gem });
            } else {
                break;
            }
        }

        return match;
    }

    /**
     * Find vertical match starting from position
     */
    findVerticalMatch(startX, startY) {
        const match = [];
        const startGem = this.getGem(startX, startY);
        if (!startGem) return match;

        for (let y = startY; y < this.height; y++) {
            const gem = this.getGem(startX, y);
            if (gem && gem.canMatchWith(startGem)) {
                match.push({ x: startX, y, gem });
            } else {
                break;
            }
        }

        return match;
    }

    /**
     * Enhance matches by detecting L and T patterns from intersecting matches
     */
    enhanceMatchesWithLAndT(matches) {
        if (matches.length < 2) return matches;

        const enhancedMatches = [];
        const processedIndices = new Set();

        // Check each pair of matches to see if they intersect to form L or T
        for (let i = 0; i < matches.length; i++) {
            if (processedIndices.has(i)) continue;

            const match1 = matches[i];
            let foundIntersection = false;

            for (let j = i + 1; j < matches.length; j++) {
                if (processedIndices.has(j)) continue;

                const match2 = matches[j];

                // Check if these two matches intersect (share a gem)
                const intersection = this.findMatchIntersection(match1, match2);

                if (intersection) {
                    // Check if one is horizontal and one is vertical
                    if ((match1.type === 'horizontal' && match2.type === 'vertical') ||
                        (match1.type === 'vertical' && match2.type === 'horizontal')) {

                        // Combine into a bomb match
                        const combinedGems = [...match1.gems];
                        match2.gems.forEach(gem => {
                            if (!combinedGems.some(g => g.x === gem.x && g.y === gem.y)) {
                                combinedGems.push(gem);
                            }
                        });

                        // Only create bomb if combined match has 5 or more gems
                        const specialType = combinedGems.length >= 5 ? 'bomb' : 'normal';

                        enhancedMatches.push({
                            type: 'tshape',
                            gems: combinedGems,
                            color: match1.color,
                            length: combinedGems.length,
                            specialType: specialType,
                            centerX: intersection.x,
                            centerY: intersection.y
                        });

                        processedIndices.add(i);
                        processedIndices.add(j);
                        foundIntersection = true;
                        break;
                    }
                }
            }

            if (!foundIntersection && !processedIndices.has(i)) {
                enhancedMatches.push(match1);
            }
        }

        return enhancedMatches;
    }

    /**
     * Find intersection point of two matches
     */
    findMatchIntersection(match1, match2) {
        for (const gem1 of match1.gems) {
            for (const gem2 of match2.gems) {
                if (gem1.x === gem2.x && gem1.y === gem2.y) {
                    return { x: gem1.x, y: gem1.y };
                }
            }
        }
        return null;
    }

    /**
     * Find L and T shaped matches for bomb gem creation
     */
    findLAndTMatches() {
        const matches = [];
        const visited = Array(this.height).fill().map(() => Array(this.width).fill(false));

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const gem = this.getGem(x, y);
                if (!gem || visited[y][x]) continue;

                // Check for T and L shapes centered at this position
                const tAndLMatch = this.findTAndLPatternAt(x, y);
                if (tAndLMatch.length >= 5) {
                    matches.push({
                        type: 'tshape',
                        gems: tAndLMatch,
                        color: gem.color,
                        length: tAndLMatch.length,
                        specialType: 'bomb',
                        centerX: x,
                        centerY: y
                    });

                    // Mark as visited
                    tAndLMatch.forEach(pos => {
                        visited[pos.y][pos.x] = true;
                    });
                }
            }
        }

        return matches;
    }

    /**
     * Find T and L patterns centered at a specific position
     */
    findTAndLPatternAt(centerX, centerY) {
        const centerGem = this.getGem(centerX, centerY);
        if (!centerGem) return [];

        const patterns = [];

        // Check T-shape (horizontal line with vertical extension)
        const horizontalLine = this.getLineMatch(centerX, centerY, 1, 0); // horizontal
        const verticalUp = this.getLineMatch(centerX, centerY, 0, -1); // up
        const verticalDown = this.getLineMatch(centerX, centerY, 0, 1); // down

        // T-shape: horizontal line of 3+ with vertical extension
        if (horizontalLine.length >= 3 && (verticalUp.length >= 2 || verticalDown.length >= 2)) {
            const tShape = [...horizontalLine];
            if (verticalUp.length >= 2) tShape.push(...verticalUp.slice(1));
            if (verticalDown.length >= 2) tShape.push(...verticalDown.slice(1));
            patterns.push(tShape);
        }

        // Check L-shapes (corner patterns)
        const directions = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, // horizontal
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }  // vertical
        ];

        for (let i = 0; i < directions.length; i++) {
            for (let j = i + 1; j < directions.length; j++) {
                const dir1 = directions[i];
                const dir2 = directions[j];

                // Skip parallel directions
                if (dir1.dx === dir2.dx || dir1.dy === dir2.dy) continue;

                const line1 = this.getLineMatch(centerX, centerY, dir1.dx, dir1.dy);
                const line2 = this.getLineMatch(centerX, centerY, dir2.dx, dir2.dy);

                if (line1.length >= 3 && line2.length >= 3) {
                    const lShape = [...line1];
                    lShape.push(...line2.slice(1)); // Avoid duplicating center gem
                    patterns.push(lShape);
                }
            }
        }

        // Return the largest pattern found
        return patterns.reduce((largest, current) =>
            current.length > largest.length ? current : largest, []);
    }

    /**
     * Get line match in a specific direction
     */
    getLineMatch(startX, startY, dx, dy) {
        const match = [];
        const startGem = this.getGem(startX, startY);
        if (!startGem) return match;

        // Add center gem first
        match.push({ x: startX, y: startY, gem: startGem });

        // Check in positive direction
        let x = startX + dx;
        let y = startY + dy;
        while (Utils.isValidGridPosition(x, y, this.width, this.height)) {
            const gem = this.getGem(x, y);
            if (gem && gem.canMatchWith(startGem)) {
                match.push({ x, y, gem });
                x += dx;
                y += dy;
            } else {
                break;
            }
        }

        // Check in negative direction
        x = startX - dx;
        y = startY - dy;
        while (Utils.isValidGridPosition(x, y, this.width, this.height)) {
            const gem = this.getGem(x, y);
            if (gem && gem.canMatchWith(startGem)) {
                match.unshift({ x, y, gem });
                x -= dx;
                y -= dy;
            } else {
                break;
            }
        }

        return match;
    }

    /**
     * Determine what type of special gem should be created
     */
    determineSpecialType(match, matchType) {
        const length = match.length;

        if (length === 4) {
            return 'rocket';
        } else if (length === 5) {
            return 'rainbow';
        } else if (length >= 3) {
            return 'normal';
        }

        return 'normal';
    }

    /**
     * Remove matched gems from board
     */
    removeMatches(matches) {
        const removedGems = [];
        const gemsToRemove = new Set();
        const specialGemsToCreate = [];
        const specialGemsToActivate = []; // Track special gems that need activation

        // First pass: Collect all gems to remove and determine special gems to create
        matches.forEach(match => {
            // Find the best position to place special gem (usually center)
            const specialGemPos = this.getBestSpecialGemPosition(match);

            // Create special gem if match qualifies
            if (match.specialType && match.specialType !== 'normal' && specialGemPos) {
                specialGemsToCreate.push({
                    x: specialGemPos.x,
                    y: specialGemPos.y,
                    color: match.color,
                    type: match.specialType,
                    isHorizontal: match.type === 'horizontal' // For rocket orientation
                });

                // Notify game mode about special gem creation
                if (this.gameMode && typeof this.gameMode.onSpecialGemCreated === 'function') {
                    this.gameMode.onSpecialGemCreated(match.gems, match.specialType);
                }
            }

            match.gems.forEach(pos => {
                const key = `${pos.x},${pos.y}`;
                
                // Check if this position will have a special gem created - if so, DON'T remove it
                const willCreateSpecialHere = specialGemsToCreate.some(
                    special => special.x === pos.x && special.y === pos.y
                );
                
                if (!willCreateSpecialHere) {
                    gemsToRemove.add(key);
                }

                // Check if this is a special gem (rocket, bomb) being matched
                if (pos.gem && (pos.gem.type === GemType.ROCKET || pos.gem.type === GemType.BOMB)) {
                    specialGemsToActivate.push({
                        gem: pos.gem,
                        x: pos.x,
                        y: pos.y
                    });
                }

                removedGems.push({
                    gem: pos.gem,
                    x: pos.x,
                    y: pos.y,
                    matchType: match.specialType || 'normal'
                });
            });

            // Create visual effect for match with colored particles
            if (this.particleSystem && match.gems.length > 0) {
                const centerGem = match.gems[Math.floor(match.gems.length / 2)];
                const color = centerGem.gem ? centerGem.gem.color : 0;
                const pixelX = (centerGem.x + 0.5) * this.cellSize + this.offsetX;
                const pixelY = (centerGem.y + 0.5) * this.cellSize + this.offsetY;

                // Use colored explosion based on gem color and match size
                this.particleSystem.createColoredExplosion(pixelX, pixelY, color, match.gems.length);

                // Create floating score text
                const matchScore = match.gems.length * 10;
                this.createFloatingScoreText(pixelX, pixelY, matchScore, match.gems.length);
            }
        });

        // ACTIVATE special gems (rockets, bombs) before removing them
        specialGemsToActivate.forEach(special => {
            const effect = special.gem.getActivationEffect();
            if (effect) {
                // Apply the special effect
                const affectedGems = this.applySpecialEffect(effect);

                // Remove affected gems
                affectedGems.forEach(affected => {
                    const gem = this.getGem(affected.x, affected.y);
                    if (gem) {
                        gem.animateOut();
                        this.setGem(affected.x, affected.y, null);
                    }
                });
            }
        });

        // Notify game mode about matches for objective tracking
        // Skip for StargazerMode as it checks collectibles after gravity instead
        if (this.gameMode && typeof this.gameMode.updateObjectives === 'function' && this.gameMode.name !== 'Stargazer') {
            this.gameMode.updateObjectives(removedGems);
        }

        // Remove gems with animation (but NOT positions where special gems will be created)
        gemsToRemove.forEach(key => {
            const [x, y] = key.split(',').map(Number);
            const gem = this.getGem(x, y);

            if (gem) {
                gem.animateOut();
                this.setGem(x, y, null);
            }
        });

        // Create special gems IMMEDIATELY (not after delay) at their positions
        specialGemsToCreate.forEach(specialData => {
            const specialGem = Gem.createSpecial(
                specialData.x,
                specialData.y,
                specialData.color,
                specialData.type,
                specialData.isHorizontal
            );
            this.setGem(specialData.x, specialData.y, specialGem);

            // Add creation particle effect
            setTimeout(() => {
                this.particleSystem.createSpecialGemEffect(
                    specialData.x,
                    specialData.y,
                    specialData.type
                );
            }, 100);
        });

        return removedGems;
    }

    /**
     * Get the best position to place a special gem
     */
    getBestSpecialGemPosition(match) {
        if (match.centerX !== undefined && match.centerY !== undefined) {
            // For T and L shapes, use the center position
            return { x: match.centerX, y: match.centerY };
        }

        // Check if the last swap position is part of this match
        if (this.lastSwapPosition) {
            const swapInMatch = match.gems.find(
                pos => pos.x === this.lastSwapPosition.x && pos.y === this.lastSwapPosition.y
            );
            if (swapInMatch) {
                // Use the swap position - where the user moved the gem
                return { x: this.lastSwapPosition.x, y: this.lastSwapPosition.y };
            }
        }

        // For line matches, use the middle gem as fallback
        if (match.gems.length > 0) {
            const middleIndex = Math.floor(match.gems.length / 2);
            const middleGem = match.gems[middleIndex];
            return { x: middleGem.x, y: middleGem.y };
        }

        return null;
    }

    /**
     * Determine the type of match for special gem creation
     */
    getMatchType(match) {
        // Return the special type if it's already determined
        if (match.specialType) {
            return match.specialType;
        }

        const length = match.length;

        if (length === 4) {
            return 'rocket';
        } else if (length === 5) {
            return 'rainbow';
        } else if (length >= 3) {
            return 'normal';
        }

        return 'normal';
    }

    /**
     * Apply gravity to make gems fall
     */
    applyGravity() {
        const movements = [];

        for (let x = 0; x < this.width; x++) {
            let writeIndex = this.height - 1;

            // Move existing gems down
            for (let y = this.height - 1; y >= 0; y--) {
                const gem = this.getGem(x, y);
                if (gem) {
                    if (y !== writeIndex) {
                        this.setGem(x, writeIndex, gem);
                        this.setGem(x, y, null);
                        gem.startFalling(writeIndex);
                        movements.push({
                            gem,
                            fromY: y,
                            toY: writeIndex
                        });
                    }
                    writeIndex--;
                }
            }

            // Fill empty spaces with new gems
            for (let y = writeIndex; y >= 0; y--) {
                const newGem = Gem.createRandom(x, y);
                newGem.currentY = -1 - (writeIndex - y);
                newGem.startFalling(y);
                this.setGem(x, y, newGem);
                movements.push({
                    gem: newGem,
                    fromY: newGem.currentY,
                    toY: y
                });
            }
        }

        return movements;
    }

    /**
     * Find all possible moves on the board
     */
    updatePossibleMoves() {
        this.possibleMoves = [];

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const adjacentPositions = Utils.getAdjacentPositions(x, y, this.width, this.height);

                adjacentPositions.forEach(pos => {
                    if (this.wouldCreateMatchAfterSwap(x, y, pos.x, pos.y)) {
                        this.possibleMoves.push({
                            from: { x, y },
                            to: { x: pos.x, y: pos.y }
                        });
                    }
                });
            }
        }
    }

    /**
     * Check if swapping two gems would create a match
     */
    wouldCreateMatchAfterSwap(x1, y1, x2, y2) {
        // Temporarily swap gems
        this.swapGems(x1, y1, x2, y2);

        // Check for matches
        const matches = this.findMatches();
        const hasMatches = matches.length > 0;

        // Swap back
        this.swapGems(x1, y1, x2, y2);

        return hasMatches;
    }

    /**
     * Get a hint for the player
     */
    getHint() {
        if (this.possibleMoves.length > 0) {
            const randomMove = Utils.randomChoice(this.possibleMoves);
            return randomMove;
        }
        return null;
    }

    /**
     * Show hint on the board
     */
    showHint() {
        this.clearHints();
        const hint = this.getHint();

        if (hint) {
            const gem1 = this.getGem(hint.from.x, hint.from.y);
            const gem2 = this.getGem(hint.to.x, hint.to.y);

            if (gem1) {
                gem1.hint = true;
                gem1.hintStartTime = Date.now();
                this.hints.push(gem1);
            }
            if (gem2) {
                gem2.hint = true;
                gem2.hintStartTime = Date.now();
                this.hints.push(gem2);
            }

            // Play hint sound
            if (window.gemsBlastApp?.game?.audioManager) {
                window.gemsBlastApp.game.audioManager.playSFX(SoundEffect.BUTTON_CLICK);
            }

            // Create hint arrow between gems
            this.createHintArrow(hint.from, hint.to);

            // Clear hints after 4 seconds
            setTimeout(() => this.clearHints(), 4000);

            console.log('Hint shown:', hint);
        } else {
            console.log('No valid moves found - shuffle needed!');
            // Suggest shuffle if no moves available
            if (window.gemsBlastApp?.game?.ui) {
                window.gemsBlastApp.game.ui.showNotification('No moves available! Use shuffle.', 'warning');
            }
        }
    }

    /**
     * Create visual arrow between hint gems
     * @param {Object} from - Starting position {x, y}
     * @param {Object} to - Ending position {x, y}
     */
    createHintArrow(from, to) {
        const fromPos = this.getCellCenterPosition(from.x, from.y);
        const toPos = this.getCellCenterPosition(to.x, to.y);

        // Calculate arrow direction
        const dx = toPos.x - fromPos.x;
        const dy = toPos.y - fromPos.y;
        const angle = Math.atan2(dy, dx);

        // Draw animated arrow on overlay
        this.drawHintArrow(fromPos, toPos, angle);
    }

    /**
     * Draw hint arrow
     * @param {Object} from - Start position
     * @param {Object} to - End position  
     * @param {number} angle - Arrow angle
     */
    drawHintArrow(from, to, angle) {
        // Create particles showing the swap direction
        if (this.particleSystem) {
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;

            // Create sparkle particles along the path
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const t = i / 5;
                    const x = from.x + (to.x - from.x) * t;
                    const y = from.y + (to.y - from.y) * t;

                    this.particleSystem.createParticle(x, y, '#FFD700', 1, 0.5);
                }, i * 100);
            }
        }
    }

    /**
     * Clear all hints
     */
    clearHints() {
        this.hints.forEach(gem => {
            gem.hint = false;
        });
        this.hints = [];
    }

    /**
     * Create floating score text at match location
     */
    createFloatingScoreText(x, y, score, matchSize) {
        const floatingText = document.createElement('div');
        floatingText.className = 'floating-score-match';

        // Determine color and size based on match size
        let fontSize = '1.5rem';
        let color = '#FFD700';
        let text = `+${score}`;

        if (matchSize >= 5) {
            fontSize = '2.5rem';
            color = '#FF69B4';
            text = `+${score}!`;
        } else if (matchSize >= 4) {
            fontSize = '2rem';
            color = '#FFA500';
            text = `+${score}!`;
        }

        floatingText.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            font-size: ${fontSize};
            font-weight: bold;
            color: ${color};
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8),
                        0 0 10px ${color};
            pointer-events: none;
            z-index: 9998;
            animation: floatUpScore 1.5s ease-out forwards;
            transform: translate(-50%, -50%);
        `;
        floatingText.textContent = text;

        document.body.appendChild(floatingText);

        // Remove after animation
        setTimeout(() => {
            if (floatingText.parentNode) {
                floatingText.parentNode.removeChild(floatingText);
            }
        }, 1500);
    }

    /**
     * Shuffle the board
     */
    shuffle() {
        const allGems = [];

        // Collect all gems
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const gem = this.getGem(x, y);
                if (gem) {
                    allGems.push(gem);
                }
            }
        }

        // Shuffle gems
        const shuffledGems = Utils.shuffleArray(allGems);

        // Place shuffled gems back
        let index = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (index < shuffledGems.length) {
                    const gem = shuffledGems[index];
                    gem.x = x;
                    gem.y = y;
                    gem.setTargetPosition(x, y);
                    this.setGem(x, y, gem);
                    index++;
                }
            }
        }

        this.updatePossibleMoves();
    }

    /**
     * Convert screen coordinates to grid coordinates
     */
    screenToGrid(screenX, screenY) {
        const canvasCoords = Utils.screenToCanvas(this.canvas, screenX, screenY);
        return Utils.pixelToGrid(
            canvasCoords.x,
            canvasCoords.y,
            this.cellSize,
            this.offsetX,
            this.offsetY
        );
    }

    /**
     * Handle click/touch on the board
     */
    handleClick(screenX, screenY) {
        if (this.animating) return false;

        const gridPos = this.screenToGrid(screenX, screenY);

        if (!Utils.isValidGridPosition(gridPos.x, gridPos.y, this.width, this.height)) {
            this.clearSelection();
            return false;
        }

        const clickedGem = this.getGem(gridPos.x, gridPos.y);
        if (!clickedGem) return false;

        // Handle power-up modes
        if (this.hammerMode && this.activePowerUp) {
            this.activePowerUp.useOnGem(this, gridPos.x, gridPos.y);
            return true;
        }

        if (this.colorBombMode && this.activePowerUp) {
            this.activePowerUp.useOnColor(this, clickedGem.color);
            return true;
        }

        // FIXED: Special gems (rocket, bomb) should NOT activate on click
        // They only activate when matched or combined with other special gems
        // Rainbow gems can still be selected for swapping
        if (clickedGem.type === GemType.ROCKET || clickedGem.type === GemType.BOMB) {
            // Don't activate - treat like normal gem for selection
            if (!this.selectedGem) {
                this.selectGem(clickedGem);
                return true;
            } else if (this.selectedGem === clickedGem) {
                this.clearSelection();
                return true;
            } else if (Utils.areAdjacent(
                this.selectedGem.x, this.selectedGem.y,
                clickedGem.x, clickedGem.y
            )) {
                // Check if swapping with a collectible in Stargazer mode
                const GemType = window.GemType || { STAR: 'star', SUN: 'sun', MOON: 'moon' };
                const isCollectibleSwap = (
                    (this.selectedGem.type === GemType.STAR || this.selectedGem.type === GemType.SUN || this.selectedGem.type === GemType.MOON) ||
                    (clickedGem.type === GemType.STAR || clickedGem.type === GemType.SUN || clickedGem.type === GemType.MOON)
                );
                
                if (isCollectibleSwap && this.gameMode && this.gameMode.name === 'Stargazer') {
                    // Allow swapping with collectibles to move them
                    this.swapGems(this.selectedGem.x, this.selectedGem.y, clickedGem.x, clickedGem.y);
                    this.clearSelection();
                    return true;
                }
                
                // First check if normal swap would create matches
                if (this.wouldCreateMatchAfterSwap(this.selectedGem.x, this.selectedGem.y, clickedGem.x, clickedGem.y)) {
                    // Valid swap - do normal swap
                    const swapResult = this.attemptSwap(this.selectedGem, clickedGem);
                    this.clearSelection();
                    return swapResult;
                }
                // If both are special gems, handle special combo
                else if (this.selectedGem.type !== GemType.NORMAL && clickedGem.type !== GemType.NORMAL) {
                    const comboResult = this.handleSpecialGemCombo(this.selectedGem, clickedGem);
                    this.clearSelection();
                    return comboResult;
                }
                // Invalid swap
                this.animateInvalidSwap(this.selectedGem, clickedGem);
                this.clearSelection();
                return false;
            } else {
                this.clearSelection();
                this.selectGem(clickedGem);
                return true;
            }
        }

        if (!this.selectedGem) {
            // First selection
            this.selectGem(clickedGem);
            return true;
        } else if (this.selectedGem === clickedGem) {
            // Deselect if clicking same gem
            this.clearSelection();
            return true;
        } else if (Utils.areAdjacent(
            this.selectedGem.x, this.selectedGem.y,
            clickedGem.x, clickedGem.y
        )) {
            // Check if swapping with a collectible in Stargazer mode
            const GemType = window.GemType || { STAR: 'star', SUN: 'sun', MOON: 'moon' };
            const isCollectibleSwap = (
                (this.selectedGem.type === GemType.STAR || this.selectedGem.type === GemType.SUN || this.selectedGem.type === GemType.MOON) ||
                (clickedGem.type === GemType.STAR || clickedGem.type === GemType.SUN || clickedGem.type === GemType.MOON)
            );
            
            if (isCollectibleSwap && this.gameMode && this.gameMode.name === 'Stargazer') {
                // Allow swapping with collectibles to move them
                this.swapGems(this.selectedGem.x, this.selectedGem.y, clickedGem.x, clickedGem.y);
                this.clearSelection();
                return true;
            }
            
            // First check if normal swap would create matches
            if (this.wouldCreateMatchAfterSwap(this.selectedGem.x, this.selectedGem.y, clickedGem.x, clickedGem.y)) {
                // Valid swap - do normal swap
                const swapResult = this.attemptSwap(this.selectedGem, clickedGem);
                this.clearSelection();
                return swapResult;
            }
            // If both are special gems, handle special combo
            else if (this.selectedGem.type !== GemType.NORMAL && clickedGem.type !== GemType.NORMAL) {
                const comboResult = this.handleSpecialGemCombo(this.selectedGem, clickedGem);
                this.clearSelection();
                return comboResult;
            }
            // Invalid swap
            this.animateInvalidSwap(this.selectedGem, clickedGem);
            this.clearSelection();
            return false;
        } else {
            // Select new gem
            this.clearSelection();
            this.selectGem(clickedGem);
            return true;
        }
    }

    /**
     * Activate a special gem
     */
    activateSpecialGem(gem) {
        console.log(`Activating special gem: ${gem.type} at (${gem.x}, ${gem.y})`);

        const effect = gem.getActivationEffect();
        if (!effect) return false;

        // Apply the effect
        const affectedGems = this.applySpecialEffect(effect);

        // Remove the activated gem
        this.setGem(gem.x, gem.y, null);
        gem.animateOut();

        // Trigger cascade if gems were affected
        if (affectedGems.length > 0) {
            // Emit custom event for game to handle
            if (window.gemsBlastApp && window.gemsBlastApp.game) {
                setTimeout(() => {
                    window.gemsBlastApp.game.processSpecialActivation(affectedGems);
                }, 300);
            }
        }

        return true;
    }

    /**
     * Handle special gem combinations
     */
    handleSpecialGemCombo(gem1, gem2) {
        console.log(`Special gem combo: ${gem1.type} + ${gem2.type}`);

        const combo = this.getComboEffect(gem1, gem2);
        if (!combo) return false;

        // Show combo notification
        this.showComboNotification(gem1.type, gem2.type, combo.type);

        // Remove both gems
        this.setGem(gem1.x, gem1.y, null);
        this.setGem(gem2.x, gem2.y, null);
        gem1.animateOut();
        gem2.animateOut();

        // Apply combo effect
        const affectedGems = this.applyComboEffect(combo);

        if (affectedGems.length > 0) {
            // Emit custom event for game to handle
            if (window.gemsBlastApp && window.gemsBlastApp.game) {
                setTimeout(() => {
                    window.gemsBlastApp.game.processSpecialActivation(affectedGems);
                }, 300);
            }
        }

        return true;
    }

    /**
     * Show combo notification
     */
    showComboNotification(type1, type2, comboType) {
        const messages = {
            'cross': '🚀 Double Rocket Combo! Cross Explosion!',
            'mega_rocket': '💥 Mega Striped! 3 Rows/Columns!',
            'double_bomb': '💣💣 Double Bomb! 5x5 Explosion!',
            'rainbow_rocket': '🌈🚀 Rainbow Rocket! Color Blast!',
            'rainbow_bomb': '🌈💣 Rainbow Bomb! 2 Colors Gone!',
            'double_rainbow': '🌈🌈 Double Rainbow! Board Clear!'
        };

        const message = messages[comboType] || 'Special Combo!';

        if (window.gemsBlastApp && window.gemsBlastApp.game && window.gemsBlastApp.game.ui) {
            window.gemsBlastApp.game.ui.showNotification(message, 'success');
        }
    }

    /**
     * Apply special gem effect
     */
    applySpecialEffect(effect) {
        const affectedGems = [];

        switch (effect.type) {
            case 'rocket':
                this.playSpecialSFX(SoundEffect.ROCKET);
                const rocketX = (effect.position.x + 0.5) * this.cellSize + this.offsetX;
                const rocketY = (effect.position.y + 0.5) * this.cellSize + this.offsetY;

                // Enhanced directional particle effect
                this.particleSystem.createDirectionalEffect(
                    rocketX,
                    rocketY,
                    effect.direction,
                    'sparkle',
                    30
                );

                // Add explosion at origin
                this.particleSystem.createExplosion(rocketX, rocketY, 'explosion', 15, 1.5);

                // Trigger screen shake
                if (window.gemsBlastApp && window.gemsBlastApp.game) {
                    window.gemsBlastApp.game.screenShake(8);
                }

                if (effect.direction === 'horizontal') {
                    // Clear entire row with gradual animation
                    for (let x = 0; x < this.width; x++) {
                        const gem = this.getGem(x, effect.position.y);
                        if (gem) {
                            affectedGems.push({ gem, x, y: effect.position.y });

                            // Gradual disappearance - delay based on distance from origin
                            const delay = Math.abs(x - effect.position.x) * 50;
                            setTimeout(() => {
                                this.setGem(x, effect.position.y, null);
                                gem.animateOut();

                                // Trail effect
                                const trailX = (x + 0.5) * this.cellSize + this.offsetX;
                                const trailY = (effect.position.y + 0.5) * this.cellSize + this.offsetY;
                                this.particleSystem.createExplosion(trailX, trailY, 'sparkle', 5, 0.8);
                            }, delay);
                        }
                    }
                } else {
                    // Clear entire column with gradual animation
                    for (let y = 0; y < this.height; y++) {
                        const gem = this.getGem(effect.position.x, y);
                        if (gem) {
                            affectedGems.push({ gem, x: effect.position.x, y });

                            // Gradual disappearance - delay based on distance from origin
                            const delay = Math.abs(y - effect.position.y) * 50;
                            setTimeout(() => {
                                this.setGem(effect.position.x, y, null);
                                gem.animateOut();

                                // Trail effect
                                const trailX = (effect.position.x + 0.5) * this.cellSize + this.offsetX;
                                const trailY = (y + 0.5) * this.cellSize + this.offsetY;
                                this.particleSystem.createExplosion(trailX, trailY, 'sparkle', 5, 0.8);
                            }, delay);
                        }
                    }
                }
                break;

            case 'bomb':
                this.playSpecialSFX(SoundEffect.BOMB);
                const bombX = (effect.position.x + 0.5) * this.cellSize + this.offsetX;
                const bombY = (effect.position.y + 0.5) * this.cellSize + this.offsetY;

                // Enhanced explosion particle effect
                this.particleSystem.createExplosion(bombX, bombY, 'explosion', 40, 2.0);

                // Trigger strong screen shake
                if (window.gemsBlastApp && window.gemsBlastApp.game) {
                    window.gemsBlastApp.game.screenShake(12);
                }

                // Clear 3x3 area with gradual animation
                const radius = effect.radius || 1;
                let delayCounter = 0;
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const x = effect.position.x + dx;
                        const y = effect.position.y + dy;

                        if (Utils.isValidGridPosition(x, y, this.width, this.height)) {
                            const gem = this.getGem(x, y);
                            if (gem) {
                                affectedGems.push({ gem, x, y });

                                // Gradual disappearance - delay based on distance from center
                                const distance = Math.abs(dx) + Math.abs(dy);
                                const delay = distance * 60;
                                setTimeout(() => {
                                    this.setGem(x, y, null);
                                    gem.animateOut();

                                    // Individual gem explosions
                                    const gemX = (x + 0.5) * this.cellSize + this.offsetX;
                                    const gemY = (y + 0.5) * this.cellSize + this.offsetY;
                                    this.particleSystem.createExplosion(gemX, gemY, 'explosion', 8, 1.0);
                                }, delay);
                            }
                        }
                    }
                }
                break;

            case 'rainbow':
                this.playSpecialSFX(SoundEffect.RAINBOW);
                const rainbowX = (effect.position.x + 0.5) * this.cellSize + this.offsetX;
                const rainbowY = (effect.position.y + 0.5) * this.cellSize + this.offsetY;

                // Enhanced rainbow particle effect
                this.particleSystem.createRainbowEffect(rainbowX, rainbowY, 50);

                // Trigger medium screen shake
                if (window.gemsBlastApp && window.gemsBlastApp.game) {
                    window.gemsBlastApp.game.screenShake(10);
                }

                // Remove all gems of the target color with gradual animation
                const targetColor = effect.color;
                let gemIndex = 0;
                for (let y = 0; y < this.height; y++) {
                    for (let x = 0; x < this.width; x++) {
                        const gem = this.getGem(x, y);
                        if (gem && gem.color === targetColor) {
                            affectedGems.push({ gem, x, y });

                            // Gradual disappearance - each gem after a delay
                            const delay = gemIndex * 40;
                            gemIndex++;

                            setTimeout(() => {
                                this.setGem(x, y, null);
                                gem.animateOut();

                                // Add particle effect for each removed gem
                                const gemX = (x + 0.5) * this.cellSize + this.offsetX;
                                const gemY = (y + 0.5) * this.cellSize + this.offsetY;
                                this.particleSystem.createColoredExplosion(gemX, gemY, targetColor, 3);
                            }, delay);
                        }
                    }
                }
                break;
        }

        return affectedGems;
    }

    /**
     * Play a sound effect for special gem activations
     */
    playSpecialSFX(effectName) {
        const audioManager = window.gemsBlastApp?.game?.audioManager;
        if (audioManager) {
            audioManager.playSFX(effectName);
        }
    }

    /**
     * Get combo effect for two special gems
     */
    getComboEffect(gem1, gem2) {
        const type1 = gem1.type;
        const type2 = gem2.type;

        // Rocket + Rocket = Cross explosion
        if (type1 === GemType.ROCKET && type2 === GemType.ROCKET) {
            return {
                type: 'cross',
                position: { x: gem1.x, y: gem1.y }
            };
        }

        // Rocket + Bomb = Mega rocket (3 rows/columns)
        if ((type1 === GemType.ROCKET && type2 === GemType.BOMB) ||
            (type1 === GemType.BOMB && type2 === GemType.ROCKET)) {
            const rocket = type1 === GemType.ROCKET ? gem1 : gem2;
            return {
                type: 'mega_rocket',
                position: { x: gem1.x, y: gem1.y },
                isHorizontal: rocket.isRocketHorizontal
            };
        }

        // Bomb + Bomb = Double explosion
        if (type1 === GemType.BOMB && type2 === GemType.BOMB) {
            return {
                type: 'double_bomb',
                position: { x: gem1.x, y: gem1.y }
            };
        }

        // Rainbow + Rocket = Transform all of color to rockets
        if ((type1 === GemType.RAINBOW && type2 === GemType.ROCKET) ||
            (type1 === GemType.ROCKET && type2 === GemType.RAINBOW)) {
            const rainbow = type1 === GemType.RAINBOW ? gem1 : gem2;
            const rocket = type1 === GemType.ROCKET ? gem1 : gem2;
            return {
                type: 'rainbow_rocket',
                color: rainbow.color,
                isHorizontal: rocket.isRocketHorizontal
            };
        }

        // Rainbow + Bomb = Remove 2 random colors
        if ((type1 === GemType.RAINBOW && type2 === GemType.BOMB) ||
            (type1 === GemType.BOMB && type2 === GemType.RAINBOW)) {
            return {
                type: 'rainbow_bomb'
            };
        }

        // Rainbow + Rainbow = Clear entire board
        if (type1 === GemType.RAINBOW && type2 === GemType.RAINBOW) {
            return {
                type: 'double_rainbow'
            };
        }

        return null;
    }

    /**
     * Apply combo effect
     */
    applyComboEffect(combo) {
        const affectedGems = [];

        switch (combo.type) {
            case 'cross':
                this.playSpecialSFX(SoundEffect.ROCKET);
                // Clear both row and column
                for (let x = 0; x < this.width; x++) {
                    const gem = this.getGem(x, combo.position.y);
                    if (gem) {
                        affectedGems.push({ gem, x, y: combo.position.y });
                        this.setGem(x, combo.position.y, null);
                        gem.animateOut();
                    }
                }
                for (let y = 0; y < this.height; y++) {
                    const gem = this.getGem(combo.position.x, y);
                    if (gem) {
                        affectedGems.push({ gem, x: combo.position.x, y });
                        this.setGem(combo.position.x, y, null);
                        gem.animateOut();
                    }
                }
                break;

            case 'mega_rocket':
                this.playSpecialSFX(SoundEffect.ROCKET);
                // Clear 3 rows or 3 columns
                if (combo.isHorizontal) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const y = combo.position.y + dy;
                        if (Utils.isValidGridPosition(0, y, this.width, this.height)) {
                            for (let x = 0; x < this.width; x++) {
                                const gem = this.getGem(x, y);
                                if (gem) {
                                    affectedGems.push({ gem, x, y });
                                    this.setGem(x, y, null);
                                    gem.animateOut();
                                }
                            }
                        }
                    }
                } else {
                    for (let dx = -1; dx <= 1; dx++) {
                        const x = combo.position.x + dx;
                        if (Utils.isValidGridPosition(x, 0, this.width, this.height)) {
                            for (let y = 0; y < this.height; y++) {
                                const gem = this.getGem(x, y);
                                if (gem) {
                                    affectedGems.push({ gem, x, y });
                                    this.setGem(x, y, null);
                                    gem.animateOut();
                                }
                            }
                        }
                    }
                }
                break;

            case 'double_bomb':
                this.playSpecialSFX(SoundEffect.BOMB);
                // 5x5 explosion
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const x = combo.position.x + dx;
                        const y = combo.position.y + dy;

                        if (Utils.isValidGridPosition(x, y, this.width, this.height)) {
                            const gem = this.getGem(x, y);
                            if (gem) {
                                affectedGems.push({ gem, x, y });
                                this.setGem(x, y, null);
                                gem.animateOut();
                            }
                        }
                    }
                }
                break;

            case 'rainbow_rocket':
                this.playSpecialSFX(SoundEffect.RAINBOW);
                // Transform all gems of color to rockets and activate them ONE BY ONE
                const targetColor = combo.color;
                const rocketsToActivate = [];

                for (let y = 0; y < this.height; y++) {
                    for (let x = 0; x < this.width; x++) {
                        const gem = this.getGem(x, y);
                        if (gem && gem.color === targetColor) {
                            // Create rocket gem
                            const rocket = Gem.createSpecial(x, y, targetColor, 'rocket', combo.isHorizontal);
                            this.setGem(x, y, rocket);
                            rocketsToActivate.push(rocket);
                        }
                    }
                }

                // Activate all rockets one by one with delay
                rocketsToActivate.forEach((rocket, index) => {
                    setTimeout(() => {
                        this.activateSpecialGem(rocket);
                    }, 500 + (index * 300)); // 300ms delay between each rocket
                });
                break;

            case 'rainbow_bomb':
                this.playSpecialSFX(SoundEffect.RAINBOW);
                // Remove 2 random colors
                const allColors = Object.values(GemColor);
                const colorsToRemove = Utils.shuffleArray(allColors).slice(0, 2);

                colorsToRemove.forEach(color => {
                    for (let y = 0; y < this.height; y++) {
                        for (let x = 0; x < this.width; x++) {
                            const gem = this.getGem(x, y);
                            if (gem && gem.color === color) {
                                affectedGems.push({ gem, x, y });
                                this.setGem(x, y, null);
                                gem.animateOut();
                            }
                        }
                    }
                });
                break;

            case 'double_rainbow':
                this.playSpecialSFX(SoundEffect.RAINBOW);
                // Clear entire board
                for (let y = 0; y < this.height; y++) {
                    for (let x = 0; x < this.width; x++) {
                        const gem = this.getGem(x, y);
                        if (gem) {
                            affectedGems.push({ gem, x, y });
                            this.setGem(x, y, null);
                            gem.animateOut();
                        }
                    }
                }
                break;
        }

        return affectedGems;
    }

    /**
     * Select a gem
     */
    selectGem(gem) {
        this.clearSelection();
        this.selectedGem = gem;
        gem.selected = true;
    }

    /**
     * Clear gem selection
     */
    clearSelection() {
        if (this.selectedGem) {
            this.selectedGem.selected = false;
            this.selectedGem = null;
        }
    }

    /**
     * Attempt to swap two gems
     */
    attemptSwap(gem1, gem2) {
        // Check if swap would create matches
        if (this.wouldCreateMatchAfterSwap(gem1.x, gem1.y, gem2.x, gem2.y)) {
            console.log('Valid swap - will create matches');
            // Store the position where the user moved the gem TO (gem2's original position)
            this.lastSwapPosition = { x: gem2.x, y: gem2.y };
            this.swapGems(gem1.x, gem1.y, gem2.x, gem2.y);
            return true;
        }

        console.log('Invalid swap - no matches created');
        // Animate invalid swap - move and reverse back
        this.animateInvalidSwap(gem1, gem2);
        return false;
    }

    /**
     * Animate an invalid swap attempt
     */
    animateInvalidSwap(gem1, gem2) {
        const duration = 200; // ms for each direction

        // Store original positions
        const gem1OrigX = gem1.targetX;
        const gem1OrigY = gem1.targetY;
        const gem2OrigX = gem2.targetX;
        const gem2OrigY = gem2.targetY;

        // Move gems to swapped positions
        gem1.setTargetPosition(gem2OrigX, gem2OrigY);
        gem2.setTargetPosition(gem1OrigX, gem1OrigY);

        // After animation completes, reverse back
        setTimeout(() => {
            gem1.setTargetPosition(gem1OrigX, gem1OrigY);
            gem2.setTargetPosition(gem2OrigX, gem2OrigY);
        }, duration);
    }

    /**
     * Update board state
     */
    update(deltaTime) {
        let allStatic = true;

        // Update all gems
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const gem = this.getGem(x, y);
                if (gem) {
                    gem.updatePosition(deltaTime);
                    if (!gem.isAtTargetPosition() || gem.animating) {
                        allStatic = false;
                    }
                }
            }
        }

        // Update particle system
        this.particleSystem.update(deltaTime);

        this.animating = !allStatic;

        // Update possible moves if board is static
        if (allStatic) {
            this.updatePossibleMoves();
        }
    }

    /**
     * Set the game mode for this board
     * @param {GameMode} gameMode - The game mode instance
     */
    setGameMode(gameMode) {
        this.gameMode = gameMode;
        // Don't re-initialize here since it's already initialized in the game class
    }

    /**
     * Get the current game mode
     * @returns {GameMode|null}
     */
    getGameMode() {
        return this.gameMode;
    }

    /**
     * Render the board
     */
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background grid
        this.drawGrid();

        // Draw mode-specific background elements (e.g., plates, stars)
        if (this.gameMode && typeof this.gameMode.renderPlates === 'function') {
            this.gameMode.renderPlates(this.ctx, this.offsetX, this.offsetY, this.cellSize);
        }

        // Draw constellation stars for Stargazer mode
        if (this.gameMode && typeof this.gameMode.renderStars === 'function') {
            this.gameMode.renderStars(this.ctx, this.offsetX, this.offsetY, this.cellSize);
        }

        // Draw gems
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const gem = this.getGem(x, y);
                if (gem) {
                    this.gemRenderer.drawGem(gem, this.offsetX, this.offsetY);
                }
            }
        }

        // Draw particle effects on top
        this.particleSystem.render();
    }

    /**
     * Draw the background grid
     */
    drawGrid() {
        const ctx = this.ctx;

        ctx.strokeStyle = 'rgba(139, 69, 19, 0.3)';
        ctx.lineWidth = 1;

        // Draw grid lines
        for (let x = 0; x <= this.width; x++) {
            const pixelX = this.offsetX + x * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(pixelX, this.offsetY);
            ctx.lineTo(pixelX, this.offsetY + this.height * this.cellSize);
            ctx.stroke();
        }

        for (let y = 0; y <= this.height; y++) {
            const pixelY = this.offsetY + y * this.cellSize;
            ctx.beginPath();
            ctx.moveTo(this.offsetX, pixelY);
            ctx.lineTo(this.offsetX + this.width * this.cellSize, pixelY);
            ctx.stroke();
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const eventTypes = Utils.getEventTypes();

        // Touch/mouse start
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        let isDragging = false;
        let draggedGem = null;
        let dragStartGridPos = null;

        this.canvas.addEventListener(eventTypes.start, (event) => {
            event.preventDefault();
            const coords = Utils.getEventCoordinates(event);
            touchStartX = coords.x;
            touchStartY = coords.y;
            touchStartTime = Date.now();
            isDragging = false;
            draggedGem = null;

            // Get the gem at start position
            const gridPos = this.screenToGrid(coords.x, coords.y);
            if (Utils.isValidGridPosition(gridPos.x, gridPos.y, this.width, this.height)) {
                draggedGem = this.getGem(gridPos.x, gridPos.y);
                dragStartGridPos = gridPos;
            }

            // Still handle click for selection
            this.handleClick(coords.x, coords.y);
        });

        // Touch/mouse move for drag detection
        this.canvas.addEventListener(eventTypes.move, (event) => {
            if (!touchStartX || !touchStartY) return;

            const coords = Utils.getEventCoordinates(event);
            const deltaX = coords.x - touchStartX;
            const deltaY = coords.y - touchStartY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // Mark as dragging if moved more than 10 pixels
            if (distance > 10) {
                isDragging = true;

                // Handle drag-and-drop swap
                if (draggedGem && dragStartGridPos) {
                    const currentGridPos = this.screenToGrid(coords.x, coords.y);

                    // Check if we've moved to an adjacent cell
                    if (Utils.isValidGridPosition(currentGridPos.x, currentGridPos.y, this.width, this.height) &&
                        Utils.areAdjacent(dragStartGridPos.x, dragStartGridPos.y, currentGridPos.x, currentGridPos.y) &&
                        (currentGridPos.x !== dragStartGridPos.x || currentGridPos.y !== dragStartGridPos.y)) {

                        const targetGem = this.getGem(currentGridPos.x, currentGridPos.y);
                        if (targetGem && !this.animating) {
                            // First check if normal swap would create matches
                            if (this.wouldCreateMatchAfterSwap(draggedGem.x, draggedGem.y, targetGem.x, targetGem.y)) {
                                // Valid swap - do normal swap
                                this.attemptSwap(draggedGem, targetGem);
                            }
                            // If both are special gems, handle special combo
                            else if (draggedGem.type !== GemType.NORMAL && targetGem.type !== GemType.NORMAL) {
                                this.handleSpecialGemCombo(draggedGem, targetGem);
                            }
                            // Invalid swap - animate rejection
                            else {
                                this.animateInvalidSwap(draggedGem, targetGem);
                            }

                            // Clear drag state after swap
                            draggedGem = null;
                            dragStartGridPos = null;
                            touchStartX = 0;
                            touchStartY = 0;
                            isDragging = false;
                        }
                    }
                }
            }
        });

        // Touch/mouse end for swipe gesture
        this.canvas.addEventListener(eventTypes.end, (event) => {
            // Clear drag state
            draggedGem = null;
            dragStartGridPos = null;

            if (!touchStartX || !touchStartY || !isDragging) {
                touchStartX = 0;
                touchStartY = 0;
                return;
            }

            const coords = Utils.getEventCoordinates(event);
            const deltaX = coords.x - touchStartX;
            const deltaY = coords.y - touchStartY;
            const deltaTime = Date.now() - touchStartTime;

            // Only process swipes that are quick enough (< 300ms) and long enough
            if (deltaTime < 300 && (Math.abs(deltaX) > 30 || Math.abs(deltaY) > 30)) {
                this.handleSwipe(touchStartX, touchStartY, deltaX, deltaY);
            }

            touchStartX = 0;
            touchStartY = 0;
            isDragging = false;
        });
    }

    /**
     * Handle swipe gesture for mobile
     */
    handleSwipe(startX, startY, deltaX, deltaY) {
        if (this.animating) return;

        // Get starting grid position
        const gridPos = this.screenToGrid(startX, startY);
        if (!Utils.isValidGridPosition(gridPos.x, gridPos.y, this.width, this.height)) {
            return;
        }

        const startGem = this.getGem(gridPos.x, gridPos.y);
        if (!startGem) return;

        // Determine swipe direction
        let targetX = gridPos.x;
        let targetY = gridPos.y;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            targetX += deltaX > 0 ? 1 : -1;
        } else {
            // Vertical swipe
            targetY += deltaY > 0 ? 1 : -1;
        }

        // Validate target position
        if (!Utils.isValidGridPosition(targetX, targetY, this.width, this.height)) {
            return;
        }

        const targetGem = this.getGem(targetX, targetY);
        if (!targetGem) return;

        // First check if normal swap would create matches
        if (this.wouldCreateMatchAfterSwap(startGem.x, startGem.y, targetGem.x, targetGem.y)) {
            // Valid swap - do normal swap
            this.attemptSwap(startGem, targetGem);
        }
        // If both are special gems, handle special combo
        else if (startGem.type !== GemType.NORMAL && targetGem.type !== GemType.NORMAL) {
            this.handleSpecialGemCombo(startGem, targetGem);
        }
        // Invalid swap - animate rejection
        else {
            this.animateInvalidSwap(startGem, targetGem);
        }
    }

    /**
     * Resize the board for responsive design
     */
    resize() {
        this.cellSize = Math.min(this.canvas.width / this.width, this.canvas.height / this.height);
        this.offsetX = (this.canvas.width - (this.width * this.cellSize)) / 2;
        this.offsetY = (this.canvas.height - (this.height * this.cellSize)) / 2;
        this.gemRenderer.updateCellSize(this.cellSize);
    }

    /**
     * Get board state for saving
     */
    getState() {
        const state = {
            width: this.width,
            height: this.height,
            grid: []
        };

        for (let y = 0; y < this.height; y++) {
            state.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                const gem = this.getGem(x, y);
                state.grid[y][x] = gem ? gem.toJSON() : null;
            }
        }

        return state;
    }

    /**
     * Load board state
     */
    loadState(state) {
        this.width = state.width;
        this.height = state.height;
        this.grid = [];

        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                const gemData = state.grid[y][x];
                this.grid[y][x] = gemData ? Gem.fromJSON(gemData) : null;
            }
        }

        this.resize();
        this.updatePossibleMoves();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameBoard;
}