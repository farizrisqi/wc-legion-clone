import Phaser from 'phaser';

// Generate texture sederhana (kotak rounded & lingkaran) supaya unit/creep
// bisa diberi tint, glow, dan terlihat lebih halus dari sekadar shape mentah.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    const g = this.add.graphics();

    // kotak rounded putih (untuk unit) -> nanti diberi tint
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(0, 0, 64, 64, 16);
    g.generateTexture('roundsquare', 64, 64);
    g.clear();

    // lingkaran putih (untuk creep)
    g.fillStyle(0xffffff, 1);
    g.fillCircle(24, 24, 24);
    g.generateTexture('disc', 48, 48);
    g.clear();

    g.destroy();
    this.scene.start('MenuScene');
  }
}
