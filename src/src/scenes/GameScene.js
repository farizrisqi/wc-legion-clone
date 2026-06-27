import Phaser from 'phaser';
import { CONFIG } from '../config.js';
import { UNITS, RACES } from '../data/unit.js';
import { CREEPS } from '../data/creeps.js';
import { WAVES } from '../data/waves.js';
import Board from '../game/Board.js';
import Creep from '../game/Creep.js';
import King from '../game/King.js';
import { gradientBg, panel, glow, pill } from '../ui/UI.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.playerFaction = data.faction || 'human';
    // AI pilih ras acak yang berbeda dari player
    const others = Object.keys(UNITS).filter(r => r !== this.playerFaction);
    this.aiFaction = others[Math.floor(Math.random() * others.length)];
    this.playerColor = RACES[this.playerFaction].color;
    this.aiColor = RACES[this.aiFaction].color;

    // tingkat kesulitan AI
    this.diffKey = data.difficulty || 'easy';
    this.diff = CONFIG.difficulties[this.diffKey] || CONFIG.difficulties.easy;
  }

  create() {
    this.gameOver = false;
    this.wave = 1;
    this.phase = 'prep';
    this.timer = CONFIG.timings.prepPhase;
    this.selectedKey = null;
    this.unitPopup = null;
    this.statsPopup = null;

    gradientBg(this);

    // --- Board & King ---
    this.playerBoard = new Board(this, CONFIG.boardWest, true, this.playerColor);
    this.enemyBoard = new Board(this, CONFIG.boardEast, false, this.aiColor);
    this.playerKing = new King(this, this.playerBoard, 'KAMU', this.playerColor);
    this.enemyKing = new King(this, this.enemyBoard, 'AI', this.aiColor);

    // lane = kumpulan creep di tiap board. pendingSends = creep kiriman yg masuk wave berikut
    this.playerLane = { board: this.playerBoard, king: this.playerKing, creeps: [], queue: [], kills: 0, pendingSends: [] };
    this.enemyLane = { board: this.enemyBoard, king: this.enemyKing, creeps: [], queue: [], kills: 0, pendingSends: [] };

    // --- Economy ---
    this.playerGold = CONFIG.economy.startGold;
    this.aiGold = CONFIG.economy.startGold;
    this.playerLumber = CONFIG.economy.startLumber;
    this.aiLumber = CONFIG.economy.startLumber;
    this.playerWisps = 0;
    this.aiWisps = 0;
    // bonus income gold/wave dari lumber yang dibelanjakan (kirim creep / upgrade king)
    this.playerIncomeBonus = 0;
    this.aiIncomeBonus = 0;

    // --- Labels board (pill) ---
    this.boardLabel(this.playerBoard, `KAMU — ${RACES[this.playerFaction].name}`, this.playerColor);
    this.boardLabel(this.enemyBoard, `AI — ${RACES[this.aiFaction].name}`, this.aiColor);

    this.buildHUD();
    this.buildShop();
    this.buildControlPanel();
    this.buildHoverHighlight();

    this.input.on('pointerdown', (p) => this.onClick(p));
    this.input.on('pointermove', (p) => this.onMove(p));

    this.startPrep();
  }

  boardLabel(board, text, color) {
    const w = board.cols * board.cellSize;
    const x = board.origin.x + w / 2;
    pill(this, board.origin.x, 112, w, 30, text, color);
  }

  // ---------- HUD ----------
  buildHUD() {
    // panel atas
    panel(this, 20, 16, 380, 52, { radius: 14, fill: 0x121a30, fillAlpha: 0.9 });
    this.add.text(40, 30, 'WAVE', { fontFamily: CONFIG.fonts.body, fontSize: '14px', color: '#7c89b3' });
    this.waveText = this.add.text(40, 44, '1', { fontFamily: CONFIG.fonts.heading, fontSize: '20px', color: '#ffffff', fontStyle: 'bold' });

    this.add.image(150, 44, 'disc').setDisplaySize(20, 20).setTint(CONFIG.colors.gold);
    this.add.text(166, 30, 'GOLD', { fontFamily: CONFIG.fonts.body, fontSize: '14px', color: '#7c89b3' });
    this.goldText = this.add.text(166, 44, '100', { fontFamily: CONFIG.fonts.heading, fontSize: '20px', color: '#fde68a', fontStyle: 'bold' });

    this.add.image(290, 44, 'disc').setDisplaySize(20, 20).setTint(CONFIG.colors.hpFull);
    this.add.text(306, 30, 'LUMBER', { fontFamily: CONFIG.fonts.body, fontSize: '14px', color: '#7c89b3' });
    this.lumberText = this.add.text(306, 44, '0', { fontFamily: CONFIG.fonts.heading, fontSize: '20px', color: '#bbf7d0', fontStyle: 'bold' });

    // pill fase di tengah atas
    this.phaseText = pill(this, CONFIG.width / 2 - 130, 22, 260, 40, '', CONFIG.colors.gold);

    // indikator difficulty (kanan atas)
    this.add.text(CONFIG.width - 24, 14, `AI: ${this.diff.name}`, {
      fontFamily: CONFIG.fonts.heading, fontSize: '15px', color: '#fca5a5', fontStyle: 'bold'
    }).setOrigin(1, 0);

    // tombol lihat statistik unit
    const statsBtn = this.add.text(CONFIG.width - 24, 40, '📊 Stats Unit', {
      fontFamily: CONFIG.fonts.body, fontSize: '16px', color: '#9fd0ff', fontStyle: 'bold'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    statsBtn.on('pointerover', () => statsBtn.setColor('#ffffff'));
    statsBtn.on('pointerout', () => statsBtn.setColor('#9fd0ff'));
    statsBtn.on('pointerdown', () => this.openStatsPopup());

    this.updateHUD();
  }

  updateHUD() {
    this.waveText.setText(`${this.wave}`);
    this.goldText.setText(`${Math.floor(this.playerGold)}`);
    this.lumberText.setText(`${Math.floor(this.playerLumber)}`);
  }

  // ---------- Shop ----------
  buildShop() {
    this.shopY = 624;
    this.shopH = 84;
    this.shopButtons = [];
    panel(this, 12, this.shopY - 8, CONFIG.width - 24, this.shopH + 16, { radius: 16, fill: 0x10172c, fillAlpha: 0.92 });

    const roster = Object.values(UNITS[this.playerFaction]);
    const color = this.playerColor;
    const startX = 24, bw = 224, gap = 12;
    roster.forEach((stats, i) => {
      const x = startX + i * (bw + gap);
      panel(this, x, this.shopY, bw, this.shopH, { radius: 12, fill: 0x182238, stroke: 0x2e3a5c, strokeWidth: 2 });
      const icon = this.add.image(x + 30, this.shopY + this.shopH / 2, 'roundsquare').setDisplaySize(36, 36).setTint(color);
      this.add.text(x + 56, this.shopY + 12, stats.name, { fontFamily: CONFIG.fonts.heading, fontSize: '15px', color: '#e6edff', fontStyle: 'bold' });
      this.add.text(x + 56, this.shopY + 36, `DMG ${stats.dmg}  •  RNG ${stats.range}`, { fontFamily: CONFIG.fonts.body, fontSize: '13px', color: '#9aa6cc' });
      this.add.text(x + 56, this.shopY + 56, stats.special ? `★ ${stats.special}` : 'serangan biasa', { fontFamily: CONFIG.fonts.body, fontSize: '12px', color: stats.special ? '#fbbf24' : '#6b779c' });
      // badge harga
      const badgeX = x + bw - 16;
      this.add.text(badgeX, this.shopY + 10, `${stats.cost}g`, { fontFamily: CONFIG.fonts.heading, fontSize: '16px', color: '#fde68a', fontStyle: 'bold' }).setOrigin(1, 0);
      this.shopButtons.push({ stats, x, bw, icon });
    });

    // highlight pemilihan
    this.selectGfx = this.add.graphics();

    // info kontrol
    this.add.text(CONFIG.width / 2, this.shopY + this.shopH + 14,
      'Klik unit → klik petak untuk menaruh   •   Klik unit terpasang = upgrade / jual',
      { fontFamily: CONFIG.fonts.body, fontSize: '13px', color: '#6b779c' }).setOrigin(0.5, 0);
  }

  highlightShop() {
    this.selectGfx.clear();
    this.shopButtons.forEach(b => {
      const afford = this.playerGold >= b.stats.cost;
      b.icon.setAlpha(afford ? 1 : 0.4);
      if (this.selectedKey === b.stats.key) {
        this.selectGfx.lineStyle(3, CONFIG.colors.gold, 1);
        this.selectGfx.strokeRoundedRect(b.x, this.shopY, b.bw, this.shopH, 12);
      }
    });
  }

  buildHoverHighlight() {
    this.hoverRect = this.add.rectangle(0, 0, CONFIG.grid.cellSize - 4, CONFIG.grid.cellSize - 4, CONFIG.colors.hoverCell, 0.45)
      .setStrokeStyle(2, CONFIG.colors.accent, 0.6).setVisible(false);
  }

  // ---------- Panel kontrol tengah (info wave + lumber + kirim creep + upgrade king) ----------
  buildControlPanel() {
    const px = 452, pw = 296;
    const cx = px + pw / 2;
    panel(this, px, 150, pw, 458, { radius: 16, fill: 0x10172c, fillAlpha: 0.92, stroke: 0x2e3a5c });
    const div = (y) => { const g = this.add.graphics(); g.lineStyle(1, 0x2e3a5c, 1); g.lineBetween(px + 14, y, px + pw - 14, y); };
    const h = (y, s, color) => this.add.text(cx, y, s, { fontFamily: CONFIG.fonts.heading, fontSize: '13px', color, fontStyle: 'bold' }).setOrigin(0.5, 0);

    // --- Info gelombang berikutnya ---
    h(158, 'GELOMBANG BERIKUTNYA', '#9fb0d8');
    this.waveInfoText = this.add.text(px + 16, 180, '', { fontFamily: CONFIG.fonts.body, fontSize: '14px', color: '#c3cdee', lineSpacing: 2 });
    this.incomingText = this.add.text(cx, 244, '', { fontFamily: CONFIG.fonts.body, fontSize: '13px', color: '#fca5a5', fontStyle: 'bold', align: 'center' }).setOrigin(0.5, 0);

    // --- Lumber, Wisp, Income ---
    div(268);
    h(274, '⬢ LUMBER  &  INCOME', '#86efac');
    this.lumberInfo = this.add.text(px + 16, 296, '', { fontFamily: CONFIG.fonts.body, fontSize: '13px', color: '#c3cdee', lineSpacing: 2 });
    this.wispBtn = this.smallBtn(px + 16, 338, pw - 32, 28, '', CONFIG.colors.hpFull, () => this.buyWisp());

    // --- Kirim creep ke musuh ---
    div(374);
    h(380, 'KIRIM CREEP KE MUSUH', '#fca5a5');
    this.sendBtns = [];
    const opts = CONFIG.sendOptions;
    const sbw = (pw - 32 - (opts.length - 1) * 8) / opts.length;
    opts.forEach((o, i) => {
      const bx = px + 16 + i * (sbw + 8);
      const b = this.smallBtn(bx, 400, sbw, 40, `${o.name}\n${o.lumber}⬢`, CONFIG.colors.eastUnit, () => this.buySend(o));
      b.opt = o;
      this.sendBtns.push(b);
    });

    // --- Upgrade King ---
    div(450);
    h(456, '♚ UPGRADE KING', '#fbbf24');
    this.kingBtns = [];
    const ups = [
      { type: 'hp', name: 'HP' },
      { type: 'attack', name: 'ATK' },
      { type: 'regen', name: 'REGEN' }
    ];
    const kbw = (pw - 32 - (ups.length - 1) * 8) / ups.length;
    ups.forEach((u, i) => {
      const bx = px + 16 + i * (kbw + 8);
      const b = this.smallBtn(bx, 476, kbw, 42, '', CONFIG.colors.gold, () => this.buyKingUpgrade(u.type));
      b.upType = u.type;
      b.upName = u.name;
      this.kingBtns.push(b);
    });
    this.kingStatText = this.add.text(cx, 524, '', { fontFamily: CONFIG.fonts.body, fontSize: '12px', color: '#9aa6cc', align: 'center' }).setOrigin(0.5, 0);
  }

  // tombol kecil generik -> {c, g, t, setLabel, setEnabled}
  smallBtn(x, y, w, h, label, color, onClick) {
    const g = this.add.graphics();
    g.fillStyle(color, 1); g.fillRoundedRect(x, y, w, h, 8);
    const t = this.add.text(x + w / 2, y + h / 2, label, { fontFamily: CONFIG.fonts.body, fontSize: '13px', color: '#06121f', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
    const zone = this.add.zone(x, y, w, h).setOrigin(0).setInteractive();
    const state = { enabled: true };
    zone.on('pointerdown', onClick);
    zone.on('pointerover', () => { if (state.enabled) g.setAlpha(0.82); });
    zone.on('pointerout', () => { if (state.enabled) g.setAlpha(1); });
    return {
      g, t, color, x, y, w, h,
      setLabel: (s) => t.setText(s),
      setEnabled: (en) => { state.enabled = en; g.setAlpha(en ? 1 : 0.35); zone.input.enabled = en; }
    };
  }

  updateWaveInfo() {
    const comp = this.getWaveComposition(this.wave).concat(this.buildWaveExtras(this.wave));
    const hpMult = this.waveHpMult(this.wave);
    const counts = {};
    comp.forEach(k => counts[k] = (counts[k] || 0) + 1);
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const lines = Object.keys(counts).map(k => `${counts[k]}×  ${cap(k)}  —  ${Math.round(CREEPS[k].hp * hpMult)} HP`);
    this.waveInfoText.setText(lines.join('\n'));

    const inc = this.playerLane.pendingSends.length;
    this.incomingText.setText(inc > 0 ? `⚠ +${inc} creep kiriman musuh!` : '');
  }

  updateControlPanel() {
    const regen = CONFIG.economy.baseLumber + this.playerWisps;
    const income = CONFIG.economy.baseIncome + this.playerIncomeBonus;
    this.lumberInfo.setText(
      `Lumber: ${Math.floor(this.playerLumber)}  (+${regen}/wave)   Wisp: ${this.playerWisps}\n` +
      `Income: +${income} gold/wave  (bonus +${this.playerIncomeBonus})`
    );
    this.wispBtn.setLabel(`Beli Wisp — ${CONFIG.economy.wispCost}g`);
    const prep = this.phase === 'prep';
    this.wispBtn.setEnabled(prep && this.playerGold >= CONFIG.economy.wispCost);
    this.sendBtns.forEach(b => b.setEnabled(prep && this.playerLumber >= b.opt.lumber));

    // tombol upgrade king
    const k = this.playerKing;
    this.kingBtns.forEach(b => {
      const cost = k.upgradeCost(b.upType);
      b.setLabel(`${b.upName}\n${cost}⬢`);
      b.setEnabled(prep && this.playerLumber >= cost);
    });
    this.kingStatText.setText(`HP ${k.maxHp}  •  ATK ${k.dmg}  •  Regen ${k.regen.toFixed(1)}/s`);
  }

  buyKingUpgrade(type) {
    if (this.phase !== 'prep') return;
    const cost = this.playerKing.upgradeCost(type);
    if (this.playerLumber < cost) return;
    this.playerLumber -= cost;
    this.playerKing.applyUpgrade(type);
    this.playerIncomeBonus += cost * CONFIG.economy.incomePerLumber;
    this.updateHUD();
    this.updateControlPanel();
    const names = { hp: 'HP', attack: 'Attack', regen: 'Regen' };
    this.notify(`King upgrade ${names[type]}!  Income +${cost * CONFIG.economy.incomePerLumber}/wave`, CONFIG.colors.gold);
  }

  buyWisp() {
    if (this.phase !== 'prep' || this.playerGold < CONFIG.economy.wispCost) return;
    this.playerGold -= CONFIG.economy.wispCost;
    this.playerWisps++;
    this.updateHUD();
    this.updateControlPanel();
    this.notify(`Wisp dibeli! Regen lumber +${CONFIG.economy.wispLumber}/wave`, CONFIG.colors.hpFull);
  }

  buySend(opt) {
    if (this.phase !== 'prep' || this.playerLumber < opt.lumber) return;
    this.playerLumber -= opt.lumber;
    this.enemyLane.pendingSends.push(opt.key);
    this.playerIncomeBonus += opt.lumber * CONFIG.economy.incomePerLumber;
    this.updateHUD();
    this.updateControlPanel();
    this.notify(`Kirim ${opt.name} ke musuh!  Income +${opt.lumber * CONFIG.economy.incomePerLumber}/wave`, CONFIG.colors.eastUnit);
  }

  // toast notifikasi melayang di tengah atas
  notify(msg, color = CONFIG.colors.gold) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    const t = this.add.text(CONFIG.width / 2, 92, msg, {
      fontFamily: CONFIG.fonts.body, fontSize: '20px', color: hex, fontStyle: 'bold',
      backgroundColor: '#0b1020cc', padding: { x: 14, y: 7 }, align: 'center'
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({ targets: t, y: 70, alpha: 0, duration: 2200, ease: 'Quad.in', onComplete: () => t.destroy() });
  }

  // ---------- Input ----------
  onClick(p) {
    if (this.gameOver) return;
    if (this.statsPopup) return; // overlay stats menutup sendiri lewat klik

    // jika popup unit terbuka, semua klik ditujukan ke popup
    if (this.unitPopup) { this.handlePopupClick(p); return; }

    // klik shop
    for (const b of this.shopButtons) {
      if (p.x >= b.x && p.x <= b.x + b.bw && p.y >= this.shopY && p.y <= this.shopY + this.shopH) {
        this.selectedKey = this.selectedKey === b.stats.key ? null : b.stats.key;
        this.highlightShop();
        return;
      }
    }

    // hanya bisa atur unit saat prep, di board sendiri
    if (this.phase !== 'prep') return;
    if (!this.playerBoard.contains(p.x, p.y)) return;
    const cell = this.playerBoard.pixelToCell(p.x, p.y);
    if (!cell) return;

    const existing = this.playerBoard.grid[cell.row][cell.col];
    if (existing) {
      // buka panel upgrade/jual
      this.openUnitPopup(cell, existing);
      return;
    }

    if (!this.selectedKey) return;
    const stats = UNITS[this.playerFaction][this.selectedKey];
    if (this.playerGold < stats.cost) return;
    if (!this.playerBoard.canPlace(cell.col, cell.row)) return;

    this.playerBoard.placeUnit(stats, this.playerFaction, cell.col, cell.row);
    this.playerGold -= stats.cost;
    this.updateHUD();
    this.highlightShop();
    this.updateControlPanel();
  }

  onMove(p) {
    if (this.phase === 'prep' && !this.unitPopup && this.playerBoard.contains(p.x, p.y)) {
      const cell = this.playerBoard.pixelToCell(p.x, p.y);
      if (cell) {
        const px = this.playerBoard.cellToPixel(cell.col, cell.row);
        this.hoverRect.setPosition(px.x, px.y).setVisible(true);
        return;
      }
    }
    this.hoverRect.setVisible(false);
  }

  // ---------- Popup upgrade/jual unit ----------
  openUnitPopup(cell, unit) {
    this.closeUnitPopup();
    const w = 220, h = 152;
    let x = Phaser.Math.Clamp(unit.x - w / 2, 8, CONFIG.width - w - 8);
    let y = Phaser.Math.Clamp(unit.y - h - 14, 76, CONFIG.height - h - 8);
    const objs = [];
    const T = (tx, ty, s, size, color, origin) => {
      const t = this.add.text(tx, ty, s, { fontFamily: CONFIG.fonts.heading, fontSize: `${size}px`, color, fontStyle: 'bold' });
      if (origin) t.setOrigin(origin[0], origin[1]);
      objs.push(t); return t;
    };

    objs.push(panel(this, x, y, w, h, { radius: 12, fill: 0x0e1730, fillAlpha: 0.98, stroke: this.playerColor, strokeWidth: 2 }));
    T(x + 14, y + 10, `${unit.stats.name}  T${unit.tier}`, 16, '#ffffff');
    T(x + 14, y + 34, `HP ${unit.maxHp}    DMG ${unit.dmg}`, 13, '#aab6d8');

    const bw = w - 28, bh = 34;
    // tombol upgrade
    const upB = { x: x + 14, y: y + 58, w: bw, h: bh };
    const cost = unit.upgradeCost();
    const canUp = unit.canUpgrade() && this.playerGold >= cost;
    const upG = this.add.graphics();
    upG.fillStyle(canUp ? CONFIG.colors.gold : 0x3a4154, 1);
    upG.fillRoundedRect(upB.x, upB.y, upB.w, upB.h, 8); objs.push(upG);
    T(upB.x + bw / 2, upB.y + bh / 2, unit.canUpgrade() ? `Upgrade → T${unit.tier + 1}  (${cost}g)` : 'TIER MAKS', 14, canUp ? '#06121f' : '#8b94ad', [0.5, 0.5]);

    // tombol jual
    const sB = { x: x + 14, y: y + 100, w: bw, h: bh };
    const refund = Math.floor(unit.invested * 0.75);
    const sG = this.add.graphics();
    sG.fillStyle(0xef4444, 1); sG.fillRoundedRect(sB.x, sB.y, sB.w, sB.h, 8); objs.push(sG);
    T(sB.x + bw / 2, sB.y + bh / 2, `Jual  (+${refund}g)`, 14, '#ffffff', [0.5, 0.5]);

    objs.forEach(o => o.setDepth(200));
    this.unitPopup = { cell, unit, objs, upBounds: upB, sellBounds: sB, canUp };
  }

  closeUnitPopup() {
    if (!this.unitPopup) return;
    this.unitPopup.objs.forEach(o => o.destroy());
    this.unitPopup = null;
  }

  // ---------- Popup statistik unit (kita & lawan) ----------
  openStatsPopup() {
    if (this.statsPopup) return;
    this.closeUnitPopup();
    const objs = [];
    const overlay = this.add.rectangle(CONFIG.width / 2, CONFIG.height / 2, CONFIG.width, CONFIG.height, 0x05080f, 0.82).setInteractive();
    overlay.on('pointerdown', () => this.closeStatsPopup());
    objs.push(overlay);

    const pw = 940, ph = 470;
    const x = CONFIG.width / 2 - pw / 2, y = CONFIG.height / 2 - ph / 2;
    objs.push(panel(this, x, y, pw, ph, { radius: 18, fill: 0x121a30, fillAlpha: 0.99, stroke: CONFIG.colors.accent, strokeWidth: 2 }));
    objs.push(this.add.text(CONFIG.width / 2, y + 16, 'STATISTIK UNIT  (stat dasar / Tier 1)', {
      fontFamily: CONFIG.fonts.heading, fontSize: '24px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5, 0));

    this.addStatsColumn(objs, x + 28, y + 64, this.playerFaction, this.playerColor, 'UNIT-MU');
    this.addStatsColumn(objs, x + pw / 2 + 8, y + 64, this.aiFaction, this.aiColor, 'UNIT LAWAN');

    // info scaling creep saat ini (berlaku untuk kedua lane)
    const hb = Math.round((this.waveHpMult(this.wave) - 1) * 100);
    const db = Math.round((this.waveDmgMult(this.wave) - 1) * 100);
    objs.push(this.add.text(CONFIG.width / 2, y + ph - 56, `⚠ Creep wave ${this.wave}: +${hb}% HP, +${db}% DMG (naik tiap wave)`, {
      fontFamily: CONFIG.fonts.body, fontSize: '14px', color: '#fca5a5', fontStyle: 'bold'
    }).setOrigin(0.5, 0));

    objs.push(this.add.text(CONFIG.width / 2, y + ph - 30, 'Klik di mana saja untuk menutup', {
      fontFamily: CONFIG.fonts.body, fontSize: '15px', color: '#8b97bd'
    }).setOrigin(0.5));

    objs.forEach(o => o.setDepth(300));
    this.statsPopup = objs;
  }

  addStatsColumn(objs, x, y, faction, color, title) {
    const hex = '#' + color.toString(16).padStart(6, '0');
    objs.push(this.add.text(x, y, `${title} — ${RACES[faction].name}`, {
      fontFamily: CONFIG.fonts.heading, fontSize: '18px', color: hex, fontStyle: 'bold'
    }));
    const pad = (s, n) => String(s).padStart(n);
    const header = `${'Unit'.padEnd(12)}${pad('$', 4)} ${pad('HP', 4)} ${pad('DMG', 4)} ${pad('R', 2)} ${pad('SPD', 4)}  Spesial`;
    const lines = [header, '─'.repeat(48)];
    for (const u of Object.values(UNITS[faction])) {
      lines.push(`${u.name.slice(0, 12).padEnd(12)}${pad(u.cost, 4)} ${pad(u.hp, 4)} ${pad(u.dmg, 4)} ${pad(u.range, 2)} ${pad(u.atkSpeed.toFixed(1), 4)}  ${u.special || '-'}`);
    }
    objs.push(this.add.text(x, y + 30, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '14px', color: '#d3dcf5', lineSpacing: 7
    }));
  }

  closeStatsPopup() {
    if (!this.statsPopup) return;
    this.statsPopup.forEach(o => o.destroy());
    this.statsPopup = null;
  }

  handlePopupClick(p) {
    const pop = this.unitPopup;
    const inB = (b) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
    if (pop.canUp && inB(pop.upBounds)) { this.doUpgradeUnit(); return; }
    if (inB(pop.sellBounds)) { this.doSellUnit(); return; }
    this.closeUnitPopup();
  }

  doUpgradeUnit() {
    if (this.phase !== 'prep') return;
    const { unit, cell } = this.unitPopup;
    const cost = unit.upgradeCost();
    if (!unit.canUpgrade() || this.playerGold < cost) return;
    this.playerGold -= cost;
    unit.upgradeTier();
    this.updateHUD();
    this.updateControlPanel();
    this.openUnitPopup(cell, unit); // refresh tampilan popup (tier/biaya baru)
  }

  doSellUnit() {
    if (this.phase !== 'prep') return;
    const { cell } = this.unitPopup;
    const refund = this.playerBoard.sellUnit(cell.col, cell.row);
    this.playerGold += refund;
    this.closeUnitPopup();
    this.updateHUD();
    this.highlightShop();
    this.updateControlPanel();
  }

  // ---------- Wave / Phase ----------
  startPrep() {
    this.phase = 'prep';
    this.timer = CONFIG.timings.prepPhase;

    // hidupkan kembali semua unit (yang mati saat bertempur) dengan HP penuh
    for (const u of this.playerBoard.units) u.respawn();
    for (const u of this.enemyBoard.units) u.respawn();

    // regen lumber tiap awal prep (dasar + jumlah wisp); AI dapat bonus dari difficulty
    this.playerLumber += CONFIG.economy.baseLumber + this.playerWisps;
    this.aiLumber += CONFIG.economy.baseLumber + this.aiWisps + this.diff.lumber;

    this.runAI(); // AI taruh unit, beli wisp, & kirim creep ke kita

    // beri tahu player kalau kebagian creep kiriman musuh
    if (this.playerLane.pendingSends.length > 0) {
      this.notify(`Musuh mengirim ${this.playerLane.pendingSends.length} creep ke lane-mu!`, CONFIG.colors.eastUnit);
    }

    this.updateHUD();
    this.updateWaveInfo();
    this.updateControlPanel();
  }

  // scaling creep kumulatif tiap wave (HP & DMG)
  waveHpMult(waveNum) {
    return 1 + (waveNum - 1) * CONFIG.creepScale.hpPerWave;
  }
  waveDmgMult(waveNum) {
    return 1 + (waveNum - 1) * CONFIG.creepScale.dmgPerWave;
  }

  // jumlah creep ekstra (tumbuh eksponensial) yang ditambahkan ke KEDUA lane tiap wave
  waveExtraCount(waveNum) {
    const { base, growth, cap } = CONFIG.waveExtra;
    return Math.min(cap, Math.round(base * Math.pow(growth, waveNum - 1)));
  }
  // tipe creep ekstra ikut menguat seiring wave
  waveExtraKey(waveNum) {
    return waveNum >= 12 ? 'brute' : waveNum >= 6 ? 'armored' : 'basic';
  }
  buildWaveExtras(waveNum) {
    return Array(this.waveExtraCount(waveNum)).fill(this.waveExtraKey(waveNum));
  }

  startFight() {
    this.phase = 'fight';
    this.spawnTimer = 0;
    this.closeUnitPopup();
    const comp = this.getWaveComposition(this.wave);
    const hpMult = this.waveHpMult(this.wave);
    const dmgMult = this.waveDmgMult(this.wave);
    const extras = this.buildWaveExtras(this.wave); // sama untuk kedua lane

    for (const lane of [this.playerLane, this.enemyLane]) {
      lane.kills = 0;
      lane.path = lane.board.getPath();
      // gabung wave dasar + creep ekstra (skala wave) + creep kiriman, lalu reset kiriman
      const all = comp.concat(extras).concat(lane.pendingSends);
      lane.queue = all.map(key => ({ key, hpMult, dmgMult }));
      lane.pendingSends = [];
    }
    this.updateControlPanel(); // nonaktifkan tombol saat bertempur
    this.updateWaveInfo();
  }

  endFight() {
    // bounty per-kill sudah diberikan saat creep mati; di akhir wave beri base income + bonus
    this.playerGold += CONFIG.economy.baseIncome + this.playerIncomeBonus;
    this.aiGold += CONFIG.economy.baseIncome + this.aiIncomeBonus + this.diff.income;
    this.updateHUD();

    this.wave++;
    this.startPrep();
  }

  getWaveComposition(waveNum) {
    const idx = (waveNum - 1) % WAVES.length;
    return WAVES[idx];
  }

  // ---------- AI ----------
  runAI() {
    const roster = Object.values(UNITS[this.aiFaction]).sort((a, b) => b.cost - a.cost); // termahal -> termurah
    const cheapest = roster[roster.length - 1].cost;

    // 1) Bangun pertahanan: isi board sampai target yang naik tiap wave (banyak unit)
    const target = Math.min(16, 3 + this.wave);
    let guard = 0;
    while (this.enemyBoard.units.length < target && this.aiGold >= cheapest && guard++ < 60) {
      // pilih unit termahal yg harganya <= 50% gold (biar bisa beli beberapa), fallback termurah
      const affordable = roster.filter(s => this.aiGold >= s.cost);
      if (affordable.length === 0) break;
      const pick = affordable.find(s => s.cost <= this.aiGold * 0.5) || affordable[affordable.length - 1];
      const cell = this.pickAICell(pick);
      if (!cell) break; // tidak ada sel valid lagi
      this.enemyBoard.placeUnit(pick, this.aiFaction, cell.col, cell.row);
      this.aiGold -= pick.cost;
    }

    // 2) Upgrade beberapa unit lama dengan sisa gold (biar ikut menguat)
    let ug = 0;
    while (ug++ < 4) {
      const cands = this.enemyBoard.units.filter(u => u.canUpgrade() && this.aiGold >= u.upgradeCost() + 30);
      if (cands.length === 0) break;
      const u = cands[Phaser.Math.Between(0, cands.length - 1)];
      this.aiGold -= u.upgradeCost();
      u.upgradeTier();
    }

    // 3) Investasi ekonomi: beli wisp dengan sisa gold
    let wb = 0;
    while (wb++ < 4 && this.aiWisps < 10 && this.aiGold >= CONFIG.economy.wispCost + 5) {
      this.aiGold -= CONFIG.economy.wispCost;
      this.aiWisps++;
    }

    // 4) Belanjakan lumber: utamakan upgrade King (~60%), sisanya kirim creep
    const opts = [...CONFIG.sendOptions].sort((a, b) => b.lumber - a.lumber);
    let sguard = 0;
    while (sguard++ < 40 && this.aiLumber > 0) {
      const preferUpgrade = Phaser.Math.Between(0, 9) < 6;
      let acted = preferUpgrade ? this.aiUpgradeKing() : this.aiSendCreep(opts);
      if (!acted) acted = preferUpgrade ? this.aiSendCreep(opts) : this.aiUpgradeKing();
      if (!acted) break;
    }
  }

  // AI: upgrade satu stat King termurah yang terjangkau. return true bila berhasil.
  aiUpgradeKing() {
    const types = ['hp', 'attack', 'regen'].sort((a, b) => this.enemyKing.upgradeCost(a) - this.enemyKing.upgradeCost(b));
    for (const type of types) {
      const cost = this.enemyKing.upgradeCost(type);
      if (this.aiLumber >= cost) {
        this.aiLumber -= cost;
        this.enemyKing.applyUpgrade(type);
        this.aiIncomeBonus += cost * CONFIG.economy.incomePerLumber;
        return true;
      }
    }
    return false;
  }

  // AI: kirim creep terkuat yang terjangkau ke lane player. return true bila berhasil.
  aiSendCreep(opts) {
    const o = opts.find(x => this.aiLumber >= x.lumber);
    if (!o) return false;
    this.aiLumber -= o.lumber;
    this.playerLane.pendingSends.push(o.key);
    this.aiIncomeBonus += o.lumber * CONFIG.economy.incomePerLumber;
    return true;
  }

  // Pilih sel terbaik untuk AI:
  // - prioritas kolom sejajar spawn-king ± 1 (paling efektif blocking path)
  // - melee (range 2): baris depan dekat spawn; ranged (range 3): baris belakang dekat king
  pickAICell(stats) {
    const board = this.enemyBoard;
    const path = board.getPath();
    if (!path) return null;

    const spawnCol = board.spawn.col; // col 3
    const isRanged = stats.range >= 3;
    const midRow = Math.floor(board.rows / 2); // row 4
    const prefCols = new Set([spawnCol - 1, spawnCol, spawnCol + 1]); // cols 2,3,4

    const cands = [];
    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        if (!board.canPlace(c, r)) continue;

        let dmin = Infinity;
        for (const p of path) {
          const d = Math.abs(p.col - c) + Math.abs(p.row - r);
          if (d < dmin) dmin = d;
        }

        let score = 0;
        // prioritas utama: kolom dekat jalur spawn–king (blocking paling efektif)
        if (prefCols.has(c)) score += 10;
        // posisi baris: melee depan, ranged belakang
        if (!isRanged && r < midRow) score += 5;
        if (isRanged && r >= midRow) score += 5;
        // bonus kecil: makin dekat jalur creep makin baik
        score -= dmin;

        cands.push({ col: c, row: r, score });
      }
    }

    if (cands.length === 0) return null;
    cands.sort((a, b) => b.score - a.score);
    // pilih acak dari kandidat top (dalam margin 3 poin dari terbaik)
    const best = cands.filter(c => c.score >= cands[0].score - 3);
    return best[Phaser.Math.Between(0, best.length - 1)];
  }

  // ---------- Update loop ----------
  update(time, delta) {
    if (this.gameOver) return;

    // King menyerang creep di lane-nya + regenerasi HP (kedua fase)
    this.playerKing.update(delta, this.playerLane.creeps);
    this.enemyKing.update(delta, this.enemyLane.creeps);

    if (this.phase === 'prep') {
      this.timer -= delta;
      this.phaseText.setText(`PERSIAPAN  ${Math.ceil(this.timer / 1000)}s`);
      if (this.timer <= 0) this.startFight();
      return;
    }

    if (this.phase === 'fight') {
      this.phaseText.setText(`WAVE ${this.wave} — BERTEMPUR`);
      this.spawnTimer -= delta;
      const spawnedThisFrame = this.spawnTimer <= 0;
      if (spawnedThisFrame) this.spawnTimer = CONFIG.timings.fightSpawnDelay;

      let anyActive = false;
      for (const lane of [this.playerLane, this.enemyLane]) {
        // spawn satu creep dari queue
        if (spawnedThisFrame && lane.queue.length > 0 && lane.path) {
          const item = lane.queue.shift();
          const spawnPath = lane.board.getPath() || lane.path;
          lane.creeps.push(new Creep(this, lane.board, CREEPS[item.key], spawnPath, item.hpMult, item.dmgMult));
        }
        // update unit (attack)
        for (const u of lane.board.units) u.update(delta, lane.creeps);
        // update creep (move)
        for (const c of lane.creeps) {
          const leaked = c.update(delta);
          if (leaked) lane.king.takeDamage(c.leakDmg);
        }
        // bersihkan creep mati, beri bounty (yang mati bukan karena leak)
        const alive = [];
        for (const c of lane.creeps) {
          if (c.dead) {
            if (!c.leaked) {
              lane.kills++;
              if (lane === this.playerLane) this.playerGold += c.bounty;
              else this.aiGold += c.bounty;
            }
          } else alive.push(c);
        }
        lane.creeps = alive;

        if (lane.queue.length > 0 || lane.creeps.length > 0) anyActive = true;
      }

      this.updateHUD(); // gold bertambah real-time saat creep mati
      this.checkGameOver();
      if (!this.gameOver && !anyActive) this.endFight();
    }
  }

  checkGameOver() {
    if (this.playerKing.dead) this.endGame(false);
    else if (this.enemyKing.dead) this.endGame(true);
  }

  endGame(win) {
    this.gameOver = true;
    const cx = CONFIG.width / 2, cy = CONFIG.height / 2;
    this.add.rectangle(cx, cy, CONFIG.width, CONFIG.height, 0x05080f, 0.78);

    const accent = win ? CONFIG.colors.hpFull : CONFIG.colors.hpLow;
    panel(this, cx - 260, cy - 150, 520, 320, { radius: 22, fill: 0x131b30, fillAlpha: 0.98, stroke: accent, strokeWidth: 3 });

    const title = this.add.text(cx, cy - 80, win ? 'KAMU MENANG!' : 'KAMU KALAH',
      { fontFamily: CONFIG.fonts.heading, fontSize: '60px', color: win ? '#86efac' : '#fca5a5', fontStyle: 'bold' }).setOrigin(0.5);
    glow(this, title, accent, 8);
    this.add.text(cx, cy - 12, `Bertahan sampai Wave ${this.wave}`,
      { fontFamily: CONFIG.fonts.body, fontSize: '22px', color: '#c3cdee' }).setOrigin(0.5);

    const btn = this.add.container(cx, cy + 70);
    const g = this.add.graphics();
    g.fillStyle(CONFIG.colors.accent, 1); g.fillRoundedRect(-130, -30, 260, 60, 22);
    const t = this.add.text(0, 0, 'MAIN LAGI', { fontFamily: CONFIG.fonts.heading, fontSize: '24px', color: '#06121f', fontStyle: 'bold' }).setOrigin(0.5);
    btn.add([g, t]);
    btn.setSize(260, 60).setInteractive(new Phaser.Geom.Rectangle(-130, -30, 260, 60), Phaser.Geom.Rectangle.Contains);
    glow(this, g, CONFIG.colors.accent, 6);
    btn.on('pointerover', () => this.tweens.add({ targets: btn, scale: 1.06, duration: 120 }));
    btn.on('pointerout', () => this.tweens.add({ targets: btn, scale: 1, duration: 120 }));
    btn.on('pointerdown', () => this.scene.start('FactionScene'));

    title.setScale(0.6);
    this.tweens.add({ targets: title, scale: 1, duration: 450, ease: 'Back.out' });
  }
}
