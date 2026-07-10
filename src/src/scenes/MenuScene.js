import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { gradientBg, panel, glow, button, heading, body } from '../ui/UI.js';
import { music } from '../audio/Music.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const cx = CONFIG.width / 2;
    gradientBg(this);

    // musik mulai saat interaksi pertama (kebijakan autoplay browser)
    this.input.on('pointerdown', () => music.start());
    music.setMood('prep');

    // tombol mute (kiri atas)
    const muteBtn = this.add.text(20, 18, music.muted ? '🔇 Musik' : '🔊 Musik', {
      fontFamily: CONFIG.fonts.body, fontSize: '18px', color: '#9fd0ff', fontStyle: 'bold'
    }).setInteractive({ useHandCursor: true });
    muteBtn.on('pointerdown', () => {
      music.start();
      muteBtn.setText(music.toggleMute() ? '🔇 Musik' : '🔊 Musik');
    });

    // dua "lambang" legion mengapit judul
    const west = this.add.image(cx - 320, 200, 'roundsquare').setDisplaySize(70, 70).setTint(CONFIG.colors.westUnit);
    const east = this.add.image(cx + 320, 200, 'roundsquare').setDisplaySize(70, 70).setTint(CONFIG.colors.eastUnit);
    glow(this, west, CONFIG.colors.westUnit, 8);
    glow(this, east, CONFIG.colors.eastUnit, 8);
    this.tweens.add({ targets: [west, east], y: '+=12', yoyo: true, repeat: -1, duration: 1600, ease: 'Sine.inOut' });

    // tombol layar penuh (membantu di HP)
    const fsBtn = this.add.text(CONFIG.width - 20, 18, '⛶ Layar Penuh', {
      fontFamily: CONFIG.fonts.body, fontSize: '18px', color: '#9fd0ff', fontStyle: 'bold'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    fsBtn.on('pointerdown', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
      try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* abaikan */ }
    });

    const title = heading(this, cx, 180, 'LEGION TD', 84, '#ffffff');
    glow(this, title, CONFIG.colors.accent, 10);
    const sub = heading(this, cx, 248, 'WEB CLONE', 30, '#7dd3fc');
    sub.setAlpha(0.9);

    // panel info
    panel(this, cx - 320, 330, 640, 150, { radius: 18, fill: 0x131b34, fillAlpha: 0.85 });
    body(this, cx - 290, 352, 'Cara main:', 20, '#9fb0d8').setFontStyle('bold');
    body(this, cx - 290, 384, '• Pilih unit di toko, klik petak untuk menaruh pasukan', 17);
    body(this, cx - 290, 412, '• Tahan King-mu dari serangan creep tiap wave', 17);
    body(this, cx - 290, 440, '• Hancurkan King lawan (AI) untuk menang!', 17);

    // pilihan kesulitan
    heading(this, cx, 512, 'PILIH KESULITAN', 22, '#9fb0d8');
    const diffs = [
      { key: 'easy', label: 'EASY', color: 0x4ade80, desc: 'AI standar' },
      { key: 'normal', label: 'NORMAL', color: 0xfbbf24, desc: '+1 lumber, +10 gold/ronde' },
      { key: 'hard', label: 'HARD', color: 0xf87171, desc: '+2 lumber, +20 gold/ronde' }
    ];
    const btns = [];
    diffs.forEach((d, i) => {
      const x = cx + (i - 1) * 290;
      const b = button(this, x, 565, 250, 64, d.label, {
        color: d.color, fontSize: 24, onClick: () => this.scene.start('FactionScene', { difficulty: d.key })
      });
      body(this, x, 605, d.desc, 13, '#8b97bd').setOrigin(0.5);
      btns.push(b);
    });

    // animasi masuk
    [title, sub].forEach((o, i) => {
      o.setAlpha(0); o.y -= 20;
      this.tweens.add({ targets: o, alpha: 1, y: '+=20', duration: 500, delay: i * 120, ease: 'Quad.out' });
    });
    btns.forEach((b, i) => {
      b.setScale(0.6); b.setAlpha(0);
      this.tweens.add({ targets: b, scale: 1, alpha: 1, duration: 400, delay: 300 + i * 100, ease: 'Back.out' });
    });

    body(this, cx, 660, 'v1.0  •  4 Ras  •  Upgrade Unit & King  •  Player vs AI', 14, '#5b6890')
      .setOrigin(0.5);
  }
}
