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

    const container = this.scene.add.container(400, 150);
    container.setDepth(1001);

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.95);
    bg.fillRoundedRect(-140, -30, 280, 60, 12);
    bg.lineStyle(2, achievement.color, 0.8);
    bg.strokeRoundedRect(-140, -30, 280, 60, 12);
    container.add(bg);

    // Icon
    const icon = this.scene.add.text(-110, 0, achievement.icon, {
      fontSize: '24px',
    }).setOrigin(0.5);
    container.add(icon);

    // Title
    const title = this.scene.add.text(-70, -12, 'Achievement!', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#8b90a5',
    });
    container.add(title);

    // Name
    const name = this.scene.add.text(-70, 2, achievement.name, {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    container.add(name);

    // Add to container
    this.notificationContainer.add(container);

    // Animation: slide in from right, hold, slide out
    container.setX(550);
    container.setAlpha(0);

    this.scene.tweens.add({
      targets: container,
      x: 400,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold for 2 seconds
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: container,
            x: -150,
            alpha: 0,
            duration: 300,
            ease: 'Back.easeIn',
            onComplete: () => container.destroy(),
          });
        });
      },
    });

    // Celebration particles
    this.spawnCelebrationParticles(container.x, container.y, achievement.color);
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
