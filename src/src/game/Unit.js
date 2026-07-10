import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { RACES } from '../data/unit.js';
import { glow } from '../ui/UI.js';

// pengali stat per tier & faktor biaya upgrade (relatif ke biaya dasar unit)
const TIER_MULT = [1, 1.8, 3.0];      // index = tier-1
const TIER_COST_FACTOR = [0, 1.5, 2.5]; // biaya naik ke tier (index = tier saat ini)

// Unit yang ditempatkan player/AI. Auto-attack creep terdekat dalam range.
export default class Unit {
  constructor(scene, board, stats, faction, col, row) {
    this.scene = scene;
    this.board = board;
    this.stats = stats;
    this.faction = faction;
    this.col = col;
    this.row = row;
    this.attackTimer = 0;

    // tier & stat turunan
    this.tier = 1;
    this.baseHp = stats.hp;
    this.baseDmg = stats.dmg;
    this.invested = stats.cost; // total gold yang ditanam (untuk hitung refund)
    this.hpBonus = 1;  // bonus skala (dipakai untuk unit AI yang menguat tiap wave)
    this.dmgBonus = 1;
    this.recomputeStats();
    this.hp = this.maxHp;
    this.alive = true;

    const p = board.cellToPixel(col, row);
    this.x = p.x;
    this.y = p.y;
    this.homeX = p.x; // posisi asal — unit kembali ke sini setelah ronde
    this.homeY = p.y;
    this.color = (RACES[faction] && RACES[faction].color) || CONFIG.colors.westUnit;
    const s = CONFIG.grid.cellSize - 5;
    this.s = s;
    this.rect = scene.add.image(p.x, p.y, 'roundsquare').setDisplaySize(s, s).setTint(this.color);
    glow(scene, this.rect, this.color, 3);
    this.label = scene.add.text(p.x, p.y, stats.name[0], {
      fontFamily: CONFIG.fonts.heading, fontSize: '18px', color: '#08111f', fontStyle: 'bold'
    }).setOrigin(0.5);

    // badge tier (muncul saat tier > 1)
    this.tierBadge = scene.add.text(p.x + s / 2 - 2, p.y + s / 2 - 2, '', {
      fontFamily: CONFIG.fonts.heading, fontSize: '11px', color: '#fde68a', fontStyle: 'bold'
    }).setOrigin(1, 1);

    // HP bar (disembunyikan saat HP penuh)
    const bw = s - 2;
    this.hpBarBg = scene.add.rectangle(p.x, p.y - s / 2 - 5, bw, 4, 0x000000, 0.6).setOrigin(0.5).setVisible(false);
    this.hpBar = scene.add.rectangle(p.x - bw / 2, p.y - s / 2 - 5, bw, 3, CONFIG.colors.hpFull).setOrigin(0, 0.5).setVisible(false);
    this.hpBarW = bw;

    // animasi muncul
    this.rect.setScale(0);
    scene.tweens.add({ targets: this.rect, scaleX: s / 64, scaleY: s / 64, duration: 200, ease: 'Back.out' });
  }

  // hitung ulang maxHp & dmg dari base × tier × bonus
  recomputeStats() {
    const m = TIER_MULT[this.tier - 1];
    this.maxHp = Math.round(this.baseHp * m * this.hpBonus);
    this.dmg = Math.round(this.baseDmg * m * this.dmgBonus);
  }

  // biaya gold untuk naik ke tier berikutnya (0 jika sudah maksimal)
  upgradeCost() {
    if (this.tier >= 3) return 0;
    return Math.round(this.stats.cost * TIER_COST_FACTOR[this.tier]);
  }

  canUpgrade() {
    return this.tier < 3;
  }

  // naikkan tier: stat HP & DMG ikut naik, HP terisi penuh
  upgradeTier() {
    if (this.tier >= 3) return;
    this.invested += this.upgradeCost();
    this.tier++;
    this.recomputeStats();
    this.hp = this.maxHp;
    this.tierBadge.setText('★'.repeat(this.tier - 1));
    // sedikit membesar + efek pop
    const ns = (CONFIG.grid.cellSize - 5) + (this.tier - 1) * 3;
    this.rect.setDisplaySize(ns, ns);
    this.scene.tweens.add({ targets: this.rect, scaleX: { from: this.rect.scaleX * 1.25, to: this.rect.scaleX }, scaleY: { from: this.rect.scaleY * 1.25, to: this.rect.scaleY }, duration: 200, ease: 'Back.out' });
  }

