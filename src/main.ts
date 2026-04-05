import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { GameScene } from './game/scenes/GameScene';
import { GameOverScene } from './game/scenes/GameOverScene';
import { GAME_WIDTH, GAME_HEIGHT } from './game/config';

// ═══════════════════════════════════════════════════════════════════════════════
// JumpJumpJump - Main Entry Point
// ═══════════════════════════════════════════════════════════════════════════════

let gameInstance: Phaser.Game | null = null;

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

// Start game when requested from landing page
function startGame() {
  console.log('Start game event received');
  const container = document.getElementById('game-container');
  if (container) {
    container.style.display = 'block';
    if (!gameInstance) {
      gameInstance = new Phaser.Game(config);
    }
  }
}

// Listen for togglePause event from HTML overlay
function handleTogglePause(event: Event) {
  const customEvent = event as CustomEvent<boolean>;
  const isPaused = customEvent.detail;
  if (gameInstance && gameInstance.scene && gameInstance.scene.scenes.length > 0) {
    const activeScene = gameInstance.scene.scenes.find(s => s.scene.isActive() && s.scene.isVisible());
    if (activeScene && 'setPaused' in activeScene) {
      (activeScene as any).setPaused(isPaused);
    }
  }
}

// Listen for startGame event from landing page
window.addEventListener('startGame', startGame);
window.addEventListener('togglePause', handleTogglePause);
