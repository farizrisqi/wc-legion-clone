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

  // dipanggil tiap awal ronde: hidupkan kembali dengan HP penuh
  respawn() {
    this.alive = true;
    this.hp = this.maxHp;
    this.attackTimer = 0;
    this.rect.setAlpha(1);
    this.label.setAlpha(1);
    this.hpBar.setVisible(false);
    this.hpBarBg.setVisible(false);
  }

  // range dalam pixel (range tile * cellSize + sedikit margin)
  rangePx() {
    return this.stats.range * CONFIG.grid.cellSize + 8;
  }

  update(delta, creeps) {
    if (!this.alive) return; // unit mati tidak menyerang
    this.attackTimer -= delta;
    if (this.attackTimer > 0) return;

    // cari creep terdekat dalam range
    let target = null;
    let best = Infinity;
    const r = this.rangePx();
    for (const c of creeps) {
      if (c.dead) continue;
      const d = Phaser.Math.Distance.Between(this.x, this.y, c.x, c.y);
      if (d <= r && d < best) { best = d; target = c; }
    }
    if (!target) return;

    this.fire(target, creeps);
    this.attackTimer = 1000 / this.stats.atkSpeed;
  }

  fire(target, creeps) {
    // visual tembakan: garis singkat yang memudar
    const line = this.scene.add.line(0, 0, this.x, this.y, target.x, target.y, 0xffffff, 0.8)
      .setOrigin(0, 0).setLineWidth(1.5);
    this.scene.tweens.add({ targets: line, alpha: 0, duration: 150, onComplete: () => line.destroy() });

    target.takeDamage(this.dmg);

    // special abilities
    const sp = this.stats.special;
    if (sp === 'slow') target.applySlow(0.3, 2000);
    else if (sp === 'poison') target.applyPoison(this.dmg * 0.6, 3000);
    else if (sp === 'splash' || sp === 'cleave') {
      // damage setengah ke creep dalam 1 tile dari target
      for (const c of creeps) {
        if (c === target || c.dead) continue;
        if (Phaser.Math.Distance.Between(target.x, target.y, c.x, c.y) <= CONFIG.grid.cellSize + 8) {
          c.takeDamage(this.dmg * 0.5);
        }
      }
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