  takeDamage(dmg) {
    if (!this.alive) return;
    // block: 30% chance kurangi 50% damage masuk
    if (this.stats.special === 'block' && Math.random() < 0.3) dmg *= 0.5;
    this.hp -= dmg;
    if (this.hp <= 0) { this.die(); return; }
    // tampilkan & update HP bar
    const pct = this.hp / this.maxHp;
    this.hpBarBg.setVisible(true);
    this.hpBar.setVisible(true).width = this.hpBarW * pct;
    this.hpBar.fillColor = pct < 0.3 ? CONFIG.colors.hpLow : pct < 0.6 ? CONFIG.colors.hpMid : CONFIG.colors.hpFull;
  }

  die() {
    this.alive = false;
    this.rect.setAlpha(0.18);
    this.label.setAlpha(0.18);
    this.hpBar.setVisible(false);
    this.hpBarBg.setVisible(false);
  }

  // dipanggil tiap awal ronde: hidupkan kembali, tween balik ke posisi asal
  respawn() {
    this.alive = true;
    this.hp = this.maxHp;
    this.attackTimer = 0;
    this.rect.setAlpha(1);
    this.label.setAlpha(1);
    this.hpBar.setVisible(false);
    this.hpBarBg.setVisible(false);
    // tween kembali ke posisi asal dengan smooth
    this.scene.tweens.add({
      targets: this,
      x: this.homeX, y: this.homeY,
      duration: 600, ease: 'Quad.inOut',
      onUpdate: () => this.updateVisualPositions()
    });
  }

  // range dalam pixel (range tile * cellSize + sedikit margin)
  rangePx() {
    return this.stats.range * CONFIG.grid.cellSize + 8;
  }

  updateVisualPositions() {
    this.rect.setPosition(this.x, this.y);
    this.label.setPosition(this.x, this.y);
    this.tierBadge.setPosition(this.x + this.s / 2 - 2, this.y + this.s / 2 - 2);
    this.hpBarBg.setPosition(this.x, this.y - this.s / 2 - 5);
    this.hpBar.setPosition(this.x - this.hpBarW / 2, this.y - this.s / 2 - 5);
  }

  moveTowards(tx, ty, delta) {
    const dx = tx - this.x, dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return;
    const step = 65 * (delta / 1000); // 65 px/s
    if (dist <= step) { this.x = tx; this.y = ty; }
    else { this.x += (dx / dist) * step; this.y += (dy / dist) * step; }
    this.updateVisualPositions();
  }

  update(delta, creeps) {
    if (!this.alive) return;
    this.attackTimer -= delta;

    // cari creep terdekat (tidak peduli jangkauan dulu)
    let nearest = null, nearestDist = Infinity;
    for (const c of creeps) {
      if (c.dead) continue;
      const d = Phaser.Math.Distance.Between(this.x, this.y, c.x, c.y);
      if (d < nearestDist) { nearestDist = d; nearest = c; }
    }

    if (!nearest) {
      // tidak ada musuh — balik ke posisi asal
      this.moveTowards(this.homeX, this.homeY, delta);
      return;
    }

    if (nearestDist <= this.rangePx()) {
      // musuh dalam jangkauan: serang kalau timer siap
      if (this.attackTimer <= 0) {
        this.fire(nearest, creeps);
        this.attackTimer = 1000 / this.stats.atkSpeed;
      }
    } else {
      // musuh di luar jangkauan: kejar
      this.moveTowards(nearest.x, nearest.y, delta);
    }
  }

