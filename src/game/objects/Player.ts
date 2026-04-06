import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GRAVITY,
  PLAYER_JUMP_VELOCITY,
  PLAYER_MOVE_SPEED,
  PLAYER_MAX_FALL_SPEED,
  PLAYER_SIZE_W,
  PLAYER_SIZE_H,
  ANIMATION,
  TOUCH,
  COLORS,
  GUN,
} from '../config';

// Bullet class
class Bullet extends Phaser.Physics.Arcade.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, direction: number) {
    super(scene, x, y, 'particle_circle');
    this.setTintFill(0xfeca57);
    this.setScale(GUN.BULLET_SIZE / 10);
    this.setDepth(60);
    scene.physics.add.existing(this);
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(direction * GUN.BULLET_SPEED);
    scene.add.existing(this);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Player - The jumping character with touch controls and squash/stretch
// ═══════════════════════════════════════════════════════════════════════════════
export class Player extends Phaser.Physics.Arcade.Sprite {
  // Touch state
  private touchDirection: number = 0; // -1 left, 0 none, 1 right

  // Jump state
  private jumpCooldown: number = 0;
  private readonly JUMP_COOLDOWN_MS = 50;

  // Movement
  private currentMoveSpeed: number = PLAYER_MOVE_SPEED;

  // Squash/stretch
  private baseScaleX: number = 1;
  private baseScaleY: number = 1;
  private isSquashing: boolean = false;

  // Effects
  private landingParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private trailEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  // State
  public isGrounded: boolean = false;
  public lastPlatformY: number = 0;

  // Powerup state
  private hasRocket: boolean = false;
  private hasShield: boolean = false;
  private shieldGfx?: Phaser.GameObjects.Graphics;
  private hasGun: boolean = false;
  private gunAmmo: number = 0;
  private lastFireTime: number = 0;
  private lastDirection: number = 1; // 1 = right, -1 = left
  private bullets: Bullet[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Physics body setup
    this.setCollideWorldBounds(false);
    this.body!.setSize(PLAYER_SIZE_W, PLAYER_SIZE_H);
    this.body!.setOffset(
      (44 - PLAYER_SIZE_W) / 2,
      (44 - PLAYER_SIZE_H)
    );
    (this.body! as Phaser.Physics.Arcade.Body).maxVelocity.set(PLAYER_MAX_FALL_SPEED, PLAYER_MAX_FALL_SPEED);

    // Apply gravity
    (this.body! as Phaser.Physics.Arcade.Body).setGravityY(GRAVITY);

    // Initial scale
    this.setScale(this.baseScaleX, this.baseScaleY);

    // Setup input and effects
    this.setupTouchInput();
    this.setupTrail();
  }

