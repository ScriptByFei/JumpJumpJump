import Phaser from 'phaser';
import { POWERUP, POWERUP_TYPES, PowerupType } from '../config';

export class Powerup extends Phaser.GameObjects.Container {
  public powerupType: PowerupType;
  private glowCircle!: Phaser.GameObjects.Graphics;
  private floatTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerupType) {
    super(scene, x, y);
    this.powerupType = type;
    this.setDepth(50);

    const config = POWERUP_TYPES[type];

    // Glow effect
    this.glowCircle = scene.add.graphics();
    this.glowCircle.fillStyle(config.color, 0.3);
    this.glowCircle.fillCircle(0, 0, POWERUP.SIZE / 2 + 8);
    this.glowCircle.setAlpha(0.5);
    this.add(this.glowCircle);

    // Main circle
    const mainCircle = scene.add.graphics();
    mainCircle.fillStyle(config.color, 1);
    mainCircle.fillCircle(0, 0, POWERUP.SIZE / 2);
    mainCircle.lineStyle(2, 0xffffff, 0.6);
    mainCircle.strokeCircle(0, 0, POWERUP.SIZE / 2);
    this.add(mainCircle);

    // Inner highlight
    const highlight = scene.add.graphics();
    highlight.fillStyle(0xffffff, 0.4);
    highlight.fillCircle(-4, -4, 6);
    this.add(highlight);

    // Symbol
    const symbols: Record<PowerupType, string> = {
      shield: 'S',
      magnet: 'M',
      rocket: 'R',
      double: '2x',
    };

    const symbolText = scene.add.text(0, 1, symbols[type], {
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.add(symbolText);

    scene.add.existing(this);
    this.startFloatAnimation();
  }

  private startFloatAnimation(): void {
    this.floatTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  update(_time: number, _delta: number): void {
    this.glowCircle.setAlpha(0.3 + Math.sin(this.scene.time.now / 150) * 0.15);
    this.glowCircle.setScale(1 + Math.sin(this.scene.time.now / 200) * 0.1);
  }

  collect(): void {
    this.scene.tweens.add({
      targets: this,
      scale: 1.5,
      alpha: 0,
      duration: 200,
      ease: 'Quad.easeOut',
      onComplete: () => this.destroy(),
    });

    const config = POWERUP_TYPES[this.powerupType];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const particle = this.scene.add.circle(
        this.x + Math.cos(angle) * 10,
        this.y + Math.sin(angle) * 10,
        4,
        config.color
      );
      particle.setDepth(100);

      this.scene.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * 40,
        y: particle.y + Math.sin(angle) * 40,
        alpha: 0,
        scale: 0,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  getCollectionBounds(): { left: number; right: number; top: number; bottom: number } {
    const halfSize = POWERUP.SIZE / 2;
    return {
      left: this.x - halfSize,
      right: this.x + halfSize,
      top: this.y - halfSize,
      bottom: this.y + halfSize,
    };
  }

  destroy(fromScene?: boolean): void {
    if (this.floatTween) this.floatTween.stop();
    super.destroy(fromScene);
  }
}