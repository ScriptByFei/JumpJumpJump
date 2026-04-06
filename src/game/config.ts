// ═══════════════════════════════════════════════════════════════════════════════
// JumpJumpJump - Game Configuration
// Modern Mobile Vertical Jumper
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Game Dimensions ─────────────────────────────────────────────────────────
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 700;
export const DEVICE_PIXEL_RATIO = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

// ─── Player Physics ───────────────────────────────────────────────────────────
export const GRAVITY = 1000;              // Smooth gravity
export const PLAYER_JUMP_VELOCITY = -620;  // Jump height ~192px
export const PLAYER_MOVE_SPEED = 320;      // Responsive horizontal movement
export const PLAYER_MAX_FALL_SPEED = 800;  // Terminal velocity
export const PLAYER_SIZE_W = 32;
export const PLAYER_SIZE_H = 36;

// ─── Platform Settings ───────────────────────────────────────────────────────
export const PLATFORM_WIDTH = 70;
export const PLATFORM_HEIGHT = 14;
export const PLATFORM_VERTICAL_GAP_MIN = 55;  // Easy gaps at start
export const PLATFORM_VERTICAL_GAP_MAX = 95;
export const PLATFORM_SPAWN_AHEAD = 350;       // Generate platforms this far ahead
export const PLATFORM_REMOVE_BELOW = 300;       // Remove platforms this far below camera

// ─── Platform Types ───────────────────────────────────────────────────────────
export type PlatformType = 'normal' | 'moving' | 'breakable' | 'boost' | 'cloud';

export const PLATFORM_TYPES = {
  normal: {
    color: 0x4ecdc4,
    highlight: 0x7eddd6,
    glow: 0x4ecdc4,
  },
  moving: {
    color: 0xfeca57,
    highlight: 0xfff3cd,
    glow: 0xfeca57,
    speed: 100,
  },
  breakable: {
    color: 0xff6b6b,
    highlight: 0xff9999,
    glow: 0xff6b6b,
  },
  boost: {
    color: 0xa855f7,
    highlight: 0xc084fc,
    glow: 0xa855f7,
    boostMultiplier: 1.5,
  },
  cloud: {
    color: 0x94a3b8,
    highlight: 0xcbd5e1,
    glow: 0x94a3b8,
    fadeDelay: 800,
  },
};

// ─── Camera Settings ─────────────────────────────────────────────────────────
export const CAMERA_LERP_Y = 0.08;          // Smooth camera follow
export const CAMERA_DEADZONE_HEIGHT = 250;  // Player can fall this far below screen center
export const CAMERA_OFFSET_Y = -200;        // Player sits in lower third of screen

// ─── Difficulty Curve ────────────────────────────────────────────────────────
export const DIFFICULTY = {
  START_GAP_MIN: 50,
  START_GAP_MAX: 80,
  MAX_GAP_MIN: 75,
  MAX_GAP_MAX: 130,
  GAP_INCREASE_RATE: 0.002,  // Gap increases by this per height unit
  SPECIAL_PLATFORM_START: 200,  // Height where special platforms start appearing
  SPECIAL_PLATFORM_CHANCE_START: 0.15,
  SPECIAL_PLATFORM_CHANCE_MAX: 0.45,
  ENEMY_START_HEIGHT: 800,      // Height where enemies start spawning
  ENEMY_SPAWN_INTERVAL: 5000,   // Base interval between enemy spawns (ms)
  ENEMY_SPAWN_INTERVAL_MIN: 3000, // Minimum interval at max difficulty
};

// ─── Enemy Settings ─────────────────────────────────────────────────────────
export type EnemyType = 'ufo' | 'spike';

export const ENEMY = {
  UFO: {
    SIZE: 38,
    SPEED: 70,
    COLOR: 0xc4b5fd,
  },
  SPIKE: {
    SIZE: 26,
    FALL_SPEED: 100,
    COLOR: 0x2d1b4e,
  },
  SPAWN_CHANCE: 0.018,
};

