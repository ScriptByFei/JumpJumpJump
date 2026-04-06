import Phaser from 'phaser';
import { COLORS } from '../config';

// ═══════════════════════════════════════════════════════════════════════════════
// Boot Scene - Creates all game textures programmatically with loading screen
// ═══════════════════════════════════════════════════════════════════════════════
export class BootScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private progress: number = 0;
  private totalSteps: number = 8;
  private currentStep: number = 0;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading UI
    this.createLoadingUI();
  }

  private createLoadingUI(): void {
    // Dark background
    this.cameras.main.setBackgroundColor(0x0f0f1a);

    // Loading bar background
    const barWidth = 200;
    const barHeight = 12;
    const barX = 400 / 2 - barWidth / 2;
    const barY = 700 / 2 + 50;

    this.loadingBar = this.add.graphics();
    this.loadingBar.fillStyle(0x2a2a3e, 1);
    this.loadingBar.fillRoundedRect(barX, barY, barWidth, barHeight, 6);

    // Loading text
    this.loadingText = this.add.text(400 / 2, barY - 30, 'Loading...', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#8b90a5',
    }).setOrigin(0.5);

    // Title
    this.add.text(400 / 2, 700 / 2 - 50, 'JumpJumpJump', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#4ecdc4',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private updateLoadingBar(): void {
    this.currentStep++;
    this.progress = this.currentStep / this.totalSteps;

    const barWidth = 200;
    const barHeight = 12;
    const barX = 400 / 2 - barWidth / 2;
    const barY = 700 / 2 + 50;

    this.loadingBar.clear();
    this.loadingBar.fillStyle(0x2a2a3e, 1);
    this.loadingBar.fillRoundedRect(barX, barY, barWidth, barHeight, 6);

    this.loadingBar.fillStyle(0x4ecdc4, 1);
    this.loadingBar.fillRoundedRect(barX, barY, barWidth * this.progress, barHeight, 6);
  }

  private scheduleNextStep(fn: () => void): void {
    // Use requestAnimationFrame to give iOS time to render
    this.time.delayedCall(16, fn); // ~1 frame at 60fps
  }

  create(): void {
    // Stagger texture creation to avoid frame drops on mobile
    this.scheduleNextStep(() => {
      this.createPlayerTexture();
      this.updateLoadingBar();

      this.scheduleNextStep(() => {
        this.createPlatformNormal();
        this.updateLoadingBar();

        this.scheduleNextStep(() => {
          this.createPlatformMoving();
          this.updateLoadingBar();

          this.scheduleNextStep(() => {
            this.createPlatformBreakable();
            this.updateLoadingBar();

            this.scheduleNextStep(() => {
              this.createPlatformBoost();
              this.updateLoadingBar();

              this.scheduleNextStep(() => {
                this.createPlatformCloud();
                this.updateLoadingBar();

                this.scheduleNextStep(() => {
                  this.createParticleTextures();
                  this.updateLoadingBar();

                  this.scheduleNextStep(() => {
                    this.createButtonTextures();
                    this.updateLoadingBar();

                    // Small delay then start game
                    this.loadingText.setText('Ready!');
                    this.time.delayedCall(200, () => {
                      this.scene.start('GameScene');
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  // ─── Player Texture ──────────────────────────────────────────────────────────
  private createPlayerTexture(): void {
    const g = this.add.graphics();
    const size = 44; // Slightly larger for detail

    // Shadow/glow under player
    g.fillStyle(COLORS.player, 0.3);
    g.fillEllipse(size / 2, size - 4, 24, 8);

    // Body (rounded rectangle with gradient effect)
    g.fillStyle(COLORS.player, 1);
    g.fillRoundedRect(6, 8, 32, 28, 10);

    // Body highlight
    g.fillStyle(COLORS.playerHighlight, 0.4);
    g.fillRoundedRect(10, 12, 12, 10, 5);

    // Eyes (white circles with pupils)
    g.fillStyle(COLORS.playerEye, 1);
    g.fillCircle(14, 20, 5);
    g.fillCircle(30, 20, 5);

    // Pupils (looking slightly up)
    g.fillStyle(0x1a1a2e, 1);
    g.fillCircle(14, 19, 2.5);
    g.fillCircle(30, 19, 2.5);

    // Eye shine
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(12, 18, 1.5);
    g.fillCircle(28, 18, 1.5);

    // Cheeks (blush)
    g.fillStyle(0xff8a8a, 0.3);
    g.fillCircle(8, 26, 3);
    g.fillCircle(36, 26, 3);

    g.generateTexture('player', size, size);
    g.destroy();
  }

  // ─── Platform Textures ──────────────────────────────────────────────────────
  private createPlatformNormal(): void {
    const g = this.add.graphics();
    const w = 70, h = 14;

    // Glow effect
    g.fillStyle(COLORS.platformNormal, 0.2);
    g.fillRoundedRect(0, 0, w + 8, h + 8, 10);
    
    // Main body
    g.fillStyle(COLORS.platformNormal, 1);
    g.fillRoundedRect(4, 4, w, h, 6);

    // Highlight
    g.fillStyle(COLORS.platformNormal + 0x303030, 0.6);
    g.fillRoundedRect(8, 6, 24, 4, 2);

    // Shine dots
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(12, 8, 1.5);
    g.fillCircle(58, 8, 1.5);

    g.generateTexture('platform_normal', w + 8, h + 8);
    g.destroy();
  }

  private createPlatformMoving(): void {
    const g = this.add.graphics();
    const w = 70, h = 14;

    // Glow effect (yellow/orange)
    g.fillStyle(COLORS.platformMoving, 0.3);
    g.fillRoundedRect(0, 0, w + 8, h + 8, 10);

    // Main body
    g.fillStyle(COLORS.platformMoving, 1);
    g.fillRoundedRect(4, 4, w, h, 6);

    // Simple highlight
    g.fillStyle(0xffffff, 0.4);
    g.fillRoundedRect(8, 6, 54, 3, 2);

    g.generateTexture('platform_moving', w + 8, h + 8);
    g.destroy();
  }

  private createPlatformBreakable(): void {
    const g = this.add.graphics();
    const w = 70, h = 14;

    // Glow effect
    g.fillStyle(COLORS.platformBreakable, 0.15);
    g.fillRoundedRect(0, 0, w + 8, h + 8, 10);

    // Main body (cracked look)
    g.fillStyle(COLORS.platformBreakable, 1);
    g.fillRoundedRect(4, 4, w, h, 6);

    // Cracks
    g.lineStyle(2, 0xcc4444);
    g.lineBetween(20, 4, 28, 18);
    g.lineBetween(35, 4, 38, 18);
    g.lineBetween(50, 4, 45, 18);

    // Danger indicator
    g.fillStyle(0xffcccc, 0.7);
    g.fillCircle(12, 8, 2);
    g.fillCircle(58, 8, 2);

    g.generateTexture('platform_breakable', w + 8, h + 8);
    g.destroy();
  }

  private createPlatformBoost(): void {
    const g = this.add.graphics();
    const w = 70, h = 14;

    // Strong glow effect (purple)
    g.fillStyle(COLORS.platformBoost, 0.3);
    g.fillRoundedRect(0, 0, w + 12, h + 12, 12);

    // Main body
    g.fillStyle(COLORS.platformBoost, 1);
    g.fillRoundedRect(6, 6, w, h, 6);

    // Star/arrow indicator
    g.fillStyle(0xffffff, 0.9);
    g.fillTriangle(35, 6, 28, 16, 42, 16);

    // Highlight
    g.fillStyle(COLORS.platformBoost + 0x505050, 0.7);
    g.fillRoundedRect(10, 8, 24, 4, 2);

    g.generateTexture('platform_boost', w + 12, h + 12);
    g.destroy();
  }

  private createPlatformCloud(): void {
    const g = this.add.graphics();
    const w = 70, h = 14;

    // Soft/cloudy appearance
    g.fillStyle(COLORS.platformCloud, 0.3);
    g.fillRoundedRect(0, 0, w, h + 6, 10);
    
    // Main body (translucent)
    g.fillStyle(COLORS.platformCloud, 0.8);
    g.fillRoundedRect(0, 3, w, h, 8);

    // Fluffy edges
    g.fillStyle(COLORS.platformCloud + 0x404040, 0.5);
    g.fillCircle(10, 10, 8);
    g.fillCircle(35, 10, 10);
    g.fillCircle(60, 10, 8);

    // Highlight (dotted)
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(20, 6, 2);
    g.fillCircle(35, 5, 2);
    g.fillCircle(50, 6, 2);

    g.generateTexture('platform_cloud', w, h + 6);
    g.destroy();
  }

  // ─── Particle Textures ──────────────────────────────────────────────────────
  private createParticleTextures(): void {
    // Small square particle
    let g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 6, 6);
    g.generateTexture('particle_square', 6, 6);
    g.destroy();

    // Star particle for boost
    g = this.add.graphics();
    g.fillStyle(COLORS.platformBoost, 1);
    const star = [0, 0, 3, 3, 6, 0, 5, 4, 8, 4, 6, 7, 7, 11, 3, 8, -1, 11, 0, 7, -2, 4, 1, 4];
    for (let i = 0; i < star.length; i += 2) {
      if (i === 0) {
        g.fillStyle(COLORS.platformBoost, 1);
        g.fillCircle(4, 4, 3);
      }
    }
    g.generateTexture('particle_star', 8, 8);
    g.destroy();

    // Small circle for landing particles
    g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('particle_circle', 8, 8);
    g.destroy();
  }

  // ─── Button Textures ────────────────────────────────────────────────────────
  private createButtonTextures(): void {
    // Primary button
    let g = this.add.graphics();
    const bw = 160, bh = 50;

    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(4, 4, bw, bh, 12);

    // Main button
    g.fillStyle(COLORS.platformNormal, 1);
    g.fillRoundedRect(0, 0, bw, bh, 12);

    // Highlight
    g.fillStyle(0xffffff, 0.2);
    g.fillRoundedRect(4, 4, bw - 8, bh / 2 - 4, 8);

    g.generateTexture('btn_primary', bw, bh);
    g.destroy();

    // Secondary button
    g = this.add.graphics();

    // Shadow
    g.fillStyle(0x000000, 0.3);
    g.fillRoundedRect(4, 4, bw, bh, 12);

    // Main button
    g.fillStyle(COLORS.platformCloud, 1);
    g.fillRoundedRect(0, 0, bw, bh, 12);

    // Border
    g.lineStyle(2, 0xffffff, 0.3);
    g.strokeRoundedRect(1, 1, bw - 2, bh - 2, 12);

    g.generateTexture('btn_secondary', bw, bh);
    g.destroy();
  }
}
