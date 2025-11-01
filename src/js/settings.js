/**
 * Settings Manager - Handles game settings and preferences
 */
class SettingsManager {
    constructor() {
        this.storageKey = 'gemsBlastSettings';
        this.settings = this.loadSettings();
        this.applySettings();
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        const defaultSettings = {
            sfxVolume: 70,
            musicVolume: 50,
            animationSpeed: 100,
            particleEffects: true,
            screenShake: true,
            colorblindMode: false,
            boardTheme: 'classic'
        };

        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                return { ...defaultSettings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }

        return defaultSettings;
    }

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Get a setting value
     */
    get(key) {
        return this.settings[key];
    }

    /**
     * Set a setting value
     */
    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySettings();
    }

    /**
     * Update multiple settings at once
     */
    update(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        this.applySettings();
    }

    /**
     * Reset settings to default
     */
    reset() {
        this.settings = {
            sfxVolume: 70,
            musicVolume: 50,
            animationSpeed: 100,
            particleEffects: true,
            screenShake: true,
            colorblindMode: false,
            boardTheme: 'classic'
        };
        this.saveSettings();
        this.applySettings();
        return this.settings;
    }

    /**
     * Apply settings to the game
     */
    applySettings() {
        // Apply animation speed CSS variable
        document.documentElement.style.setProperty(
            '--animation-speed-multiplier',
            this.settings.animationSpeed / 100
        );

        // Apply colorblind mode
        if (this.settings.colorblindMode) {
            document.body.classList.add('colorblind-mode');
        } else {
            document.body.classList.remove('colorblind-mode');
        }

        // Apply board theme to canvas
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            if (this.settings.boardTheme) {
                canvas.setAttribute('data-theme', this.settings.boardTheme);
            } else {
                canvas.removeAttribute('data-theme');
            }
        }

        // Apply theme styling to the board container only
        const boardContainer = document.querySelector('.board-container');
        if (boardContainer) {
            if (this.settings.boardTheme) {
                boardContainer.setAttribute('data-theme', this.settings.boardTheme);
            } else {
                boardContainer.removeAttribute('data-theme');
            }
        }

        // Keep the global page theme static so only the board changes color
        document.body.removeAttribute('data-theme');
    }

    /**
     * Get animation duration adjusted for speed setting
     */
    getAnimationDuration(baseDuration) {
        return baseDuration / (this.settings.animationSpeed / 100);
    }

    /**
     * Check if particle effects are enabled
     */
    particlesEnabled() {
        return this.settings.particleEffects;
    }

    /**
     * Check if screen shake is enabled
     */
    shakeEnabled() {
        return this.settings.screenShake;
    }

    /**
     * Get SFX volume (0-1 range)
     */
    getSFXVolume() {
        return this.settings.sfxVolume / 100;
    }

    /**
     * Get music volume (0-1 range)
     */
    getMusicVolume() {
        return this.settings.musicVolume / 100;
    }

    /**
     * Get all settings
     */
    getAll() {
        return { ...this.settings };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
}
