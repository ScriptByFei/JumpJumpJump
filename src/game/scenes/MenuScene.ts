import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, HIGHSCORE_KEY, COLORS } from '../config';

// ═══════════════════════════════════════════════════════════════════════════════
// MenuScene - Premium Mobile Game Start Screen
// ═══════════════════════════════════════════════════════════════════════════════

export class MenuScene extends Phaser.Scene {
  // Highscore
  private highScore: number = 0;

  // Background layers
  private bgGradient!: Phaser.GameObjects.Graphics;
  private stars: Phaser.GameObjects.Star[] = [];
  private floatingPlatforms: Phaser.GameObjects.Rectangle[] = [];

  // Game preview
  private previewBall!: Phaser.GameObjects.Arc;
  private previewBallVy: number = 0;
  private previewPlatforms: Phaser.GameObjects.Rectangle[] = [];
  private readonly PREVIEW_GRAVITY = 600;
  private readonly PREVIEW_BOUNCE = -380;

  // UI Elements
  private titleText!: Phaser.GameObjects.Text;
  private titleGlow!: Phaser.GameObjects.Text;
  private taglineText!: Phaser.GameObjects.Text;
  private playButton!: Phaser.GameObjects.Container;
  private playButtonBg!: Phaser.GameObjects.Graphics;
  private playButtonText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private soundButton!: Phaser.GameObjects.Container;

  // Animation state
  private pulseTime: number = 0;
  private soundOn: boolean = true;
  private buttonPressed: boolean = false;

  // Safe areas
  private safeTop: number = 0;
  private safeBottom: number = 0;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Reset state
    this.buttonPressed = false;
    this.highScore = parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0');
    this.calculateSafeAreas();

    // Create all layers
    this.createBackground();
    this.createStars();
    this.createFloatingPlatforms();
    this.createGamePreview();
    this.createTitle();
    this.createPlayButton();
    this.createSecondaryButtons();
    this.setupInput();

