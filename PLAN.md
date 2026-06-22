# Legion TD Web Clone — Game Plan

Game clone dari Warcraft 3 Legion TD untuk web browser.
Player vs AI, bisa pilih West Legion atau East Legion.
Deploy ke Vercel via GitHub (static build).

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Game Engine | Phaser 3 |
| Build Tool | Vite |
| Language | Vanilla JavaScript |
| Deploy | Vercel (static, no backend) |
| Grafis | Geometric shapes (kotak/lingkaran + label) |

---

## Struktur File

```
legion-td/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.js              # Entry point — Phaser game config + scene list
    ├── config.js            # Semua konstanta (warna, ukuran grid, timing)
    ├── scenes/
    │   ├── MenuScene.js     # Main menu
    │   ├── FactionScene.js  # Pilih West atau East Legion
    │   └── GameScene.js     # Main game loop (file terbesar)
    ├── game/
    │   ├── Board.js         # Render grid, logic place/sell unit
    │   ├── Unit.js          # Unit class: draw, auto-attack, special ability
    │   ├── Creep.js         # Creep class: draw, movement, HP bar
    │   ├── King.js          # King class: HP bar, trigger game over
    │   ├── WaveManager.js   # State machine: prep → fight → complete
    │   ├── Economy.js       # Gold, income per wave, send creeps
    │   ├── AIPlayer.js      # AI: auto-place unit setiap prep phase
    │   └── Pathfinder.js    # A* pathfinding untuk navigasi creep
    └── data/
        ├── units.js         # Definisi semua unit West + East
        ├── creeps.js        # Tipe-tipe creep
        └── waves.js         # Komposisi 15 wave
```

---

## Layout Game (1280 × 720, landscape)

```
+──────────────────────────+──────────────────────────+
│      YOUR BOARD          │      AI BOARD            │
│   (West atau East)       │   (kebalikannya)         │
│                          │                          │
│   Grid 8 × 8 col/row     │   Grid 8 × 8 col/row     │
│                          │                          │
│   ↑ creep spawn (atas)   │   ↑ creep spawn (atas)   │
│   ↓ King (bawah)         │   ↓ King (bawah)         │
│                          │                          │
│   ████████ King HP ████  │   ████████ King HP ████  │
+──────────────────────────+──────────────────────────+
│  Wave: 3  │  Timer: 08s  │  Gold: 145  │  +15/wave  │
│ [Peasant 30g][Footman 50g][Rifleman 60g][...][SELL] │
+────────────────────────────────────────────────────+
```

**Kontrol:**
- Klik unit di shop bawah → selected (highlight)
- Klik cell di grid → place unit
- Klik unit yang sudah di-place → sell (dapat 75% gold balik)
- Prep phase: bisa place/sell
- Fight phase: unit auto-attack, tidak bisa place

---

## Unit Roster

### West Legion (tema: Human Alliance)

| Unit | Cost | HP | DMG | Range | Atk/s | Special |
|------|------|----|-----|-------|-------|---------|
| Peasant | 30g | 80 | 8 | 1 | 0.8 | — |
| Footman | 50g | 150 | 12 | 1 | 0.9 | — |
| Rifleman | 60g | 80 | 18 | 3 | 1.2 | — |
| Sorceress | 80g | 60 | 10 | 3 | 0.7 | Slow (−30% speed, 2s) |
| Knight | 120g | 300 | 25 | 1 | 0.8 | Splash damage 1-tile |

### East Legion (tema: Horde)

| Unit | Cost | HP | DMG | Range | Atk/s | Special |
|------|------|----|-----|-------|-------|---------|
| Peon | 30g | 80 | 8 | 1 | 0.8 | — |
| Grunt | 50g | 150 | 12 | 1 | 0.9 | — |
| Headhunter | 60g | 80 | 18 | 3 | 1.2 | — |
| Witch Doctor | 80g | 60 | 8 | 3 | 0.7 | Poison DoT (+3 dmg/s × 3s) |
| Tauren | 120g | 300 | 20 | 1 | 0.8 | AoE cleave 1-tile |

---

## Creep & Wave System

### Tipe Creep

| Tipe | HP | Speed | Armor | Bounty |
|------|----|-------|-------|--------|
| Basic | 50 | 80 | 0 | 1g |
| Armored | 100 | 60 | 15 | 2g |
| Fast | 35 | 160 | 0 | 1g |
| Boss | 600 | 50 | 20 | 10g |

### 15 Wave

```
Wave  1 : 8×  Basic
Wave  2 : 12× Basic
Wave  3 : 10× Basic  + 3× Armored
Wave  4 : 15× Basic
Wave  5 : 6×  Fast   + 4× Basic   + 1× Boss       ← Boss Wave
Wave  6 : 12× Basic  + 5× Armored
Wave  7 : 18× Basic
Wave  8 : 8×  Fast   + 6× Armored
Wave  9 : 20× Basic  + 2× Boss
Wave 10 : 10× Fast   + 8× Armored + 2× Boss        ← Boss Wave
Wave 11 : (W6 komposisi × HP ×1.3)
Wave 12 : (W7 komposisi × HP ×1.3)
Wave 13 : (W8 komposisi × HP ×1.3)
Wave 14 : (W9 komposisi × HP ×1.3)
Wave 15 : Semua tipe, HP ×1.5                       ← Final Wave
```

