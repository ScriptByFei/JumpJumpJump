import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, HIGHSCORE_KEY, COLORS } from '../config';

// ═══════════════════════════════════════════════════════════════════════════════
// MenuScene - Clear, Readable Mobile Game Start Screen
// ═══════════════════════════════════════════════════════════════════════════════

export class MenuScene extends Phaser.Scene {
  private highScore: number = 0;

  private titleText!: Phaser.GameObjects.Text;
  private taglineText!: Phaser.GameObjects.Text;
  private scoreBadge!: Phaser.GameObjects.Container;
  private playButton!: Phaser.GameObjects.Container;
  private soundButton!: Phaser.GameObjects.Container;
  private howToPlayBtn!: Phaser.GameObjects.Text;
  private character!: Phaser.GameObjects.Container;
  private platforms: Phaser.GameObjects.Rectangle[] = [];
  private bgLayer!: Phaser.GameObjects.Graphics;

  private safeTop: number = 80;
  private safeBottom: number = 50;

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

  private calculateSafeAreas(): void {
    if (typeof document !== 'undefined') {
      const style = getComputedStyle(document.documentElement);
      const sat = style.getPropertyValue('--sat').trim();
      const sab = style.getPropertyValue('--sab').trim();
      this.safeTop = sat ? parseInt(sat) + 30 : 100;
      this.safeBottom = sab ? parseInt(sab) + 30 : 70;
    }
  }

  private createBackground(): void {
    this.bgLayer = this.add.graphics();
    this.bgLayer.fillGradientStyle(0x0a0a14, 0x0a0a14, 0x0f0f1a, 0x12121f, 1);
    this.bgLayer.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.bgLayer.setDepth(-100);
  }

  private createPlatforms(): void {
    const centerX = GAME_WIDTH / 2;
    const baseY = GAME_HEIGHT * 0.52;

    const positions = [
      { x: centerX, y: baseY },
      { x: centerX - 70, y: baseY + 70 },
      { x: centerX + 70, y: baseY + 70 },
    ];

    positions.forEach((pos) => {
      // Clear white platforms with good visibility
      const plat = this.add.rectangle(pos.x, pos.y, 75, 16, COLORS.platformNormal);
      plat.setAlpha(0.7);
      plat.setDepth(0);
      this.platforms.push(plat);
    });
  }

  private createCharacter(): void {
    const centerX = GAME_WIDTH / 2;
    const baseY = GAME_HEIGHT * 0.52 - 60;

    this.character = this.add.container(centerX, baseY);
    this.character.setDepth(1);

    // Clear coral ball
    const body = this.add.circle(0, 0, 30, COLORS.player);
    this.character.add(body);

    // Soft glow
    const glow = this.add.circle(0, 0, 40, COLORS.playerHighlight);
    glow.setAlpha(0.3);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    this.character.add(glow);

    this.startIdleAnimation();
  }