// ─── Scoring ─────────────────────────────────────────────────────────────────
export const POINTS_PER_100PX = 10;
export const HIGHSCORE_KEY = 'jumpjumpjump-highscore';

// ─── Visual Settings ───────────────────────────────────────────────────────────
export const COLORS = {
  // Background gradient (dark space theme)
  background: 0x0f0f1a,
  backgroundGradientTop: 0x1a1a2e,
  backgroundStars: 0xffffff,

  // Player
  player: 0xe94560,
  playerHighlight: 0xff8a8a,
  playerEye: 0xffffff,

  // Platforms
  platformNormal: 0x4ecdc4,
  platformMoving: 0xfeca57,
  platformBreakable: 0xff6b6b,
  platformBoost: 0xa855f7,
  platformCloud: 0x94a3b8,

  // UI
  text: 0xffffff,
  textMuted: 0x8b90a5,
  textShadow: 0x000000,
  buttonBg: 0x4ecdc4,
  buttonHover: 0x3dbdb4,
  scoreText: 0xfeca57,
  highscoreText: 0xa855f7,

  // Effects
  particleNormal: 0x4ecdc4,
  particleBoost: 0xa855f7,
  particleBreak: 0xff6b6b,

  // Overlays
  overlayDark: 0x000000,
  overlayAlpha: 0.7,
  gameOverBg: 0x0a0a14,
};

// ─── Animation Settings ───────────────────────────────────────────────────────
export const ANIMATION = {
  // Squash & Stretch
  JUMP_SQUASH_X: 0.7,
  JUMP_SQUASH_Y: 1.3,
  LAND_SQUASH_X: 1.3,
  LAND_SQUASH_Y: 0.7,
  SQUASH_RECOVERY_TIME: 100,

  // Particles
  LAND_PARTICLE_COUNT: 8,
  LAND_PARTICLE_SPEED: 80,
  BREAK_PARTICLE_COUNT: 12,
  BOOST_PARTICLE_COUNT: 15,

  // Screen shake
  SHAKE_INTENSITY_SMALL: 3,
  SHAKE_INTENSITY_MEDIUM: 6,
  SHAKE_INTENSITY_LARGE: 10,
  SHAKE_DURATION: 100,

  // Platform animations
  FLOAT_AMPLITUDE: 4,
  FLOAT_SPEED: 1500,
  PULSE_SCALE: 0.05,
};

// ─── Touch Controls ───────────────────────────────────────────────────────────
export const TOUCH = {
  DEAD_ZONE: 20,        // Pixels from center to start moving
  EDGE_SENSITIVITY: 50, // Extra speed at screen edges
};

// ─── Powerups ──────────────────────────────────────────────────────────────────
export type PowerupType = 'shield' | 'magnet' | 'rocket' | 'double';

export const POWERUP = {
  SPAWN_CHANCE: 0.03,
  MIN_HEIGHT: 500,
  SIZE: 28,
  FALL_SPEED: 60,
  DURATION: {
    shield: 5000,
    magnet: 8000,
    rocket: 10000,
    double: 15000,
  },
};

export const POWERUP_TYPES = {
  shield: { color: 0x00d4ff, symbol: 'S' },
  magnet: { color: 0xff4081, symbol: 'M' },
  rocket: { color: 0xff6b35, symbol: 'R' },
  double: { color: 0xffd700, symbol: '2x' },
};

// ─── Safe Area (will be calculated at runtime) ───────────────────────────────
export let SAFE_AREA = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

export function calculateSafeArea(): void {
  if (typeof document !== 'undefined') {
    const style = getComputedStyle(document.documentElement);
    SAFE_AREA = {
      top: parseInt(style.getPropertyValue('--sat') || '0') || 
            parseInt(style.getPropertyValue('padding-top') || '0'),
      bottom: parseInt(style.getPropertyValue('--sab') || '0') ||
              parseInt(style.getPropertyValue('padding-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--sal') || '0'),
      right: parseInt(style.getPropertyValue('--sar') || '0'),
    };
  }
}
