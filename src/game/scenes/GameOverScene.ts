import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

// ═══════════════════════════════════════════════════════════════════════════════
// Game Over Scene - Polished version with confetti and animations
// ═══════════════════════════════════════════════════════════════════════════════
interface GameOverData {
  score: number;
  highScore: number;
}

export class GameOverScene extends Phaser.Scene {
  private gameData!: GameOverData;
  private confettiEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverData): void {
    this.gameData = data;
  }

  create(): void {
    // Background
    this.createBackground();

    // Confetti for high scores
    if (this.gameData.score >= this.gameData.highScore && this.gameData.score > 0) {
      this.createConfetti();
    }

    // Game Over title
    this.createTitle();

    // Score panel
    this.createScorePanel();

    // Buttons
    this.createButtons();

    // Input
    this.setupInput();

    // Fade in
    this.cameras.main.fadeIn(300);
  }

  // ─── Background ─────────────────────────────────────────────────────────────
  private createBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(
      COLORS.backgroundGradientTop,
      COLORS.backgroundGradientTop,
      COLORS.background,
      COLORS.background,
      1
    );
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Dark overlay
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.5
    );
    overlay.setDepth(0);
  }

  // ─── Confetti ───────────────────────────────────────────────────────────────
  private createConfetti(): void {
    const colors = [
      COLORS.platformNormal,
      COLORS.platformBoost,
      COLORS.platformMoving,
      COLORS.platformBreakable,
      COLORS.scoreText,
    ];

    this.confettiEmitter = this.add.particles(0, 0, 'particle_square', {
      x: { min: 0, max: GAME_WIDTH },
      y: -20,
      speed: { min: 50, max: 150 },
      angle: { min: 60, max: 120 },
      scale: { start: 0.5, end: 0.2 },
      rotate: { min: 0, max: 360 },
      lifespan: 4000,
      frequency: 80,
      quantity: 3,
      tint: colors,
    });

    // Stop after a few seconds
    this.time.delayedCall(4000, () => {
      if (this.confettiEmitter) {
        this.confettiEmitter.stop();
      }
    });
  }

  // ─── Title ─────────────────────────────────────────────────────────────────
  private createTitle(): void {
    const centerX = GAME_WIDTH / 2;
    const safeTop = this.getSafeAreaTop();
    const titleY = safeTop + 80;

    // Shadow
    const shadow = this.add.text(centerX + 4, titleY + 4, 'GAME\nOVER', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#000000',
      align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    // Main text
    const title = this.add.text(centerX, titleY, 'GAME\nOVER', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#e94560',
      align: 'center',
      stroke: '#0f0f1a',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0);

    // Animate in
    this.tweens.add({
      targets: [title, shadow],
      alpha: 1,
      scale: 1,
      duration: 600,
      delay: 200,
      ease: 'Back.easeOut',
    });
  }

  // ─── Score Panel ───────────────────────────────────────────────────────────
  private createScorePanel(): void {
    const centerX = GAME_WIDTH / 2;
    const safeTop = this.getSafeAreaTop();
    const panelY = safeTop + 220;

    // Panel background
    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.background, 0.8);
    panelBg.fillRoundedRect(centerX - 120, panelY - 90, 240, 180, 16);
    panelBg.lineStyle(2, COLORS.platformNormal, 0.5);
    panelBg.strokeRoundedRect(centerX - 120, panelY - 90, 240, 180, 16);

    // Score label
    const scoreLabel = this.add.text(centerX, panelY - 50, 'SCORE', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#8b8b8b',
    }).setOrigin(0.5).setAlpha(0);

    // Score value
    const scoreText = this.add.text(centerX, panelY - 10, '0', {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#' + COLORS.scoreText.toString(16).padStart(6, '0'),
      stroke: '#0f0f1a',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    // High score
    const isNewRecord = this.gameData.score >= this.gameData.highScore && this.gameData.score > 0;
    const highScoreLabel = isNewRecord ? 'NEW BEST!' : 'BEST';
    const highScoreColor = isNewRecord ? COLORS.platformBoost : COLORS.textMuted;

    const hsLabel = this.add.text(centerX, panelY + 40, highScoreLabel, {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#' + highScoreColor.toString(16).padStart(6, '0'),
    }).setOrigin(0.5).setAlpha(0);

    const hsValue = this.add.text(centerX, panelY + 70, this.gameData.highScore.toString(), {
      fontSize: '28px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#' + highScoreColor.toString(16).padStart(6, '0'),
      stroke: '#0f0f1a',
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0);

    // Animate score counting up
    this.tweens.addCounter({
      from: 0,
      to: this.gameData.score,
      duration: 1200,
      ease: 'Cubic.easeOut',
      delay: 400,
      onUpdate: (tween) => {
        scoreText.setText(Math.floor(tween.getValue() ?? 0).toString());
      },
    });

    // Animate elements in
    this.tweens.add({
      targets: [scoreLabel, scoreText, hsLabel, hsValue],
      alpha: 1,
      duration: 400,
      delay: 400,
    });

    // Pulse effect for new record
    if (isNewRecord) {
      this.tweens.add({
        targets: scoreText,
        scale: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
        delay: 1500,
      });
    }
  }

  // ─── Buttons ────────────────────────────────────────────────────────────────
  private createButtons(): void {
    const centerX = GAME_WIDTH / 2;
    const safeBottom = this.getSafeAreaBottom();
    const btnY = GAME_HEIGHT - safeBottom - 100;

    // Retry button
    this.createButton(centerX, btnY - 35, 'TRY AGAIN', () => this.restartGame());

    // Menu button
    this.createButton(centerX, btnY + 35, 'MENU', () => this.goToMenu());
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const container = this.add.container(x, y);

    // Button background
    const btnBg = this.add.image(0, 0, 'btn_primary');
    btnBg.setScale(1.1);

    // Button text
    const btnText = this.add.text(0, 0, text, {
      fontSize: '16px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    container.add([btnBg, btnText]);
    container.setAlpha(0);
    container.setScale(0);

    // Animate in
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 400,
      delay: 800,
      ease: 'Back.easeOut',
    });

    // Make interactive
    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scale: 1.08,
        duration: 100,
      });
    });
    btnBg.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 100,
      });
    });
    btnBg.on('pointerdown', callback);
  }

  // ─── Input ─────────────────────────────────────────────────────────────────
  private setupInput(): void {
    this.input.keyboard?.on('keydown-SPACE', () => this.restartGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.restartGame());
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────
  private restartGame(): void {
    this.cameras.main.fadeOut(200);
    this.time.delayedCall(200, () => {
      this.scene.start('GameScene');
    });
  }

  private goToMenu(): void {
    this.cameras.main.fadeOut(200);
    this.time.delayedCall(200, () => {
      this.scene.start('MenuScene');
    });
  }

  // ─── Safe Area ──────────────────────────────────────────────────────────────
  private getSafeAreaTop(): number {
    const style = getComputedStyle(document.documentElement);
    const sat = style.getPropertyValue('--sat').trim();
    return sat ? parseInt(sat) : 44;
  }

  private getSafeAreaBottom(): number {
    const style = getComputedStyle(document.documentElement);
    const sab = style.getPropertyValue('--sab').trim();
    return sab ? parseInt(sab) : 34;
  }

  // ─── Shutdown ───────────────────────────────────────────────────────────────
  shutdown(): void {
    if (this.confettiEmitter) {
      this.confettiEmitter.destroy();
    }
  }
}
