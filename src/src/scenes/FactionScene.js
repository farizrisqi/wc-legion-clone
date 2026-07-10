import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { UNITS, RACES, SKILL_DESC } from '../data/unit.js';
import { gradientBg, glow, heading, body } from '../ui/UI.js';
import { music } from '../audio/Music.js';

export default class FactionScene extends Phaser.Scene {
  constructor() {
    super('FactionScene');
  }

  init(data) {
    this.difficulty = (data && data.difficulty) || 'easy';
  }

  create() {
    const cx = CONFIG.width / 2;
    gradientBg(this);
    this.input.on('pointerdown', () => music.start());

    heading(this, cx, 70, 'PILIH RAS-MU', 44, '#ffffff');
    body(this, cx, 116, 'Tiap ras punya 5 unit. AI akan memakai ras lain secara acak.', 17, '#8b97bd').setOrigin(0.5);

    const keys = Object.keys(RACES);
    const cw = 280, gap = 26;
    const totalW = keys.length * cw + (keys.length - 1) * gap;
    let x = cx - totalW / 2 + cw / 2;
    keys.forEach((key, i) => {
      this.makeCard(x, 400, key, i * 90);
      x += cw + gap;
    });
  }

  makeCard(x, y, raceKey, delay) {
    const race = RACES[raceKey];
    const color = race.color;
    const hex = '#' + color.toString(16).padStart(6, '0');
    const w = 280, h = 440;
    const c = this.add.container(x, y);

    const g = this.add.graphics();
    g.fillStyle(0x141d33, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    g.lineStyle(3, color, 0.85); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
    c.add(g);
    glow(this, g, color, 6);

    const icon = this.add.image(0, -150, 'roundsquare').setDisplaySize(80, 80).setTint(color);
    glow(this, icon, color, 8);
    c.add(icon);

    c.add(this.add.text(0, -85, race.name, { fontFamily: CONFIG.fonts.heading, fontSize: '26px', color: hex, fontStyle: 'bold' }).setOrigin(0.5));
    c.add(this.add.text(0, -55, race.theme, { fontFamily: CONFIG.fonts.body, fontSize: '15px', color: '#8b97bd' }).setOrigin(0.5));

    // daftar unit + desc skill
    Object.values(UNITS[raceKey]).forEach((u, i) => {
      const yOff = -18 + i * 42;
      c.add(this.add.text(-w / 2 + 20, yOff, `${u.name}`, {
        fontFamily: CONFIG.fonts.body, fontSize: '15px', color: '#e2e8f0', fontStyle: 'bold'
      }));
      c.add(this.add.text(w / 2 - 14, yOff + 1, `${u.cost}g`, {
        fontFamily: CONFIG.fonts.heading, fontSize: '13px', color: '#fde68a', fontStyle: 'bold'
      }).setOrigin(1, 0));
      const descText = u.special ? `★ ${SKILL_DESC[u.special] || u.special}` : 'Serangan biasa';
      const descColor = u.special ? '#fbbf24' : '#4b5a7a';
      c.add(this.add.text(-w / 2 + 20, yOff + 18, descText, {
        fontFamily: CONFIG.fonts.body, fontSize: '12px', color: descColor,
        wordWrap: { width: w - 32 }
      }));
    });

    c.setSize(w, h).setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    c.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.04, duration: 150, ease: 'Quad.out' }));
    c.on('pointerout', () => this.tweens.add({ targets: c, scale: 1, duration: 150, ease: 'Quad.out' }));
    c.on('pointerdown', () => this.scene.start('GameScene', { faction: raceKey, difficulty: this.difficulty }));

    c.setAlpha(0); c.y += 30;
    this.tweens.add({ targets: c, alpha: 1, y: '-=30', duration: 420, delay, ease: 'Quad.out' });
  }
}