  private startIdleAnimation(): void {
    this.tweens.add({
      targets: this.character,
      y: this.character.y - 16,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createTitle(): void {
    const centerX = GAME_WIDTH / 2;
    const titleY = this.safeTop;

    // Clean white title - NO stroke (crisper)
    this.titleText = this.add.text(centerX, titleY, 'JumpJumpJump', {
      fontSize: '40px',
      fontFamily: 'Russo One, sans-serif',
      color: '#ffffff',
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setDepth(50);

    // Tagline: LARGE, HIGH CONTRAST, CLEAR - no effects
    this.taglineText = this.add.text(centerX, titleY + 75, 'Jump higher. Survive longer.', {
      fontSize: '50px',
      fontFamily: 'Exo 2, sans-serif',
      fontStyle: '600',
      color: '#ffffff',
    });
    this.taglineText.setOrigin(0.5);
    this.taglineText.setDepth(50);
    this.taglineText.setAlpha(1);

    if (this.highScore > 0) {
      this.createScoreBadge(centerX, titleY + 95);
    }
  }

  private createScoreBadge(x: number, y: number): void {
    this.scoreBadge = this.add.container(x, y);
    this.scoreBadge.setDepth(50);

    // Gold badge with solid background
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(0xfeca57, 0.2);
    badgeBg.fillRoundedRect(-55, -16, 110, 32, 16);
    this.scoreBadge.add(badgeBg);

    const text = this.add.text(0, 0, `Best: ${this.highScore}`, {
      fontSize: '18px',
      fontFamily: 'Exo 2, sans-serif',
      fontStyle: '700',
      color: '#feca57',
    });
    text.setOrigin(0.5);
    this.scoreBadge.add(text);
  }

  private createPlayButton(): void {
    const centerX = GAME_WIDTH / 2;
    const buttonY = GAME_HEIGHT * 0.76;
    const buttonW = 220;
    const buttonH = 72;

    this.playButton = this.add.container(centerX, buttonY);
    this.playButton.setDepth(100);

    // Glow ring
    const glowRing = this.add.graphics();
    glowRing.fillStyle(COLORS.platformNormal, 0.12);
    glowRing.fillRoundedRect(-buttonW / 2 - 14, -buttonH / 2 - 14, buttonW + 28, buttonH + 28, 46);
    this.playButton.add(glowRing);

    // Shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.4);
    shadow.fillRoundedRect(-buttonW / 2 + 4, -buttonH / 2 + 6, buttonW, buttonH, 36);
    this.playButton.add(shadow);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.platformNormal, 1);
    bg.fillRoundedRect(-buttonW / 2, -buttonH / 2, buttonW, buttonH, 36);
    this.playButton.add(bg);

    // Text
    const text = this.add.text(0, 0, 'PLAY', {
      fontSize: '32px',
      fontFamily: 'Russo One, sans-serif',
      color: '#0f0f1a',
    });
    text.setOrigin(0.5);
    this.playButton.add(text);

    // Hit area
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

  private createSecondaryButtons(): void {
    const bottomY = GAME_HEIGHT - this.safeBottom;

    // Sound button - proper touch target
    this.soundButton = this.add.container(55, bottomY);
    this.soundButton.setDepth(60);

    const soundBg = this.add.graphics();
    soundBg.fillStyle(0xffffff, 0.12);
    soundBg.fillCircle(0, 0, 28);
    this.soundButton.add(soundBg);

    const soundIcon = this.add.text(0, 0, '🔊', { fontSize: '26px' });
    soundIcon.setOrigin(0.5);
    this.soundButton.add(soundIcon);

    const soundHit = this.add.rectangle(0, 0, 60, 60, 0xffffff, 0);
    soundHit.setInteractive({ useHandCursor: true });
    this.soundButton.add(soundHit);

    soundHit.on('pointerdown', () => this.toggleSound());
    soundHit.on('pointerover', () => {
      soundBg.clear();
      soundBg.fillStyle(0xffffff, 0.2);
      soundBg.fillCircle(0, 0, 28);
    });
    soundHit.on('pointerout', () => {
      soundBg.clear();
      soundBg.fillStyle(0xffffff, 0.12);
      soundBg.fillCircle(0, 0, 28);
    });

    // How to Play - clear pill button
    const htpContainer = this.add.container(GAME_WIDTH - 55, bottomY);
    htpContainer.setDepth(60);

    const htpBg = this.add.graphics();
    htpBg.fillStyle(0xffffff, 0.12);
    htpBg.fillRoundedRect(-65, -18, 130, 36, 18);
    htpContainer.add(htpBg);

    this.howToPlayBtn = this.add.text(0, 0, 'How to Play', {
      fontSize: '16px',
      fontFamily: 'Exo 2, sans-serif',
      fontStyle: '600',
      color: '#c5cbd8',
    });
    this.howToPlayBtn.setOrigin(0.5);
    htpContainer.add(this.howToPlayBtn);

    const htpHit = this.add.rectangle(0, 0, 140, 44, 0xffffff, 0);
    htpHit.setInteractive({ useHandCursor: true });
    htpContainer.add(htpHit);

    htpHit.on('pointerdown', () => this.showHowToPlay());
    htpHit.on('pointerover', () => this.howToPlayBtn.setColor('#ffffff'));
    htpHit.on('pointerout', () => this.howToPlayBtn.setColor('#c5cbd8'));
  }

  private setupInput(): void {
    this.input.keyboard?.on('keydown-SPACE', () => this.startGame());
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame());
  }

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

  private toggleSound(): void {
    // Toggle sound (would need game integration)
  }

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

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x12121f, 1);
    panelBg.fillRoundedRect(-150, -150, 300, 300, 28);
    panel.add(panelBg);

    const title = this.add.text(0, -115, 'How to Play', {
      fontSize: '28px',
      fontFamily: 'Russo One, sans-serif',
      color: '#ffffff',
    });
    title.setOrigin(0.5);
    panel.add(title);

    const inst = this.add.text(0, -35, 'Tap LEFT or RIGHT\nto move\n\nJump on platforms\nto climb higher\n\nDon\'t fall!', {
      fontSize: '17px',
      fontFamily: 'Exo 2, sans-serif',
      color: '#c5cbd8',
      align: 'center',
      lineSpacing: 10,
    });
    inst.setOrigin(0.5);
    panel.add(inst);

    const closeBtn = this.add.text(0, 95, 'Got it!', {
      fontSize: '20px',
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

  update(): void {
    // No heavy update logic needed
  }
}
