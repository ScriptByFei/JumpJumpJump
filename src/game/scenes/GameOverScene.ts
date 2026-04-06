import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';

interface GameOverData {
  score: number;
  highScore: number;
}

export class GameOverScene extends Phaser.Scene {
  private gameData!: GameOverData;
  private confettiEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: GameOverData): void {
    this.gameData = data;
  }

  create(): void {
    this.createBackground();
    this.createContent();
    this.createButtons();
    this.setupInput();
    this.cameras.main.fadeIn(400);
  }

  private createBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x0a0a14, 0x0a0a14, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.3);
    vignette.fillRect(0, 0, GAME_WIDTH, 80);
    vignette.fillRect(0, GAME_HEIGHT - 120, GAME_WIDTH, 120);
    vignette.setDepth(1);
  }

  private createContent(): void {
    const centerX = GAME_WIDTH / 2;
    const safeTop = this.getSafeAreaTop();
    const topOffset = safeTop + 30;
    const titleY = topOffset + 40;

    // Decorative lines
    const lineTop = this.add.graphics();
    lineTop.lineStyle(2, 0x4ecdc4, 0.4);
    lineTop.lineBetween(centerX - 80, titleY - 25, centerX + 80, titleY - 25);
    lineTop.setAlpha(0);
    this.tweens.add({ targets: lineTop, alpha: 1, duration: 400, delay: 200 });

    // Skull icon
    const skull = this.add.graphics();
    skull.fillStyle(0x4ecdc4, 0.8);
    skull.fillCircle(0, 0, 15);
    skull.fillStyle(0x0a0a14, 1);
    skull.fillCircle(-5, -2, 4);
    skull.fillCircle(5, -2, 4);
    skull.fillTriangle(0, 2, -2, 6, 2, 6);
    skull.setPosition(centerX, titleY - 55);
    skull.setScale(0);
    this.tweens.add({ targets: skull, scale: 1, alpha: 1, duration: 400, delay: 200 });

    // Game Over text
    const title = this.add.text(centerX, titleY, 'GAME OVER', {
      fontSize: '38px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#e94560',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 400, delay: 300 });

    const lineBottom = this.add.graphics();
    lineBottom.lineStyle(2, 0x4ecdc4, 0.4);
    lineBottom.lineBetween(centerX - 80, titleY + 25, centerX + 80, titleY + 25);
    lineBottom.setAlpha(0);
    this.tweens.add({ targets: lineBottom, alpha: 1, duration: 400, delay: 400 });

    // Score section
    const scoreSectionY = titleY + 80;

    const yourScoreLabel = this.add.text(centerX, scoreSectionY, 'DEINE PUNKTE', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#6b7280',
      letterSpacing: 2,
    }).setOrigin(0.5).setAlpha(0);

    const scoreValue = this.add.text(centerX, scoreSectionY + 30, '0', {
      fontSize: '64px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: [yourScoreLabel, scoreValue], alpha: 1, duration: 300, delay: 400 });

    this.tweens.addCounter({
      from: 0,
      to: this.gameData.score,
      duration: 1000,
      ease: 'Cubic.easeOut',
      delay: 500,
      onUpdate: (tween) => {
        scoreValue.setText(Math.floor(tween.getValue() ?? 0).toString());
      },
    });

    // High score / New Record
    const isNewRecord = this.gameData.score >= this.gameData.highScore && this.gameData.score > 0;
    const bestY = scoreSectionY + 100;

    if (isNewRecord) {
      if (this.gameData.score > 0) {
        this.createConfetti();
      }

      const badge = this.add.graphics();
      badge.fillStyle(0xfeca57, 1);
      badge.fillRoundedRect(-60, -15, 120, 30, 15);
      badge.setPosition(centerX, bestY);
      badge.setScale(0);

      const badgeText = this.add.text(centerX, bestY, 'NEUER REKORD!', {
        fontSize: '14px',
        fontFamily: 'Arial Black, Arial, sans-serif',
        color: '#0f0f1a',
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: badge, scale: 1, alpha: 1, duration: 400, delay: 800, ease: 'Back.easeOut' });
      this.tweens.add({ targets: badgeText, alpha: 1, duration: 400, delay: 800 });
      this.tweens.add({ targets: badge, scale: 1.1, duration: 600, yoyo: true, repeat: -1, delay: 1200 });
    } else {
      const bestLabel = this.add.text(centerX, bestY - 10, 'BESTE PUNKTZAHL', {
        fontSize: '11px',
        fontFamily: 'Arial, sans-serif',
        color: '#6b7280',
        letterSpacing: 1,
      }).setOrigin(0.5).setAlpha(0);

      const bestValue = this.add.text(centerX, bestY + 15, this.gameData.highScore.toString(), {
        fontSize: '24px',
        fontFamily: 'Arial Black, Arial, sans-serif',
        color: '#a855f7',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({ targets: [bestLabel, bestValue], alpha: 1, duration: 400, delay: 600 });
    }
  }

  private createConfetti(): void {
    const colors = [0x4ecdc4, 0xfeca57, 0xa855f7, 0xff6b6b, 0x00d4ff];

    this.confettiEmitter = this.add.particles(0, 0, 'particle_square', {
      x: { min: 0, max: GAME_WIDTH },
      y: -30,
      speed: { min: 80, max: 200 },
      angle: { min: 60, max: 120 },
      scale: { start: 0.6, end: 0.1 },
      rotate: { min: 0, max: 360 },
      lifespan: 5000,
      frequency: 60,
      quantity: 2,
      tint: colors,
    });

    this.time.delayedCall(4000, () => {
      if (this.confettiEmitter) this.confettiEmitter.stop();
    });
  }

  private createButtons(): void {
    const centerX = GAME_WIDTH / 2;
    const safeBottom = this.getSafeAreaBottom();
    const btnY = GAME_HEIGHT - safeBottom - 40;
    const btnSpacing = 70;

    this.createButton(centerX, btnY - btnSpacing / 2, 'NOCHMAL', 0x4ecdc4, () => this.restartGame());
    this.createButton(centerX, btnY + btnSpacing / 2, 'MENU', 0x6b7280, () => this.goToMenu());
  }

  private createButton(x: number, y: number, text: string, color: number, callback: () => void): void {
    const container = this.add.container(x, y);
    const btnWidth = 180;
    const btnHeight = 50;

    const btnBg = this.add.graphics();
    btnBg.fillStyle(color, 1);
    btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 12);
    btnBg.fillStyle(0xffffff, 0.1);
    btnBg.fillRoundedRect(-btnWidth / 2 + 3, -btnHeight / 2 + 3, btnWidth - 6, btnHeight / 2 - 3, 10);
    container.add(btnBg);

    const btnText = this.add.text(0, 0, text, {
      fontSize: '16px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(btnText);

    container.setAlpha(0);
    container.setScale(0.8);

    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 400,
      delay: 1000,
      ease: 'Back.easeOut',
    });

    const hitArea = this.add.rectangle(0, 0, btnWidth, btnHeight, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on('pointerover', () => {
      this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
    });

    hitArea.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 100 });
    });

    hitArea.on('pointerdown', () => {
      this.tweens.add({ targets: container, scale: 0.95, duration: 50, yoyo: true });
      callback();
    });
  }

  private setupInput(): void {
    this.input.keyboard?.on('keydown-SPACE', () => this.restartGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.restartGame());
  }

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

  shutdown(): void {
    if (this.confettiEmitter) {
      this.confettiEmitter.destroy();
    }
  }
}