---

## Sistem & Algoritma Utama

### 1. A* Pathfinding (`Pathfinder.js`)
- Grid 8×8, cell = `0` (passable) atau `1` (blocked oleh unit)
- Creep spawn: row 0, col 3 → King: row 7, col 3
- Heuristic: Manhattan distance
- Placement **ditolak** jika unit memblokir semua path ke King
- Path di-recompute setiap unit di-place atau di-sell

### 2. Combat Loop (`GameScene.update` → `Unit.update`)
- Tiap frame: scan semua creep → cari yang terdekat dalam `range` tiles
- Jika `attackTimer <= 0` dan ada target → spawn projectile → reset timer
- Projectile bergerak ke target → on hit: `creep.takeDamage(dmg)`
- **Sorceress:** on hit apply slow 2s
- **Witch Doctor:** on hit apply poison (DoT 3 dmg/s × 3s)
- **Knight/Tauren:** cek adjacent tiles → splash damage ke creep sekitar

### 3. Wave State Machine (`WaveManager.js`)
```
prep (12s) → fight → complete (2s) → prep ...
                        ↓
              hitung income + send creeps
```
- **Prep phase:** timer countdown, AI place units, player bisa place/sell
- **Fight phase:** spawn creep tiap 0.5s, unit auto-attack
- **Complete:** semua creep mati/lolos → award income → next wave

### 4. Economy (`Economy.js`)
- Start gold: `100g`
- Income per wave: `10g base + jumlah kill`
- Kill bounty: sesuai tabel creep (1g–10g)
- **Send creeps:** `sendCount = floor(kills × 0.4)` → tambah ke wave lawan berikutnya
- Creep lolos (sampai King): `king.takeDamage(creep.leakDmg)`, default 50 dmg

### 5. AI Player (`AIPlayer.js`)
- Dipanggil saat prep phase mulai
- Loop: ambil unit paling mahal yang affordable → random valid cell → place
- Max 3 placement per prep phase (balance)
- Cek A*: skip cell jika memblokir path

---

## Alur Game

```
MenuScene
    ↓ Play
FactionScene  →  pilih West atau East
    ↓
GameScene
    ↓  loop
    prep phase  →  fight phase  →  income phase
                                       ↓
                              next wave atau...
                                       ↓
                         Player King HP = 0  →  LOSE
                         AI King HP = 0      →  WIN
                              ↓
                         popup + tombol "Play Again"
```

---

## King Stats
- HP: 2000
- Ukuran: 2×2 tile (bagian bawah board, tidak bisa di-overwrite)
- HP bar ditampilkan di bawah masing-masing board

---

## Warna & Visual

| Elemen | Warna |
|--------|-------|
| Background | `#1a1a2e` |
| Board player | `#16213e` |
| Board AI | `#0f3460` |
| Grid lines | `#2a2a4a` |
| Hover cell | `#3a3a6a` |
| West units | Biru (`#4fc3f7`) |
| East units | Merah/oranye (`#ef5350`) |
| Creeps | Hijau → merah (sesuai HP%) |
| HP bar full | `#4caf50` |
| HP bar mid | `#ffeb3b` |
| HP bar low | `#f44336` |

---

## Urutan Implementasi

```
[1]  package.json + vite.config.js + index.html    (project setup)
[2]  config.js                                      (semua konstanta)
[3]  main.js                                        (Phaser init + scenes)
[4]  data/units.js + data/creeps.js + data/waves.js (semua data game)
[5]  Pathfinder.js                                  (A* algorithm)
[6]  Board.js                                       (render grid, place/sell)
[7]  Unit.js                                        (draw + attack logic)
[8]  Creep.js + King.js                             (draw + HP + movement)
[9]  WaveManager.js                                 (state machine + spawn)
[10] Economy.js                                     (gold + income + send)
[11] AIPlayer.js                                    (auto-place tiap prep)
[12] GameScene.js                                   (assemble semua sistem)
[13] MenuScene.js + FactionScene.js                 (UI screens)
[14] Game Over popup + Play Again
[15] npm run build → push GitHub → Vercel deploy
```

---

## Deploy ke Vercel

1. `npm run build` → generate `dist/`
2. Push ke GitHub
3. Import repo di Vercel → auto-detect Vite → deploy
4. Tidak perlu `vercel.json` untuk static game

---

## Checklist Verifikasi

- [ ] `npm run dev` → buka `localhost:5173` → menu muncul
- [ ] Pilih faction → 2 board terbuka dengan grid
- [ ] Klik unit di shop → klik cell → unit muncul di grid
- [ ] Timer habis → creep spawn dan jalan (A* pathfinding)
- [ ] Unit auto-attack creep → creep mati → gold bertambah
- [ ] Creep lolos → King HP berkurang
- [ ] King HP = 0 → Game Over popup muncul
- [ ] AI board: unit auto-muncul tiap prep phase
- [ ] `npm run build` → tidak ada error → `dist/` terbentuk
