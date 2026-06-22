import Phaser from 'phaser';
import { CONFIG } from '../config.js';

const F = CONFIG.fonts;

// Latar gradient lembut untuk seluruh scene
export function gradientBg(scene) {
  const g = scene.add.graphics();
  g.fillGradientStyle(CONFIG.colors.bgTop, CONFIG.colors.bgTop, CONFIG.colors.bgBottom, CONFIG.colors.bgBottom, 1);
  g.fillRect(0, 0, CONFIG.width, CONFIG.height);
  // sedikit "bintang" halus di latar
  g.fillStyle(0xffffff, 0.06);
  for (let i = 0; i < 40; i++) {
    g.fillCircle(Math.random() * CONFIG.width, Math.random() * CONFIG.height, Math.random() * 1.5);
  }
  return g;
}

// Panel rounded. Mengembalikan objek graphics.
export function panel(scene, x, y, w, h, opts = {}) {
  const {
    radius = 14, fill = CONFIG.colors.panel, fillAlpha = 1,
    stroke = CONFIG.colors.panelBorder, strokeWidth = 2, strokeAlpha = 1
  } = opts;
  const g = scene.add.graphics();
  if (fill !== null) { g.fillStyle(fill, fillAlpha); g.fillRoundedRect(x, y, w, h, radius); }
  if (stroke !== null && strokeWidth > 0) { g.lineStyle(strokeWidth, stroke, strokeAlpha); g.strokeRoundedRect(x, y, w, h, radius); }
  return g;
}

// Glow lembut (hanya jika renderer WebGL). Aman dipanggil di canvas.
export function glow(scene, obj, color = 0xffffff, outer = 6) {
  if (scene.renderer && scene.renderer.type === Phaser.WEBGL && obj.postFX) {
    try { obj.postFX.addGlow(color, outer, 0, false, 0.1, 12); } catch (e) { /* abaikan */ }
  }
  return obj;
}

export function heading(scene, x, y, text, size = 32, color = '#e6edff') {
  return scene.add.text(x, y, text, {
    fontFamily: F.heading, fontSize: `${size}px`, color, fontStyle: 'bold'
  }).setOrigin(0.5);
}

export function body(scene, x, y, text, size = 16, color = '#aab6d8') {
  return scene.add.text(x, y, text, { fontFamily: F.body, fontSize: `${size}px`, color });
}

// Tombol interaktif rounded dengan hover. Mengembalikan container.
export function button(scene, x, y, w, h, label, opts = {}) {
  const { color = CONFIG.colors.accent, textColor = '#06121f', fontSize = 26, onClick } = opts;
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(color, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2.6);
  const t = scene.add.text(0, 0, label, {
    fontFamily: F.heading, fontSize: `${fontSize}px`, color: textColor, fontStyle: 'bold'
  }).setOrigin(0.5);
  c.add([g, t]);
  c.setSize(w, h).setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  glow(scene, g, color, 5);
  c.on('pointerover', () => scene.tweens.add({ targets: c, scale: 1.06, duration: 120, ease: 'Quad.out' }));
  c.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 120, ease: 'Quad.out' }));
  if (onClick) c.on('pointerdown', onClick);
  return c;
}

// "Pill" kecil untuk info HUD (label + nilai). Mengembalikan text nilai agar bisa diupdate.
export function pill(scene, x, y, w, h, label, color = CONFIG.colors.accent) {
  panel(scene, x, y, w, h, { radius: h / 2, fill: 0x10172e, stroke: color, strokeWidth: 2, strokeAlpha: 0.6 });
  const t = scene.add.text(x + w / 2, y + h / 2, label, {
    fontFamily: F.heading, fontSize: '18px', color: '#e6edff', fontStyle: 'bold'
  }).setOrigin(0.5);
  return t;
}