    // Start animations
    this.startAnimations();
  }

  // ─── Safe Areas ─────────────────────────────────────────────────────────────
  private calculateSafeAreas(): void {
    if (typeof document !== 'undefined') {
      const style = getComputedStyle(document.documentElement);
      const sat = style.getPropertyValue('--sat').trim();
      const sab = style.getPropertyValue('--sab').trim();
      this.safeTop = sat ? parseInt(sat) : 44;
      this.safeBottom = sab ? parseInt(sab) : 34;
    }
  }

  // ─── Background ─────────────────────────────────────────────────────────────
  private createBackground(): void {
    // Deep atmospheric gradient
    this.bgGradient = this.add.graphics();

    // Draw layered gradient
    const layers = [
      { y: 0, color1: 0x0a0a14, color2: 0x0f0f1a },
      { y: GAME_HEIGHT * 0.3, color1: 0x12121f, color2: 0x1a1a2e },
      { y: GAME_HEIGHT * 0.6, color1: 0x1a1a35, color2: 0x16213e },
    ];

    layers.forEach(layer => {
      this.bgGradient.fillGradientStyle(
        layer.color1, layer.color1,
        layer.color2, layer.color2,
        1
      );
      this.bgGradient.fillRect(0, layer.y, GAME_WIDTH, GAME_HEIGHT * 0.4);
    });

    // Subtle top glow
    const topGlow = this.add.graphics();
    topGlow.fillStyle(0x4ecdc4, 0.08);
    topGlow.fillEllipse(GAME_WIDTH / 2, -100, GAME_WIDTH * 1.5, 300);

    // Bottom atmosphere
    const bottomGlow = this.add.graphics();
    bottomGlow.fillStyle(0xe94560, 0.05);
    bottomGlow.fillEllipse(GAME_WIDTH / 2, GAME_HEIGHT + 150, GAME_WIDTH * 1.2, 400);
  }

  // ─── Stars (Parallax Background) ────────────────────────────────────────────
  private createStars(): void {
    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.9);

      const star = this.add.star(x, y, 4, 0, size, 0xffffff);
      star.setAlpha(alpha);
      star.setDepth(-10);

      // Twinkle animation
      this.tweens.add({
        targets: star,
        alpha: alpha * 0.3,
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 2000),
      });

      this.stars.push(star);
    }
  }

  // ─── Floating Background Platforms ─────────────────────────────────────────
  private createFloatingPlatforms(): void {
    const platformConfigs = [
      { x: 60, y: 150, w: 50, alpha: 0.15 },
      { x: GAME_WIDTH - 80, y: 200, w: 45, alpha: 0.12 },
      { x: 100, y: GAME_HEIGHT * 0.7, w: 40, alpha: 0.1 },
      { x: GAME_WIDTH - 60, y: GAME_HEIGHT * 0.6, w: 55, alpha: 0.12 },
    ];

    platformConfigs.forEach(config => {
      const plat = this.add.rectangle(
        config.x,
        config.y,
        config.w,
        10,
        COLORS.platformNormal
      );
      plat.setAlpha(config.alpha);
      plat.setDepth(-5);
      this.floatingPlatforms.push(plat);

      // Gentle float animation
      this.tweens.add({
        targets: plat,
        y: config.y + Phaser.Math.Between(-10, 10),
        duration: 2000 + Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });
  }

  // ─── Game Preview (Animated Ball + Platforms) ────────────────────────────────
  private createGamePreview(): void {
    const centerX = GAME_WIDTH / 2;
    const baseY = GAME_HEIGHT * 0.48;

    // Preview platforms (stylized, minimal)
    const platformPositions = [
      { x: centerX - 80, y: baseY + 30 },
      { x: centerX + 80, y: baseY + 30 },
      { x: centerX, y: baseY - 40 },
    ];

    platformPositions.forEach((pos, i) => {
      const plat = this.add.rectangle(pos.x, pos.y, 65 - i * 5, 10, COLORS.platformNormal);
      plat.setAlpha(0.4);
      plat.setDepth(1);
      this.previewPlatforms.push(plat);
    });

    // Preview ball (stylized player representation)
    this.previewBall = this.add.circle(centerX, baseY - 60, 18, COLORS.player);
    this.previewBall.setDepth(2);
    this.previewBallVy = this.PREVIEW_BOUNCE;

    // Ball glow
    const glow = this.add.circle(centerX, baseY - 60, 24, COLORS.playerHighlight);
    glow.setAlpha(0.3);
    glow.setDepth(0);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.name = 'ballGlow';
  }

  // ─── Title ─────────────────────────────────────────────────────────────────
  private createTitle(): void {
    const centerX = GAME_WIDTH / 2;
    const titleY = this.safeTop + 70;

    // Title glow (behind)
    this.titleGlow = this.add.text(centerX, titleY, 'JumpJumpJump', {
      fontSize: '42px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#4ecdc4',
    });
    this.titleGlow.setOrigin(0.5);
    this.titleGlow.setAlpha(0.3);
    this.titleGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.titleGlow.setDepth(100);

    // Main title
    this.titleText = this.add.text(centerX, titleY, 'JumpJumpJump', {
      fontSize: '42px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
      stroke: '#4ecdc4',
      strokeThickness: 1,
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setDepth(101);

    // Tagline
    this.taglineText = this.add.text(centerX, titleY + 45, 'Jump higher. Survive longer.', {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#8b90a5',
    });
    this.taglineText.setOrigin(0.5);
    this.taglineText.setDepth(101);

    // Highscore (below tagline if exists)
    if (this.highScore > 0) {
      this.highScoreText = this.add.text(centerX, titleY + 75, `Best: ${this.highScore}`, {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif',
        color: '#feca57',
      });
      this.highScoreText.setOrigin(0.5);
      this.highScoreText.setDepth(101);
    }
  }

  // ─── Play Button ───────────────────────────────────────────────────────────
  private createPlayButton(): void {
    const centerX = GAME_WIDTH / 2;
    const buttonY = GAME_HEIGHT * 0.78;
    const buttonW = 180;
    const buttonH = 56;

    // Button container
    this.playButton = this.add.container(centerX, buttonY);
    this.playButton.setDepth(200);

    // Button background (rounded rect)
    this.playButtonBg = this.add.graphics();
    this.drawPlayButtonBg(0, 0, buttonW, buttonH, 1);
    this.playButton.add(this.playButtonBg);

    // Button text
    this.playButtonText = this.add.text(0, 0, 'PLAY', {
      fontSize: '24px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#0f0f1a',
    });
    this.playButtonText.setOrigin(0.5);
    this.playButton.add(this.playButtonText);

    // Glow ring (behind button)
    const glowRing = this.add.graphics();
    glowRing.fillStyle(COLORS.platformNormal, 0.15);
    glowRing.fillRoundedRect(-buttonW / 2 - 8, -buttonH / 2 - 8, buttonW + 16, buttonH + 16, 40);
    glowRing.setDepth(-1);
    this.playButton.add(glowRing);
    glowRing.setName('glowRing');

    // Make interactive
    const hitArea = this.add.rectangle(0, 0, buttonW, buttonH, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    this.playButton.add(hitArea);

    hitArea.on('pointerdown', () => this.onPlayButtonDown());
    hitArea.on('pointerup', () => this.onPlayButtonUp());
    hitArea.on('pointerover', () => this.onPlayButtonOver());
    hitArea.on('pointerout', () => this.onPlayButtonOut());

    // Initial pulse animation
    this.startButtonPulse();
  }

  private drawPlayButtonBg(x: number, y: number, w: number, h: number, scale: number): void {
    this.playButtonBg.clear();

    // Shadow
    this.playButtonBg.fillStyle(0x000000, 0.3);
    this.playButtonBg.fillRoundedRect(
      x - w / 2 + 3,
      y - h / 2 + 4,
      w * scale,
      h * scale,
      28 * scale
    );

    // Main button
    this.playButtonBg.fillStyle(COLORS.platformNormal, 1);
    this.playButtonBg.fillRoundedRect(
      x - w / 2,
      y - h / 2,
      w * scale,
      h * scale,
      28 * scale
    );
  }

  private startButtonPulse(): void {
    // Subtle scale pulse
    this.tweens.add({
      targets: this.playButton,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private onPlayButtonDown(): void {
    if (this.buttonPressed) return;
    this.buttonPressed = true;

    // Stop pulse, scale down
    this.tweens.killTweensOf(this.playButton);
    this.tweens.add({
      targets: this.playButton,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 80,
      ease: 'Quad.easeOut',
    });
  }

  private onPlayButtonUp(): void {
    if (!this.buttonPressed) return;
    this.buttonPressed = false;
    this.startGame();
  }

  private onPlayButtonOver(): void {
    if (this.buttonPressed) return;
    // Slight lift effect
    this.tweens.killTweensOf(this.playButton);
    this.tweens.add({
      targets: this.playButton,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 100,
      ease: 'Quad.easeOut',
    });
  }

  private onPlayButtonOut(): void {
    if (this.buttonPressed) {
      this.buttonPressed = false;
    }
    this.tweens.killTweensOf(this.playButton);
    this.startButtonPulse();
  }

  // ─── Secondary Buttons ─────────────────────────────────────────────────────
  private createSecondaryButtons(): void {
    const bottomY = GAME_HEIGHT - this.safeBottom - 20;

    // Sound button (left)
    this.soundButton = this.createIconButton(50, bottomY, this.soundOn ? 'sound' : 'mute');
    this.soundButton.on('pointerdown', () => this.toggleSound());

    // How to Play button (right) - stored for potential future use
    this.createTextButton(
      GAME_WIDTH - 80,
      bottomY,
      'How to Play',
      () => this.showHowToPlay()
    );
  }

  private createIconButton(x: number, y: number, type: 'sound' | 'mute'): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.setDepth(150);

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.1);
    bg.fillCircle(0, 0, 22);
    container.add(bg);

    const icon = this.add.text(0, 0, type === 'sound' ? '🔊' : '🔇', {
      fontSize: '20px',
    });
    icon.setOrigin(0.5);
    container.add(icon);

    const hitArea = this.add.rectangle(0, 0, 44, 44, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    // Hover effect
    hitArea.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xffffff, 0.2);
      bg.fillCircle(0, 0, 22);
    });
    hitArea.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0xffffff, 0.1);
      bg.fillCircle(0, 0, 22);
    });

    return container;
  }

  private createTextButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    container.setDepth(150);

    const hitArea = this.add.rectangle(0, 0, 100, 30, 0xffffff, 0);
    hitArea.setInteractive({ useHandCursor: true });
    container.add(hitArea);

    const label = this.add.text(0, 0, text, {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#8b90a5',
    });
    label.setOrigin(0.5);
    container.add(label);

    hitArea.on('pointerdown', callback);

    hitArea.on('pointerover', () => {
      label.setColor('#ffffff');
    });
    hitArea.on('pointerout', () => {
      label.setColor('#8b90a5');
    });

    return container;
  }

  // ─── Input ─────────────────────────────────────────────────────────────────
  private setupInput(): void {
    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
  }

  // ─── Game Start ─────────────────────────────────────────────────────────────
  private startGame(): void {
    if (this.buttonPressed === false && !this.buttonPressed) {
      // Only start from button or direct tap
    }

    // Disable input
    this.input.enabled = false;

    // Visual feedback
    this.tweens.killTweensOf(this.playButton);

    // Scale up and fade
    this.tweens.add({
      targets: this.playButton,
      scaleX: 1.1,
      scaleY: 1.1,
      alpha: 0,
      duration: 200,
      ease: 'Quad.easeIn',
    });

    // Fade out other elements
    this.tweens.add({
      targets: [this.titleText, this.titleGlow, this.taglineText, this.previewBall],
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeIn',
    });

    if (this.highScoreText) {
      this.tweens.add({
        targets: this.highScoreText,
        alpha: 0,
        duration: 300,
        delay: 100,
        ease: 'Quad.easeIn',
      });
    }

    // Transition
    this.cameras.main.fade(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }

  // ─── Sound Toggle ───────────────────────────────────────────────────────────
  private toggleSound(): void {
    this.soundOn = !this.soundOn;
    // Note: Actual sound toggle would need to communicate with GameScene
    // For now, just visual feedback
  }

  // ─── How to Play ────────────────────────────────────────────────────────────
  private showHowToPlay(): void {
    // Simple modal overlay
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x0a0a14,
      0.9
    );
    overlay.setDepth(300);
    overlay.setAlpha(0);

    const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    panel.setDepth(301);
    panel.setScale(0.8);

    // Panel background
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1a1a2e, 1);
    panelBg.fillRoundedRect(-140, -150, 280, 300, 20);
    panel.add(panelBg);

    // Title
    const title = this.add.text(0, -120, 'How to Play', {
      fontSize: '22px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
    });
    title.setOrigin(0.5);
    panel.add(title);

    // Instructions
    const instructions = [
      'Tap LEFT or RIGHT',
      'to move',
      '',
      'Jump on platforms',
      'to climb higher',
      '',
      'Don\'t fall!',
    ];

    const instText = this.add.text(0, -50, instructions.join('\n'), {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#8b90a5',
      align: 'center',
      lineSpacing: 8,
    });
    instText.setOrigin(0.5);
    panel.add(instText);

    // Close button
    const closeBtn = this.add.text(0, 100, 'Got it!', {
      fontSize: '16px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#4ecdc4',
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    panel.add(closeBtn);

    closeBtn.on('pointerdown', () => {
      this.tweens.add({
        targets: [overlay, panel],
        alpha: 0,
        scale: 0.8,
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

  // ─── Animations ─────────────────────────────────────────────────────────────
  private startAnimations(): void {
    this.pulseTime = 0;
  }

  // ─── Update ─────────────────────────────────────────────────────────────────
  update(_time: number, delta: number): void {
    // Update game preview physics
    this.updatePreviewBall(delta);

    // Subtle title glow pulse
    this.pulseTime += delta;
    const glowIntensity = 0.2 + Math.sin(this.pulseTime * 0.002) * 0.1;
    this.titleGlow.setAlpha(glowIntensity);
  }

  private updatePreviewBall(delta: number): void {
    const dt = delta / 1000;

    // Apply gravity
    this.previewBallVy += this.PREVIEW_GRAVITY * dt;
    this.previewBall.y += this.previewBallVy * dt;

    // Platform collision
    for (const plat of this.previewPlatforms) {
      const platTop = plat.y - 5;
      const platLeft = plat.x - plat.width / 2;
      const platRight = plat.x + plat.width / 2;

      if (
        this.previewBallVy > 0 &&
        this.previewBall.y + 18 >= platTop &&
        this.previewBall.y + 18 <= platTop + 15 &&
        this.previewBall.x >= platLeft &&
        this.previewBall.x <= platRight
      ) {
        this.previewBall.y = platTop - 18;
        this.previewBallVy = this.PREVIEW_BOUNCE;

        // Squash effect
        this.tweens.add({
          targets: this.previewBall,
          scaleX: 1.2,
          scaleY: 0.8,
          duration: 60,
          yoyo: true,
          ease: 'Quad.easeOut',
        });
      }
    }

    // Side boundaries
    if (this.previewBall.x < 18) this.previewBall.x = 18;
    if (this.previewBall.x > GAME_WIDTH - 18) this.previewBall.x = GAME_WIDTH - 18;

    // Gentle horizontal sway
    const swayAmount = Math.sin(this.pulseTime * 0.001) * 0.5;
    this.previewBall.x = GAME_WIDTH / 2 + swayAmount;
  }
}
