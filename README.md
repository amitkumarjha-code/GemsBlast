# 🎮 GemsBlast Game

A web-based match-3 puzzle game inspired by Seekers Notes.

## 🎯 Features

- **Match-3 Gameplay**: Swap and match 3+ gems of the same color
- **Special Gems**: Create powerful Rocket, Bomb, and Rainbow gems with special combinations
- **Multiple Game Modes**: Classic, Plates, Palette, and Stargazer challenges
- **15 Progressive Levels**: Increasing difficulty from Easy to Expert
- **Power-Up System**: Hammer, Shuffle, Color Bomb, Extra Moves, and Score Boost
- **Reward System**: Earn power-ups through gameplay, achievements, and daily rewards
- **Combo System**: Build combos with cascading matches for score multipliers up to 3x
- **Enhanced Visual Effects**: Color-coded particle explosions, screen shake for combos, enhanced special gem effects
- **Floating Score Animations**: Score text appears at match locations with size/color based on match quality
- **Achievement Popups**: Animated notifications when unlocking achievements
- **Victory Celebrations**: Confetti effects, star earning animations, and victory bounce effects
- **Enhanced Hints**: Animated visual hints with glowing effects and directional indicators
- **Star Rating**: Earn 1-3 stars per level based on performance
- **Level Progression**: Unlock new levels by completing previous ones
- **Persistent Save**: All progress automatically saved
- **Responsive Design**: Play on desktop, tablet, and mobile

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (for development server)

### Installation
1. Clone the repository
```bash
git clone https://github.com/yourusername/gemsblast-game.git
cd gemsblast-game
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:8080`

## 🎮 How to Play

1. **Basic Matching**: Swap adjacent gems to create lines of 3+ same-colored gems
2. **Special Gems**: 
   - Match 4 gems → Rocket (clears row/column)
   - Match 5 in L/T → Bomb (3x3 explosion)
   - Match 5 in line → Rainbow (removes all of one color)
3. **Combinations**: Combine special gems for powerful effects
4. **Power-Ups**: Use strategic power-ups to overcome difficult challenges
5. **Game Modes**:
   - **Classic**: Reach the target score
   - **Plates**: Clear all golden plates
   - **Palette**: Collect specific colored gems
   - **Stargazer**: Form constellation patterns
6. **Objectives**: Complete level goals within the move limit to earn stars

## 🛠️ Development

### Project Structure
```
gemsblast-game/
├── index.html          # Main game page
├── src/
│   ├── css/
│   │   ├── main.css    # Main styles
│   │   └── animations.css # Animation definitions
│   └── js/
│       ├── game.js     # Core game logic
│       ├── board.js    # Game board management
│       ├── gems.js     # Gem system
│       ├── gamemode.js # Game mode base class
│       ├── gamemodes.js # Mode implementations
│       ├── powerups.js # Power-up system
│       ├── rewards.js  # Reward and achievement system
│       ├── levels.js   # Level progression system
│       ├── tutorial.js # Tutorial system
│       ├── particles.js # Visual effects
│       ├── ui.js       # User interface
│       ├── utils.js    # Utility functions
│       └── main.js     # App initialization
└── README.md
```

### Development Phases
- [x] Phase 1: Foundation & Core Setup
- [x] Phase 2: Special Gems & Combinations
- [x] Phase 3: Game Modes & Objectives
- [x] Phase 4: Power-ups & Boosters
- [x] Phase 5: Levels & Progression System
- [x] Phase 6: Sound Effects & Music
- [x] Phase 7: Advanced Features & Polish
- [ ] Phase 8: Testing & Optimization

## Recent UI/UX Improvements ✨

### Special Gem Behavior Fixed
- ✅ Rocket and Bomb gems no longer activate on click
- ✅ They only activate when matched with other gems
- ✅ Rainbow gems can be swapped with any gem to activate

### Enhanced Visual Graphics
- ✅ Rocket gems now have realistic rocket ship design with nose cone, fins, and windows
- ✅ Bomb gems feature animated fuse with sparkling particles
- ✅ Rainbow gems have rotating multi-layered gradient with sparkling stars
- ✅ All special gems have professional canvas-based graphics instead of emojis

### Loading Experience
- ✅ Added animated loading screen with bouncing gem icons
- ✅ Progress bar shows loading percentage (0-100%)
- ✅ Step-by-step loading messages guide the user
- ✅ Smooth fade-in/fade-out transitions

### Objective Progress Visualization
- ✅ Individual progress bars for each objective
- ✅ Color-coded progress (low/medium/high completion)
- ✅ Visual completion animations when objectives are met
- ✅ Moves display turns yellow (≤5 moves) and red (≤2 moves) as warning
- ✅ Percentage display for each objective

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🎯 Roadmap

See the [Development Plan](DEVELOPMENT_PLAN.md) for detailed phase-wise implementation.

