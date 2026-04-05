import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, HIGHSCORE_KEY, COLORS } from '../config';

// ═══════════════════════════════════════════════════════════════════════════════
// MenuScene - Focused Premium Mobile Game Start Screen
// ═══════════════════════════════════════════════════════════════════════════════

export class MenuScene extends Phaser.Scene {
  // State
  private highScore: number = 0;
  private pulseTime: number = 0;

  // UI Elements - only what we need
  private titleText!: Phaser.GameObjects.Text;
  private taglineText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private playButton!: Phaser.GameObjects.Container;
  private howToPlayBtn!: Phaser.GameObjects.Text;
  private soundBtn!: Phaser.GameObjects.Text;
  private character!: Phaser.GameObjects.Container;
  private platforms: Phaser.GameObjects.Rectangle[] = [];

  // Background
  private bgLayer!: Phaser.GameObjects.Graphics;
  private accentGlow!: Phaser.GameObjects.Graphics;

  // Safe areas
  private safeTop: number = 60;
  private safeBottom: number = 40;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Calculate safe areas
    this.calculateSafeAreas();

    // Load high score
    this.highScore = parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0');

    // Build screen from back to front
    this.createBackground();
    this.createAccentGlow();
    this.createPlatforms();
    this.createCharacter();
    this.createTitle();
    this.createPlayButton();
    this.createSecondaryButtons();
    this.setupInput();
  }

  // ─── Safe Areas ─────────────────────────────────────────────────────────────
  private calculateSafeAreas(): void {
    if (typeof document !== 'undefined') {
      const style = getComputedStyle(document.documentElement);
      const sat = style.getPropertyValue('--sat').trim();
      const sab = style.getPropertyValue('--sab').trim();
      this.safeTop = sat ? parseInt(sat) + 20 : 80;
      this.safeBottom = sab ? parseInt(sab) + 20 : 60;
    }
  }

  // ─── Background ─────────────────────────────────────────────────────────────
  private createBackground(): void {
    // Clean dark gradient
    this.bgLayer = this.add.graphics();
    this.bgLayer.fillGradientStyle(0x0a0a14, 0x0a0a14, 0x0f0f1a, 0x12121f, 1);
    this.bgLayer.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.bgLayer.setDepth(-100);
  }

  // ─── Accent Glow ────────────────────────────────────────────────────────────
  private createAccentGlow(): void {
    // Subtle teal glow at top
    this.accentGlow = this.add.graphics();
    this.accentGlow.fillStyle(COLORS.platformNormal, 0.06);
    this.accentGlow.fillEllipse(GAME_WIDTH / 2, -50, GAME_WIDTH * 1.2, 250);
    this.accentGlow.setDepth(-99);

    // Subtle pink glow at bottom
    const bottomGlow = this.add.graphics();
    bottomGlow.fillStyle(COLORS.player, 0.04);
    bottomGlow.fillEllipse(GAME_WIDTH / 2, GAME_HEIGHT + 100, GAME_WIDTH * 1.3, 300);
    bottomGlow.setDepth(-99);
  }

  // ─── Platforms (Simple, clean) ──────────────────────────────────────────────
  private createPlatforms(): void {
    const centerX = GAME_WIDTH / 2;
    const baseY = GAME_HEIGHT * 0.52;

    // Only 3 simple platforms - clean and clear
    const positions = [
      { x: centerX, y: baseY },
      { x: centerX - 70, y: baseY + 70 },
      { x: centerX + 70, y: baseY + 70 },
    ];

    positions.forEach((pos) => {
      const plat = this.add.rectangle(pos.x, pos.y, 65, 12, COLORS.platformNormal);
      plat.setAlpha(0.5);
      plat.setDepth(0);
      this.platforms.push(plat);
    });
  }

  // ─── Character (Clean bounce animation) ────────────────────────────────────
  private createCharacter(): void {
    const centerX = GAME_WIDTH / 2;
    const baseY = GAME_HEIGHT * 0.52 - 50;

    // Character container
    this.character = this.add.container(centerX, baseY);
    this.character.setDepth(1);

    // Simple circle body
    const body = this.add.circle(0, 0, 20, COLORS.player);
    this.character.add(body);

    // Subtle glow behind
    const glow = this.add.circle(0, 0, 28, COLORS.playerHighlight);
    glow.setAlpha(0.2);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    this.character.add(glow);

    // Start idle animation
    this.startCharacterIdle();
  }

  private startCharacterIdle(): void {
    // Gentle float up and down
    this.tweens.add({
      targets: this.character,
      y: this.character.y - 12,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ─── Title Block ────────────────────────────────────────────────────────────
  private createTitle(): void {
    const centerX = GAME_WIDTH / 2;
    const titleY = this.safeTop;

    // Main title - bold and clean
    this.titleText = this.add.text(centerX, titleY, 'JumpJumpJump', {
      fontSize: '42px',
      fontFamily: 'Russo One, sans-serif',
      color: '#ffffff',
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setDepth(50);

    // Subtle glow/stroke for clarity
    this.titleText.setStroke('#4ecdc4', 3);

    // Tagline - short and strong
    this.taglineText = this.add.text(centerX, titleY + 48, 'Jump higher. Survive longer.', {
      fontSize: '16px',
      fontFamily: 'Exo 2, sans-serif',
      fontStyle: 'italic',
      color: '#8b90a5',
    });
    this.taglineText.setOrigin(0.5);
    this.taglineText.setDepth(50);

    // High score (if exists)
    if (this.highScore > 0) {
      this.scoreText = this.add.text(centerX, titleY + 80, `Best: ${this.highScore}`, {
        fontSize: '15px',
        fontFamily: 'Exo 2, sans-serif',
        fontStyle: 'italic',
        color: '#feca57',
      });
      this.scoreText.setOrigin(0.5);
      this.scoreText.setDepth(50);
    }
  }

  // ─── Play Button (THE focus) ────────────────────────────────────────────────
  private createPlayButton(): void {
    const centerX = GAME_WIDTH / 2;
    const buttonY = GAME_HEIGHT * 0.75;
    const buttonW = 200;
    const buttonH = 64;

    // Container
    this.playButton = this.add.container(centerX, buttonY);
    this.playButton.setDepth(100);

    // Glow ring (behind button - makes it pop)
    const glowRing = this.add.graphics();
    glowRing.fillStyle(COLORS.platformNormal, 0.12);
    glowRing.fillRoundedRect(-buttonW / 2 - 10, -buttonH / 2 - 10, buttonW + 20, buttonH + 20, 42);
    this.playButton.add(glowRing);

    // Button shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(-buttonW / 2 + 4, -buttonH / 2 + 6, buttonW, buttonH, 32);
    this.playButton.add(shadow);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.platformNormal, 1);
    bg.fillRoundedRect(-buttonW / 2, -buttonH / 2, buttonW, buttonH, 32);
    this.playButton.add(bg);

    // Button text
    const text = this.add.text(0, 0, 'PLAY', {
      fontSize: '28px',
      fontFamily: 'Russo One, sans-serif',
      color: '#0f0f1a',
    });
    text.setOrigin(0.5);
    this.playButton.add(text);

    // Hit area (larger for easy tap)
    const hitArea = this.add.rectangle(0, 0, buttonW + 20, buttonH + 20, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    this.playButton.add(hitArea);

    // Interactions
    hitArea.on('pointerdown', () => this.onPlayDown());
    hitArea.on('pointerup', () => this.onPlayUp());
    hitArea.on('pointerover', () => this.onPlayOver());
    hitArea.on('pointerout', () => this.onPlayOut());

    // Pulse animation (subtle, not distracting)
    this.startButtonPulse();
  }

  private startButtonPulse(): void {
    this.tweens.add({
      targets: this.playButton,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private onPlayDown(): void {
    this.tweens.killTweensOf(this.playButton);
    this.tweens.add({
      targets: this.playButton,
      scaleX: 0.94,
      scaleY: 0.94,
      duration: 80,
      ease: 'Quad.easeOut',
    });
  }

  private onPlayUp(): void {
    this.tweens.killTweensOf(this.playButton);
    this.startGame();
  }

  private onPlayOver(): void {
    this.tweens.killTweensOf(this.playButton);
    this.tweens.add({
      targets: this.playButton,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 100,
      ease: 'Quad.easeOut',
    });
  }

  private onPlayOut(): void {
    this.tweens.killTweensOf(this.playButton);
    this.startButtonPulse();
  }

  // ─── Secondary Buttons (Clearly secondary) ─────────────────────────────────
  private createSecondaryButtons(): void {
    const bottomY = GAME_HEIGHT - this.safeBottom;

    // Only two simple text buttons
    // Sound button (left)
    this.soundBtn = this.add.text(30, bottomY, '🔊', {
      fontSize: '22px',
    });
    this.soundBtn.setOrigin(0.5);
    this.soundBtn.setDepth(60);
    this.soundBtn.setInteractive({ useHandCursor: true });
    this.soundBtn.on('pointerdown', () => this.toggleSound());
    this.soundBtn.on('pointerover', () => this.soundBtn.setAlpha(0.7));
    this.soundBtn.on('pointerout', () => this.soundBtn.setAlpha(1));

    // How to Play (right)
    this.howToPlayBtn = this.add.text(GAME_WIDTH - 30, bottomY, 'How to Play', {
      fontSize: '13px',
      fontFamily: 'Exo 2, sans-serif',
      color: '#666666',
    });
    this.howToPlayBtn.setOrigin(0.5);
    this.howToPlayBtn.setDepth(60);
    this.howToPlayBtn.setInteractive({ useHandCursor: true });
    this.howToPlayBtn.on('pointerdown', () => this.showHowToPlay());
    this.howToPlayBtn.on('pointerover', () => this.howToPlayBtn.setColor('#ffffff'));
    this.howToPlayBtn.on('pointerout', () => this.howToPlayBtn.setColor('#666666'));
  }

  // ─── Input ─────────────────────────────────────────────────────────────────
  private setupInput(): void {
    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
  }

  // ─── Game Start ─────────────────────────────────────────────────────────────
  private startGame(): void {
    // Disable further input
    this.input.enabled = false;

    // Stop animations
    this.tweens.killTweensOf(this.playButton);
    this.tweens.killTweensOf(this.character);

    // Scale up and fade button
    this.tweens.add({
      targets: this.playButton,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0,
      duration: 250,
      ease: 'Quad.easeIn',
    });

    // Fade other elements
    this.tweens.add({
      targets: [this.titleText, this.taglineText, this.character, this.bgLayer],
      alpha: 0,
      duration: 350,
      ease: 'Quad.easeIn',
    });

    if (this.scoreText) {
      this.tweens.add({
        targets: this.scoreText,
        alpha: 0,
        duration: 350,
        delay: 50,
        ease: 'Quad.easeIn',
      });
    }

    // Fade secondary buttons faster
    this.tweens.add({
      targets: [this.soundBtn, this.howToPlayBtn],
      alpha: 0,
      duration: 200,
      ease: 'Quad.easeIn',
    });

    // Transition
    this.cameras.main.fade(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  // ─── Sound Toggle ───────────────────────────────────────────────────────────
  private toggleSound(): void {
    // Toggle state (would need to communicate with game)
  }

  // ─── How to Play Modal ─────────────────────────────────────────────────────
  private showHowToPlay(): void {
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x0a0a14,
      0.92
    );
    overlay.setDepth(200);
    overlay.setAlpha(0);

    // Panel
    const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    panel.setDepth(201);
    panel.setScale(0.9);

    // Panel background
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x12121f, 1);
    panelBg.fillRoundedRect(-130, -130, 260, 260, 20);
    panel.add(panelBg);

    // Title
    const title = this.add.text(0, -100, 'How to Play', {
      fontSize: '24px',
      fontFamily: 'Russo One, sans-serif',
      color: '#ffffff',
    });
    title.setOrigin(0.5);
    panel.add(title);

    // Instructions
    const inst = this.add.text(0, -40, 'Tap LEFT or RIGHT\nto move\n\nJump on platforms\nto climb higher\n\nDon\'t fall!', {
      fontSize: '14px',
      fontFamily: 'Exo 2, sans-serif',
      color: '#8b90a5',
      align: 'center',
      lineSpacing: 6,
    });
    inst.setOrigin(0.5);
    panel.add(inst);

    // Close button
    const closeBtn = this.add.text(0, 80, 'Got it!', {
      fontSize: '16px',
      fontFamily: 'Russo One, sans-serif',
      color: '#4ecdc4',
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    panel.add(closeBtn);

    closeBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: [overlay, panel],
        alpha: 0,
        scale: 0.9,
        duration: 200,
        ease: 'Quad.easeIn',
        onComplete: () => {
          overlay.destroy();
          panel.destroy();
        },
      });
    });

    // Animate in
    this.tweens.add({
      targets: overlay,
      alpha: 1,
      duration: 200,
      ease: 'Quad.easeOut',
    });
    this.tweens.add({
      targets: panel,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
  }

  // ─── Update ─────────────────────────────────────────────────────────────────
  update(_time: number, _delta: number): void {
    this.pulseTime += _delta;
  }
}
