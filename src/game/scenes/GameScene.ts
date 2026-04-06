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
  POWERUP,
  POWERUP_TYPES,
  PowerupType,
  ENEMY,
  EnemyType,
  BIOMES,
  getBiomeForHeight,
  Biome,
} from '../config';
import { Player } from '../objects/Player';
import { Platform } from '../objects/Platform';
import { Powerup } from '../objects/Powerup';
import { Enemy } from '../objects/Enemy';
import { AchievementManager } from '../systems/AchievementManager';

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
  private gameOverCount: number = 0;
  private startY: number = 0;
  private maxHeight: number = 0;

  // Powerups
  private powerups: Powerup[] = [];
  private activePowerups: Set<PowerupType> = new Set();
  private powerupTimers: Map<PowerupType, number> = new Map();
  private activePowerupIndicators: Phaser.GameObjects.Container[] = [];

  // Enemies
  private enemies: Enemy[] = [];
  private lastEnemySpawn: number = 0;
  private enemySpawnInterval: number = DIFFICULTY.ENEMY_SPAWN_INTERVAL;

  // Combo system
  private combo: number = 0;
  private comboMultiplier: number = 1;
  private totalJumps: number = 0;
  private lastLandTime: number = 0;
  private comboTimeout: number = 2000; // ms to maintain combo

  // Camera
  private cameraShakeTween?: Phaser.Tweens.Tween;
  // Background elements
  private stars: Phaser.GameObjects.Star[] = [];
  private bgGradient!: Phaser.GameObjects.Graphics;
  private ambientParticles: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private currentBiome: Biome = BIOMES[0];
  private lastBiomeId: string = 'space';

  // Sound
  private soundManager = new SoundManager();
  private achievementManager!: AchievementManager;

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
    this.totalJumps = 0;

    // Reset powerups
    this.powerups.forEach(p => p.destroy());
    this.powerups = [];
    this.activePowerups.clear();
    this.clearPowerupTimers();
    this.clearPowerupIndicators();

    // Reset enemies
    this.enemies.forEach(e => e.destroy());
    this.enemies = [];
    this.lastEnemySpawn = 0;
    this.enemySpawnInterval = DIFFICULTY.ENEMY_SPAWN_INTERVAL;

    // Load high score
    this.highScore = parseInt(localStorage.getItem(HIGHSCORE_KEY) || '0');

    // Initialize achievement manager
    this.achievementManager = new AchievementManager(this);

    // Dispatch initial HUD values to HTML overlay
    window.dispatchEvent(new CustomEvent('updateHUD', {
      detail: { 
        score: 0,
        height: 0,
        combo: 0,
        best: this.highScore
      }
    }));
    
    // Show HUD when game starts
    const gameHud = document.getElementById('game-hud');
    if (gameHud) gameHud.style.display = 'block';

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

    // Parallax stars - reduced count for faster mobile startup
    for (let i = 0; i < 30; i++) {
      const star = this.add.star(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(-5000, GAME_HEIGHT),
        Phaser.Math.Between(3, 5),
        1,
        2,
        this.currentBiome.starColor
      );
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 1));
      star.setScale(Phaser.Math.FloatBetween(0.2, 1));
      star.setDepth(-50);
      this.stars.push(star);
    }

    // Ambient particles for current biome
    this.createAmbientParticles();
  }

  private createAmbientParticles(): void {
    // Remove old particles
    this.ambientParticles.forEach(p => p.destroy());
    this.ambientParticles = [];

    const texture = this.currentBiome.particleType === 'star' ? 'particle_star' : 'particle_circle';

    // Create ambient particles that float around
    const emitter = this.add.particles(0, 0, texture, {
      x: { min: 0, max: GAME_WIDTH },
      y: { min: -5000, max: GAME_HEIGHT },
      scale: { start: 0.15, end: 0.05 },
      alpha: { start: 0.4, end: 0 },
      tint: this.currentBiome.particleColor,
      speed: { min: 5, max: 25 },
      angle: { min: 80, max: 100 },
      frequency: 200,
      lifespan: 4000,
      quantity: 1,
    });
    emitter.setDepth(-40);
    this.ambientParticles.push(emitter);
  }

  private updateBackgroundGradient(height: number): void {
    // Check for biome transition
    const newBiome = getBiomeForHeight(height);
    
    if (newBiome.id !== this.lastBiomeId) {
      this.triggerBiomeTransition(newBiome);
    }

    // Use current biome colors with smooth blend based on progress within biome
    const biomeIndex = BIOMES.indexOf(newBiome);
    const nextBiome = BIOMES[biomeIndex + 1];
    
    let topColor: number;
    let botColor: number;
    
    if (nextBiome) {
      const biomeRange = nextBiome.threshold - newBiome.threshold;
      const progressInBiome = Math.min((height - newBiome.threshold) / biomeRange, 1);
      
      // Blend toward next biome colors
      const blendFactor = Math.pow(progressInBiome, 0.5); // Ease-in for smoother transition
      
      const topColorObj = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(newBiome.topColor),
        Phaser.Display.Color.ValueToColor(nextBiome.topColor),
        100,
        blendFactor
      );
      const botColorObj = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(newBiome.bottomColor),
        Phaser.Display.Color.ValueToColor(nextBiome.bottomColor),
        100,
        blendFactor
      );
      topColor = Phaser.Display.Color.GetColor(topColorObj.r, topColorObj.g, topColorObj.b);
      botColor = Phaser.Display.Color.GetColor(botColorObj.r, botColorObj.g, botColorObj.b);
    } else {
      // At max biome, use its colors
      topColor = newBiome.topColor;
      botColor = newBiome.bottomColor;
    }
    
    this.bgGradient.clear();
    this.bgGradient.fillGradientStyle(topColor, topColor, botColor, botColor, 1);
    this.bgGradient.fillRect(0, -10000, GAME_WIDTH, 20000);
  }

  private triggerBiomeTransition(newBiome: Biome): void {
    this.lastBiomeId = newBiome.id;
    this.currentBiome = newBiome;

    // Update star colors
    this.stars.forEach(star => {
      this.tweens.add({
        targets: star,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          star.setFillStyle(newBiome.starColor);
          this.tweens.add({
            targets: star,
            alpha: Phaser.Math.FloatBetween(0.3, 1),
            duration: 300,
          });
        },
      });
    });

    // Recreate ambient particles for new biome
    this.createAmbientParticles();

    // Flash effect for biome transition
    const r = (newBiome.topColor >> 16) & 0xff;
    const g = (newBiome.topColor >> 8) & 0xff;
    const b = newBiome.topColor & 0xff;
    this.cameras.main.flash(400, r, g, b, true);

    // Show biome name
    this.showBiomeName(newBiome.name);
  }

  private showBiomeName(name: string): void {
    const text = this.add.text(GAME_WIDTH / 2, this.cameras.main.scrollY - 50, name, {
      fontSize: '28px',
      fontFamily: 'Arial Black, Arial, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(500).setAlpha(0);

    // Big entrance with scale
    this.tweens.add({
      targets: text,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: text,
          scale: 1,
          duration: 100,
        });
      },
    });

    // Fade out after 1.5s
    this.tweens.add({
      targets: text,
      alpha: 0,
      y: text.y - 30,
      delay: 1500,
      duration: 500,
      onComplete: () => text.destroy(),
    });
  }

  // ─── UI ─────────────────────────────────────────────────────────────────────
  // Note: Score, combo, and best score are now handled by HTML HUD (index.html)
  // This method only creates the touch hint
  private createUI(): void {
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

  // ─── Platforms ───────────────────────────────────────────────────────────────
  private createInitialPlatforms(): void {
    // Starting platform (always normal, centered)
    this.createPlatform(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'normal');

    // Generate initial platforms going up - reduced count for faster startup
    let y = GAME_HEIGHT - 130;
    for (let i = 0; i < 8; i++) { // Reduced from 15
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

    // Spawn powerup?
    const height = this.startY - y;
    if (height > POWERUP.MIN_HEIGHT && Math.random() < POWERUP.SPAWN_CHANCE) {
      const types: PowerupType[] = ['shield', 'magnet', 'rocket', 'double', 'gun'];
      const pType = types[Math.floor(Math.random() * types.length)];
      this.powerups.push(new Powerup(this, x, y - 40, pType));
    }

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

  // ─── Update ─────────────────────────────────────────────────────────────────
  update(_time: number, _delta: number): void {
    // Update player
    if (this.player) {
      this.player.update(_time, _delta);
    }

    // Skip game logic if game over
    if (this.isGameOver) return;

    // Update platforms
    this.platforms.forEach(p => p.update(_delta));

    // Update powerups
    this.updatePowerups(_delta);

    // Collision detection
    this.checkCollisions();

    // Check powerup collection
    this.checkPowerupCollection();

    // Update enemies
    this.updateEnemies(_delta);

    // Check enemy collisions
    this.checkEnemyCollisions();

    // Check game over
    this.checkGameOver();

    // Update score
    this.updateScore();

    // Platform management
    this.managePlatforms();

    // Parallax stars
    this.updateStars();

    // Update combo timeout
    this.checkComboTimeout(_time);

    // Update background only when height changes significantly (performance)
    if (Math.abs(this.maxHeight - this.lastGradientHeight) > 100) {
      this.updateBackgroundGradient(this.maxHeight);
      this.lastGradientHeight = this.maxHeight;
    }
  }

  // ─── Collision ──────────────────────────────────────────────────────────────
  private lastPlatformY: number = 0;
  private lastGradientHeight: number = 0;

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
      // Combo display handled by HTML HUD
    }
    this.lastLandTime = currentTime;

    // Update combo display (HTML HUD)
    window.dispatchEvent(new CustomEvent('updateHUD', {
      detail: { combo: this.combo }
    }));

    // Track achievements for jumps and combo
    this.totalJumps++;
    if (this.achievementManager) {
      this.achievementManager.trackJump(this.totalJumps);
      this.achievementManager.trackCombo(this.combo);
    }

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

  private checkComboTimeout(_time: number): void {
    if (this.combo > 0 && this.time.now - this.lastLandTime > this.comboTimeout) {
      this.combo = 0;
      this.comboMultiplier = 1;
      // Combo display handled by HTML HUD
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

    // Track game over achievement
    this.gameOverCount++;
    if (this.achievementManager) {
      this.achievementManager.trackGameOver(this.gameOverCount);
    }

    // Hide HTML pause overlay and HUD when game ends
    const pauseOverlay = document.getElementById('pause-overlay');
    const gameHud = document.getElementById('game-hud');
    if (pauseOverlay) pauseOverlay.style.display = 'none';
    if (gameHud) gameHud.style.display = 'none';

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
      // Track height achievements
      if (this.achievementManager) {
        this.achievementManager.trackHeight(this.maxHeight);
      }
    }

    let newScore = Math.floor((this.maxHeight / 10) * this.comboMultiplier);

    // Double powerup
    if (this.activePowerups.has('double')) {
      newScore *= 2;
    }

    if (newScore !== this.score) {
      const oldScore = this.score;
      this.score = newScore;

      // Update HTML HUD
      window.dispatchEvent(new CustomEvent('updateHUD', {
        detail: { 
          score: this.score,
          height: Math.floor(this.maxHeight / 10)
        }
      }));

      // Milestone celebration every 1000 points
      if (this.score > 0 && Math.floor(this.score / 1000) > Math.floor(oldScore / 1000)) {
        this.celebrateMilestone(this.score);
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

    // Remove dead (broken/faded) and off-screen platforms in one pass
    this.platforms = this.platforms.filter(platform => {
      // Destroy platforms below camera or that are dead
      if (platform.y > removeThreshold || !platform.alive) {
        platform.destroy();
        return false;
      }
      return true;
    });
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

  // ─── Powerup Methods ─────────────────────────────────────────────────────────
  private updatePowerups(_delta: number): void {
    for (const powerup of this.powerups) {
      powerup.update(this.time.now, _delta);
      powerup.y += POWERUP.FALL_SPEED * (_delta / 1000);
    }

    const cameraBottom = this.cameras.main.scrollY + GAME_HEIGHT;
    this.powerups = this.powerups.filter(p => {
      if (p.y > cameraBottom + 100) {
        p.destroy();
        return false;
      }
      return true;
    });

    this.updateActivePowerups();
  }

  private checkPowerupCollection(): void {
    if (!this.player.isFalling()) return;

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      const bounds = powerup.getCollectionBounds();

      if (this.player.getRight() > bounds.left && this.player.getLeft() < bounds.right &&
          this.player.getBottom() > bounds.top && this.player.getTop() < bounds.bottom) {
        this.collectPowerup(powerup, i);
      }
    }
  }

  private collectPowerup(powerup: Powerup, index: number): void {
    powerup.collect();
    this.powerups.splice(index, 1);
    const type = powerup.powerupType;

    // Track powerup achievement
    if (this.achievementManager) {
      this.achievementManager.trackPowerup(type);
    }

    this.activatePowerup(type);
    this.showPowerupEffect(powerup.x, powerup.y, type);

    const config = POWERUP_TYPES[type];
    const text = this.add.text(powerup.x, powerup.y, `+${type.toUpperCase()}!`, {
      fontSize: '18px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#' + config.color.toString(16).padStart(6, '0'),
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: text,
      y: text.y - 50,
      alpha: 0,
      duration: 600,
      onComplete: () => text.destroy(),
    });
  }

  private activatePowerup(type: PowerupType): void {
    if (this.powerupTimers.has(type)) {
      clearTimeout(this.powerupTimers.get(type) as unknown as number);
    }

    this.activePowerups.add(type);

    switch (type) {
      case 'rocket': this.player.activateRocket(true); break;
      case 'shield': this.player.activateShield(true); break;
      case 'gun': this.player.activateGun(true); break;
    }

    this.createPowerupIndicator(type);

    const duration = POWERUP.DURATION[type];
    const timerId = setTimeout(() => this.deactivatePowerup(type), duration) as unknown as number;
    this.powerupTimers.set(type, timerId);
  }

  private deactivatePowerup(type: PowerupType): void {
    this.activePowerups.delete(type);
    this.powerupTimers.delete(type);

    switch (type) {
      case 'rocket': this.player.activateRocket(false); break;
      case 'shield': this.player.activateShield(false); break;
      case 'gun': this.player.activateGun(false); break;
    }

    this.removePowerupIndicator(type);
  }

  private updateActivePowerups(): void {
    if (!this.activePowerups.has('magnet')) return;

    for (const platform of this.platforms) {
      if (!platform.alive) continue;

      const dx = platform.x - this.player.x;
      const dy = platform.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 150 && dist > 0) {
        const force = (1 - dist / 150) * 30;
        this.player.body!.velocity.x += (dx / dist) * force;
      }
    }

    const maxVel = 400;
    if (Math.abs(this.player.body!.velocity.x) > maxVel) {
      this.player.body!.velocity.x = Math.sign(this.player.body!.velocity.x) * maxVel;
    }
  }

  private createPowerupIndicator(type: PowerupType): void {
    const safeTop = this.getSafeAreaTop();
    const y = safeTop + 90 + this.activePowerupIndicators.length * 28;
    const config = POWERUP_TYPES[type];

    const container = this.add.container(GAME_WIDTH - 30, y);

    const bg = this.add.circle(0, 0, 11, config.color, 0.9);
    container.add(bg);

    const symbols: Record<PowerupType, string> = {
      shield: 'S', magnet: 'M', rocket: 'R', double: '2x', gun: 'G'
    };
    const symbol = this.add.text(0, 0, symbols[type], {
      fontSize: '10px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(symbol);

    this.tweens.add({
      targets: container,
      scale: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    container.setDepth(1000);
    this.activePowerupIndicators.push(container);
  }

  private removePowerupIndicator(type: PowerupType): void {
    const typeIndex = [...this.activePowerups].indexOf(type);
    const visualIndex = this.activePowerupIndicators.length - typeIndex - 1;

    if (visualIndex >= 0 && visualIndex < this.activePowerupIndicators.length) {
      const indicator = this.activePowerupIndicators[visualIndex];
      this.tweens.killTweensOf(indicator);
      indicator.destroy();
      this.activePowerupIndicators.splice(visualIndex, 1);

      const safeTop = this.getSafeAreaTop();
      this.activePowerupIndicators.forEach((ind, i) => {
        ind.y = safeTop + 90 + i * 28;
      });
    }
  }

  private clearPowerupIndicators(): void {
    for (const indicator of this.activePowerupIndicators) {
      this.tweens.killTweensOf(indicator);
      indicator.destroy();
    }
    this.activePowerupIndicators = [];
  }

  private clearPowerupTimers(): void {
    for (const timer of this.powerupTimers.values()) {
      clearTimeout(timer);
    }
    this.powerupTimers.clear();
  }

  private showPowerupEffect(_x: number, _y: number, type: PowerupType): void {
    const colors: Record<PowerupType, number> = {
      shield: 0x00d4ff, magnet: 0xff4081, rocket: 0xff6b35, double: 0xffd700, gun: 0xfeca57
    };
    const color = colors[type];
    this.cameras.main.flash(100, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff, true);
  }

  private getSafeAreaTop(): number {
    const style = getComputedStyle(document.documentElement);
    const sat = style.getPropertyValue('--sat').trim();
    return sat ? parseInt(sat) : 44;
  }

  // ─── Enemy Methods ───────────────────────────────────────────────────────────
  private updateEnemies(_delta: number): void {
    const height = this.startY - this.player.y;

    // Spawn enemies after certain height
    if (height > DIFFICULTY.ENEMY_START_HEIGHT && this.time.now - this.lastEnemySpawn > this.enemySpawnInterval) {
      if (Math.random() < ENEMY.SPAWN_CHANCE) {
        this.spawnEnemy();
        this.lastEnemySpawn = this.time.now;

        // Decrease spawn interval over time (increase difficulty)
        const progress = Math.min(height / 15000, 1);
        this.enemySpawnInterval = Phaser.Math.Linear(
          DIFFICULTY.ENEMY_SPAWN_INTERVAL,
          DIFFICULTY.ENEMY_SPAWN_INTERVAL_MIN,
          progress
        );
      }
    }

    // Update each enemy
    for (const enemy of this.enemies) {
      enemy.update(this.time.now, _delta);
    }

    // Remove enemies that are off screen
    const cameraTop = this.cameras.main.scrollY;
    const cameraBottom = cameraTop + GAME_HEIGHT;

    this.enemies = this.enemies.filter(enemy => {
      // UFO: remove if off left/right
      if (enemy.enemyType === 'ufo') {
        if (enemy.x < -50 || enemy.x > GAME_WIDTH + 50) {
          enemy.destroy();
          return false;
        }
      }
      // Spike: remove if below camera
      if (enemy.enemyType === 'spike') {
        if (enemy.y > cameraBottom + 100) {
          enemy.destroy();
          return false;
        }
      }
      return true;
    });
  }

  private spawnEnemy(): void {
    const types: EnemyType[] = ['ufo', 'spike'];
    const type = types[Math.floor(Math.random() * types.length)];

    let x: number, y: number;

    if (type === 'ufo') {
      // Spawn at left or right edge, random Y above camera
      x = Math.random() > 0.5 ? -30 : GAME_WIDTH + 30;
      y = this.cameras.main.scrollY - 50 - Math.random() * 100;
    } else {
      // Spike: spawn above camera, random X
      x = Phaser.Math.Between(50, GAME_WIDTH - 50);
      y = this.cameras.main.scrollY - 100;
    }

    const enemy = new Enemy(this, x, y, type);
    this.enemies.push(enemy);
  }

  private checkEnemyCollisions(): void {
    if (!this.player.isFalling()) return;

    const playerLeft = this.player.getLeft();
    const playerRight = this.player.getRight();
    const playerTop = this.player.getTop();
    const playerBottom = this.player.getBottom();

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const bounds = enemy.getCollisionBounds();

      // Check collision
      if (playerRight > bounds.left && playerLeft < bounds.right &&
          playerBottom > bounds.top && playerTop < bounds.bottom) {

        // Bounce off enemy — no matter where you hit from
        if (!this.activePowerups.has('shield')) {
          // Bounce off enemy!
          this.player.bounceOffEnemy();
          this.soundManager.playBoost();
          this.showBounceOffEnemyEffect(enemy);
          enemy.destroy();
          this.enemies.splice(i, 1);
          continue;
        }

        // Shield protects from enemy
        if (this.activePowerups.has('shield')) {
          this.showShieldHitEffect(enemy);
          enemy.destroy();
          this.enemies.splice(i, 1);
        } else {
          this.triggerGameOver();
          return;
        }
      }
    }

    // Check bullet-enemy collisions
    this.checkBulletCollisions();
  }

  private checkBulletCollisions(): void {
    const bullets = this.player.getBullets();
    const bulletsToDestroy: any[] = [];

    for (const bullet of bullets) {
      const bulletBounds = {
        left: bullet.x - 4,
        right: bullet.x + 4,
        top: bullet.y - 4,
        bottom: bullet.y + 4,
      };

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        const enemyBounds = enemy.getCollisionBounds();

        if (bulletBounds.right > enemyBounds.left && bulletBounds.left < enemyBounds.right &&
            bulletBounds.bottom > enemyBounds.top && bulletBounds.top < enemyBounds.bottom) {

          // Enemy destroyed!
          this.showEnemyDestroyEffect(enemy);
          enemy.destroy();
          this.enemies.splice(i, 1);
          bulletsToDestroy.push(bullet);

          // Small screen shake
          this.cameras.main.shake(100, 0.005);
          break;
        }
      }
    }

    if (bulletsToDestroy.length > 0) {
      this.player.destroyBullets(bulletsToDestroy);
    }
  }

  private showEnemyDestroyEffect(enemy: Enemy): void {
    const color = enemy.enemyType === 'ufo' ? ENEMY.UFO.COLOR : ENEMY.SPIKE.COLOR;

    // Explosion particles
    for (let j = 0; j < 15; j++) {
      const angle = (j / 15) * Math.PI * 2;
      const particle = this.add.circle(
        enemy.x + Math.cos(angle) * 10,
        enemy.y + Math.sin(angle) * 10,
        5,
        color
      );
      particle.setDepth(100);

      this.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * 50,
        y: particle.y + Math.sin(angle) * 50,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private showShieldHitEffect(enemy: Enemy): void {
    // Flash effect
    this.cameras.main.flash(100, 0, 229, 255, true);

    // Particle burst
    const color = enemy.enemyType === 'ufo' ? ENEMY.UFO.COLOR : ENEMY.SPIKE.COLOR;
    for (let j = 0; j < 10; j++) {
      const angle = (j / 10) * Math.PI * 2;
      const particle = this.add.circle(
        enemy.x + Math.cos(angle) * 20,
        enemy.y + Math.sin(angle) * 20,
        5,
        color
      );
      particle.setDepth(100);

      this.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * 60,
        y: particle.y + Math.sin(angle) * 60,
        alpha: 0,
        scale: 0,
        duration: 400,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private showBounceOffEnemyEffect(enemy: Enemy): void {
    // Cyan/white burst effect
    const r = (this.currentBiome.particleColor >> 16) & 0xff;
    const g = (this.currentBiome.particleColor >> 8) & 0xff;
    const b = this.currentBiome.particleColor & 0xff;
    this.cameras.main.flash(100, r, g, b, true);

    // Ring effect expanding outward
    const ring = this.add.circle(enemy.x, enemy.y, 10, 0x00ffff, 0.6);
    ring.setDepth(100);
    this.tweens.add({
      targets: ring,
      scale: 4,
      alpha: 0,
      duration: 300,
      onComplete: () => ring.destroy(),
    });

    // Particle burst
    for (let j = 0; j < 12; j++) {
      const angle = (j / 12) * Math.PI * 2;
      const particle = this.add.circle(
        enemy.x + Math.cos(angle) * 15,
        enemy.y + Math.sin(angle) * 15,
        Phaser.Math.Between(3, 6),
        0x00ffff
      );
      particle.setDepth(100);

      this.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * 50,
        y: particle.y + Math.sin(angle) * 50,
        alpha: 0,
        scale: 0,
        duration: 400,
        onComplete: () => particle.destroy(),
      });
    }
  }
}
