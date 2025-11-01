/* ==========================================================================
   GemsBlast Game - Tutorial System
   ========================================================================== */

/**
 * Tutorial System class managing mode-specific tutorials
 */
class TutorialSystem {
    constructor() {
        this.currentStep = 0;
        this.currentTutorial = null;
        this.isActive = false;

        // Tutorial definitions for each mode
        this.tutorials = {
            classic: {
                name: 'Classic Mode',
                steps: [
                    {
                        icon: '⭐',
                        title: 'Welcome to Classic Mode!',
                        content: `
                            <p>Classic Mode is the traditional match-3 gameplay.</p>
                            <p>Your goal is to <span class="tutorial-highlight">reach the target score</span> before running out of moves!</p>
                        `
                    },
                    {
                        icon: '💎',
                        title: 'How to Play',
                        content: `
                            <p>Match 3 or more gems of the same color by swapping adjacent gems.</p>
                            <ul>
                                <li>Click a gem, then click an adjacent gem to swap</li>
                                <li>Matches can be horizontal or vertical</li>
                                <li>Longer matches give more points!</li>
                            </ul>
                        `
                    },
                    {
                        icon: '🚀',
                        title: 'Special Gems & Scoring',
                        content: `
                            <p>Create special gems for powerful effects:</p>
                            <ul>
                                <li><strong>4-in-a-row:</strong> Creates a Rocket gem</li>
                                <li><strong>L or T shape:</strong> Creates a Bomb gem</li>
                                <li><strong>5-in-a-row:</strong> Creates a Rainbow gem</li>
                            </ul>
                            <p>Reach <span class="tutorial-highlight">5000 points</span> to win!</p>
                        `
                    }
                ]
            },

            plates: {
                name: 'Plates Mode',
                steps: [
                    {
                        icon: '🟨',
                        title: 'Welcome to Plates Mode!',
                        content: `
                            <p>In Plates Mode, golden plates are hidden beneath the gems.</p>
                            <p>Your goal is to <span class="tutorial-highlight">clear all the plates</span> by making matches on top of them!</p>
                        `
                    },
                    {
                        icon: '💡',
                        title: 'How to Clear Plates',
                        content: `
                            <p>Make matches directly above the golden plates:</p>
                            <ul>
                                <li>Look for the golden background beneath gems</li>
                                <li>Match 3+ gems on top of a plate to clear it</li>
                                <li>Watch for golden sparkles when plates are cleared</li>
                            </ul>
                        `
                    },
                    {
                        icon: '⚡',
                        title: 'Strategy Tips',
                        content: `
                            <p>Master Plates Mode with these tips:</p>
                            <ul>
                                <li>Focus on plates in hard-to-reach areas first</li>
                                <li>Special gems can clear multiple plates at once</li>
                                <li>You have <span class="tutorial-highlight">25 moves</span> - plan wisely!</li>
                            </ul>
                            <p>Clear all plates to win!</p>
                        `
                    }
                ]
            },

            palette: {
                name: 'Palette Mode',
                steps: [
                    {
                        icon: '💎',
                        title: 'Welcome to Palette Mode!',
                        content: `
                            <p>Palette Mode challenges you to collect specific colored gems.</p>
                            <p>Your goal is to <span class="tutorial-highlight">collect the required amount</span> of each target color!</p>
                        `
                    },
                    {
                        icon: '🎯',
                        title: 'Collection Objectives',
                        content: `
                            <p>Check your objectives to see which colors to collect:</p>
                            <ul>
                                <li>3-4 random colors are selected each game</li>
                                <li>Collect 15-25 gems of each target color</li>
                                <li>Progress is shown in the objectives panel</li>
                            </ul>
                        `
                    },
                    {
                        icon: '🌟',
                        title: 'Collection Strategy',
                        content: `
                            <p>Maximize your collection efficiency:</p>
                            <ul>
                                <li>Prioritize matches with target colors</li>
                                <li>Larger matches collect more gems</li>
                                <li>Special gems help clear non-target colors</li>
                            </ul>
                            <p>You have <span class="tutorial-highlight">35 moves</span> to complete all collections!</p>
                        `
                    }
                ]
            },

            stargazer: {
                name: 'Stargazer Mode',
                steps: [
                    {
                        icon: '⭐',
                        title: 'Welcome to Stargazer Mode!',
                        content: `
                            <p>Stargazer Mode is all about forming constellation patterns.</p>
                            <p>Your goal is to <span class="tutorial-highlight">create specific patterns</span> with matched gems!</p>
                        `
                    },
                    {
                        icon: '🌌',
                        title: 'Constellation Patterns',
                        content: `
                            <p>Form these special patterns to complete objectives:</p>
                            <ul>
                                <li><strong>Cross:</strong> 5 gems in a + shape</li>
                                <li><strong>L-Shape:</strong> 5 gems forming an L</li>
                                <li><strong>Diamond:</strong> 5 gems in a diamond pattern</li>
                            </ul>
                            <p>Each pattern must be a specific color!</p>
                        `
                    },
                    {
                        icon: '✨',
                        title: 'Pattern Strategy',
                        content: `
                            <p>Tips for forming constellations:</p>
                            <ul>
                                <li>Plan matches to create the required shapes</li>
                                <li>Patterns can be rotated in any direction</li>
                                <li>Watch for magical effects when patterns complete</li>
                            </ul>
                            <p>Form <span class="tutorial-highlight">3 constellations</span> with 40 moves to win!</p>
                        `
                    }
                ]
            },

            powerups: {
                name: 'Power-Ups Guide',
                steps: [
                    {
                        icon: '🔨',
                        title: 'Hammer Power-Up',
                        content: `
                            <p>The Hammer removes a single gem of your choice.</p>
                            <ul>
                                <li><strong>How to use:</strong> Click the hammer button, then click any gem</li>
                                <li><strong>Best for:</strong> Removing obstacles or setting up special matches</li>
                                <li><strong>Tip:</strong> Use it on hard-to-reach gems or to complete objectives</li>
                            </ul>
                        `
                    },
                    {
                        icon: '🔀',
                        title: 'Shuffle Power-Up',
                        content: `
                            <p>Shuffle rearranges all gems on the board randomly.</p>
                            <ul>
                                <li><strong>How to use:</strong> Click the shuffle button for instant effect</li>
                                <li><strong>Best for:</strong> When no moves are available or for a fresh start</li>
                                <li><strong>Tip:</strong> Great for finding better match opportunities</li>
                            </ul>
                        `
                    },
                    {
                        icon: '💣',
                        title: 'Color Bomb Power-Up',
                        content: `
                            <p>Color Bomb removes all gems of a specific color.</p>
                            <ul>
                                <li><strong>How to use:</strong> Click the bomb button, then click any gem color</li>
                                <li><strong>Best for:</strong> Clearing large areas and achieving objectives quickly</li>
                                <li><strong>Tip:</strong> Combine with color objectives for massive progress</li>
                            </ul>
                        `
                    },
                    {
                        icon: '➕',
                        title: 'Extra Moves Power-Up',
                        content: `
                            <p>Extra Moves adds 5 additional moves to your count.</p>
                            <ul>
                                <li><strong>How to use:</strong> Click the button to instantly add moves</li>
                                <li><strong>Best for:</strong> When you're close to winning but out of moves</li>
                                <li><strong>Tip:</strong> Save it for crucial moments near game end</li>
                            </ul>
                        `
                    },
                    {
                        icon: '⭐',
                        title: 'Score Boost Power-Up',
                        content: `
                            <p>Score Boost doubles your points for 10 moves.</p>
                            <ul>
                                <li><strong>How to use:</strong> Activate before making big matches</li>
                                <li><strong>Best for:</strong> Maximizing points from special gem combos</li>
                                <li><strong>Tip:</strong> Use with special gems for exponential scoring</li>
                            </ul>
                        `
                    },
                    {
                        icon: '🎁',
                        title: 'Earning Power-Ups',
                        content: `
                            <p>You can earn power-ups by:</p>
                            <ul>
                                <li><strong>Completing levels:</strong> Random rewards after each win</li>
                                <li><strong>High scores:</strong> Bonus power-ups for great performance</li>
                                <li><strong>Combo streaks:</strong> Make consecutive matches</li>
                                <li><strong>Creating special gems:</strong> Earn rewards for skill</li>
                                <li><strong>Daily rewards:</strong> Log in daily for free power-ups</li>
                            </ul>
                            <p class="tutorial-highlight">Use power-ups strategically to master the game!</p>
                        `
                    }
                ]
            }
        };

        this.initializeElements();
        this.setupEventListeners();
    }

