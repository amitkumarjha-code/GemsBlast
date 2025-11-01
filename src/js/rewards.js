class RewardSystem {
    constructor(game) {
        this.game = game;
        this.powerUpManager = game.powerUpManager;

        // Reward thresholds
        this.rewards = {
            levelComplete: {
                hammer: { chance: 0.3, amount: 1 },
                shuffle: { chance: 0.2, amount: 1 },
                colorBomb: { chance: 0.15, amount: 1 },
                extraMoves: { chance: 0.25, amount: 1 },
                scoreBoost: { chance: 0.2, amount: 1 }
            },
            highScore: {
                threshold: 5000,
                powerUp: 'hammer',
                amount: 2
            },
            perfectScore: {
                threshold: 10000,
                powerUp: 'colorBomb',
                amount: 1
            },
            comboStreak: {
                threshold: 5, // 5 consecutive matches
                powerUp: 'shuffle',
                amount: 1
            },
            specialGemMaster: {
                threshold: 10, // Create 10 special gems in one game
                powerUp: 'scoreBoost',
                amount: 1
            },
            dailyReward: {
                powerUps: ['hammer', 'shuffle', 'extraMoves'],
                amount: 1
            }
        };

        // Session tracking
        this.sessionStats = {
            comboStreak: 0,
            maxComboStreak: 0,
            specialGemsCreated: 0,
            achievementsEarned: []
        };

        this.lastDailyReward = this.loadLastDailyReward();
    }

    // Called when a level/game is completed
    onLevelComplete(score, movesRemaining) {
        const rewards = [];

        // Random power-up rewards based on chance
        for (const [powerUpType, config] of Object.entries(this.rewards.levelComplete)) {
            if (Math.random() < config.chance) {
                this.powerUpManager.add(powerUpType, config.amount);
                rewards.push({ type: powerUpType, amount: config.amount, reason: 'Level Complete' });
            }
        }

        // Bonus moves reward (extra moves if player finished with many moves left)
        if (movesRemaining >= 5) {
            this.powerUpManager.add('extraMoves', 1);
            rewards.push({ type: 'extraMoves', amount: 1, reason: 'Efficient Play' });
        }

        // High score rewards
        if (score >= this.rewards.perfectScore.threshold) {
            this.powerUpManager.add(
                this.rewards.perfectScore.powerUp,
                this.rewards.perfectScore.amount
            );
            rewards.push({
                type: this.rewards.perfectScore.powerUp,
                amount: this.rewards.perfectScore.amount,
                reason: 'Perfect Score!'
            });
        } else if (score >= this.rewards.highScore.threshold) {
            this.powerUpManager.add(
                this.rewards.highScore.powerUp,
                this.rewards.highScore.amount
            );
            rewards.push({
                type: this.rewards.highScore.powerUp,
                amount: this.rewards.highScore.amount,
                reason: 'High Score'
            });
        }

        // Combo streak achievement
        if (this.sessionStats.maxComboStreak >= this.rewards.comboStreak.threshold) {
            this.powerUpManager.add(
                this.rewards.comboStreak.powerUp,
                this.rewards.comboStreak.amount
            );
            rewards.push({
                type: this.rewards.comboStreak.powerUp,
                amount: this.rewards.comboStreak.amount,
                reason: `${this.sessionStats.maxComboStreak}x Combo Streak!`
            });
        }

        // Special gem master achievement
        if (this.sessionStats.specialGemsCreated >= this.rewards.specialGemMaster.threshold) {
            this.powerUpManager.add(
                this.rewards.specialGemMaster.powerUp,
                this.rewards.specialGemMaster.amount
            );
            rewards.push({
                type: this.rewards.specialGemMaster.powerUp,
                amount: this.rewards.specialGemMaster.amount,
                reason: `Special Gem Master (${this.sessionStats.specialGemsCreated})`
            });
        }

        // Reset session stats for next game
        this.resetSessionStats();

        return rewards;
    }

    // Called when player makes a match
    onMatch(matchCount) {
        this.sessionStats.comboStreak++;
        this.sessionStats.maxComboStreak = Math.max(
            this.sessionStats.maxComboStreak,
            this.sessionStats.comboStreak
        );
    }

    // Called when combo breaks (no valid moves or player waits)
    onComboBreak() {
        this.sessionStats.comboStreak = 0;
    }

    // Called when special gem is created
    onSpecialGemCreated(gemType) {
        this.sessionStats.specialGemsCreated++;
    }

    // Daily reward system
    checkDailyReward() {
        const now = new Date();
        const today = now.toDateString();

        if (this.lastDailyReward !== today) {
            const randomPowerUp = this.rewards.dailyReward.powerUps[
                Math.floor(Math.random() * this.rewards.dailyReward.powerUps.length)
            ];

            this.powerUpManager.add(randomPowerUp, this.rewards.dailyReward.amount);
            this.lastDailyReward = today;
            this.saveLastDailyReward(today);

            return {
                type: randomPowerUp,
                amount: this.rewards.dailyReward.amount,
                reason: 'Daily Reward'
            };
        }

        return null;
    }

    // Achievement system
    checkAchievements() {
        const achievements = [];

        // First win achievement
        if (!this.hasAchievement('firstWin')) {
            achievements.push({
                id: 'firstWin',
                name: 'First Victory',
                reward: { type: 'hammer', amount: 3 }
            });
        }

        // Mode master achievements
        const modes = ['classic', 'plates', 'palette', 'stargazer'];
        modes.forEach(mode => {
            const wins = this.getModeWins(mode);
            if (wins === 1 && !this.hasAchievement(`${mode}First`)) {
                achievements.push({
                    id: `${mode}First`,
                    name: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Starter`,
                    reward: { type: 'shuffle', amount: 1 }
                });
            } else if (wins === 10 && !this.hasAchievement(`${mode}Master`)) {
                achievements.push({
                    id: `${mode}Master`,
                    name: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Master`,
                    reward: { type: 'colorBomb', amount: 2 }
                });
            }
        });

        return achievements;
    }

    // Award achievement rewards
    awardAchievement(achievement) {
        if (achievement.reward) {
            this.powerUpManager.add(achievement.reward.type, achievement.reward.amount);
        }
        this.sessionStats.achievementsEarned.push(achievement.id);
        this.saveAchievement(achievement.id);

        // Show achievement notification
        this.showAchievementNotification(achievement);
    }

    /**
     * Show achievement popup notification
     */
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 25px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            z-index: 10000;
            min-width: 300px;
            animation: slideInRight 0.5s ease-out;
        `;

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="font-size: 2.5rem;">🏆</div>
                <div>
                    <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 4px;">Achievement Unlocked!</div>
                    <div style="font-size: 1.1rem; font-weight: bold;">${achievement.name}</div>
                    ${achievement.reward ? `<div style="font-size: 0.85rem; color: #FFD700; margin-top: 6px;">+${achievement.reward.amount} ${achievement.reward.type}</div>` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Play sound if available
        if (window.gemsBlastApp && window.gemsBlastApp.game && window.gemsBlastApp.game.audioManager) {
            window.gemsBlastApp.game.audioManager.playSound(SoundEffect.POWER_UP);
        }

        // Remove after delay
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 4000);
    }

    // Session stats management
    resetSessionStats() {
        this.sessionStats = {
            comboStreak: 0,
            maxComboStreak: 0,
            specialGemsCreated: 0,
            achievementsEarned: []
        };
    }

    // Persistence
    loadLastDailyReward() {
        return localStorage.getItem('gemsblast_daily_reward') || '';
    }

    saveLastDailyReward(date) {
        localStorage.setItem('gemsblast_daily_reward', date);
    }

    hasAchievement(achievementId) {
        const achievements = JSON.parse(localStorage.getItem('gemsblast_achievements') || '[]');
        return achievements.includes(achievementId);
    }

    saveAchievement(achievementId) {
        const achievements = JSON.parse(localStorage.getItem('gemsblast_achievements') || '[]');
        if (!achievements.includes(achievementId)) {
            achievements.push(achievementId);
            localStorage.setItem('gemsblast_achievements', JSON.stringify(achievements));
        }
    }

    getModeWins(mode) {
        const stats = JSON.parse(localStorage.getItem('gemsblast_stats') || '{}');
        return stats[`${mode}Wins`] || 0;
    }

    incrementModeWins(mode) {
        const stats = JSON.parse(localStorage.getItem('gemsblast_stats') || '{}');
        stats[`${mode}Wins`] = (stats[`${mode}Wins`] || 0) + 1;
        localStorage.setItem('gemsblast_stats', JSON.stringify(stats));
    }
}
