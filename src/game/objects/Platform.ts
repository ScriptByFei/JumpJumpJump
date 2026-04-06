import Phaser from 'phaser';
import {
  GAME_WIDTH,
  PLATFORM_WIDTH,
  PLATFORM_HEIGHT,
  PLATFORM_TYPES,
  PlatformType,
  ANIMATION,
  COLORS,
} from '../config';

// ═══════════════════════════════════════════════════════════════════════════════
// Platform - Different types with various behaviors
// ═══════════════════════════════════════════════════════════════════════════════
export class Platform extends Phaser.GameObjects.Image {
  // Platform type
  public readonly platformType: PlatformType;
  public readonly typeConfig: typeof PLATFORM_TYPES.normal;

  // State
  public alive: boolean = true;
  public touched: boolean = false;

  // Cached bounds (recalculate only when position changes)
  private _top?: number;
  private _left?: number;
  private _right?: number;

  // Type-specific state
  private moveSpeed: number;
  private moveRangeMin: number;
  private moveRangeMax: number;

  // Breakable state
  private shakeTimer: number = 0;
  private readonly SHAKE_DURATION = 300;
  private originalX: number;

  // Cloud state
  private fadeTimer: number = 0;
  private readonly FADE_DURATION: number;
  private cloudOpacity: number = 1;
  private isFading: boolean = false;

