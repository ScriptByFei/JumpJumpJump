import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, HIGHSCORE_KEY } from '../config';

// ═══════════════════════════════════════════════════════════════════════════════
// Menu Scene - Modern Minimal Design
// ═══════════════════════════════════════════════════════════════════════════════

export class MenuScene extends Phaser.Scene {
  private highScore: number = 0;
  private ball!: Phaser.GameObjects.Arc;
  private ballVy: number = 0;
  private platforms: Phaser.GameObjects.Rectangle[] = [];
  private readonly GRAVITY = 600;
  private readonly BOUNCE_VELOCITY = -450;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Load high score
    this.highScore = parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0');

    // Background - solid dark
    this.createBackground();

    // Animated ball demo
    this.createBallDemo();

    // Title
    this.createTitle();

    // High score
    this.createHighScore();

    // Tap to play
    this.createTapHint();

    // Input
    this.setupInput();
  }

  // ─── Background ─────────────────────────────────────────────────────────────
  private createBackground(): void {
    // Clean dark background with subtle gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Subtle top glow
    const glow = this.add.graphics();
    glow.fillStyle(0x4ecdc4, 0.05);
    glow.fillEllipse(GAME_WIDTH / 2, -50, GAME_WIDTH, 200);
  }

  // ─── Ball Demo Animation ─────────────────────────────────────────────────────
  private createBallDemo(): void {
    const centerX = GAME_WIDTH / 2;
    const baseY = GAME_HEIGHT - 100;

    // Create 3 simple platforms
    const platformPositions = [
      { x: centerX - 100, y: baseY - 100 },
      { x: centerX + 100, y: baseY - 100 },
      { x: centerX, y: baseY - 220 },
    ];

    platformPositions.forEach((pos) => {
      const plat = this.add.rectangle(pos.x, pos.y, 70, 12, 0x4ecdc4);
      plat.setAlpha(0.6);
      this.platforms.push(plat);
    });

    // Ball
    this.ball = this.add.circle(centerX, baseY - 150, 15, 0x4ecdc4);
    this.ballVy = this.BOUNCE_VELOCITY;
  }

  // ─── Title ─────────────────────────────────────────────────────────────────
  private createTitle(): void {
    const centerX = GAME_WIDTH / 2;

    // Simple, bold title
    this.add.text(centerX, 80, 'JUMP', {
      fontSize: '72px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  // ─── High Score ─────────────────────────────────────────────────────────────
  private createHighScore(): void {
    const centerX = GAME_WIDTH / 2;
    const y = 140;

    if (this.highScore > 0) {
      this.add.text(centerX, y, `${this.highScore}`, {
        fontSize: '28px',
        fontFamily: 'Arial, sans-serif',
        color: '#4ecdc4',
      }).setOrigin(0.5);
    }
  }

  // ─── Tap Hint ───────────────────────────────────────────────────────────────
  private createTapHint(): void {
    const centerX = GAME_WIDTH / 2;
    const y = GAME_HEIGHT - 50;

    // Pulsing play indicator
    const playIcon = this.add.text(centerX, y, '▶', {
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      color: '#4ecdc4',
    }).setOrigin(0.5);

    this.add.text(centerX + 25, y, 'TAP TO PLAY', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#666666',
    }).setOrigin(0, 0.5);

    // Pulse animation
    this.tweens.add({
      targets: playIcon,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ─── Input Setup ─────────────────────────────────────────────────────────────
  private setupInput(): void {
    this.input.on('pointerdown', () => this.startGame());
    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
  }

  // ─── Game Start ──────────────────────────────────────────────────────────────
  private startGame(): void {
    this.input.enabled = false;
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  // ─── Update ──────────────────────────────────────────────────────────────────
  update(_time: number, delta: number): void {
    const dt = delta / 1000;

    // Ball physics simulation
    this.ballVy += this.GRAVITY * dt;
    this.ball.y += this.ballVy * dt;

    // Platform collision
    for (const plat of this.platforms) {
      const platTop = plat.y - 6;
      const platLeft = plat.x - 35;
      const platRight = plat.x + 35;

      if (
        this.ballVy > 0 &&
        this.ball.y + 15 >= platTop &&
        this.ball.y + 15 <= platTop + 20 &&
        this.ball.x >= platLeft &&
        this.ball.x <= platRight
      ) {
        this.ball.y = platTop - 15;
        this.ballVy = this.BOUNCE_VELOCITY;
      }
    }

    // Ground bounce
    const groundY = GAME_HEIGHT - 85;
    if (this.ball.y + 15 >= groundY) {
      this.ball.y = groundY - 15;
      this.ballVy = this.BOUNCE_VELOCITY;
    }

    // Side boundaries
    if (this.ball.x < 15) this.ball.x = 15;
    if (this.ball.x > GAME_WIDTH - 15) this.ball.x = GAME_WIDTH - 15;
  }
}
