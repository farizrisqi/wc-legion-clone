import { CONFIG } from '../config.js';
import { findPath } from './Pathfinder.js';
import { glow } from '../ui/UI.js';
import Unit from './Unit.js';

// Satu Board mewakili satu sisi (player atau AI).
export default class Board {
  constructor(scene, origin, isPlayer, accent) {
    this.scene = scene;
    this.origin = origin;
    this.isPlayer = isPlayer;
    this.accent = accent || (isPlayer ? CONFIG.colors.westUnit : CONFIG.colors.eastUnit);
    this.cols = CONFIG.grid.cols;
    this.rows = CONFIG.grid.rows;
    this.cellSize = CONFIG.grid.cellSize;

    // grid berisi referensi Unit atau null
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
    this.units = [];

    // titik spawn creep (atas) dan goal (bawah, depan King)
    this.spawn = { col: 3, row: 0 };
    this.goal = { col: 3, row: this.rows - 1 };

    this.drawGrid();
  }

  drawGrid() {
    const w = this.cols * this.cellSize;
    const h = this.rows * this.cellSize;
    const accent = this.accent;
    const bg = this.isPlayer ? CONFIG.colors.boardPlayer : CONFIG.colors.boardAI;
    const pad = 10;

    // panel pembungkus dengan border ber-glow
    const frame = this.scene.add.graphics();
    frame.fillStyle(bg, 1);
    frame.fillRoundedRect(this.origin.x - pad, this.origin.y - pad, w + pad * 2, h + pad * 2, 16);
    frame.lineStyle(2.5, accent, 0.5);
    frame.strokeRoundedRect(this.origin.x - pad, this.origin.y - pad, w + pad * 2, h + pad * 2, 16);
    glow(this.scene, frame, accent, 4);

    // garis grid halus
    const g = this.scene.add.graphics();
    g.lineStyle(1, CONFIG.colors.gridLine, 0.8);
    for (let c = 0; c <= this.cols; c++) {
      g.lineBetween(this.origin.x + c * this.cellSize, this.origin.y,
        this.origin.x + c * this.cellSize, this.origin.y + h);
    }
    for (let r = 0; r <= this.rows; r++) {
      g.lineBetween(this.origin.x, this.origin.y + r * this.cellSize,
        this.origin.x + w, this.origin.y + r * this.cellSize);
    }

    // marker spawn (amber) & goal/King (merah)
    const sp = this.cellToPixel(this.spawn.col, this.spawn.row);
    g.fillStyle(0xfbbf24, 0.18);
    g.fillRoundedRect(sp.x - this.cellSize / 2 + 2, sp.y - this.cellSize / 2 + 2, this.cellSize - 4, this.cellSize - 4, 6);
    this.scene.add.text(sp.x, sp.y, '▼', { fontFamily: CONFIG.fonts.body, fontSize: '16px', color: '#fbbf24' }).setOrigin(0.5).setAlpha(0.7);

    const gp = this.cellToPixel(this.goal.col, this.goal.row);
    g.fillStyle(0xf87171, 0.18);
    g.fillRoundedRect(gp.x - this.cellSize / 2 + 2, gp.y - this.cellSize / 2 + 2, this.cellSize - 4, this.cellSize - 4, 6);
  }

  cellToPixel(col, row) {
    return {
      x: this.origin.x + col * this.cellSize + this.cellSize / 2,
      y: this.origin.y + row * this.cellSize + this.cellSize / 2
    };
  }

  pixelToCell(x, y) {
    const col = Math.floor((x - this.origin.x) / this.cellSize);
    const row = Math.floor((y - this.origin.y) / this.cellSize);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return null;
    return { col, row };
  }

  contains(x, y) {
    return x >= this.origin.x && x < this.origin.x + this.cols * this.cellSize &&
      y >= this.origin.y && y < this.origin.y + this.rows * this.cellSize;
  }

  // grid biner untuk pathfinding (1 = blocked); unit mati tidak menghalangi
  toGrid(extraBlock) {
    const grid = this.grid.map(row => row.map(cell => (cell && cell.alive ? 1 : 0)));
    if (extraBlock) grid[extraBlock.row][extraBlock.col] = 1;
    return grid;
  }

  // boleh menempatkan unit di sel ini?
  canPlace(col, row) {
    if (this.grid[row][col]) return false;
    if (col === this.spawn.col && row === this.spawn.row) return false;
    if (col === this.goal.col && row === this.goal.row) return false;
    // pastikan creep selalu bisa lewat dari atas ke bawah (tak bisa diblok total)
    const grid = this.toGrid({ col, row });
    return findPath(grid, this.spawn, this.goal) !== null;
  }

  placeUnit(stats, faction, col, row) {
    const unit = new Unit(this.scene, this, stats, faction, col, row);
    this.grid[row][col] = unit;
    this.units.push(unit);
    return unit;
  }

  sellUnit(col, row) {
    const unit = this.grid[row][col];
    if (!unit) return 0;
    unit.destroy();
    this.grid[row][col] = null;
    this.units = this.units.filter(u => u !== unit);
    return Math.floor(unit.invested * 0.75);
  }

  getPath() {
    return findPath(this.toGrid(), this.spawn, this.goal);
  }
}
