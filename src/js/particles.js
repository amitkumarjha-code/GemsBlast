/* ==========================================================================
   GemsBlast Game - Particle Effects System
   ========================================================================== */

/**
 * Particle class for visual effects
 */
class Particle {
    constructor(x, y, type = 'star') {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.type = type;

        // Movement properties
        this.vx = Utils.randomFloat(-2, 2);
        this.vy = Utils.randomFloat(-3, -1);
        this.gravity = 0.1;
        this.friction = 0.98;

        // Visual properties
        this.size = Utils.randomFloat(2, 6);
        this.color = this.getRandomColor();
        this.alpha = 1;
        this.rotation = 0;
        this.rotationSpeed = Utils.randomFloat(-0.2, 0.2);

        // Lifecycle
        this.life = 1;
        this.decay = Utils.randomFloat(0.015, 0.025);
        this.dead = false;
    }

    /**
     * Get random color based on particle type
     */
    getRandomColor() {
        const colors = {
            star: ['#FFD700', '#FFA500', '#FF6347', '#FF69B4'],
            sparkle: ['#FFFFFF', '#E6E6FA', '#F0F8FF', '#FFFACD'],
            explosion: ['#FF4500', '#FF6347', '#FFA500', '#FFD700', '#FFFFFF'],
            magic: ['#9370DB', '#8A2BE2', '#BA55D3', '#DA70D6'],
            // Color-coded for gem colors
            red: ['#FF0000', '#FF4444', '#FF6666', '#CC0000'],
            blue: ['#0000FF', '#4444FF', '#6666FF', '#0000CC'],
            green: ['#00FF00', '#44FF44', '#66FF66', '#00CC00'],
            yellow: ['#FFFF00', '#FFFF44', '#FFFF66', '#CCCC00'],
            purple: ['#9370DB', '#8A2BE2', '#BA55D3', '#6A0DAD'],
            orange: ['#FFA500', '#FF8C00', '#FFB84D', '#CC8400']
        };

        const colorArray = colors[this.type] || colors.star;
        return Utils.randomChoice(colorArray);
    }

    /**
     * Update particle state
     */
    update(deltaTime) {
        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Apply gravity and friction
        this.vy += this.gravity;
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Update rotation
        this.rotation += this.rotationSpeed;

        // Update life
        this.life -= this.decay;
        this.alpha = this.life;

        // Check if dead
        if (this.life <= 0) {
            this.dead = true;
        }
    }

    /**
     * Render particle
     */
    render(ctx) {
        if (this.dead) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        switch (this.type) {
            case 'star':
                this.renderStar(ctx);
                break;
            case 'sparkle':
                this.renderSparkle(ctx);
                break;
            case 'explosion':
                this.renderExplosion(ctx);
                break;
            case 'magic':
                this.renderMagic(ctx);
                break;
            default:
                this.renderDefault(ctx);
        }

        ctx.restore();
    }

    /**
     * Render star particle
     */
    renderStar(ctx) {
        const spikes = 5;
        const outerRadius = this.size;
        const innerRadius = this.size * 0.4;

        ctx.fillStyle = this.color;
        ctx.beginPath();

        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.closePath();
        ctx.fill();

        // Add glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = this.size * 2;
        ctx.fill();
    }

    /**
     * Render sparkle particle
     */
    renderSparkle(ctx) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;

        // Draw cross pattern
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(this.size, 0);
        ctx.moveTo(0, -this.size);
        ctx.lineTo(0, this.size);
        ctx.stroke();

        // Draw center circle
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Render explosion particle
     */
    renderExplosion(ctx) {
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Render magic particle
     */
    renderMagic(ctx) {
        // Draw wispy trail
        const trailLength = 8;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.size * 0.5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(-trailLength, 0);
        ctx.quadraticCurveTo(0, -trailLength * 0.5, trailLength, 0);
        ctx.stroke();

        // Draw core
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * Render default particle
     */
    renderDefault(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Particle System for managing multiple particles
 */
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
    }

    /**
     * Create explosion effect
     */
    createExplosion(x, y, type = 'star', count = 20, intensity = 1.0) {
        for (let i = 0; i < count; i++) {
            const particle = new Particle(x, y, type);

            // Spread particles in all directions
            const angle = (i / count) * Math.PI * 2;
            const speed = Utils.randomFloat(2, 5) * intensity;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;

            // Add some randomness to size based on intensity
            particle.size *= (0.8 + intensity * 0.4);

            this.particles.push(particle);
        }
    }

    /**
     * Create enhanced match explosion with color
     */
    createColoredExplosion(x, y, color, matchSize = 3) {
        // Map gem color to particle type
        const colorMap = {
            0: 'red',    // Red
            1: 'blue',   // Blue
            2: 'green',  // Green
            3: 'yellow', // Yellow
            4: 'purple', // Purple
            5: 'orange'  // Orange
        };

        const particleType = colorMap[color] || 'star';
        const intensity = Math.min(matchSize / 3, 2.0); // Scale with match size
        const count = Math.min(15 + matchSize * 5, 40); // More particles for bigger matches

        this.createExplosion(x, y, particleType, count, intensity);

        // Add extra sparkles for larger matches
        if (matchSize >= 4) {
            this.createExplosion(x, y, 'sparkle', 10, intensity * 1.2);
        }
    }

    /**
     * Create directional effect (for rocket gems)
     */
    createDirectionalEffect(x, y, direction, type = 'sparkle', count = 15) {
        for (let i = 0; i < count; i++) {
            const particle = new Particle(x, y, type);

            if (direction === 'horizontal') {
                particle.vx = Utils.randomFloat(-8, 8);
                particle.vy = Utils.randomFloat(-1, 1);
            } else {
                particle.vx = Utils.randomFloat(-1, 1);
                particle.vy = Utils.randomFloat(-8, 8);
            }

            this.particles.push(particle);
        }
    }

    /**
     * Create rainbow effect
     */
    createRainbowEffect(x, y, count = 30) {
        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

        for (let i = 0; i < count; i++) {
            const particle = new Particle(x, y, 'magic');
            particle.color = colors[i % colors.length];

            const angle = (i / count) * Math.PI * 2;
            const speed = Utils.randomFloat(3, 6);
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.decay = 0.01; // Slower decay for rainbow

            this.particles.push(particle);
        }
    }

    /**
     * Create match effect
     */
    createMatchEffect(gems, type = 'star') {
        gems.forEach(gemData => {
            const x = (gemData.x + 0.5) * 80; // Approximate cell size
            const y = (gemData.y + 0.5) * 80;

            this.createExplosion(x, y, type, 8);
        });
    }

    /**
     * Create special gem creation effect
     */
    createSpecialGemEffect(x, y, gemType) {
        const cellSize = 80; // Approximate
        const pixelX = (x + 0.5) * cellSize;
        const pixelY = (y + 0.5) * cellSize;

        switch (gemType) {
            case 'rocket':
                this.createDirectionalEffect(pixelX, pixelY, 'horizontal', 'sparkle', 20);
                break;
            case 'bomb':
                this.createExplosion(pixelX, pixelY, 'explosion', 25);
                break;
            case 'rainbow':
                this.createRainbowEffect(pixelX, pixelY, 30);
                break;
        }
    }

    /**
     * Update all particles
     */
    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);

            if (particle.dead) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * Render all particles
     */
    render() {
        this.particles.forEach(particle => {
            particle.render(this.ctx);
        });
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }

    /**
     * Get particle count
     */
    getParticleCount() {
        return this.particles.length;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Particle, ParticleSystem };
}