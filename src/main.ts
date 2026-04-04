import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { MenuScene } from './game/scenes/MenuScene';
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
    // Ensure canvas doesn't get too large on desktop
    max: {
      width: 800,
      height: 1400,
    },
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene],
  // No physics config - we handle gravity in Player class for more control
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // We apply gravity manually in Player
      debug: false,
    },
  },
  // Prevent context menu on right-click
  disableContextMenu: true,
  // Audio settings
  audio: {
    noAudio: true, // No audio in this version
  },
};

// Hide loading screen when Phaser is ready
const game = new Phaser.Game(config);

game.events.on('ready', () => {
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.classList.add('hidden');
    setTimeout(() => loadingEl.remove(), 300);
  }
});