  // Visual
  private floatTween?: Phaser.Tweens.Tween;
  private pulseTween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: PlatformType = 'normal'
  ) {
    super(scene, x, y, `platform_${type}`);

    scene.add.existing(this);
    this.setDepth(1);

    this.platformType = type;
    this.typeConfig = PLATFORM_TYPES[type] || PLATFORM_TYPES.normal;
    this.originalX = x;

    // Set initial scale
    this.setScale(1, 1);

    // Type-specific setup
    this.moveSpeed = PLATFORM_TYPES.moving.speed;
    this.moveRangeMin = PLATFORM_WIDTH / 2 + 10;
    this.moveRangeMax = GAME_WIDTH - PLATFORM_WIDTH / 2 - 10;
    this.FADE_DURATION = PLATFORM_TYPES.cloud.fadeDelay;

    // Start animations
    this.startAnimations();
  }

  // ─── Animations ──────────────────────────────────────────────────────────────
  private startAnimations(): void {
    // Moving platforms use horizontal tween movement
    if (this.platformType === 'moving') {
      this.scene.tweens.add({
        targets: this,
        x: this.moveRangeMax,
        duration: (this.moveRangeMax - this.moveRangeMin) / this.moveSpeed * 1000,
        ease: 'Linear',
        yoyo: true,
        repeat: -1,
        onUpdate: () => this.invalidateCache(),
      });
    } else {
      // Floating animation for non-moving platforms
      this.floatTween = this.scene.tweens.add({
        targets: this,
        y: this.y - ANIMATION.FLOAT_AMPLITUDE,
        duration: ANIMATION.FLOAT_SPEED + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Pulse animation for boost platforms
      if (this.platformType === 'boost') {
        this.pulseTween = this.scene.tweens.add({
          targets: this,
          scaleX: 1 + ANIMATION.PULSE_SCALE,
          scaleY: 1 + ANIMATION.PULSE_SCALE,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }
  }

  // ─── Update ─────────────────────────────────────────────────────────────────
  update(_delta: number): void {
    if (!this.alive) return;

    switch (this.platformType) {
      case 'moving':
        // Moving platforms don't need manual update - movement is handled by tween
        break;
      case 'breakable':
        this.updateBreakable();
        break;
      case 'cloud':
        this.updateCloud();
        break;
    }
  }

  private updateBreakable(): void {
    if (!this.touched) return;

    this.shakeTimer -= 16; // Approximate delta
    if (this.shakeTimer > 0) {
      // Shake effect
      this.x = this.originalX + (Math.random() - 0.5) * 6;
      this.angle = (Math.random() - 0.5) * 10;
    } else if (this.shakeTimer <= 0 && this.alive) {
      this.break();
    }
  }

  private updateCloud(): void {
    if (!this.isFading) return;

    this.fadeTimer -= 16;
    if (this.fadeTimer > 0) {
      this.cloudOpacity = this.fadeTimer / this.FADE_DURATION;
      this.setAlpha(this.cloudOpacity);
    } else {
      this.fade();
    }
  }

  // ─── Player Interaction ──────────────────────────────────────────────────────
  onPlayerLand(): void {
    switch (this.platformType) {
      case 'breakable':
        if (this.touched) return; // Already breaking
        this.touched = true;
        this.startBreakSequence();
        break;
      case 'cloud':
        if (this.touched) return; // Already fading
        this.touched = true;
        this.startFadeSequence();
        break;
      case 'boost':
        this.triggerBoostEffect();
        break;
      case 'normal':
      case 'moving':
      default:
        this.triggerLandEffect();
        break;
    }
  }

  private startBreakSequence(): void {
    this.shakeTimer = this.SHAKE_DURATION;
  }

  private startFadeSequence(): void {
    this.isFading = true;
    this.fadeTimer = this.FADE_DURATION;
  }

  private triggerLandEffect(): void {
    // Enhanced particle burst with more particles and trail effect
    const particles = this.scene.add.particles(this.x, this.y - 5, 'particle_circle', {
      speed: { min: 30, max: 80 },
      angle: { min: 160, max: 220 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 400,
      gravityY: 100,
      quantity: 8,
      tint: this.typeConfig.color,
      blendMode: Phaser.BlendModes.ADD,
    });

    // White shine particles
    const shineParticles = this.scene.add.particles(this.x, this.y - 8, 'particle_circle', {
      speed: { min: 50, max: 100 },
      angle: { min: 170, max: 190 },
      scale: { start: 0.2, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: 300,
      gravityY: 50,
      quantity: 4,
      tint: 0xffffff,
      blendMode: Phaser.BlendModes.ADD,
    });

    this.scene.time.delayedCall(500, () => {
      particles.destroy();
      shineParticles.destroy();
    });

    // Subtle platform bounce
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.85,
      duration: 50,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  private triggerBoostEffect(): void {
    // Intense boost particles with multiple colors
    const particles = this.scene.add.particles(this.x, this.y - 10, 'particle_star', {
      speed: { min: 100, max: 250 },
      angle: { min: 230, max: 310 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 700,
      gravityY: -150,
      quantity: 18,
      tint: COLORS.platformBoost,
      blendMode: Phaser.BlendModes.ADD,
    });

    // Extra white burst particles
    const burstParticles = this.scene.add.particles(this.x, this.y - 15, 'particle_circle', {
      speed: { min: 150, max: 300 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.4, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      quantity: 10,
      tint: 0xffffff,
      blendMode: Phaser.BlendModes.ADD,
    });

    this.scene.time.delayedCall(800, () => {
      particles.destroy();
      burstParticles.destroy();
    });

    // Flash effect with scale pulse
    this.scene.tweens.add({
      targets: this,
      alpha: 0.4,
      scaleX: 1.1,
      scaleY: 0.9,
      duration: 80,
      yoyo: true,
      repeat: 1,
      ease: 'Quad.easeOut',
    });
  }

  // ─── Break & Fade ───────────────────────────────────────────────────────────
  private break(): void {
    if (!this.alive) return;
    this.alive = false;

    // Stop animations
    if (this.floatTween) this.floatTween.stop();
    if (this.pulseTween) this.pulseTween.stop();

    // Enhanced break particles with debris effect
    const particles = this.scene.add.particles(this.x, this.y, 'particle_square', {
      speed: { min: 80, max: 200 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      gravityY: 500,
      quantity: 15,
      tint: COLORS.platformBreakable,
      blendMode: Phaser.BlendModes.ADD,
    });

    // Dust cloud particles
    const dustParticles = this.scene.add.particles(this.x, this.y, 'particle_circle', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: 400,
      quantity: 8,
      tint: 0x8b5a5a,
    });

    this.scene.time.delayedCall(700, () => {
      particles.destroy();
      dustParticles.destroy();
    });

    // Platform shake then disappear
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 0.5,
      duration: 200,
      ease: 'Back.easeIn',
    });

    // Remove from scene
    this.scene.time.delayedCall(200, () => {
      this.setVisible(false);
      this.setActive(false);
    });
  }

  private fade(): void {
    if (!this.alive) return;
    this.alive = false;

    // Stop animations
    if (this.floatTween) this.floatTween.stop();
    if (this.pulseTween) this.pulseTween.stop();

    // Fade out animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleY: 0.5,
      duration: 200,
      onComplete: () => {
        this.setVisible(false);
        this.setActive(false);
      },
    });
  }

  // ─── Getters ─────────────────────────────────────────────────────────────────
  getTop(): number {
    if (this._top === undefined) this._top = this.y - PLATFORM_HEIGHT / 2;
    return this._top;
  }

  getLeft(): number {
    if (this._left === undefined) this._left = this.x - PLATFORM_WIDTH / 2;
    return this._left;
  }

  getRight(): number {
    if (this._right === undefined) this._right = this.x + PLATFORM_WIDTH / 2;
    return this._right;
  }

  // Invalidate cache when position changes (for moving platforms)
  invalidateCache(): void {
    this._top = undefined;
    this._left = undefined;
    this._right = undefined;
  }

  getWidth(): number {
    return PLATFORM_WIDTH;
  }

  // ─── Cleanup ────────────────────────────────────────────────────────────────
  destroy(): void {
    if (this.floatTween) this.floatTween.stop();
    if (this.pulseTween) this.pulseTween.stop();
    super.destroy();
  }
}
