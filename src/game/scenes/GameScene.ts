import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS,
  CAMERA_LERP_Y,
  CAMERA_DEADZONE_HEIGHT,
  PLATFORM_SPAWN_AHEAD,
  PLATFORM_REMOVE_BELOW,
  DIFFICULTY,
  ANIMATION,
  HIGHSCORE_KEY,
  PlatformType,
} from '../config';
import { Player } from '../objects/Player';
import { Platform } from '../objects/Platform';

// ═══════════════════════════════════════════════════════════════════════════════
// Game Scene - Enhanced with combo system, sounds, and better effects
// ═══════════════════════════════════════════════════════════════════════════════

// Simple sound manager using Web Audio API
class SoundManager {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (!this.audioCtx) {
      try {
        this.audioCtx = new AudioContext();
      } catch (e) {
        return null;
      }
    }
    return this.audioCtx;
  }

  playJump(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  playLand(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }

  playBoost(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.2);
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  playBreak(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    source.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    source.start(ctx.currentTime);
  }

  playMilestone(): void {
    const ctx = this.getContext();
    if (!ctx) return;
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.15);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.15);
    });
  }
}

export class GameScene extends Phaser.Scene {
  // Game objects
  private player!: Player;
  private platforms: Platform[] = [];

  // State
  private score: number = 0;
  private highScore: number = 0;
  private isGameOver: boolean = false;
  private startY: number = 0;
  private maxHeight: number = 0;

  // Combo system
  private combo: number = 0;
  private comboMultiplier: number = 1;
  private lastLandTime: number = 0;
  private comboTimeout: number = 2000; // ms to maintain combo
  private comboText!: Phaser.GameObjects.Text;

  // Pause state
  private isPaused: boolean = false;

  // UI
  private scoreText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;

  // Camera
  private cameraShakeTween?: Phaser.Tweens.Tween;
  // Background elements
  private stars: Phaser.GameObjects.Star[] = [];
  private bgGradient!: Phaser.GameObjects.Graphics;

  // Sound
  private soundManager = new SoundManager();

  constructor() {
    super({ key: 'GameScene' });
  }

  // ─── Create ─────────────────────────────────────────────────────────────────
  create(): void {
    console.log('GameScene: create() called');
    
    this.isGameOver = false;
    this.score = 0;
    this.startY = GAME_HEIGHT - 100;
    this.maxHeight = 0;
    this.platforms = [];
    this.combo = 0;
    this.comboMultiplier = 1;

    // Load high score
    this.highScore = parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0');

    // Background
    this.createBackground();
    console.log('GameScene: background created');

    // UI
    this.createUI();
    console.log('GameScene: UI created');

    // Create starting platform and player
    this.createInitialPlatforms();
    console.log('GameScene: platforms created');
    this.createPlayer();
    console.log('GameScene: player created');

    // Camera setup
    this.cameras.main.startFollow(
      this.player,
      true,
      CAMERA_LERP_Y,
      CAMERA_LERP_Y
    );
    this.cameras.main.setDeadzone(GAME_WIDTH, CAMERA_DEADZONE_HEIGHT);
    console.log('GameScene: create() complete');
  }

