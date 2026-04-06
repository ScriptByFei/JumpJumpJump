import Phaser from 'phaser';
import { ENEMY, EnemyType, GAME_WIDTH } from '../config';

export class Enemy extends Phaser.GameObjects.Container {
  public enemyType: EnemyType;
  private direction: number = 1;
  private floatTween?: Phaser.Tweens.Tween;
  private pulseTween?: Phaser.Tweens.Tween;
  private glow!: Phaser.GameObjects.Graphics;
  private mainBody!: Phaser.GameObjects.Graphics;

  // Cached bounds
  private _bounds?: { left: number; right: number; top: number; bottom: number };

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType) {
    super(scene, x, y);
    this.enemyType = type;
    this.setDepth(60);

    if (type === 'ufo') {
      this.direction = Math.random() > 0.5 ? 1 : -1;
      this.createGhost();
    } else {
      this.createPhantom();
    }

    scene.add.existing(this);
    this.startAnimations();
  }

  private createGhost(): void {
    // Ghostly floating spirit with skull face
    const size = ENEMY.UFO.SIZE;

    // Outer glow (pulsing)
    this.glow = this.scene.add.graphics();
    this.glow.fillStyle(0x8b5cf6, 0.15);
    this.glow.fillEllipse(0, 0, size + 18, size + 10);
    this.add(this.glow);

    // Main ghostly body (rounded top, wavy bottom)
    this.mainBody = this.scene.add.graphics();
    this.mainBody.fillStyle(0xc4b5fd, 0.9);
    // Head dome
    this.mainBody.fillEllipse(0, -5, size * 1.4, size * 1.6);
    // Body
    this.mainBody.fillRect(-size * 0.6, -size * 0.3, size * 1.2, size * 0.8);
    // Wavy bottom
    for (let i = -2; i <= 2; i++) {
      const waveY = size * 0.5 + Math.sin(i * 1.5) * 8;
      this.mainBody.fillCircle(i * size * 0.3, waveY, size * 0.35);
    }
    // Outline
    this.mainBody.lineStyle(2, 0x7c3aed, 0.6);
    this.mainBody.strokeEllipse(0, -5, size * 1.4, size * 1.6);
    this.add(this.mainBody);

    // Inner glow
    const innerGlow = this.scene.add.graphics();
    innerGlow.fillStyle(0xe9d5ff, 0.4);
    innerGlow.fillCircle(0, -8, size * 0.35);
    this.add(innerGlow);

    // Evil skull face - hollow dark eye sockets
    const leftSocket = this.scene.add.graphics();
    leftSocket.fillStyle(0x000000, 0.95);
    leftSocket.fillCircle(-8, -8, 7);
    this.add(leftSocket);

    const rightSocket = this.scene.add.graphics();
    rightSocket.fillStyle(0x000000, 0.95);
    rightSocket.fillCircle(8, -8, 7);
    this.add(rightSocket);

    // Glowing red pupils
    const leftPupil = this.scene.add.graphics();
    leftPupil.fillStyle(0xff0040, 1);
    leftPupil.fillCircle(-8, -8, 4);
    this.add(leftPupil);

    const rightPupil = this.scene.add.graphics();
    rightPupil.fillStyle(0xff0040, 1);
    rightPupil.fillCircle(8, -8, 4);
    this.add(rightPupil);

    // Eye highlights
    const leftCore = this.scene.add.graphics();
    leftCore.fillStyle(0xffffff, 0.8);
    leftCore.fillCircle(-9, -9, 2);
    this.add(leftCore);

    const rightCore = this.scene.add.graphics();
    rightCore.fillStyle(0xffffff, 0.8);
    rightCore.fillCircle(7, -9, 2);
    this.add(rightCore);

    // Menacing mouth
    const mouth = this.scene.add.graphics();
    mouth.fillStyle(0x000000, 0.9);
    mouth.fillTriangle(-10, 5, 10, 5, 0, 14);
    this.add(mouth);

    // Fangs
    const leftFang = this.scene.add.graphics();
    leftFang.fillStyle(0xfafafa, 1);
    leftFang.fillTriangle(-7, 6, -4, 6, -5.5, 12);
    this.add(leftFang);

    const rightFang = this.scene.add.graphics();
    rightFang.fillStyle(0xfafafa, 1);
    rightFang.fillTriangle(4, 6, 7, 6, 5.5, 12);
    this.add(rightFang);

    // Wispy trails
    for (let i = 0; i < 3; i++) {
      const trail = this.scene.add.graphics();
      trail.fillStyle(0xc4b5fd, 0.3 - i * 0.1);
      trail.fillEllipse(0, size * 0.6 + i * 10, 18 - i * 4, 12);
      this.add(trail);
    }
  }

  private createPhantom(): void {
    // Dark phantom/demon that falls from above
    const size = ENEMY.SPIKE.SIZE;

    // Outer dark aura
    this.glow = this.scene.add.graphics();
    this.glow.fillStyle(0x1a1a2e, 0.4);
    this.glow.fillCircle(0, 0, size + 14);
    this.add(this.glow);

    // Main body (dark sphere)
    this.mainBody = this.scene.add.graphics();
    this.mainBody.fillStyle(0x2d1b4e, 1);
    this.mainBody.fillCircle(0, 0, size);
    this.mainBody.lineStyle(3, 0x6b21a8, 0.8);
    this.mainBody.strokeCircle(0, 0, size);
    this.add(this.mainBody);

    // Inner dark core
    const core = this.scene.add.graphics();
    core.fillStyle(0x0f0f1a, 1);
    core.fillCircle(0, 0, size * 0.65);
    this.add(core);

    // Energy veins (red streaks)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const vein = this.scene.add.graphics();
      vein.lineStyle(2, 0xdc2626, 0.8);
      vein.beginPath();
      vein.moveTo(Math.cos(angle) * size * 0.4, Math.sin(angle) * size * 0.4);
      vein.lineTo(Math.cos(angle) * size * 0.85, Math.sin(angle) * size * 0.85);
      vein.strokePath();
      this.add(vein);
    }

    // Spiky crown (horns)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const spike = this.scene.add.graphics();
      spike.fillStyle(0x4c1d95, 1);
      spike.fillTriangle(
        Math.cos(angle) * size * 0.6,
        Math.sin(angle) * size * 0.6 - 10,
        Math.cos(angle) * size * 1.2,
        Math.sin(angle) * size * 1.2 - 10,
        Math.cos(angle + 0.25) * size * 0.6,
        Math.sin(angle + 0.25) * size * 0.6 - 10
      );
      this.add(spike);
    }

    // Three glowing eyes
    const eyeColor = 0xff0000;
    const eyeGlow = 0xff6b6b;

    // Center eye
    const centerEye = this.scene.add.graphics();
    centerEye.fillStyle(0x000000, 1);
    centerEye.fillCircle(0, -4, 5);
    centerEye.fillStyle(eyeColor, 1);
    centerEye.fillCircle(0, -4, 3);
    centerEye.fillStyle(eyeGlow, 0.8);
    centerEye.fillCircle(0, -4, 1.5);
    this.add(centerEye);

    // Left eye
    const leftEye = this.scene.add.graphics();
    leftEye.fillStyle(0x000000, 1);
    leftEye.fillCircle(-7, 2, 4);
    leftEye.fillStyle(eyeColor, 1);
    leftEye.fillCircle(-7, 2, 2.5);
    leftEye.fillStyle(eyeGlow, 0.8);
    leftEye.fillCircle(-7, 2, 1);
    this.add(leftEye);

    // Right eye
    const rightEye = this.scene.add.graphics();
    rightEye.fillStyle(0x000000, 1);
    rightEye.fillCircle(7, 2, 4);
    rightEye.fillStyle(eyeColor, 1);
    rightEye.fillCircle(7, 2, 2.5);
    rightEye.fillStyle(eyeGlow, 0.8);
    rightEye.fillCircle(7, 2, 1);
    this.add(rightEye);

    // Fanged mouth
    const mouth = this.scene.add.graphics();
    mouth.fillStyle(0x000000, 0.9);
    mouth.fillRoundedRect(-10, 6, 20, 7, 3);
    this.add(mouth);

    // Fangs
    for (let i = -1; i <= 1; i++) {
      const fang = this.scene.add.graphics();
      fang.fillStyle(0xfafafa, 1);
      fang.fillTriangle(i * 7 - 2, 6, i * 7 + 2, 6, i * 7, 12);
      this.add(fang);
    }
  }

  private startAnimations(): void {
    // Floating animation
    this.floatTween = this.scene.tweens.add({
      targets: this,
      y: this.y - 8,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Pulsing glow
    this.pulseTween = this.scene.tweens.add({
      targets: this.glow,
      alpha: 0.6,
      scale: 1.15,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  update(_time: number, _delta: number): void {
    if (this.enemyType === 'ufo') {
      this.x += ENEMY.UFO.SPEED * this.direction * (_delta / 1000);

      if (this.x < -30 || this.x > GAME_WIDTH + 30) {
        this.direction *= -1;
        this.scaleX *= -1;
      }
    } else {
      this.y += ENEMY.SPIKE.FALL_SPEED * (_delta / 1000);
    }
  }

  getDirection(): number {
    return this.direction;
  }

  getCollisionBounds(): { left: number; right: number; top: number; bottom: number } {
    if (!this._bounds) {
      const size = this.enemyType === 'ufo' ? ENEMY.UFO.SIZE : ENEMY.SPIKE.SIZE;
      this._bounds = {
        left: this.x - size / 2,
        right: this.x + size / 2,
        top: this.y - size / 2,
        bottom: this.y + size / 2,
      };
    } else {
      // Update cached bounds
      const size = this.enemyType === 'ufo' ? ENEMY.UFO.SIZE : ENEMY.SPIKE.SIZE;
      this._bounds.left = this.x - size / 2;
      this._bounds.right = this.x + size / 2;
      this._bounds.top = this.y - size / 2;
      this._bounds.bottom = this.y + size / 2;
    }
    return this._bounds;
  }

  destroy(fromScene?: boolean): void {
    if (this.floatTween) this.floatTween.stop();
    if (this.pulseTween) this.pulseTween.stop();
    super.destroy(fromScene);
  }
}