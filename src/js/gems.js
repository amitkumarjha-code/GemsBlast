/* ==========================================================================
   GemsBlast Game - Gem System
   ========================================================================== */

/**
 * Gem Types Enumeration
 */
const GemType = {
    NORMAL: 'normal',
    ROCKET: 'rocket',
    BOMB: 'bomb',
    RAINBOW: 'rainbow',
    STAR: 'star',
    SUN: 'sun',
    MOON: 'moon'
};

/**
 * Gem Colors Enumeration
 */
const GemColor = {
    RED: 'red',
    BLUE: 'blue',
    GREEN: 'green',
    YELLOW: 'yellow',
    PURPLE: 'purple',
    ORANGE: 'orange'
};

/**
 * Gem class representing individual gems on the board
 */
class Gem {
    constructor(x, y, color, type = GemType.NORMAL) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.id = Utils.generateId();

        // Visual properties
        this.size = 0;
        this.targetSize = 1;
        this.opacity = 1;
        this.rotation = 0;
        this.scale = 1;

        // Animation properties
        this.animating = false;
        this.falling = false;
        this.fallSpeed = 0;
        this.selected = false;
        this.hint = false;

        // Position interpolation for smooth movement
        this.currentX = x;
        this.currentY = y;
        this.targetX = x;
        this.targetY = y;

        // Special gem properties
        this.isRocketHorizontal = false; // For rocket gems
        this.bombRadius = 1; // For bomb gems