  // ─── Background ─────────────────────────────────────────────────────────────
  private createBackground(): void {
    // Dynamic gradient background
    this.bgGradient = this.add.graphics();
    this.updateBackgroundGradient(0);
    this.bgGradient.setDepth(-100);

    // Parallax stars
    for (let i = 0; i < 60; i++) {
      const star = this.add.star(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(-5000, GAME_HEIGHT),
        Phaser.Math.Between(3, 5),
        1,
        2,
        0xffffff
      );
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 1));
      star.setScale(Phaser.Math.FloatBetween(0.2, 1));
      star.setDepth(-50);
      this.stars.push(star);
    }
  }

  private updateBackgroundGradient(height: number): void {
    // Gradually shift colors as player goes higher
    const progress = Math.min(height / 15000, 1);
    
    // Interpolate from dark blue to purple to pink
    const topR = Math.floor(Phaser.Math.Linear(0x1a, 0x6b, progress));
    const topG = Math.floor(Phaser.Math.Linear(0x1a, 0x21, progress));
    const topB = Math.floor(Phaser.Math.Linear(0x2e, 0x8b, progress));
    
    const botR = Math.floor(Phaser.Math.Linear(0x0f, 0x2d, progress));
    const botG = Math.floor(Phaser.Math.Linear(0x0f, 0x1a, progress));
    const botB = Math.floor(Phaser.Math.Linear(0x1a, 0x4a, progress));
    
    const topColor = (topR << 16) | (topG << 8) | topB;
    const botColor = (botR << 16) | (botG << 8) | botB;
    
    this.bgGradient.clear();
    this.bgGradient.fillGradientStyle(topColor, topColor, botColor, botColor, 1);
    this.bgGradient.fillRect(0, -10000, GAME_WIDTH, 20000);
  }

  // ─── UI ─────────────────────────────────────────────────────────────────────
  private createUI(): void {
    const padding = 16;
    const safeTop = this.getSafeAreaTop();
    const safeLeft = this.getSafeAreaLeft();
    const topOffset = safeTop + padding;

    // ─── Left HUD Block: Score + Combo ───────────────────────────────────────
    
    // Score - 44px, clear and balanced
    this.scoreText = this.add.text(safeLeft + padding, topOffset, '0', {
      fontSize: '44px',
      fontFamily: 'Russo One, Arial Black, sans-serif',
      color: '#ffffff',
    });
    this.scoreText.setOrigin(0, 0);
    this.scoreText.setDepth(1000);

    // Combo - "COMBO ×13" in accent color, 26px, clear and prominent
    this.comboText = this.add.text(safeLeft + padding, topOffset + 50, '', {
      fontSize: '26px',
      fontFamily: 'Russo One, Arial, sans-serif',
      color: '#4ecdc4',
    });
    this.comboText.setOrigin(0, 0);
    this.comboText.setDepth(1000);
    this.comboText.setAlpha(0);

    // Store combo base Y for camera following
    (this as any).comboBaseY = topOffset + 50;

    // ─── Right HUD Block: Pause Button + Best Score Badge ─────────────────────
    
    // Pause button positioned via HTML overlay (top right)
    // Best Score Badge - premium compact panel aligned with pause button

    // Best badge container
    const bestContainer = this.add.container(GAME_WIDTH - padding, topOffset);
    bestContainer.setDepth(1000);

    // Best badge background - centered, same style as pause button
    const bestBg = this.add.graphics();
    bestBg.fillStyle(0x000000, 0.4);
    bestBg.fillRoundedRect(-64, 0, 128, 64, 12);
    bestContainer.add(bestBg);

    // BEST label - uppercase, centered
    const bestLabel = this.add.text(0, 10, 'BEST', {
      fontSize: '11px',
      fontFamily: 'Exo 2, Arial, sans-serif',
      fontStyle: '700',
      color: '#9ba3b5',
    });
    bestLabel.setOrigin(0.5, 0);
    bestContainer.add(bestLabel);

    // Best value - clean number, centered, no prefix
    this.highScoreText = this.add.text(0, 28, this.highScore.toString(), {
      fontSize: '24px',
      fontFamily: 'Russo One, Arial, sans-serif',
      color: '#feca57',
    });
    this.highScoreText.setOrigin(0.5, 0);
    bestContainer.add(this.highScoreText);

    // Store reference for camera following
    (this as any).bestContainer = bestContainer;

    // Touch controls hint
    this.createTouchHint();
  }

  // ─── Touch Controls Hint ─────────────────────────────────────────────────────
  private createTouchHint(): void {
    const safeBottom = this.getSafeAreaBottom();
    const y = GAME_HEIGHT - safeBottom - 80;

    // Left arrow
    const leftArrow = this.add.text(60, y, '◀', {
      fontSize: '28px',
      color: '#666666',
    }).setOrigin(0.5).setAlpha(0.6);

    // Right arrow
    const rightArrow = this.add.text(GAME_WIDTH - 60, y, '▶', {
      fontSize: '28px',
      color: '#666666',
    }).setOrigin(0.5).setAlpha(0.6);

    // Center text
    const hintText = this.add.text(GAME_WIDTH / 2, y, 'TAP LEFT/RIGHT TO MOVE', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#666666',
    }).setOrigin(0.5).setAlpha(0.6);

    // Fade out after 3 seconds
    this.tweens.add({
      targets: [leftArrow, rightArrow, hintText],
      alpha: 0,
      duration: 500,
      delay: 3000,
      onComplete: () => {
        leftArrow.destroy();
        rightArrow.destroy();
        hintText.destroy();
      },
    });
  }

  private getSafeAreaBottom(): number {
    const style = getComputedStyle(document.documentElement);
    const sab = style.getPropertyValue('--sab').trim();
    return sab ? parseInt(sab) : 34;
  }

  private getSafeAreaTop(): number {
    const style = getComputedStyle(document.documentElement);
    const sat = style.getPropertyValue('--sat').trim();
    return sat ? parseInt(sat) : 44;
  }

  private getSafeAreaLeft(): number {
    const style = getComputedStyle(document.documentElement);
    const sal = style.getPropertyValue('--sal').trim();
    return sal ? parseInt(sal) : 0;
  }

  // ─── Platforms ───────────────────────────────────────────────────────────────
  private createInitialPlatforms(): void {
    // Starting platform (always normal, centered)
    this.createPlatform(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'normal');

    // Generate initial platforms going up with bigger gaps initially
    let y = GAME_HEIGHT - 130;
    for (let i = 0; i < 15; i++) {
      // First few platforms have larger gaps to make death possible
      const baseGap = i < 5 ? 70 + i * 10 : this.getGapForHeight(-y);
      y -= baseGap;
      const x = this.getValidXForHeight(-y);
      const type = this.getPlatformTypeForHeight(-y, i);
      this.createPlatform(x, y, type);
    }
  }

  private createPlatform(x: number, y: number, type: PlatformType): Platform {
    const platform = new Platform(this, x, y, type);
    this.platforms.push(platform);
    return platform;
  }

  // ─── Player ─────────────────────────────────────────────────────────────────
  private createPlayer(): void {
    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT - 120);
  }

  // ─── Difficulty Scaling ──────────────────────────────────────────────────────
  private getGapForHeight(height: number): number {
    const progress = Math.min(height / 10000, 1);
    const minGap = Phaser.Math.Linear(
      DIFFICULTY.START_GAP_MIN,
      DIFFICULTY.MAX_GAP_MIN,
      progress
    );
    const maxGap = Phaser.Math.Linear(
      DIFFICULTY.START_GAP_MAX,
      DIFFICULTY.MAX_GAP_MAX,
      progress
    );
    return Phaser.Math.Between(Math.floor(minGap), Math.floor(maxGap));
  }

  private getPlatformTypeForHeight(height: number, index: number): PlatformType {
    if (index < 3) return 'normal';

    if (height < DIFFICULTY.SPECIAL_PLATFORM_START) {
      return 'normal';
    }

    const heightProgress = Math.min(
      (height - DIFFICULTY.SPECIAL_PLATFORM_START) / 5000,
      1
    );
    const specialChance = Phaser.Math.Linear(
      DIFFICULTY.SPECIAL_PLATFORM_CHANCE_START,
      DIFFICULTY.SPECIAL_PLATFORM_CHANCE_MAX,
      heightProgress
    );

    const rand = Math.random();
    
    if (rand < specialChance * 0.2) {
      return 'boost';
    }
    if (rand < specialChance * 0.4) {
      return 'cloud';
    }
    if (rand < specialChance * 0.7) {
      return 'breakable';
    }
    if (rand < specialChance) {
      return 'moving';
    }

    return 'normal';
  }

  private getValidXForHeight(_height: number): number {
    const margin = 35 + 20;
    const lastPlatform = this.platforms[this.platforms.length - 1];
    
    if (lastPlatform) {
      const lastX = lastPlatform.x;
      const maxJump = 180;
      
      let x = Phaser.Math.Between(
        Math.max(margin, lastX - maxJump),
        Math.min(GAME_WIDTH - margin, lastX + maxJump)
      );
      
      if (Math.random() < 0.15) {
        x = Phaser.Math.Between(margin, GAME_WIDTH - margin);
      }
      
      return x;
    }

    return Phaser.Math.Between(margin, GAME_WIDTH - margin);
  }

  // ─── Pause Control ─────────────────────────────────────────────────────────
  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    console.log('GameScene: paused =', paused);
  }

  // ─── Update ─────────────────────────────────────────────────────────────────
  update(_time: number, _delta: number): void {
    if (this.isGameOver || this.isPaused) return;

    // Update player
    this.player.update(_time, _delta);

    // Update platforms
    this.platforms.forEach(p => p.update(_delta));

    // Collision detection
    this.checkCollisions();

    // Check game over
    this.checkGameOver();

    // Update score
    this.updateScore();

    // Platform management
    this.managePlatforms();

    // Update UI position
    this.updateUIPosition();

    // Parallax stars
    this.updateStars();

    // Update combo timeout
    this.checkComboTimeout(_time);

    // Update background based on height
    this.updateBackgroundGradient(this.maxHeight);
  }

  // ─── Collision ──────────────────────────────────────────────────────────────
  private lastPlatformY: number = 0;

  private checkCollisions(): void {
    if (!this.player.isFalling()) return;

    const playerBottom = this.player.getBottom();
    const playerLeft = this.player.getLeft();
    const playerRight = this.player.getRight();
    const playerVelY = this.player.body!.velocity.y;

    for (const platform of this.platforms) {
      if (!platform.alive) continue;

      const platTop = platform.getTop();
      const platLeft = platform.getLeft();
      const platRight = platform.getRight();

      const isAbovePlatform = playerBottom >= platTop - 10 && playerBottom <= platTop + 20;
      const isHorizontallyAligned = playerRight > platLeft + 5 && playerLeft < platRight - 5;
      const isMovingDown = playerVelY > 0;

      if (isAbovePlatform && isHorizontallyAligned && isMovingDown) {
        // Land on platform
        this.player.y = platTop - 18;
        this.player.land();
        platform.onPlayerLand();

        // Check if this platform is higher than the last one (for combo)
        const isHigher = platTop < this.lastPlatformY;
        this.lastPlatformY = platTop;

        // Handle platform-specific effects
        this.handlePlatformLanding(platform, isHigher);
        break;
      }
    }
  }

  private handlePlatformLanding(platform: Platform, isHigher: boolean): void {
    const currentTime = this.time.now;

    // Update combo - only if going higher
    if (isHigher && currentTime - this.lastLandTime < this.comboTimeout) {
      this.combo++;
      this.comboMultiplier = Math.min(1 + this.combo * 0.15, 5); // Max 5x multiplier
    } else if (isHigher) {
      this.combo = 1;
      this.comboMultiplier = 1;
    }
    // If not higher, reset combo
    if (!isHigher && this.combo > 0) {
      this.combo = 0;
      this.comboMultiplier = 1;
      this.comboText.setAlpha(0);
    }
    this.lastLandTime = currentTime;

    // Update combo display
    this.updateComboDisplay();

    // Sound effects
    this.soundManager.playLand();

    // Create landing particles
    this.createLandingParticles(platform);

    switch (platform.platformType) {
      case 'boost':
        this.player.boost();
        this.screenShake(ANIMATION.SHAKE_INTENSITY_MEDIUM);
        this.soundManager.playBoost();
        this.createBoostEffect();
        break;
      case 'moving':
        this.player.jump();
        const vel = platform.body?.velocity?.x || 0;
        if (vel !== 0) {
          this.player.body!.velocity.x += vel * 0.3;
        }
        break;
      case 'breakable':
        this.player.jump();
        this.soundManager.playBreak();
        break;
      case 'cloud':
      case 'normal':
      default:
        this.player.jump();
        this.soundManager.playJump();
        break;
    }

    // Show floating score
    this.showFloatingScore(platform);
  }

  private createLandingParticles(platform: Platform): void {
    const colors: Record<PlatformType, number> = {
      normal: COLORS.platformNormal,
      moving: COLORS.platformMoving,
      breakable: COLORS.platformBreakable,
      boost: COLORS.platformBoost,
      cloud: COLORS.platformCloud,
    };

    const color = colors[platform.platformType];

    // Better particles - more varied, better looking
    for (let i = 0; i < 8; i++) {
      const offsetX = Phaser.Math.Between(-25, 25);
      const particle = this.add.circle(
        platform.x + offsetX,
        platform.y - 3,
        Phaser.Math.Between(2, 4),
        color
      );
      particle.setDepth(10);

      // Spread in arc
      const angle = Phaser.Math.FloatBetween(2.2, 3.9);
      const speed = Phaser.Math.Between(50, 100);

      this.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * speed,
        y: particle.y + Math.sin(angle) * speed * -1,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private createBoostEffect(): void {
    // Simple purple flash
    this.cameras.main.flash(100, 168, 85, 247, false);
  }

  private updateComboDisplay(): void {
    if (this.combo >= 1) {
      this.comboText.setText(`COMBO ×${this.combo}`);
      this.comboText.setAlpha(1);
      // Subtle pulse animation
      this.tweens.add({
        targets: this.comboText,
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 150,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    } else {
      this.comboText.setAlpha(0);
    }
  }

  private checkComboTimeout(_time: number): void {
    if (this.combo > 0 && this.time.now - this.lastLandTime > this.comboTimeout) {
      this.combo = 0;
      this.comboMultiplier = 1;
      this.comboText.setAlpha(0);
    }
  }

  private showFloatingScore(platform: Platform): void {
    const baseScore = Math.floor(10 * this.comboMultiplier);
    
    const scorePopup = this.add.text(
      platform.x,
      platform.y - 30,
      `+${baseScore}`,
      {
        fontSize: '18px',
        fontFamily: 'Arial Black, Arial, sans-serif',
        color: this.combo > 1 ? '#feca57' : '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: scorePopup,
      y: scorePopup.y - 40,
      alpha: 0,
      scale: 1.3,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => scorePopup.destroy(),
    });
  }

  // ─── Game Over ──────────────────────────────────────────────────────────────
  private checkGameOver(): void {
    const playerY = this.player.y;
    
    // Die if player falls below camera view OR below starting area by 400px
    if (playerY > this.startY + 400) {
      this.triggerGameOver();
    }
  }

  private triggerGameOver(): void {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Save high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem(HIGHSCORE_KEY, this.highScore.toString());
    }

    // Death effects: shake + red flash
    this.cameras.main.shake(300, 0.02);
    this.cameras.main.flash(200, 255, 50, 50, false);

    // Player death animation - shrink and fade
    this.tweens.add({
      targets: this.player,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeIn',
    });

    // Camera fade effect
    this.cameras.main.fade(500, 0, 0, 0);

    // Transition to game over
    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        highScore: this.highScore,
      });
    });
  }

  // ─── Score ─────────────────────────────────────────────────────────────────
  private updateScore(): void {
    const currentHeight = Math.max(0, this.startY - this.player.y);
    
    if (currentHeight > this.maxHeight) {
      this.maxHeight = currentHeight;
    }

    const newScore = Math.floor((this.maxHeight / 10) * this.comboMultiplier);
    
    if (newScore !== this.score) {
      const oldScore = this.score;
      this.score = newScore;
      this.scoreText.setText(this.score.toString());

      // Scale animation on score change
      this.tweens.add({
        targets: this.scoreText,
        scale: 1.2,
        duration: 100,
        yoyo: true,
        ease: 'Cubic.easeOut',
      });

      // Milestone celebration every 1000 points
      if (this.score > 0 && Math.floor(this.score / 1000) > Math.floor(oldScore / 1000)) {
        this.celebrateMilestone(this.score);
      }

      // Flash effect when beating high score
      if (this.score > this.highScore && this.score > 0) {
        this.highScoreText.setText(this.score.toString());
        this.highScoreText.setColor('#' + COLORS.highscoreText.toString(16).padStart(6, '0'));
      }
    }
  }

  // ─── Milestone Celebration ───────────────────────────────────────────────────
  private celebrateMilestone(score: number): void {
    this.soundManager.playMilestone();

    // Flash screen (subtle)
    this.cameras.main.flash(150, 78, 205, 196, true);

    // Show milestone text
    const milestoneText = this.add.text(GAME_WIDTH / 2, this.player.y - 80, `${score}!`, {
      fontSize: '48px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#feca57',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(1000).setScale(0);

    // Big entrance animation with overshoot
    this.tweens.add({
      targets: milestoneText,
      scale: 1.3,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Bounce back
        this.tweens.add({
          targets: milestoneText,
          scale: 1,
          duration: 100,
          ease: 'Quad.easeOut',
        });
      }
    });

    // Score text pop
    this.tweens.add({
      targets: this.scoreText,
      scale: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Animate and remove
    this.tweens.add({
      targets: milestoneText,
      y: milestoneText.y - 80,
      alpha: 0,
      duration: 600,
      delay: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => milestoneText.destroy(),
    });
  }

  // ─── Platform Management ────────────────────────────────────────────────────
  private managePlatforms(): void {
    const cameraTop = this.cameras.main.scrollY;

    this.spawnPlatformsAboveCamera(cameraTop);
    this.removePlatformsBelowCamera(cameraTop);
  }

  private spawnPlatformsAboveCamera(cameraTop: number): void {
    const highestPlatform = this.getHighestPlatformY();
    const spawnThreshold = cameraTop - PLATFORM_SPAWN_AHEAD;

    if (highestPlatform > spawnThreshold) {
      const height = -highestPlatform;
      const newY = highestPlatform - this.getGapForHeight(height);
      const newX = this.getValidXForHeight(height);
      const type = this.getPlatformTypeForHeight(height, this.platforms.length);
      this.createPlatform(newX, newY, type);
    }
  }

  private getHighestPlatformY(): number {
    let highest = 0;
    for (const p of this.platforms) {
      if (p.y < highest) highest = p.y;
    }
    return highest;
  }

  private removePlatformsBelowCamera(cameraTop: number): void {
    const removeThreshold = cameraTop + GAME_HEIGHT + PLATFORM_REMOVE_BELOW;

    this.platforms = this.platforms.filter(platform => {
      if (platform.y > removeThreshold) {
        platform.destroy();
        return false;
      }
      return true;
    });
  }

  // ─── UI Updates ─────────────────────────────────────────────────────────────
  private updateUIPosition(): void {
    const cameraTop = this.cameras.main.scrollY;
    const safeTop = this.getSafeAreaTop();
    const padding = 16;
    
    // Score follows camera up
    const minY = Math.min(cameraTop + safeTop + padding, this.scoreText.y);
    this.scoreText.setY(minY);
    
    // Combo follows score
    if ((this as any).comboBaseY !== undefined) {
      this.comboText.setY(minY + 50);
    }
    
    // Best badge follows camera up
    if ((this as any).bestContainer) {
      (this as any).bestContainer.setY(minY);
    }
  }

  // ─── Visual Effects ─────────────────────────────────────────────────────────
  private screenShake(_intensity: number): void {
    if (this.cameraShakeTween) return;

    this.cameras.main.flash(ANIMATION.SHAKE_DURATION, 255, 100, 100, false);
    this.cameraShakeTween = this.tweens.add({
      targets: this.cameras.main,
      duration: ANIMATION.SHAKE_DURATION,
      onComplete: () => {
        this.cameraShakeTween = undefined;
      },
    });
  }

  private updateStars(): void {
    const cameraTop = this.cameras.main.scrollY;
    
    this.stars.forEach((star) => {
      if (star.y > cameraTop + GAME_HEIGHT + 50) {
        star.y = cameraTop - 50;
        star.x = Phaser.Math.Between(0, GAME_WIDTH);
      }
    });
  }
}