  fire(target, creeps) {
    const sp = this.stats.special;

    // warna garis serangan berdasarkan skill
    const lineColor =
      sp === 'poison' || sp === 'disease' ? 0x4ade80 :
      sp === 'slow' || sp === 'ensnare' || sp === 'web' ? 0x93c5fd :
      sp === 'curse' ? 0xc084fc :
      sp === 'pierce' ? 0xfde047 :
      sp === 'crit' ? 0xff4444 :
      0xffffff;

    const drawLine = (tx, ty) => {
      const l = this.scene.add.line(0, 0, this.x, this.y, tx, ty, lineColor, 0.85)
        .setOrigin(0, 0).setLineWidth(1.5);
      this.scene.tweens.add({ targets: l, alpha: 0, duration: 150, onComplete: () => l.destroy() });
    };
    drawLine(target.x, target.y);

    // damage dasar ke target
    let dmg = this.dmg;
    if (sp === 'crit' && Math.random() < 0.25) dmg *= 2.5; // crit dihitung dulu
    target.takeDamage(dmg);

    // efek skill
    if (sp === 'slow')      target.applySlow(0.35, 2500);
    else if (sp === 'poison')   target.applyPoison(this.dmg * 0.6, 3000);
    else if (sp === 'ensnare')  target.applyRoot(1500);
    else if (sp === 'web')      target.applyRoot(2000);
    else if (sp === 'curse')    target.applyCurse(8, 3000);
    else if (sp === 'pulverize' && Math.random() < 0.4) target.applySlow(0.5, 3000);
    else if (sp === 'devour') {
      // heal unit sebesar 35% dari dmg didealt
      this.hp = Math.min(this.maxHp, this.hp + this.dmg * 0.35);
      const pct = this.hp / this.maxHp;
      this.hpBarBg.setVisible(true);
      this.hpBar.setVisible(pct < 1).width = this.hpBarW * pct;
      this.hpBar.fillColor = pct < 0.3 ? CONFIG.colors.hpLow : pct < 0.6 ? CONFIG.colors.hpMid : CONFIG.colors.hpFull;
      if (pct >= 1) { this.hpBarBg.setVisible(false); this.hpBar.setVisible(false); }
    }
    else if (sp === 'splash') {
      for (const c of creeps) {
        if (c === target || c.dead) continue;
        if (Phaser.Math.Distance.Between(target.x, target.y, c.x, c.y) <= CONFIG.grid.cellSize * 1.5) {
          c.takeDamage(this.dmg * 0.5);
        }
      }
    }
    else if (sp === 'cleave') {
      // tebas 2 creep terdekat dari unit (selain target) dengan 60% dmg
      const others = creeps.filter(c => c !== target && !c.dead)
        .sort((a, b) => Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y) - Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y))
        .slice(0, 2);
      for (const c of others) { drawLine(c.x, c.y); c.takeDamage(this.dmg * 0.6); }
    }
    else if (sp === 'stomp') {
      // slow semua creep dalam radius 2 tile dari unit ini
      const r2 = CONFIG.grid.cellSize * 2;
      for (const c of creeps) {
        if (c.dead) continue;
        if (Phaser.Math.Distance.Between(this.x, this.y, c.x, c.y) <= r2) c.applySlow(0.5, 2500);
      }
    }
    else if (sp === 'pierce') {
      // peluru menembus semua creep yang ada di garis antara unit dan target
      const dx = target.x - this.x, dy = target.y - this.y;
      const len2 = dx * dx + dy * dy;
      for (const c of creeps) {
        if (c === target || c.dead) continue;
        const t = ((c.x - this.x) * dx + (c.y - this.y) * dy) / len2;
        if (t < 0 || t > 1.1) continue;
        const px = this.x + t * dx, py = this.y + t * dy;
        if (Math.hypot(c.x - px, c.y - py) <= 18) c.takeDamage(this.dmg);
      }
    }
    else if (sp === 'disease') {
      // sebarkan poison setengah kekuatan ke creep adjacent target
      for (const c of creeps) {
        if (c === target || c.dead) continue;
        if (Phaser.Math.Distance.Between(target.x, target.y, c.x, c.y) <= CONFIG.grid.cellSize + 4) {
          c.applyPoison(this.dmg * 0.3, 3000);
        }
      }
    }
    else if (sp === 'multishot') {
      // tembak creep kedua terdekat sekaligus
      const second = creeps.filter(c => c !== target && !c.dead)
        .sort((a, b) => Phaser.Math.Distance.Between(this.x, this.y, a.x, a.y) - Phaser.Math.Distance.Between(this.x, this.y, b.x, b.y))[0];
      if (second) { drawLine(second.x, second.y); second.takeDamage(this.dmg); }
    }
  }

  destroy() {
    this.rect.destroy();
    this.label.destroy();
    this.tierBadge.destroy();
    this.hpBar.destroy();
    this.hpBarBg.destroy();
  }
}
