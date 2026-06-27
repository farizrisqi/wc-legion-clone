import { CONFIG } from '../config.js';
import { findPath } from './Pathfinder.js';

// Creep yang bergerak dari spawn menuju King mengikuti path (array of {col,row}).
export default class Creep {
  constructor(scene, board, stats, path, hpMult = 1, dmgMult = 1) {
    this.scene = scene;
    this.board = board;
    this.stats = stats;
    this.maxHp = Math.round(stats.hp * hpMult);
    this.hp = this.maxHp;
    this.armor = stats.armor;
    this.speed = stats.speed;
    this.bounty = stats.bounty;
    this.leakDmg = stats.leakDmg;

    this.path = path;
    this.pathIndex = 1; // index 0 = sel spawn (posisi awal)
    this.dead = false;
    this.leaked = false;

    this.slowFactor = 1;
    this.slowTimer = 0;
    this.poisonDps = 0;
    this.poisonTimer = 0;

    // stat menyerang unit (ikut scaling wave)
    this.dmg = Math.round((stats.dmg || 0) * dmgMult);
    this.atkSpeed = stats.atkSpeed || 1;
    this.range = stats.range || 1;
    this.attackTimer = 0;

    const start = board.cellToPixel(path[0].col, path[0].row);
    this.x = start.x;
    this.y = start.y;

    const sz = stats.key === 'boss' ? 30 : stats.key === 'brute' ? 24 : 18;
    const baseColor =
      stats.key === 'boss' ? 0xc084fc :
      stats.key === 'brute' ? 0xfb923c :
      stats.key === 'armored' ? 0x94a3b8 :
      stats.key === 'fast' ? 0x5eead4 :
      stats.key === 'swarm' ? 0xfde047 :
      CONFIG.colors.creep;
    this.baseColor = baseColor;
    this.circle = scene.add.image(this.x, this.y, 'disc').setDisplaySize(sz, sz).setTint(baseColor);
    this.hpBarBg = scene.add.rectangle(this.x, this.y - sz / 2 - 5, sz + 2, 5, 0x000000, 0.6).setOrigin(0.5);
    this.hpBar = scene.add.rectangle(this.x - sz / 2, this.y - sz / 2 - 5, sz, 4, CONFIG.colors.hpFull).setOrigin(0, 0.5);
    this.size = sz;
  }

  applySlow(factor, duration) {
    this.slowFactor = 1 - factor;
    this.slowTimer = duration;
  }

  applyPoison(dps, duration) {
    this.poisonDps = dps;
    this.poisonTimer = duration;
  }

  // unit hidup terdekat dalam jangkauan serang creep
  findUnitInRange() {
    const r = this.range * CONFIG.grid.cellSize + 10;
    let best = null, bd = Infinity;
    for (const u of this.board.units) {
      if (!u.alive) continue;
      const d = Math.hypot(u.x - this.x, u.y - this.y);
      if (d <= r && d < bd) { bd = d; best = u; }
    }
    return best;
  }

  takeDamage(dmg) {
    // armor reduksi ala WC3: 100/(100+armor)
    const actual = dmg * (100 / (100 + this.armor));
    this.hp -= actual;
    if (this.hp <= 0) this.die();
    else this.updateHpBar();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    // pop kecil saat mati
    this.scene.tweens.add({
      targets: this.circle, scale: 0, alpha: 0, duration: 150,
      onComplete: () => this.circle.destroy()
    });
    this.hpBar.destroy();
    this.hpBarBg.destroy();
  }

  updateHpBar() {
    const pct = Math.max(0, this.hp / this.maxHp);
    this.hpBar.width = this.size * pct;
    let color = CONFIG.colors.hpFull;
    if (pct < 0.3) color = CONFIG.colors.hpLow;
    else if (pct < 0.6) color = CONFIG.colors.hpMid;
    this.hpBar.fillColor = color;
    // creep memerah saat sekarat
    this.circle.setTint(pct < 0.35 ? 0xf87171 : this.baseColor);
  }

  // return true kalau creep mencapai King (leak)
  update(delta) {
    if (this.dead) return false;

    // poison DoT
    if (this.poisonTimer > 0) {
      this.poisonTimer -= delta;
      this.hp -= this.poisonDps * (delta / 1000);
      if (this.hp <= 0) { this.die(); return false; }
      this.updateHpBar();
    }
    // slow
    if (this.slowTimer > 0) {
      this.slowTimer -= delta;
      if (this.slowTimer <= 0) this.slowFactor = 1;
    }

    if (this.pathIndex >= this.path.length) { // sampai goal -> leak (prioritas)
      this.leaked = true;
      this.die();
      return true;
    }

    // jika ada unit dalam jangkauan, berhenti & serang (tidak bergerak)
    const unit = this.findUnitInRange();
    if (unit) {
      this.attackTimer -= delta;
      if (this.attackTimer <= 0) {
        const line = this.scene.add.line(0, 0, this.x, this.y, unit.x, unit.y, 0xff6b6b, 0.8)
          .setOrigin(0, 0).setLineWidth(2);
        this.scene.tweens.add({ targets: line, alpha: 0, duration: 150, onComplete: () => line.destroy() });
        unit.takeDamage(this.dmg);
        this.attackTimer = 1000 / this.atkSpeed;
        // jika unit baru saja mati, repath lewat sel yang kini terbuka
        if (!unit.alive) {
          const cell = this.board.pixelToCell(this.x, this.y);
          if (cell) {
            const newPath = findPath(this.board.toGrid(), cell, this.board.goal);
            if (newPath && newPath.length > 1) { this.path = newPath; this.pathIndex = 1; }
          }
        }
      }
      return false;
    }

    const tgt = this.board.cellToPixel(this.path[this.pathIndex].col, this.path[this.pathIndex].row);
    const speed = this.speed * this.slowFactor;
    const step = speed * (delta / 1000);
    const dx = tgt.x - this.x;
    const dy = tgt.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= step) {
      this.x = tgt.x;
      this.y = tgt.y;
      this.pathIndex++;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }

    this.circle.setPosition(this.x, this.y);
    this.hpBarBg.setPosition(this.x, this.y - this.size / 2 - 5);
    this.hpBar.setPosition(this.x - this.size / 2, this.y - this.size / 2 - 5);
    return false;
  }
}