    /**
     * Initialize DOM elements
     */
    initializeElements() {
        this.overlay = document.getElementById('tutorial-overlay');
        this.stepsContainer = document.getElementById('tutorial-steps');
        this.prevBtn = document.getElementById('tutorial-prev-btn');
        this.nextBtn = document.getElementById('tutorial-next-btn');
        this.skipBtn = document.getElementById('tutorial-skip-btn');
        this.closeBtn = document.getElementById('tutorial-close-btn');
        this.stepIndicator = document.getElementById('tutorial-step-indicator');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.previousStep());
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextStep());
        }

        if (this.skipBtn) {
            this.skipBtn.addEventListener('click', () => this.hide());
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hide());
        }
    }

    /**
     * Show tutorial for a specific mode
     * @param {string} modeName - Name of the mode
     */
    show(modeName) {
        // Check if user has seen this tutorial before
        const seenKey = `gemsBlast_tutorial_${modeName}_seen`;
        if (Utils.loadFromStorage(seenKey, false)) {
            return; // Don't show if already seen
        }

        this.currentTutorial = this.tutorials[modeName];
        if (!this.currentTutorial) {
            console.warn(`No tutorial found for mode: ${modeName}`);
            return;
        }

        this.currentStep = 0;
        this.isActive = true;
        this.renderSteps();
        this.updateNavigation();

        if (this.overlay) {
            this.overlay.classList.remove('hidden');
        }
    }

    /**
     * Hide tutorial
     */
    hide() {
        if (this.overlay) {
            this.overlay.classList.add('hidden');
        }

        // Mark tutorial as seen
        if (this.currentTutorial) {
            const modeName = Object.keys(this.tutorials).find(
                key => this.tutorials[key] === this.currentTutorial
            );
            if (modeName) {
                Utils.saveToStorage(`gemsBlast_tutorial_${modeName}_seen`, true);
            }
        }

        this.isActive = false;
        this.currentTutorial = null;
    }

    /**
     * Go to next step
     */
    nextStep() {
        if (!this.currentTutorial) return;

        if (this.currentStep < this.currentTutorial.steps.length - 1) {
            this.currentStep++;
            this.updateNavigation();
            this.showCurrentStep();
        } else {
            this.hide();
        }
    }

    /**
     * Go to previous step
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.updateNavigation();
            this.showCurrentStep();
        }
    }

    /**
     * Render all tutorial steps
     */
    renderSteps() {
        if (!this.stepsContainer || !this.currentTutorial) return;

        this.stepsContainer.innerHTML = '';

        this.currentTutorial.steps.forEach((step, index) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'tutorial-step';
            stepDiv.dataset.step = index;

            stepDiv.innerHTML = `
                <div class="tutorial-step-icon">${step.icon}</div>
                <h3>${step.title}</h3>
                ${step.content}
            `;

            this.stepsContainer.appendChild(stepDiv);
        });

        this.showCurrentStep();
    }

    /**
     * Show current step
     */
    showCurrentStep() {
        const steps = this.stepsContainer?.querySelectorAll('.tutorial-step');
        if (!steps) return;

        steps.forEach((step, index) => {
            if (index === this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    /**
     * Update navigation buttons
     */
    updateNavigation() {
        if (!this.currentTutorial) return;

        const totalSteps = this.currentTutorial.steps.length;

        // Update step indicator
        if (this.stepIndicator) {
            this.stepIndicator.textContent = `${this.currentStep + 1} / ${totalSteps}`;
        }

        // Update prev button
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentStep === 0;
            this.prevBtn.style.opacity = this.currentStep === 0 ? '0.5' : '1';
        }

        // Update next button text
        if (this.nextBtn) {
            const isLastStep = this.currentStep === totalSteps - 1;
            this.nextBtn.textContent = isLastStep ? 'Start Playing!' : 'Next';
        }
    }

    /**
     * Reset tutorial progress (for debugging or settings)
     */
    resetProgress() {
        Object.keys(this.tutorials).forEach(modeName => {
            Utils.saveToStorage(`gemsBlast_tutorial_${modeName}_seen`, false);
        });
        console.log('Tutorial progress reset');
    }

    /**
     * Force show tutorial (even if already seen)
     * @param {string} modeName - Name of the mode
     */
    forceShow(modeName) {
        const seenKey = `gemsBlast_tutorial_${modeName}_seen`;
        Utils.saveToStorage(seenKey, false);
        this.show(modeName);
    }
}

// Export class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TutorialSystem };
}
