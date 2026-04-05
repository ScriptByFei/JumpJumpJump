import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, HIGHSCORE_KEY, COLORS } from '../config';

// ═══════════════════════════════════════════════════════════════════════════════
// MenuScene - Focused Premium Mobile Game Start Screen
// ═══════════════════════════════════════════════════════════════════════════════

export class MenuScene extends Phaser.Scene {
  // State
  private highScore: number = 0;
  private pulseTime: number = 0;

  // UI Elements
  private titleText!: Phaser.GameObjects.Text;
  private taglineText!: Phaser.GameObjects.Text;
  private scoreBadge!: Phaser.GameObjects.Container;
  private playButton!: Phaser.GameObjects.Container;
  private soundButton!: Phaser.GameObjects.Container;
  private howToPlayBtn!: Phaser.GameObjects.Text;
  private character!: Phaser.GameObjects.Container;
  private platforms: Phaser.GameObjects.Rectangle[] = [];

  // Background
  private bgLayer!: Phaser.GameObjects.Graphics;

  // Safe areas
  private safeTop: number = 70;
  private safeBottom: number = 45;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.calculateSafeAreas();
    this.highScore = parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0');

    this.createBackground();
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
      this.safeTop = sat ? parseInt(sat) + 24 : 90;
      this.safeBottom = sab ? parseInt(sab) + 24 : 65;
    }
  }

  // ─── Background ─────────────────────────────────────────────────────────────
  private createBackground(): void {
    this.bgLayer = this.add.graphics();
    this.bgLayer.fillGradientStyle(0x0a0a14, 0x0a0a14, 0x0f0f1a, 0x12121f, 1);
    this.bgLayer.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.bgLayer.setDepth(-100);

    // Subtle accent glows
    const topGlow = this.add.graphics();
    topGlow.fillStyle(COLORS.platformNormal, 0.05);
    topGlow.fillEllipse(GAME_WIDTH / 2, -40, GAME_WIDTH * 1.2, 200);
    topGlow.setDepth(-99);

    const bottomGlow = this.add.graphics();
    bottomGlow.fillStyle(COLORS.player, 0.04);
    bottomGlow.fillEllipse(GAME_WIDTH / 2, GAME_HEIGHT + 80, GAME_WIDTH * 1.3, 250);
    bottomGlow.setDepth(-99);
  }

  // ─── Platforms ───────────────────────────────────────────────────────────────
  private createPlatforms(): void {
    const centerX = GAME_WIDTH / 2;
    const baseY = GAME_HEIGHT * 0.52;

    const positions = [
      { x: centerX, y: baseY },
      { x: centerX - 65, y: baseY + 65 },
      { x: centerX + 65, y: baseY + 65 },
    ];

    positions.forEach((pos) => {
      const plat = this.add.rectangle(pos.x, pos.y, 70, 14, COLORS.platformNormal);
      plat.setAlpha(0.6);
      plat.setDepth(0);
      this.platforms.push(plat);
    });
  }

  // ─── Character ───────────────────────────────────────────────────────────────
  private createCharacter(): void {
    const centerX = GAME_WIDTH / 2;
    const baseY = GAME_HEIGHT * 0.52 - 55;

    this.character = this.add.container(centerX, baseY);
    this.character.setDepth(1);

    // Larger ball (26px radius = 52px diameter)
    const body = this.add.circle(0, 0, 26, COLORS.player);
    this.character.add(body);

    // Subtle glow
    const glow = this.add.circle(0, 0, 34, COLORS.playerHighlight);
    glow.setAlpha(0.25);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    this.character.add(glow);

    this.startCharacterIdle();
  }

  private startCharacterIdle(): void {
    this.tweens.add({
      targets: this.character,
      y: this.character.y - 14,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ─── Title Block ────────────────────────────────────────────────────────────
  private createTitle(): void {
    const centerX = GAME_WIDTH / 2;
    const titleY = this.safeTop + 10;

    // Title: crisp, smaller, less stroke
    this.titleText = this.add.text(centerX, titleY, 'JumpJumpJump', {
      fontSize: '36px',
      fontFamily: 'Russo One, sans-serif',
      color: '#ffffff',
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setDepth(50);
    this.titleText.setStroke('#4ecdc4', 2);

    // Tagline: larger, more visible, not italic (cleaner)
    this.taglineText = this.add.text(centerX, titleY + 48, 'Jump higher. Survive longer.', {
      fontSize: '18px',
      fontFamily: 'Exo 2, sans-serif',
      fontStyle: '600',
      color: '#9ba3b5',
    });
    this.taglineText.setOrigin(0.5);
    this.taglineText.setDepth(50);

    // Score as pill badge
    if (this.highScore > 0) {
      this.createScoreBadge(centerX, titleY + 88);
    }
  }

  private createScoreBadge(x: number, y: number): void {
    this.scoreBadge = this.add.container(x, y);
    this.scoreBadge.setDepth(50);

    // Badge background
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(0xfeca57, 0.15);
    badgeBg.fillRoundedRect(-50, -14, 100, 28, 14);
    this.scoreBadge.add(badgeBg);

    // Badge text
    const text = this.add.text(0, 0, `Best: ${this.highScore}`, {
      fontSize: '16px',
      fontFamily: 'Exo 2, sans-serif',
      fontStyle: '600',
      color: '#feca57',
    });
    text.setOrigin(0.5);
    this.scoreBadge.add(text);
  }

  // ─── Play Button ────────────────────────────────────────────────────────────
  private createPlayButton(): void {
    const centerX = GAME_WIDTH / 2;
    const buttonY = GAME_HEIGHT * 0.76;
    const buttonW = 210;
    const buttonH = 68;

    this.playButton = this.add.container(centerX, buttonY);
    this.playButton.setDepth(100);

    // Glow ring
    const glowRing = this.add.graphics();
    glowRing.fillStyle(COLORS.platformNormal, 0.1);
    glowRing.fillRoundedRect(-buttonW / 2 - 12, -buttonH / 2 - 12, buttonW + 24, buttonH + 24, 44);
    this.playButton.add(glowRing);

    // Shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillRoundedRect(-buttonW / 2 + 4, -buttonH / 2 + 6, buttonW, buttonH, 34);
    this.playButton.add(shadow);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.platformNormal, 1);
    bg.fillRoundedRect(-buttonW / 2, -buttonH / 2, buttonW, buttonH, 34);
    this.playButton.add(bg);

    // Button text
    const text = this.add.text(0, 0, 'PLAY', {
      fontSize: '30px',
      fontFamily: 'Russo One, sans-serif',
      color: '#0f0f1a',
    });
    text.setOrigin(0.5);
    this.playButton.add(text);

    // Larger hit area
    const hitArea = this.add.rectangle(0, 0, buttonW + 30, buttonH + 30, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    this.playButton.add(hitArea);

    hitArea.on('pointerdown', () => this.onPlayDown());
    hitArea.on('pointerup', () => this.onPlayUp());
    hitArea.on('pointerover', () => this.onPlayOver());
    hitArea.on('pointerout', () => this.onPlayOut());

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

  // ─── Secondary Buttons ───────────────────────────────────────────────────────
  private createSecondaryButtons(): void {
    const bottomY = GAME_HEIGHT - this.safeBottom;

    // Sound button: proper icon button with background
    this.soundButton = this.add.container(50, bottomY);
    this.soundButton.setDepth(60);

    const soundBg = this.add.graphics();
    soundBg.fillStyle(0xffffff, 0.08);
    soundBg.fillCircle(0, 0, 24);
    this.soundButton.add(soundBg);

    const soundIcon = this.add.text(0, 0, '🔊', { fontSize: '22px' });
    soundIcon.setOrigin(0.5);
    this.soundButton.add(soundIcon);

    const soundHit = this.add.rectangle(0, 0, 52, 52, 0xffffff, 0);
    soundHit.setInteractive({ useHandCursor: true });
    this.soundButton.add(soundHit);

    soundHit.on('pointerdown', () => this.toggleSound());
    soundHit.on('pointerover', () => soundBg.clear() || soundBg.fillStyle(0xffffff, 0.15) || soundBg.fillCircle(0, 0, 24));
    soundHit.on('pointerout', () => soundBg.clear() || soundBg.fillStyle(0xffffff, 0.08) || soundBg.fillCircle(0, 0, 24));

    // How to Play: larger, clearer with pill background
    const htpContainer = this.add.container(GAME_WIDTH - 50, bottomY);
    htpContainer.setDepth(60);

    const htpBg = this.add.graphics();
    htpBg.fillStyle(0xffffff, 0.08);
    htpBg.fillRoundedRect(-62, -16, 124, 32, 16);
    htpContainer.add(htpBg);

    this.howToPlayBtn = this.add.text(0, 0, 'How to Play', {
      fontSize: '15px',
      fontFamily: 'Exo 2, sans-serif',
      fontStyle: '600',
      color: '#8b90a5',
    });
    this.howToPlayBtn.setOrigin(0.5);
    htpContainer.add(this.howToPlayBtn);

    const htpHit = this.add.rectangle(0, 0, 130, 36, 0xffffff, 0);
    htpHit.setInteractive({ useHandCursor: true });
    htpContainer.add(htpHit);

    htpHit.on('pointerdown', () => this.showHowToPlay());
    htpHit.on('pointerover', () => this.howToPlayBtn.setColor('#ffffff'));
    htpHit.on('pointerout', () => this.howToPlayBtn.setColor('#8b90a5'));
  }

  // ─── Input ─────────────────────────────────────────────────────────────────
  private setupInput(): void {
    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
  }

  // ─── Game Start ─────────────────────────────────────────────────────────────
  private startGame(): void {
    this.input.enabled = false;
    this.tweens.killTweensOf(this.playButton);
    this.tweens.killTweensOf(this.character);

    this.tweens.add({
      targets: this.playButton,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0,
      duration: 250,
      ease: 'Quad.easeIn',
    });

    this.tweens.add({
      targets: [this.titleText, this.taglineText, this.character, this.bgLayer],
      alpha: 0,
      duration: 350,
      ease: 'Quad.easeIn',
    });

    if (this.scoreBadge) {
      this.tweens.add({
        targets: this.scoreBadge,
        alpha: 0,
        duration: 350,
        delay: 50,
        ease: 'Quad.easeIn',
      });
    }

    this.tweens.add({
      targets: [this.soundButton, this.howToPlayBtn],
      alpha: 0,
      duration: 200,
      ease: 'Quad.easeIn',
    });

    this.cameras.main.fade(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  // ─── Sound Toggle ───────────────────────────────────────────────────────────
  private toggleSound(): void {
    // State toggle would need to communicate with game
  }

  // ─── How to Play Modal ───────────────────────────────────────────────────────
  private showHowToPlay(): void {
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x0a0a14, 0.92
    );
    overlay.setDepth(200);
    overlay.setAlpha(0);

    const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    panel.setDepth(201);
    panel.setScale(0.9);

    // Panel background
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x12121f, 1);
    panelBg.fillRoundedRect(-140, -140, 280, 280, 24);
    panel.add(panelBg);

    // Title
    const title = this.add.text(0, -105, 'How to Play', {
      fontSize: '26px',
      fontFamily: 'Russo One, sans-serif',
      color: '#ffffff',
    });
    title.setOrigin(0.5);
    panel.add(title);

    // Instructions
    const inst = this.add.text(0, -35, 'Tap LEFT or RIGHT\nto move\n\nJump on platforms\nto climb higher\n\nDon\'t fall!', {
      fontSize: '16px',
      fontFamily: 'Exo 2, sans-serif',
      color: '#9ba3b5',
      align: 'center',
      lineSpacing: 8,
    });
    inst.setOrigin(0.5);
    panel.add(inst);

    // Close button
    const closeBtn = this.add.text(0, 90, 'Got it!', {
      fontSize: '18px',
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

    this.tweens.add({ targets: overlay, alpha: 1, duration: 200, ease: 'Quad.easeOut' });
    this.tweens.add({ targets: panel, scale: 1, duration: 300, ease: 'Back.easeOut' });
  }

  // ─── Update ─────────────────────────────────────────────────────────────────
  update(_time: number, _delta: number): void {
    this.pulseTime += _delta;
  }
}
