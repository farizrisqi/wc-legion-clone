import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { glow } from '../ui/UI.js';

// King di bawah board. Bisa menyerang creep dekat goal, di-upgrade pakai lumber.
export default class King {
  constructor(scene, board, label, accent) {
    this.scene = scene;
    this.board = board;
    this.accent = accent;
    this.maxHp = CONFIG.king.hp;
    this.hp = this.maxHp;

    // stat tempur
    this.dmg = CONFIG.king.atkDmg;
    this.range = CONFIG.king.atkRange;
    this.atkSpeed = CONFIG.king.atkSpeed;
    this.regen = 0;
    this.attackTimer = 0;
    this.levels = { hp: 0, attack: 0, regen: 0 };

    // titik tembak = sel goal (depan King)
    const gp = board.cellToPixel(board.goal.col, board.goal.row);
    this.atkX = gp.x;
    this.atkY = gp.y;

    const w = board.cols * board.cellSize;
    this.barW = w;
    const x = board.origin.x + w / 2;
    const y = board.origin.y + board.rows * board.cellSize + 34;
    this.barX = board.origin.x;
    this.barY = y + 24;

    // takhta King
    const throne = scene.add.image(x, y, 'roundsquare').setDisplaySize(54, 40).setTint(0xfbbf24);
    glow(scene, throne, 0xfbbf24, 5);
    scene.add.text(x, y - 1, '♚', { fontSize: '26px', color: '#3a2a00' }).setOrigin(0.5);

    // HP bar
    this.barGfx = scene.add.graphics();
    this.text = scene.add.text(x, this.barY + 9, '', {
      fontFamily: CONFIG.fonts.heading, fontSize: '12px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.label = label;
    this.drawBar();
  }

  drawBar() {
    const pct = this.hp / this.maxHp;
    const g = this.barGfx;
    g.clear();
    g.fillStyle(0x000000, 0.55);
    g.fillRoundedRect(this.barX, this.barY, this.barW, 18, 9);
    const color = pct < 0.3 ? CONFIG.colors.hpLow : pct < 0.6 ? CONFIG.colors.hpMid : CONFIG.colors.hpFull;
    if (pct > 0) {
      g.fillStyle(color, 1);
      g.fillRoundedRect(this.barX + 2, this.barY + 2, Math.max(4, (this.barW - 4) * pct), 14, 7);
    }
    g.lineStyle(1.5, this.accent, 0.5);
    g.strokeRoundedRect(this.barX, this.barY, this.barW, 18, 9);
    this.text.setText(`${this.label}  ${Math.round(this.hp)} / ${this.maxHp}`);
  }

  takeDamage(dmg) {
    this.hp = Math.max(0, this.hp - dmg);
    this.drawBar();
    this.scene.cameras.main.shake(120, 0.003);
  }

  // upgrade pakai lumber. type: 'hp' | 'attack' | 'regen'
  upgradeCost(type) {
    return CONFIG.king.upgrades[type].base * (this.levels[type] + 1);
  }

  applyUpgrade(type) {
    const u = CONFIG.king.upgrades[type];
    this.levels[type]++;
    // HP upgrade menambah max DAN current HP (+amount), bukan menyembuhkan ke penuh
    // contoh: 1700/2000 -> 2300/2600
    if (type === 'hp') { this.maxHp += u.amount; this.hp += u.amount; }
    else if (type === 'attack') { this.dmg += u.amount; }
    else if (type === 'regen') { this.regen += u.amount; }
    this.drawBar();
  }

  update(delta, creeps) {
    if (this.hp <= 0) return;

    // regenerasi HP
    if (this.regen > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.regen * (delta / 1000));
      this.drawBar();
    }

    // serang creep terdekat dalam range
    this.attackTimer -= delta;
    if (this.attackTimer > 0 || !creeps || creeps.length === 0) return;
    let target = null, best = Infinity;
    for (const c of creeps) {
      if (c.dead) continue;
      const d = Phaser.Math.Distance.Between(this.atkX, this.atkY, c.x, c.y);
      if (d <= this.range && d < best) { best = d; target = c; }
    }
    if (!target) return;

    const line = this.scene.add.line(0, 0, this.atkX, this.atkY, target.x, target.y, 0xfbbf24, 0.9)
      .setOrigin(0, 0).setLineWidth(2.5);
    this.scene.tweens.add({ targets: line, alpha: 0, duration: 160, onComplete: () => line.destroy() });
    target.takeDamage(this.dmg);
    this.attackTimer = 1000 / this.atkSpeed;
  }

  get dead() {
    return this.hp <= 0;
  }
}