        // Initialize size animation
        this.animateIn();
    }

    /**
     * Create a random normal gem
     */
    static createRandom(x, y) {
        const colors = Object.values(GemColor);
        const randomColor = Utils.randomChoice(colors);
        return new Gem(x, y, randomColor);
    }

    /**
     * Create a special gem based on match type
     */
    static createSpecial(x, y, color, matchType, isHorizontal = false) {
        let type = GemType.NORMAL;

        switch (matchType) {
            case 'rocket':
                type = GemType.ROCKET;
                break;
            case 'bomb':
            case 'tshape':
            case 'lshape':
                type = GemType.BOMB;
                break;
            case 'rainbow':
                type = GemType.RAINBOW;
                break;
        }

        const gem = new Gem(x, y, color, type);
        if (type === GemType.ROCKET) {
            gem.isRocketHorizontal = isHorizontal;
        }

        // Add special creation animation
        gem.scale = 0;
        Utils.animateValue(0, 1.2, 400, (value) => {
            gem.scale = value;
        }, 'easeOutBounce').then(() => {
            Utils.animateValue(1.2, 1, 200, (value) => {
                gem.scale = value;
            }, 'easeOutCubic');
        });

        return gem;
    }

    /**
     * Animate gem appearance
     */
    animateIn() {
        this.size = 0;
        this.targetSize = 1;
        this.animating = true;

        Utils.animateValue(0, 1, 300, (value) => {
            this.size = value;
        }, 'easeOutBounce').then(() => {
            this.animating = false;
        });
    }

    /**
     * Animate gem disappearance
     */
    animateOut() {
        this.animating = true;

        return Utils.animateValue(1, 0, 200, (value) => {
            this.size = value;
            this.opacity = value;
        }, 'easeInCubic');
    }

    /**
     * Set target position for smooth movement
     */
    setTargetPosition(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    /**
     * Update gem position with interpolation
     */
    updatePosition(deltaTime) {
        const speed = 8; // Animation speed

        if (this.falling) {
            // Apply gravity when falling
            this.fallSpeed += 0.5;
            this.currentY += this.fallSpeed * deltaTime;

            if (this.currentY >= this.targetY) {
                this.currentY = this.targetY;
                this.falling = false;
                this.fallSpeed = 0;
            }
        } else {
            // Smooth interpolation to target position
            const dx = this.targetX - this.currentX;
            const dy = this.targetY - this.currentY;

            if (Math.abs(dx) > 0.01) {
                this.currentX += dx * speed * deltaTime;
            } else {
                this.currentX = this.targetX;
            }

            if (Math.abs(dy) > 0.01) {
                this.currentY += dy * speed * deltaTime;
            } else {
                this.currentY = this.targetY;
            }
        }

        // Update grid position when movement is complete
        if (Math.abs(this.currentX - this.targetX) < 0.01 &&
            Math.abs(this.currentY - this.targetY) < 0.01) {
            this.x = this.targetX;
            this.y = this.targetY;
        }
    }

    /**
     * Start falling animation
     */
    startFalling(targetY) {
        this.falling = true;
        this.fallSpeed = 0;
        this.targetY = targetY;
    }

    /**
     * Get gem color as hex value
     */
    getColorHex() {
        const colorMap = {
            [GemColor.RED]: '#E53E3E',
            [GemColor.BLUE]: '#3182CE',
            [GemColor.GREEN]: '#38A169',
            [GemColor.YELLOW]: '#D69E2E',
            [GemColor.PURPLE]: '#805AD5',
            [GemColor.ORANGE]: '#DD6B20'
        };
        return colorMap[this.color] || '#FFFFFF';
    }

    /**
     * Get gem display size based on current animation state
     */
    getDisplaySize() {
        let displaySize = this.size * this.scale;

        if (this.selected) {
            displaySize *= 1.1;
        }

        if (this.hint) {
            // Pulsing effect for hints
            const time = Date.now() / 500;
            displaySize *= 1 + Math.sin(time) * 0.1;
        }

        return displaySize;
    }

    /**
     * Check if gem is at its target position
     */
    isAtTargetPosition() {
        return Math.abs(this.currentX - this.targetX) < 0.01 &&
            Math.abs(this.currentY - this.targetY) < 0.01;
    }

    /**
     * Check if gem can be matched with another gem
     */
    canMatchWith(otherGem) {
        if (!otherGem) {
            return false;
        }

        // Rainbow gems should NEVER be matched automatically - only activated by swapping
        if (this.type === GemType.RAINBOW || otherGem.type === GemType.RAINBOW) {
            return false;
        }

        // Collectibles (star, sun, moon) cannot be matched
        if (this.type === GemType.STAR || this.type === GemType.SUN || this.type === GemType.MOON ||
            otherGem.type === GemType.STAR || otherGem.type === GemType.SUN || otherGem.type === GemType.MOON) {
            return false;
        }

        // Rockets and Bombs CAN match with anything of the same color (including each other)
        // This allows: normal + normal + rocket, or rocket + rocket, etc.
        return this.color === otherGem.color;
    }

    /**
     * Get the effect this gem will have when activated
     */
    getActivationEffect() {
        switch (this.type) {
            case GemType.ROCKET:
                return {
                    type: 'rocket',
                    direction: this.isRocketHorizontal ? 'horizontal' : 'vertical',
                    position: { x: this.x, y: this.y }
                };

            case GemType.BOMB:
                return {
                    type: 'bomb',
                    radius: this.bombRadius,
                    position: { x: this.x, y: this.y }
                };

            case GemType.RAINBOW:
                return {
                    type: 'rainbow',
                    color: this.color,
                    position: { x: this.x, y: this.y }
                };

            default:
                return null;
        }
    }

    /**
     * Clone this gem
     */
    clone() {
        const cloned = new Gem(this.x, this.y, this.color, this.type);
        cloned.isRocketHorizontal = this.isRocketHorizontal;
        cloned.bombRadius = this.bombRadius;
        cloned.size = this.size;
        cloned.targetSize = this.targetSize;
        cloned.opacity = this.opacity;
        cloned.rotation = this.rotation;
        cloned.scale = this.scale;
        return cloned;
    }

    /**
     * Convert gem to JSON for saving
     */
    toJSON() {
        return {
            x: this.x,
            y: this.y,
            color: this.color,
            type: this.type,
            isRocketHorizontal: this.isRocketHorizontal,
            bombRadius: this.bombRadius
        };
    }

    /**
     * Create gem from JSON data
     */
    static fromJSON(data) {
        const gem = new Gem(data.x, data.y, data.color, data.type);
        gem.isRocketHorizontal = data.isRocketHorizontal || false;
        gem.bombRadius = data.bombRadius || 1;
        return gem;
    }
}

/**
 * Gem Renderer class for drawing gems on canvas
 */
class GemRenderer {
    constructor(canvas, cellSize) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = cellSize;

