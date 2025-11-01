/* ==========================================================================
   GemsBlast Game - Utility Functions
   ========================================================================== */

/**
 * Utility class containing helper functions for the game
 */
class Utils {
    /**
     * Generate a random integer between min and max (inclusive)
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Generate a random float between min and max
     */
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Choose a random element from an array
     */
    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    /**
     * Shuffle an array using Fisher-Yates algorithm
     */
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Clamp a value between min and max
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Linear interpolation between two values
     */
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    /**
     * Convert grid coordinates to canvas pixel coordinates
     */
    static gridToPixel(gridX, gridY, cellSize, offsetX = 0, offsetY = 0) {
        return {
            x: gridX * cellSize + offsetX + cellSize / 2,
            y: gridY * cellSize + offsetY + cellSize / 2
        };
    }

    /**
     * Convert canvas pixel coordinates to grid coordinates
     */
    static pixelToGrid(pixelX, pixelY, cellSize, offsetX = 0, offsetY = 0) {
        return {
            x: Math.floor((pixelX - offsetX) / cellSize),
            y: Math.floor((pixelY - offsetY) / cellSize)
        };
    }

    /**
     * Check if a point is within a rectangle
     */
    static pointInRect(pointX, pointY, rectX, rectY, rectWidth, rectHeight) {
        return pointX >= rectX &&
            pointX <= rectX + rectWidth &&
            pointY >= rectY &&
            pointY <= rectY + rectHeight;
    }

    /**
     * Calculate distance between two points
     */
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Check if two grid positions are adjacent (horizontally or vertically)
     */
    static areAdjacent(x1, y1, x2, y2) {
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    /**
     * Deep clone an object or array
     */
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return obj.map(item => Utils.deepClone(item));
        }

        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = Utils.deepClone(obj[key]);
            }
        }
        return cloned;
    }

    /**
     * Format time in MM:SS format
     */
    static formatTime(seconds) {
        if (seconds === undefined || seconds === null || isNaN(seconds)) {
            return '0:00';
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * Format score with commas
     */
    static formatScore(score) {
        return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Create a DOM element with specified attributes
     */
    static createElement(tag, className = '', attributes = {}) {
        const element = document.createElement(tag);
        if (className) {
            element.className = className;
        }
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        return element;
    }

    /**
     * Add event listener with automatic cleanup
     */
    static addEventListenerWithCleanup(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    }

    /**
     * Debounce function calls
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function calls
     */
    static throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Validate if coordinates are within grid bounds
     */
    static isValidGridPosition(x, y, gridWidth = 8, gridHeight = 8) {
        return x >= 0 && x < gridWidth && y >= 0 && y < gridHeight;
    }

    /**
     * Get all adjacent positions for a given grid coordinate
     */
    static getAdjacentPositions(x, y, gridWidth = 8, gridHeight = 8) {
        const positions = [];
        const directions = [
            { dx: -1, dy: 0 }, // left
            { dx: 1, dy: 0 },  // right
            { dx: 0, dy: -1 }, // up
            { dx: 0, dy: 1 }   // down
        ];

        for (const { dx, dy } of directions) {
            const newX = x + dx;
            const newY = y + dy;
            if (Utils.isValidGridPosition(newX, newY, gridWidth, gridHeight)) {
                positions.push({ x: newX, y: newY });
            }
        }

        return positions;
    }

    /**
     * Create a promise that resolves after a specified delay
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Animate a value over time using easing
     */
    static async animateValue(from, to, duration, callback, easing = 'easeOutCubic') {
        const start = Date.now();
        const easingFunctions = {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: t => t * t * t,
            easeOutCubic: t => (--t) * t * t + 1,
            easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeInBounce: t => 1 - Utils.easeOutBounce(1 - t),
            easeOutBounce: t => {
                if (t < 1 / 2.75) return 7.5625 * t * t;
                if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
                if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
                return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
            }
        };

        const easingFunc = easingFunctions[easing] || easingFunctions.easeOutCubic;

        return new Promise(resolve => {
            const animate = () => {
                const elapsed = Date.now() - start;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easingFunc(progress);
                const currentValue = from + (to - from) * easedProgress;

                callback(currentValue, progress);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(animate);
        });
    }

    /**
     * Generate a unique ID
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Check if device supports touch
     */
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    /**
     * Get the appropriate event types for the device
     */
    static getEventTypes() {
        if (Utils.isTouchDevice()) {
            return {
                start: 'touchstart',
                move: 'touchmove',
                end: 'touchend'
            };
        } else {
            return {
                start: 'mousedown',
                move: 'mousemove',
                end: 'mouseup'
            };
        }
    }

    /**
     * Get coordinates from mouse or touch event
     */
    static getEventCoordinates(event) {
        if (event.touches && event.touches.length > 0) {
            return {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        } else if (event.changedTouches && event.changedTouches.length > 0) {
            return {
                x: event.changedTouches[0].clientX,
                y: event.changedTouches[0].clientY
            };
        } else {
            return {
                x: event.clientX,
                y: event.clientY
            };
        }
    }

    /**
     * Convert screen coordinates to canvas coordinates
     */
    static screenToCanvas(canvas, screenX, screenY) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (screenX - rect.left) * scaleX,
            y: (screenY - rect.top) * scaleY
        };
    }

    /**
     * Load an image and return a promise
     */
    static loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    /**
     * Load multiple images
     */
    static async loadImages(sources) {
        const promises = sources.map(src => Utils.loadImage(src));
        return Promise.all(promises);
    }

    /**
     * Save data to localStorage with error handling
     */
    static saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.warn('Failed to save to localStorage:', error);
            return false;
        }
    }

    /**
     * Load data from localStorage with error handling
     */
    static loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.warn('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }

    /**
     * Clear data from localStorage
     */
    static clearStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn('Failed to clear localStorage:', error);
            return false;
        }
    }

    /**
     * Trigger haptic feedback on mobile devices
     */
    static hapticFeedback(style = 'light') {
        // Check if the Vibration API is supported
        if ('vibrate' in navigator) {
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [30],
                success: [10, 50, 10],
                error: [50, 100, 50],
                selection: [5]
            };

            const pattern = patterns[style] || patterns.light;
            navigator.vibrate(pattern);
        }
    }

    /**
     * Check if device is in landscape orientation
     */
    static isLandscape() {
        return window.innerWidth > window.innerHeight;
    }

    /**
     * Get device pixel ratio for high-DPI displays
     */
    static getPixelRatio() {
        return window.devicePixelRatio || 1;
    }

    /**
     * Detect if running as Progressive Web App (PWA)
     */
    static isPWA() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}