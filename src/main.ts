import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { GameScene } from './game/scenes/GameScene';
import { GameOverScene } from './game/scenes/GameOverScene';
import { GAME_WIDTH, GAME_HEIGHT } from './game/config';

// ═══════════════════════════════════════════════════════════════════════════════
// JumpJumpJump - Main Entry Point
// ═══════════════════════════════════════════════════════════════════════════════

let gameInstance: Phaser.Game | null = null;

// Expose for HTML overlay pause button
declare global {
  interface Window {
    setGamePaused: (paused: boolean) => void;
    restartGame: () => void;
  }
}

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

// Set pause state - exposed globally for HTML button
window.setGamePaused = function(paused: boolean) {
  if (!gameInstance) return;
  
  // Find GameScene and pause/unpause it
  const gameScene = gameInstance.scene.getScene('GameScene') as any;
  if (gameScene && typeof gameScene.setPaused === 'function') {
    gameScene.setPaused(paused);
  }
  
  // Show/hide HTML pause overlay
  const overlay = document.getElementById('pause-overlay');
  const pauseBtn = document.getElementById('pause-btn');
  if (overlay) {
    overlay.style.display = paused ? 'flex' : 'none';
  }
  if (pauseBtn) {
    pauseBtn.textContent = paused ? '▶' : '⏸';
  }
};

// Restart game - exposed globally for HTML button
window.restartGame = function() {
  if (!gameInstance) return;
  
  // Hide overlay
  const overlay = document.getElementById('pause-overlay');
  if (overlay) overlay.style.display = 'none';
  
  // Get GameScene and restart it
  const gameScene = gameInstance.scene.getScene('GameScene') as any;
  if (gameScene) {
    gameScene.scene.restart();
  }
};

// Listen for startGame event from landing page
window.addEventListener('startGame', startGame);