  // ─── Touch Input ─────────────────────────────────────────────────────────────
  private setupTouchInput(): void {
    const scene = this.scene;

    // Track touch/click position
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleTouchStart(pointer);
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        this.handleTouchMove(pointer);
      }
    });

    scene.input.on('pointerup', () => {
      this.touchDirection = 0;
    });

    scene.input.on('pointercancel', () => {
      this.touchDirection = 0;
    });

    // Keyboard fallback (for testing)
    scene.input.keyboard?.on('keydown-LEFT', () => this.touchDirection = -1);
    scene.input.keyboard?.on('keydown-RIGHT', () => this.touchDirection = 1);
    scene.input.keyboard?.on('keyup-LEFT', () => { if (this.touchDirection === -1) this.touchDirection = 0; });
    scene.input.keyboard?.on('keyup-RIGHT', () => { if (this.touchDirection === 1) this.touchDirection = 0; });

    // Shooting with Z or Space
    scene.input.keyboard?.on('keydown-Z', () => this.tryShoot());
    scene.input.keyboard?.on('keydown-SPACE', () => this.tryShoot());
  }

  private handleTouchStart(pointer: Phaser.Input.Pointer): void {
    this.updateDirectionFromPointer(pointer);
  }

  private handleTouchMove(pointer: Phaser.Input.Pointer): void {
    this.updateDirectionFromPointer(pointer);
  }

  private updateDirectionFromPointer(pointer: Phaser.Input.Pointer): void {
    // Calculate position relative to screen center
    const screenCenterX = this.scene.cameras.main.width / 2;
    const offsetX = pointer.x - screenCenterX;

    // Dead zone in center
    if (Math.abs(offsetX) < TOUCH.DEAD_ZONE) {
      this.touchDirection = 0;
      return;
    }

    // Direction based on which side was touched
    this.touchDirection = offsetX < 0 ? -1 : 1;

    // Edge sensitivity - increase speed near edges
    const screenWidth = this.scene.cameras.main.width;
    const edgeDistance = Math.min(
      pointer.x,
      screenWidth - pointer.x
    );
    
    if (edgeDistance < TOUCH.EDGE_SENSITIVITY) {
      this.currentMoveSpeed = PLAYER_MOVE_SPEED * 1.2;
    } else {
      this.currentMoveSpeed = PLAYER_MOVE_SPEED;
    }
  }

  // ─── Trail Effect ────────────────────────────────────────────────────────────
  private setupTrail(): void {
    this.trailEmitter = this.scene.add.particles(0, 0, 'particle_circle', {
      speed: { min: 5, max: 20 },
      angle: { min: 80, max: 100 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 300,
      frequency: 30,
      emitting: false,
      tint: COLORS.playerHighlight,
    });
  }

  // ─── Update ─────────────────────────────────────────────────────────────────
  update(_time: number, _delta: number): void {
    // Update cooldown
    if (this.jumpCooldown > 0) {
      this.jumpCooldown -= _delta;
    }

    // Handle horizontal movement from touch
    let vx = this.touchDirection * this.currentMoveSpeed;
    
    // Track last direction for shooting
    if (this.touchDirection !== 0) {
      this.lastDirection = this.touchDirection;
    }
    
    // Reset speed to default
    this.currentMoveSpeed = PLAYER_MOVE_SPEED;

    // Apply velocity
    this.body!.velocity.x = vx;

    // Update bullets - remove off-screen
    this.bullets = this.bullets.filter(bullet => {
      if (bullet.x < -50 || bullet.x > GAME_WIDTH + 50) {
        bullet.destroy();
        return false;
      }
      return true;
    });

    // Screen wrap
    if (this.x < -PLAYER_SIZE_W) {
      this.x = GAME_WIDTH + PLAYER_SIZE_W;
    } else if (this.x > GAME_WIDTH + PLAYER_SIZE_W) {
      this.x = -PLAYER_SIZE_W;
    }

    // Update trail emitter position
    if (this.trailEmitter) {
      this.trailEmitter.setPosition(this.x, this.y);
      // Start/stop emitting based on velocity
      if (this.body!.velocity.y < -100 && Math.abs(this.body!.velocity.x) > 50) {
        this.trailEmitter.start();
      } else {
        this.trailEmitter.stop();
      }
    }

    // Update shield visual position
    if (this.hasShield && this.shieldGfx) {
      this.updateShieldVisual();
    }

    // Reset grounded state (will be set by collision)
    this.isGrounded = false;
  }

  // ─── Jump Methods ───────────────────────────────────────────────────────────
  jump(customVelocity?: number): void {
    if (this.jumpCooldown > 0) return;

    const jumpVel = customVelocity || PLAYER_JUMP_VELOCITY;
    this.body!.velocity.y = jumpVel;
    this.jumpCooldown = this.JUMP_COOLDOWN_MS;
    
    // Jump squash/stretch
    this.squash(
      ANIMATION.JUMP_SQUASH_X,
      ANIMATION.JUMP_SQUASH_Y,
      ANIMATION.SQUASH_RECOVERY_TIME
    );

    // Trigger trail when jumping
    if (this.trailEmitter) {
      this.trailEmitter.explode(5);
    }
  }

  land(): void {
    this.isGrounded = true;
    this.lastPlatformY = this.y;

    // Landing squash/stretch
    this.squash(
      ANIMATION.LAND_SQUASH_X,
      ANIMATION.LAND_SQUASH_Y,
      ANIMATION.SQUASH_RECOVERY_TIME
    );

    // Landing particles
    this.triggerLandingEffect();
  }

  boost(customVelocity?: number): void {
    // Boost jump - higher than normal
    const boostVel = customVelocity || PLAYER_JUMP_VELOCITY * 1.5;
    this.body!.velocity.y = boostVel;
    this.jumpCooldown = this.JUMP_COOLDOWN_MS;

    // Intense squash/stretch for boost
    this.squash(0.5, 1.5, 150);

    // More particles for boost
    this.triggerBoostEffect();
  }

  // ─── Powerup Methods ─────────────────────────────────────────────────────────
  activateRocket(active: boolean): void {
    this.hasRocket = active;
    (this.body! as Phaser.Physics.Arcade.Body).setGravityY(
      active ? GRAVITY * 1.3 : GRAVITY
    );
  }

  activateShield(active: boolean): void {
    this.hasShield = active;
    if (active && !this.shieldGfx) {
      this.shieldGfx = this.scene.add.graphics();
      this.shieldGfx.setDepth(5);
    }
    if (!active && this.shieldGfx) {
      this.shieldGfx.clear();
    }
  }

  updateShieldVisual(): void {
    if (!this.shieldGfx || !this.hasShield) return;
    this.shieldGfx.clear();
    this.shieldGfx.lineStyle(3, 0x00d4ff, 0.8);
    this.shieldGfx.strokeEllipse(0, 0, 50, 40);
    this.shieldGfx.fillStyle(0x00d4ff, 0.15);
    this.shieldGfx.fillEllipse(0, 0, 50, 40);
    this.shieldGfx.setPosition(this.x, this.y);
    const pulse = Math.sin(this.scene.time.now / 150) * 0.1 + 1;
    this.shieldGfx.setScale(pulse);
  }

  hasActiveShield(): boolean { return this.hasShield; }
  hasActiveRocket(): boolean { return this.hasRocket; }
  hasActiveGun(): boolean { return this.hasGun; }
  getGunAmmo(): number { return this.gunAmmo; }

  // ─── Gun Methods ──────────────────────────────────────────────────────────────
  activateGun(active: boolean): void {
    this.hasGun = active;
    if (active) {
      this.gunAmmo = GUN.AMMO;
    }
  }

  private tryShoot(): void {
    if (!this.hasGun || this.gunAmmo <= 0) return;

    const now = this.scene.time.now;
    if (now - this.lastFireTime < GUN.FIRE_COOLDOWN) return;

    this.lastFireTime = now;
    this.gunAmmo--;

    // Create bullet
    const bullet = new Bullet(
      this.scene,
      this.x + this.lastDirection * 20,
      this.y,
      this.lastDirection
    );
    this.bullets.push(bullet);

    // Muzzle flash effect
    const flash = this.scene.add.circle(
      this.x + this.lastDirection * 20,
      this.y,
      8,
      0xfeca57
    );
    flash.setDepth(61);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 100,
      onComplete: () => flash.destroy(),
    });

    // Check if gun is empty
    if (this.gunAmmo <= 0) {
      this.hasGun = false;
    }
  }

  getBullets(): Bullet[] {
    return this.bullets;
  }

  destroyBullets(bulletsToDestroy: Bullet[]): void {
    bulletsToDestroy.forEach(bullet => {
      const index = this.bullets.indexOf(bullet);
      if (index > -1) {
        this.bullets.splice(index, 1);
      }
      bullet.destroy();
    });
  }

  // ─── Squash & Stretch ────────────────────────────────────────────────────────
  private squash(scaleX: number, scaleY: number, duration: number): void {
    if (this.isSquashing) return;
    
    this.isSquashing = true;
    this.setScale(this.baseScaleX * scaleX, this.baseScaleY * scaleY);

    // Recover to original scale
    this.scene.time.delayedCall(duration / 2, () => {
      this.setScale(this.baseScaleX * 1.1, this.baseScaleY * 0.9);
    });

    this.scene.time.delayedCall(duration, () => {
      this.setScale(this.baseScaleX, this.baseScaleY);
      this.isSquashing = false;
    });
  }

  // ─── Particle Effects ────────────────────────────────────────────────────────
  private triggerLandingEffect(): void {
    if (!this.landingParticles) {
      this.landingParticles = this.scene.add.particles(0, 0, 'particle_circle', {
        speed: { min: 30, max: ANIMATION.LAND_PARTICLE_SPEED },
        angle: { min: 160, max: 200 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 400,
        gravityY: 150,
        quantity: ANIMATION.LAND_PARTICLE_COUNT,
        tint: COLORS.platformNormal,
      });
    }

    this.landingParticles.setPosition(this.x, this.y + PLAYER_SIZE_H / 2);
    this.landingParticles.explode();
  }

  private triggerBoostEffect(): void {
    // Burst of purple particles
    const boostParticles = this.scene.add.particles(this.x, this.y, 'particle_star', {
      speed: { min: 50, max: 150 },
      angle: { min: 220, max: 320 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      gravityY: 200,
      quantity: ANIMATION.BOOST_PARTICLE_COUNT,
      tint: COLORS.platformBoost,
    });

    this.scene.time.delayedCall(600, () => boostParticles.destroy());
  }

  // ─── State Getters ───────────────────────────────────────────────────────────
  canJump(): boolean {
    return this.jumpCooldown <= 0;
  }

  isFalling(): boolean {
    return this.body!.velocity.y > 0;
  }

  getBottom(): number {
    return this.y + PLAYER_SIZE_H / 2;
  }

  getLeft(): number {
    return this.x - PLAYER_SIZE_W / 2 + 5;
  }

  getRight(): number {
    return this.x + PLAYER_SIZE_W / 2 - 5;
  }

  getTop(): number {
    return this.y - PLAYER_SIZE_H / 2;
  }
}
