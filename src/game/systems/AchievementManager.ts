import Phaser from 'phaser';
import { AchievementId, ACHIEVEMENTS, ACHIEVEMENTS_KEY } from '../config';

// ═══════════════════════════════════════════════════════════════════════════════
// Achievement Manager - Tracks and displays achievements
// ═══════════════════════════════════════════════════════════════════════════════
export class AchievementManager {
  private scene: Phaser.Scene;
  private earned: Set<AchievementId> = new Set();
  private powerupsUsed: Set<string> = new Set();
  private notificationContainer?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Load saved achievements
    this.loadAchievements();

    // Create notification container
    this.createNotificationContainer();
  }

  private loadAchievements(): void {
    try {
      const saved = localStorage.getItem(ACHIEVEMENTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.earned = new Set(parsed.earned || []);
        this.powerupsUsed = new Set(parsed.powerupsUsed || []);
      }
    } catch (e) {
      console.log('Failed to load achievements');
    }
  }

  private saveAchievements(): void {
    try {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify({
        earned: Array.from(this.earned),
        powerupsUsed: Array.from(this.powerupsUsed),
      }));
    } catch (e) {
      console.log('Failed to save achievements');
    }
  }

  private createNotificationContainer(): void {
    this.notificationContainer = this.scene.add.container(0, 0);
    this.notificationContainer.setDepth(1000);
    this.notificationContainer.setScrollFactor(0);
  }

  // ─── Track Stats ─────────────────────────────────────────────────────────────

  trackJump(jumpCount: number): void {
    // First jump
    this.checkAndAward('first_jump');

    // Jump milestones
    if (jumpCount >= 50) this.checkAndAward('jump_50');
    if (jumpCount >= 100) this.checkAndAward('jump_100');
    if (jumpCount >= 500) this.checkAndAward('jump_500');
  }

  trackHeight(maxHeight: number): void {
    if (maxHeight >= 1000) this.checkAndAward('height_1000');
    if (maxHeight >= 5000) this.checkAndAward('height_5000');
    if (maxHeight >= 10000) this.checkAndAward('height_10000');
  }

  trackCombo(combo: number): void {
    if (combo >= 5) this.checkAndAward('combo_5');
    if (combo >= 10) this.checkAndAward('combo_10');
    if (combo >= 20) this.checkAndAward('combo_20');
  }

  trackPowerup(type: string): void {
    this.powerupsUsed.add(type);
    this.checkAndAward('powerup_first');

    // Check if all powerups used
    if (this.powerupsUsed.has('shield') &&
        this.powerupsUsed.has('magnet') &&
        this.powerupsUsed.has('rocket') &&
        this.powerupsUsed.has('double')) {
      this.checkAndAward('powerup_all');
    }
  }

  trackGameOver(gameOverCount: number): void {
    if (gameOverCount >= 5) this.checkAndAward('game_over_5');
    if (gameOverCount >= 20) this.checkAndAward('game_over_20');
  }

  // ─── Award Achievement ───────────────────────────────────────────────────────

  private checkAndAward(id: AchievementId): void {
    if (this.earned.has(id)) return; // Already earned

    this.earned.add(id);
    this.saveAchievements();
    this.showNotification(ACHIEVEMENTS[id]);
  }

  private showNotification(achievement: typeof ACHIEVEMENTS[keyof typeof ACHIEVEMENTS]): void {
    if (!this.notificationContainer) return;

    const centerX = 200; // Center of GAME_WIDTH (400)
    const y = 80;
    const notifWidth = 220;
    const notifHeight = 50;
    const halfW = notifWidth / 2;

    const container = this.scene.add.container(centerX, y);
    container.setDepth(1001);

    // Background with gradient effect
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-halfW, -notifHeight/2, notifWidth, notifHeight, 10);
    bg.lineStyle(2, achievement.color, 0.8);
    bg.strokeRoundedRect(-halfW, -notifHeight/2, notifWidth, notifHeight, 10);
    container.add(bg);

    // Icon (left side)
    const icon = this.scene.add.text(-halfW + 20, 0, achievement.icon, {
      fontSize: '20px',
    }).setOrigin(0.5);
    container.add(icon);

    // Title + Name (right side)
    const textX = -halfW + 50;
    const title = this.scene.add.text(textX, -8, 'Achievement!', {
      fontSize: '10px',
      fontFamily: 'Arial, sans-serif',
      color: '#8b90a5',
    }).setOrigin(0, 0.5);
    container.add(title);

    const name = this.scene.add.text(textX, 8, achievement.name, {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    container.add(name);

    // Add to container
    this.notificationContainer.add(container);

    // Animation: slide in from right, hold, slide out
    container.setX(centerX + halfW + 50);
    container.setAlpha(0);

    this.scene.tweens.add({
      targets: container,
      x: centerX,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold for 2 seconds
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: container,
            x: -halfW - 50,
            alpha: 0,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => container.destroy(),
          });
        });
      },
    });

    // Celebration particles
    this.spawnCelebrationParticles(centerX, y, achievement.color);
  }

  private spawnCelebrationParticles(x: number, y: number, color: number): void {
    for (let i = 0; i < 20; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 3);
      particle.setPosition(x, y);
      particle.setDepth(999);

      const angle = (i / 20) * Math.PI * 2;
      const distance = Phaser.Math.Between(50, 100);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 600,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  // ─── Getters ─────────────────────────────────────────────────────────────────

  hasAchievement(id: AchievementId): boolean {
    return this.earned.has(id);
  }

  getEarnedCount(): number {
    return this.earned.size;
  }

  getTotalCount(): number {
    return Object.keys(ACHIEVEMENTS).length;
  }

  getAllEarned(): AchievementId[] {
    return Array.from(this.earned);
  }

  // ─── Reset (for testing) ─────────────────────────────────────────────────────

  resetAll(): void {
    this.earned.clear();
    this.powerupsUsed.clear();
    this.saveAchievements();
  }
}
