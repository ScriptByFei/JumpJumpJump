# JumpJumpJump

A modern vertical jump game built with Vite, TypeScript, and Phaser 3.
Mobile-first, endless runner style, inspired by Doodle Jump.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (opens at localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Controls

**Mobile:** Tap left or right half of the screen
**Desktop:** Arrow keys ← → or A / D

## Project Structure

```
src/
├── main.ts                 # Phaser game entry point
├── game/
│   ├── config.ts           # Game constants (gravity, speeds, dimensions, colors)
│   ├── scenes/
│   │   ├── BootScene.ts    # Loads assets, creates placeholder textures
│   │   ├── MenuScene.ts    # Start screen
│   │   ├── GameScene.ts    # Core gameplay
│   │   └── GameOverScene.ts
│   ├── objects/
│   │   ├── Player.ts       # Player sprite, movement, jump, wrap
│   │   └── Platform.ts     # Platform with optional horizontal movement
│   └── systems/
│       ├── PlatformSpawner.ts  # Procedural platform generation & cleanup
│       └── ScoreSystem.ts      # Score tracking & high score
└── ui/                     # Future: HUD elements, overlays

public/                     # Static assets (favicon, etc.)
```

## Gameplay

- Player jumps automatically when landing on a platform
- Only left/right control
- Endless vertical level — camera follows upward
- Score = height climbed × 10
- Game over when falling below the visible screen
- Horizontal screen wrap (go off one side → appear on the other)

## Extending

The structure is set up for easy expansion:

- **Items/Powerups** → add to `src/game/objects/` and spawn in `PlatformSpawner`
- **Enemies** → add enemy classes, extend `PlatformSpawner` to include hazard platforms
- **Better graphics** → replace placeholder textures in `BootScene` with loaded assets
- **Sound** → add audio files to `public/assets/audio/` and play via `this.sound.play()`
- **More scenes** → extend the scene array in `main.ts`

## Tech Stack

- [Phaser 3](https://phaser.io/) — game framework
- [Vite](https://vitejs.dev/) — build tool
- [TypeScript](https://www.typescriptlang.org/) — type safety
# Sun Apr  5 11:38:50 CEST 2026
