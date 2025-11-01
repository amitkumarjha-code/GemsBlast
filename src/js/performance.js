/**
 * Performance Monitor - Tracks game performance metrics
 */
class PerformanceMonitor {
    constructor() {
        this.enabled = false;
        this.displayHUD = false;

        // Performance metrics
        this.metrics = {
            fps: 0,
            frameTime: 0,
            renderTime: 0,
            updateTime: 0,
            memory: 0,
            drawCalls: 0,
            particleCount: 0
        };

        // FPS tracking
        this.frameCount = 0;
        this.lastFPSUpdate = performance.now();
        this.frameTimes = [];
        this.maxFrameTimeSamples = 60;

        // Performance history for graphs
        this.history = {
            fps: [],
            frameTime: [],
            memory: []
        };
        this.maxHistoryLength = 100;

        // Performance thresholds
        this.thresholds = {
            targetFPS: 60,
            warningFPS: 45,
            criticalFPS: 30,
            maxFrameTime: 16.67 // 60 FPS target
        };

        // HUD elements
        this.hudElement = null;
        this.createHUD();

        // Start monitoring if supported
        if (window.performance && window.performance.memory) {
            this.memorySupported = true;
        }
    }

    /**
     * Enable/disable performance monitoring
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (this.hudElement) {
            this.hudElement.style.display = enabled && this.displayHUD ? 'block' : 'none';
        }
    }

    /**
     * Toggle HUD display
     */
    toggleHUD() {
        this.displayHUD = !this.displayHUD;
        if (this.hudElement) {
            this.hudElement.style.display = this.enabled && this.displayHUD ? 'block' : 'none';
        }
    }

    /**
     * Create performance HUD overlay
     */
    createHUD() {
        this.hudElement = document.createElement('div');
        this.hudElement.id = 'performance-hud';
        this.hudElement.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.85);
            color: #0f0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            min-width: 200px;
            display: none;
            pointer-events: none;
        `;
        document.body.appendChild(this.hudElement);
    }

    /**
     * Start frame timing
     */
    startFrame() {
        if (!this.enabled) return;
        this.frameStartTime = performance.now();
    }

    /**
     * End frame timing and update metrics
     */
    endFrame() {
        if (!this.enabled) return;

        const now = performance.now();
        const frameTime = now - this.frameStartTime;

        // Track frame times
        this.frameTimes.push(frameTime);
        if (this.frameTimes.length > this.maxFrameTimeSamples) {
            this.frameTimes.shift();
        }

        // Update FPS every second
        this.frameCount++;
        if (now - this.lastFPSUpdate >= 1000) {
            this.metrics.fps = Math.round(this.frameCount * 1000 / (now - this.lastFPSUpdate));
            this.frameCount = 0;
            this.lastFPSUpdate = now;

            // Update history
            this.addToHistory('fps', this.metrics.fps);
            this.addToHistory('frameTime', frameTime);

            // Update memory if supported
            if (this.memorySupported) {
                this.metrics.memory = Math.round(performance.memory.usedJSHeapSize / 1048576); // MB
                this.addToHistory('memory', this.metrics.memory);
            }
        }

        // Calculate average frame time
        const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        this.metrics.frameTime = Math.round(avgFrameTime * 100) / 100;

        // Update HUD
        if (this.displayHUD) {
            this.updateHUD();
        }
    }

    /**
     * Track render time
     */
    trackRenderTime(time) {
        if (!this.enabled) return;
        this.metrics.renderTime = Math.round(time * 100) / 100;
    }

    /**
     * Track update time
     */
    trackUpdateTime(time) {
        if (!this.enabled) return;
        this.metrics.updateTime = Math.round(time * 100) / 100;
    }

    /**
     * Track draw calls
     */
    trackDrawCalls(count) {
        if (!this.enabled) return;
        this.metrics.drawCalls = count;
    }

    /**
     * Track particle count
     */
    trackParticleCount(count) {
        if (!this.enabled) return;
        this.metrics.particleCount = count;
    }

    /**
     * Add value to history
     */
    addToHistory(metric, value) {
        if (!this.history[metric]) {
            this.history[metric] = [];
        }
        this.history[metric].push(value);
        if (this.history[metric].length > this.maxHistoryLength) {
            this.history[metric].shift();
        }
    }

    /**
     * Update HUD display
     */
    updateHUD() {
        if (!this.hudElement) return;

        const fpsColor = this.getFPSColor(this.metrics.fps);
        const frameTimeColor = this.metrics.frameTime > this.thresholds.maxFrameTime ? '#ff0' : '#0f0';

        let html = '<div style="font-weight: bold; margin-bottom: 5px;">⚡ PERFORMANCE</div>';
        html += `<div style="color: ${fpsColor}">FPS: ${this.metrics.fps}</div>`;
        html += `<div style="color: ${frameTimeColor}">Frame: ${this.metrics.frameTime}ms</div>`;
        html += `<div>Render: ${this.metrics.renderTime}ms</div>`;
        html += `<div>Update: ${this.metrics.updateTime}ms</div>`;

        if (this.memorySupported) {
            html += `<div>Memory: ${this.metrics.memory} MB</div>`;
        }

        html += `<div>Draws: ${this.metrics.drawCalls}</div>`;
        html += `<div>Particles: ${this.metrics.particleCount}</div>`;

        // Performance status
        const status = this.getPerformanceStatus();
        const statusColor = status === 'good' ? '#0f0' : status === 'warning' ? '#ff0' : '#f00';
        html += `<div style="margin-top: 5px; color: ${statusColor}">Status: ${status.toUpperCase()}</div>`;

        this.hudElement.innerHTML = html;
    }

    /**
     * Get FPS color based on value
     */
    getFPSColor(fps) {
        if (fps >= this.thresholds.warningFPS) return '#0f0';
        if (fps >= this.thresholds.criticalFPS) return '#ff0';
        return '#f00';
    }

    /**
     * Get overall performance status
     */
    getPerformanceStatus() {
        if (this.metrics.fps >= this.thresholds.warningFPS) return 'good';
        if (this.metrics.fps >= this.thresholds.criticalFPS) return 'warning';
        return 'critical';
    }

    /**
     * Get performance report
     */
    getReport() {
        return {
            current: { ...this.metrics },
            averages: {
                fps: this.calculateAverage(this.history.fps),
                frameTime: this.calculateAverage(this.history.frameTime),
                memory: this.calculateAverage(this.history.memory)
            },
            status: this.getPerformanceStatus(),
            history: { ...this.history }
        };
    }

    /**
     * Calculate average from array
     */
    calculateAverage(arr) {
        if (!arr || arr.length === 0) return 0;
        return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 100) / 100;
    }

    /**
     * Check if performance is acceptable
     */
    isPerformanceAcceptable() {
        return this.metrics.fps >= this.thresholds.warningFPS;
    }

    /**
     * Log performance warning
     */
    logWarning(message) {
        if (!this.enabled) return;
        console.warn(`[Performance] ${message}`, this.metrics);
    }

    /**
     * Reset metrics
     */
    reset() {
        this.frameCount = 0;
        this.frameTimes = [];
        this.history = {
            fps: [],
            frameTime: [],
            memory: []
        };
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.hudElement && this.hudElement.parentNode) {
            this.hudElement.parentNode.removeChild(this.hudElement);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}
