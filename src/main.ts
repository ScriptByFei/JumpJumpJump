import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { GameScene } from './game/scenes/GameScene';
import { GameOverScene } from './game/scenes/GameOverScene';
import { GAME_WIDTH, GAME_HEIGHT } from './game/config';

// ═══════════════════════════════════════════════════════════════════════════════
// JumpJumpJump - Main Entry Point
// ═══════════════════════════════════════════════════════════════════════════════

const config: Phaser.Types.Core.GameConfig = {
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0f0f1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    max: {
      width: 800,
      height: 1400,
    },
  },
  scene: [BootScene, GameScene, GameOverScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  disableContextMenu: true,
  audio: {
    noAudio: true,
  },
};

// Game instance
let game: Phaser.Game | null = null;

// Start game function
function startGame() {
  if (game) {
    game.destroy(true);
  }
  game = new Phaser.Game(config);
}

// Listen for startGame event from landing page
window.addEventListener('startGame', startGame);

// Don't auto-start - landing page controls when to start
