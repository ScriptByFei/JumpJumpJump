import Phaser from 'phaser';
import { ENEMY, EnemyType } from '../config';

export class Enemy extends Phaser.GameObjects.Container {
  public enemyType: EnemyType;
  private direction: number = 1;
  private floatTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType) {
    super(scene, x, y);
    this.enemyType = type;
    this.setDepth(60);

    if (type === 'ufo') {
      this.direction = Math.random() > 0.5 ? 1 : -1;
      this.createUFO();
    } else {
      this.createSpike();
    }

    scene.add.existing(this);
    this.startFloatAnimation();
  }

  private createUFO(): void {
    const color = ENEMY.UFO.COLOR;
    const size = ENEMY.UFO.SIZE;

    // Glow
    const glow = this.scene.add.graphics();
    glow.fillStyle(color, 0.3);
    glow.fillEllipse(0, 0, size + 10, size / 2);
    this.add(glow);

    // Main body
    const body = this.scene.add.graphics();
    body.fillStyle(color, 1);
    body.fillEllipse(0, 0, size, size / 2);
    body.lineStyle(2, 0xffffff, 0.5);
    body.strokeEllipse(0, 0, size, size / 2);
    this.add(body);

    // Dome
    const dome = this.scene.add.graphics();
    dome.fillStyle(0x00e5ff, 0.8);
    dome.fillEllipse(0, -8, size / 2, size / 3);
    this.add(dome);

    // Eyes
    const eye1 = this.scene.add.circle(-8, 2, 4, 0xffffff);
    const eye2 = this.scene.add.circle(8, 2, 4, 0xffffff);
    const pupil1 = this.scene.add.circle(-8, 2, 2, 0x000000);
    const pupil2 = this.scene.add.circle(8, 2, 2, 0x000000);
    this.add(eye1);
    this.add(eye2);
    this.add(pupil1);
    this.add(pupil2);
  }

  private createSpike(): void {
    const color = ENEMY.SPIKE.COLOR;
    const size = ENEMY.SPIKE.SIZE;

    // Glow
    const glow = this.scene.add.graphics();
    glow.fillStyle(color, 0.3);
    glow.fillCircle(0, 0, size + 8);
    this.add(glow);

    // Main spike ball
    const body = this.scene.add.graphics();
    body.fillStyle(color, 1);
    body.fillCircle(0, 0, size);
    body.lineStyle(2, 0xffffff, 0.4);
    body.strokeCircle(0, 0, size);
    this.add(body);

    // Spikes
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spike = this.scene.add.graphics();
      spike.fillStyle(0xffd54f, 1);
      spike.fillTriangle(
        Math.cos(angle) * size,
        Math.sin(angle) * size,
        Math.cos(angle - 0.3) * (size + 10),
        Math.sin(angle - 0.3) * (size + 10),
        Math.cos(angle + 0.3) * (size + 10),
        Math.sin(angle + 0.3) * (size + 10)
      );
      this.add(spike);
    }

    // Angry eyes
    const eye1 = this.scene.add.graphics();
    eye1.fillStyle(0xffffff, 1);
    eye1.fillCircle(-6, -3, 5);
    eye1.fillStyle(0xff0000, 1);
    eye1.fillCircle(-6, -3, 3);
    this.add(eye1);

    const eye2 = this.scene.add.graphics();
    eye2.fillStyle(0xffffff, 1);
    eye2.fillCircle(6, -3, 5);
    eye2.fillStyle(0xff0000, 1);
    eye2.fillCircle(6, -3, 3);
    this.add(eye2);
  }

  private startFloatAnimation(): void {
    this.floatTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  update(_time: number, _delta: number): void {
    if (this.enemyType === 'ufo') {
      this.x += ENEMY.UFO.SPEED * this.direction * (_delta / 1000);
    } else {
      this.y += ENEMY.SPIKE.FALL_SPEED * (_delta / 1000);
    }
  }

  getDirection(): number {
    return this.direction;
  }

  reverseDirection(): void {
    this.direction *= -1;
    this.scaleX *= -1;
  }

  getCollisionBounds(): { left: number; right: number; top: number; bottom: number } {
    const size = this.enemyType === 'ufo' ? ENEMY.UFO.SIZE : ENEMY.SPIKE.SIZE;
    return {
      left: this.x - size / 2,
      right: this.x + size / 2,
      top: this.y - size / 2,
      bottom: this.y + size / 2,
    };
  }

  destroy(fromScene?: boolean): void {
    if (this.floatTween) this.floatTween.stop();
    super.destroy(fromScene);
  }
}