        // Cached gradients for better performance
        this.gradientCache = new Map();
    }

    /**
     * Draw a single gem
     */
    drawGem(gem, offsetX = 0, offsetY = 0) {
        const ctx = this.ctx;
        const size = this.cellSize * 0.8 * gem.getDisplaySize();
        const centerX = (gem.currentX * this.cellSize) + offsetX + (this.cellSize / 2);
        const centerY = (gem.currentY * this.cellSize) + offsetY + (this.cellSize / 2);

        ctx.save();
        ctx.globalAlpha = gem.opacity;
        ctx.translate(centerX, centerY);
        ctx.rotate(gem.rotation);

        // Draw based on gem type
        switch (gem.type) {
            case GemType.NORMAL:
                this.drawNormalGem(ctx, size, gem.color, gem.selected, gem.hint);
                break;
            case GemType.ROCKET:
                this.drawRocketGem(ctx, size, gem.color, gem.isRocketHorizontal, gem.hint);
                break;
            case GemType.BOMB:
                this.drawBombGem(ctx, size, gem.color, gem.hint);
                break;
            case GemType.RAINBOW:
                this.drawRainbowGem(ctx, size, gem.hint);
                break;
            case GemType.STAR:
                this.drawStarCollectible(ctx, size);
                break;
            case GemType.SUN:
                this.drawSunCollectible(ctx, size);
                break;
            case GemType.MOON:
                this.drawMoonCollectible(ctx, size);
                break;
        }

        ctx.restore();
    }

    /**
     * Draw a normal gem as a fruit
     */
    drawNormalGem(ctx, size, color, selected = false, hint = false) {
        const radius = size / 2;
        
        // Draw different fruit based on color
        switch(color) {
            case GemColor.RED:
                this.drawStrawberry(ctx, radius, selected);
                break;
            case GemColor.ORANGE:
                this.drawOrange(ctx, radius, selected);
                break;
            case GemColor.YELLOW:
                this.drawBanana(ctx, radius, selected);
                break;
            case GemColor.GREEN:
                this.drawGrape(ctx, radius, selected);
                break;
            case GemColor.BLUE:
                this.drawBlueberry(ctx, radius, selected);
                break;
            case GemColor.PURPLE:
                this.drawPlum(ctx, radius, selected);
                break;
        }

        // Draw hint glow
        if (hint) {
            const now = Date.now();
            const pulseSpeed = 400;
            const pulsePhase = (now % pulseSpeed) / pulseSpeed;
            const pulseIntensity = 0.5 + Math.sin(pulsePhase * Math.PI * 2) * 0.4;

            ctx.save();
            ctx.globalAlpha = pulseIntensity * 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 6;
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.globalAlpha = pulseIntensity * 0.8;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.15, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFEB3B';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();
        }
    }

    /**
     * Draw a strawberry (red)
     */
    drawStrawberry(ctx, radius, selected) {
        // Draw strawberry body
        ctx.fillStyle = '#FF3B3B';
        ctx.beginPath();
        ctx.ellipse(0, radius * 0.1, radius * 0.8, radius * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        
        if (selected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Draw seeds
        ctx.fillStyle = '#FFEB3B';
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * radius * 0.4;
            const y = Math.sin(angle) * radius * 0.5 + radius * 0.1;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw green leaf top
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.moveTo(-radius * 0.4, -radius * 0.6);
        ctx.lineTo(0, -radius * 0.8);
        ctx.lineTo(radius * 0.4, -radius * 0.6);
        ctx.lineTo(0, -radius * 0.4);
        ctx.closePath();
        ctx.fill();
    }

    /**
     * Draw an orange
     */
    drawOrange(ctx, radius, selected) {
        // Draw orange body
        const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
        gradient.addColorStop(0, '#FFB74D');
        gradient.addColorStop(1, '#FF9800');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        if (selected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Draw texture dots
        ctx.fillStyle = 'rgba(230, 120, 0, 0.3)';
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius * 0.7;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw small leaf
        ctx.fillStyle = '#66BB6A';
        ctx.beginPath();
        ctx.ellipse(0, -radius * 0.9, radius * 0.15, radius * 0.25, -0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw a pink dragon fruit
     */
    drawBanana(ctx, radius, selected) {
        // Draw dragon fruit body (oval shape)
        const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
        gradient.addColorStop(0, '#FF69B4');
        gradient.addColorStop(0.7, '#FF1493');
        gradient.addColorStop(1, '#C71585');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.85, radius, 0, 0, Math.PI * 2);
        ctx.fill();

        if (selected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Draw scale-like texture pattern
        ctx.fillStyle = 'rgba(144, 238, 144, 0.7)';
        for (let row = -2; row <= 2; row++) {
            for (let col = -2; col <= 2; col++) {
                const x = col * radius * 0.35;
                const y = row * radius * 0.35;
                const dist = Math.sqrt(x * x + y * y);
                if (dist < radius * 0.85) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x - radius * 0.1, y - radius * 0.15);
                    ctx.lineTo(x + radius * 0.1, y - radius * 0.15);
                    ctx.closePath();
                    ctx.fill();
                }
            }
        }

        // Draw green leafy top
        ctx.fillStyle = '#7CB342';
        const leafCount = 6;
        for (let i = 0; i < leafCount; i++) {
            const angle = (i / leafCount) * Math.PI * 2 - Math.PI / 2;
            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.ellipse(0, -radius * 0.9, radius * 0.15, radius * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Add white seeds/dots inside
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius * 0.6;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Draw green apple
     */
    drawGrape(ctx, radius, selected) {
        // Draw apple body (slightly wider at bottom)
        const appleGradient = ctx.createRadialGradient(-radius * 0.35, -radius * 0.35, 0, 0, 0, radius * 1.1);
        appleGradient.addColorStop(0, '#A8E063');
        appleGradient.addColorStop(0.6, '#8BC34A');
        appleGradient.addColorStop(1, '#689F38');
        ctx.fillStyle = appleGradient;
        
        // Apple body shape
        ctx.beginPath();
        ctx.ellipse(0, radius * 0.1, radius * 0.9, radius, 0, 0, Math.PI * 2);
        ctx.fill();

        if (selected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Draw indent at top
        ctx.fillStyle = '#689F38';
        ctx.beginPath();
        ctx.ellipse(0, -radius * 0.7, radius * 0.2, radius * 0.15, 0, 0, Math.PI);
        ctx.fill();

        // Draw brown stem
        ctx.fillStyle = '#6D4C41';
        ctx.beginPath();
        ctx.rect(-radius * 0.08, -radius * 0.95, radius * 0.16, radius * 0.35);
        ctx.fill();

        // Draw leaf
        ctx.fillStyle = '#66BB6A';
        ctx.save();
        ctx.translate(radius * 0.25, -radius * 0.85);
        ctx.rotate(0.4);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.3, radius * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Leaf vein
        ctx.strokeStyle = '#558B2F';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.25, 0);
        ctx.lineTo(radius * 0.25, 0);
        ctx.stroke();
        ctx.restore();

        // Add highlight for shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(-radius * 0.4, -radius * 0.2, radius * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Small highlight dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(-radius * 0.35, -radius * 0.15, radius * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw blueberry (blue)
     */
    drawBlueberry(ctx, radius, selected) {
        // Draw blueberry body
        const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
        gradient.addColorStop(0, '#64B5F6');
        gradient.addColorStop(1, '#1976D2');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        if (selected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Draw crown at top
        ctx.fillStyle = '#424242';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * radius * 0.3;
            const y = Math.sin(angle) * radius * 0.3 - radius * 0.7;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Draw plum (purple)
     */
    /**
     * Draw purple grapes
     */
    drawPlum(ctx, radius, selected) {
        const grapeRadius = radius * 0.32;
        
        // Draw purple grape cluster
        const positions = [
            [0, -radius * 0.4],
            [-grapeRadius * 0.85, -radius * 0.15],
            [grapeRadius * 0.85, -radius * 0.15],
            [-grapeRadius * 1.3, radius * 0.15],
            [0, radius * 0.15],
            [grapeRadius * 1.3, radius * 0.15],
            [-grapeRadius * 0.85, radius * 0.5],
            [grapeRadius * 0.85, radius * 0.5],
            [0, radius * 0.7]
        ];

        positions.forEach(([x, y]) => {
            const grapeGradient = ctx.createRadialGradient(x - grapeRadius * 0.3, y - grapeRadius * 0.3, 0, x, y, grapeRadius);
            grapeGradient.addColorStop(0, '#BA68C8');
            grapeGradient.addColorStop(0.6, '#9C27B0');
            grapeGradient.addColorStop(1, '#6A1B9A');
            ctx.fillStyle = grapeGradient;
            ctx.beginPath();
            ctx.arc(x, y, grapeRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add highlight to each grape
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(x - grapeRadius * 0.25, y - grapeRadius * 0.25, grapeRadius * 0.2, 0, Math.PI * 2);
            ctx.fill();
        });

        if (selected) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw brown stem at top
        ctx.strokeStyle = '#795548';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.6);
        ctx.lineTo(0, -radius * 1.0);
        ctx.stroke();

        // Draw green leaf
        ctx.fillStyle = '#66BB6A';
        ctx.save();
        ctx.translate(radius * 0.35, -radius * 0.9);
        ctx.rotate(0.5);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.28, radius * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Leaf vein
        ctx.strokeStyle = '#558B2F';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-radius * 0.25, 0);
        ctx.lineTo(radius * 0.25, 0);
        ctx.stroke();
        ctx.restore();

        // Add another leaf on the other side
        ctx.fillStyle = '#66BB6A';
        ctx.save();
        ctx.translate(-radius * 0.3, -radius * 0.95);
        ctx.rotate(-0.4);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.25, radius * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Draw a rocket gem - Enhanced visual (FULL REPLACEMENT)
     */
    drawRocketGem(ctx, size, color, isHorizontal, hint = false) {
        const radius = size / 2 * 1.1; // 10% larger

        // Get base color for the gem type
        const baseColor = this.getGemColorHex(color);

        // Draw rocket body with darker, more solid gradient for visibility
        const rocketGradient = ctx.createLinearGradient(
            0, -radius * 0.6,
            0, radius * 0.6
        );
        // Use much darker colors for better visibility against fruits
        const lightColor = this.darkenColor(baseColor, 0.2);
        const medColor = this.darkenColor(baseColor, 0.4);
        const darkColor = this.darkenColor(baseColor, 0.6);

        rocketGradient.addColorStop(0, lightColor);
        rocketGradient.addColorStop(0.5, medColor);
        rocketGradient.addColorStop(1, darkColor);

        ctx.save();

        if (isHorizontal) {
            // Horizontal rocket shape - FULL SIZE
            ctx.fillStyle = rocketGradient;

            // Main rocket body
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * 0.8, radius * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Add dark outline for visibility
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Rocket nose cone
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(radius * 0.7, 0);
            ctx.lineTo(radius * 0.4, -radius * 0.3);
            ctx.lineTo(radius * 0.4, radius * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Rocket fins (bottom)
            ctx.fillStyle = '#FF4400';
            ctx.beginPath();
            ctx.moveTo(-radius * 0.7, -radius * 0.5);
            ctx.lineTo(-radius * 0.9, -radius * 0.7);
            ctx.lineTo(-radius * 0.5, -radius * 0.5);
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(-radius * 0.7, radius * 0.5);
            ctx.lineTo(-radius * 0.9, radius * 0.7);
            ctx.lineTo(-radius * 0.5, radius * 0.5);
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Window
            ctx.fillStyle = '#87CEEB';
            ctx.strokeStyle = '#4682B4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(radius * 0.1, 0, radius * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Color stripe indicator - makes color more obvious
            ctx.fillStyle = baseColor;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(-radius * 0.3, -radius * 0.15, radius * 0.6, radius * 0.3);
            ctx.globalAlpha = 1.0;

            // Flame trail
            const flameGradient = ctx.createLinearGradient(-radius * 0.7, 0, -radius * 1.2, 0);
            flameGradient.addColorStop(0, '#FFD700');
            flameGradient.addColorStop(0.5, '#FF8C00');
            flameGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');

            ctx.fillStyle = flameGradient;
            ctx.beginPath();
            ctx.moveTo(-radius * 0.7, 0);
            ctx.lineTo(-radius * 1.1, -radius * 0.2);
            ctx.lineTo(-radius * 1.1, radius * 0.2);
            ctx.closePath();
            ctx.fill();

        } else {
            // Vertical rocket shape - FULL SIZE
            ctx.fillStyle = rocketGradient;

            // Main rocket body
            ctx.beginPath();
            ctx.ellipse(0, 0, radius * 0.5, radius * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Add dark outline for visibility
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Rocket nose cone
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(0, -radius * 0.7);
            ctx.lineTo(-radius * 0.3, -radius * 0.4);
            ctx.lineTo(radius * 0.3, -radius * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Rocket fins (bottom)
            ctx.fillStyle = '#FF4400';
            ctx.beginPath();
            ctx.moveTo(-radius * 0.5, radius * 0.7);
            ctx.lineTo(-radius * 0.7, radius * 0.9);
            ctx.lineTo(-radius * 0.5, radius * 0.5);
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(radius * 0.5, radius * 0.7);
            ctx.lineTo(radius * 0.7, radius * 0.9);
            ctx.lineTo(radius * 0.5, radius * 0.5);
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Window
            ctx.fillStyle = '#87CEEB';
            ctx.strokeStyle = '#4682B4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, radius * 0.1, radius * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Color stripe indicator - makes color more obvious
            ctx.fillStyle = baseColor;
            ctx.globalAlpha = 0.8;
            ctx.fillRect(-radius * 0.15, -radius * 0.2, radius * 0.3, radius * 0.6);
            ctx.globalAlpha = 1.0;

            // Flame trail
            const flameGradient = ctx.createLinearGradient(0, radius * 0.7, 0, radius * 1.2);
            flameGradient.addColorStop(0, '#FFD700');
            flameGradient.addColorStop(0.5, '#FF8C00');
            flameGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');

            ctx.fillStyle = flameGradient;
            ctx.beginPath();
            ctx.moveTo(0, radius * 0.7);
            ctx.lineTo(-radius * 0.2, radius * 1.1);
            ctx.lineTo(radius * 0.2, radius * 1.1);
            ctx.closePath();
            ctx.fill();
        }

        // Metallic shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-radius * 0.2, -radius * 0.2, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Outline for visibility
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (isHorizontal) {
            ctx.ellipse(0, 0, radius * 0.8, radius * 0.5, 0, 0, Math.PI * 2);
        } else {
            ctx.ellipse(0, 0, radius * 0.5, radius * 0.8, 0, 0, Math.PI * 2);
        }
        ctx.stroke();

        ctx.restore();

        // Draw hint glow if needed
        if (hint) {
            const now = Date.now();
            const pulseSpeed = 400;
            const pulsePhase = (now % pulseSpeed) / pulseSpeed;
            const pulseIntensity = 0.5 + Math.sin(pulsePhase * Math.PI * 2) * 0.4;

            ctx.save();
            ctx.globalAlpha = pulseIntensity * 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 6;
            ctx.stroke();
            ctx.restore();
        }
    }

    /**
     * Draw a bomb gem - Enhanced visual (FULL REPLACEMENT)
     */
    drawBombGem(ctx, size, color, hint = false) {
        const radius = size / 2 * 1.1; // 10% larger

        // Get base color for the gem type
        const baseColor = this.getGemColorHex(color);

        // Draw bomb body (NO base gem) - FULL SIZE
        ctx.save();

        // FIRST: Draw thick colored circle around bomb for visibility
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 8;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(0, radius * 0.1, radius * 0.85, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Main bomb sphere - dark base with stronger color tint
        const bombGradient = ctx.createRadialGradient(
            -radius * 0.2, -radius * 0.2, 0,
            0, 0, radius * 0.7
        );
        // Mix black with gem color for tinted bomb - increased blend ratios for more visible color
        const tintColor1 = this.blendColors('#555555', baseColor, 0.6);
        const tintColor2 = this.blendColors('#2C2C2C', baseColor, 0.5);
        const tintColor3 = this.blendColors('#000000', baseColor, 0.4);

        bombGradient.addColorStop(0, tintColor1);
        bombGradient.addColorStop(0.6, tintColor2);
        bombGradient.addColorStop(1, tintColor3);

        ctx.fillStyle = bombGradient;
        ctx.beginPath();
        ctx.arc(0, radius * 0.1, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Bomb outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bomb highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-radius * 0.2, -radius * 0.1, radius * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Fuse
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = radius * 0.12;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.5);
        ctx.quadraticCurveTo(
            radius * 0.15, -radius * 0.65,
            radius * 0.1, -radius * 0.8
        );
        ctx.stroke();

        // Spark/flame at fuse tip
        const now = Date.now();
        const sparkGradient = ctx.createRadialGradient(
            radius * 0.1, -radius * 0.8, 0,
            radius * 0.1, -radius * 0.8, radius * 0.25
        );
        sparkGradient.addColorStop(0, '#FFFF00');
        sparkGradient.addColorStop(0.3, '#FFD700');
        sparkGradient.addColorStop(0.6, '#FF8C00');
        sparkGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');

        ctx.fillStyle = sparkGradient;
        ctx.beginPath();
        ctx.arc(radius * 0.1, -radius * 0.8, radius * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Animated spark particles
        for (let i = 0; i < 4; i++) {
            const angle = (now / 300 + i * Math.PI * 2 / 4) % (Math.PI * 2);
            const sparkDist = radius * 0.3;
            const sparkX = radius * 0.1 + Math.cos(angle) * sparkDist;
            const sparkY = -radius * 0.8 + Math.sin(angle) * sparkDist;

            ctx.fillStyle = i % 2 === 0 ? '#FFFF00' : '#FF8C00';
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, radius * 0.06, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Draw hint glow if needed
        if (hint) {
            const pulseSpeed = 400;
            const pulsePhase = (now % pulseSpeed) / pulseSpeed;
            const pulseIntensity = 0.5 + Math.sin(pulsePhase * Math.PI * 2) * 0.4;

            ctx.save();
            ctx.globalAlpha = pulseIntensity * 0.6;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 6;
            ctx.stroke();
            ctx.restore();
        }
    }

    /**
     * Draw a rainbow gem - Enhanced visual (FULL REPLACEMENT)
     */
    drawRainbowGem(ctx, size, hint = false) {
        const radius = size / 2;
        const now = Date.now();

        // 7 rainbow colors
        const colors = [
            '#FF0000', // Red
            '#FF7F00', // Orange
            '#FFFF00', // Yellow
            '#00FF00', // Green
            '#00BFFF', // Blue (Sky Blue for better visibility)
            '#4B0082', // Indigo
            '#9400D3'  // Violet
        ];

        // Draw rainbow as colored segments/stripes
        const segmentAngle = (Math.PI * 2) / colors.length;
        const rotation = (now / 2000) % (Math.PI * 2);

        ctx.save();
        ctx.rotate(rotation);

        // Draw each color as a pie segment
        colors.forEach((color, i) => {
            const startAngle = i * segmentAngle;
            const endAngle = (i + 1) * segmentAngle;
            
            // Create gradient for depth
            const gradient = ctx.createRadialGradient(
                -radius * 0.2, -radius * 0.2, 0,
                0, 0, radius
            );
            gradient.addColorStop(0, this.lightenColor(color, 0.4));
            gradient.addColorStop(0.7, color);
            gradient.addColorStop(1, this.darkenColor(color, 0.3));

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Add subtle border between segments
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        ctx.restore();

        // Draw sparkling stars around the gem
        ctx.save();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI / 4) + (now / 1000);
            const starDist = radius * 1.1;
            const starX = Math.cos(angle) * starDist;
            const starY = Math.sin(angle) * starDist;

            // Star brightness pulses
            const brightness = 0.5 + Math.sin(now / 300 + i) * 0.5;
            ctx.globalAlpha = brightness;

            // Draw 4-point star
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            for (let j = 0; j < 4; j++) {
                const starAngle = j * Math.PI / 2;
                const pointDist = j % 2 === 0 ? radius * 0.2 : radius * 0.08;
                const px = starX + Math.cos(starAngle) * pointDist;
                const py = starY + Math.sin(starAngle) * pointDist;

                if (j === 0) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        ctx.restore();

        // Draw white outline with golden glow
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Add shimmering highlight
        const shimmer = Math.sin(now / 400) * 0.3 + 0.7;
        ctx.globalAlpha = shimmer * 0.9;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw hint glow if needed
        if (hint) {
            const pulseSpeed = 400;
            const pulsePhase = (now % pulseSpeed) / pulseSpeed;
            const pulseIntensity = 0.5 + Math.sin(pulsePhase * Math.PI * 2) * 0.4;

            ctx.save();
            ctx.globalAlpha = pulseIntensity * 0.8;
            ctx.beginPath();
            ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 8;
            ctx.stroke();
            ctx.restore();
        }
    }

    /**
     * Get gem color as hex
     */
    getGemColorHex(color) {
        const colorMap = {
            [GemColor.RED]: '#E53E3E',
            [GemColor.BLUE]: '#3182CE',
            [GemColor.GREEN]: '#38A169',
            [GemColor.YELLOW]: '#D69E2E',
            [GemColor.PURPLE]: '#805AD5',
            [GemColor.ORANGE]: '#DD6B20'
        };
        return colorMap[color] || '#FFFFFF';
    }

    /**
     * Lighten a color by a factor
     */
    lightenColor(color, factor) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * factor * 100);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    /**
     * Darken a color by a factor
     */
    darkenColor(color, factor) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * factor * 100);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }

    /**
     * Blend two colors together
     */
    blendColors(color1, color2, ratio) {
        const c1 = parseInt(color1.replace('#', ''), 16);
        const c2 = parseInt(color2.replace('#', ''), 16);

        const r1 = (c1 >> 16) & 0xFF;
        const g1 = (c1 >> 8) & 0xFF;
        const b1 = c1 & 0xFF;

        const r2 = (c2 >> 16) & 0xFF;
        const g2 = (c2 >> 8) & 0xFF;
        const b2 = c2 & 0xFF;

        const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
        const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
        const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * Draw star collectible
     */
    drawStarCollectible(ctx, size) {
        const radius = size / 2;
        
        ctx.save();
        
        // Golden star
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        
        // Draw 5-pointed star
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI / 5) - Math.PI / 2;
            const x = Math.cos(angle) * radius * 0.8;
            const y = Math.sin(angle) * radius * 0.8;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Inner point
            const innerAngle = angle + (2 * Math.PI / 5);
            const innerX = Math.cos(innerAngle) * radius * 0.3;
            const innerY = Math.sin(innerAngle) * radius * 0.3;
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Add sparkle
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    /**
     * Draw sun collectible
     */
    drawSunCollectible(ctx, size) {
        const radius = size / 2;
        
        ctx.save();
        
        // Sun rays
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 3;
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI / 6);
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * radius * 0.6, Math.sin(angle) * radius * 0.6);
            ctx.lineTo(Math.cos(angle) * radius * 0.9, Math.sin(angle) * radius * 0.9);
            ctx.stroke();
        }
        
        // Sun circle
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.6);
        gradient.addColorStop(0, '#FFF700');
        gradient.addColorStop(0.5, '#FFD700');
        gradient.addColorStop(1, '#FFA500');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(-radius * 0.2, -radius * 0.2, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    /**
     * Draw moon collectible
     */
    drawMoonCollectible(ctx, size) {
        const radius = size / 2;
        
        ctx.save();
        
        // Moon crescent
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.8);
        gradient.addColorStop(0, '#F0F0F0');
        gradient.addColorStop(0.7, '#E0E0E0');
        gradient.addColorStop(1, '#C0C0C0');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Create crescent by cutting out a circle
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(radius * 0.3, 0, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        
        // Add craters
        ctx.fillStyle = 'rgba(180, 180, 180, 0.4)';
        ctx.beginPath();
        ctx.arc(-radius * 0.2, -radius * 0.3, radius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(-radius * 0.3, radius * 0.2, radius * 0.1, 0, Math.PI * 2);
        ctx.fill();
        
        // Add stars around moon
        ctx.fillStyle = '#FFFFFF';
        const starPositions = [
            [radius * 0.9, -radius * 0.5],
            [radius * 0.7, radius * 0.7],
            [-radius * 0.8, -radius * 0.6]
        ];
        
        starPositions.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }

    /**
     * Update cell size (for responsive design)
     */
    updateCellSize(newCellSize) {
        this.cellSize = newCellSize;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Gem, GemType, GemColor, GemRenderer };
}