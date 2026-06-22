export const CONFIG = {
    width: 1280,
    height: 720,
    grid: {
      cols: 8,
      rows: 8,
      cellSize: 40 // Ukuran kotak grid dalam pixel
    },
    boardWest: { x: 120, y: 150 }, // Titik origin rendering board kiri (player)
    boardEast: { x: 760, y: 150 }, // Titik origin rendering board kanan (AI)
    fonts: {
      heading: 'Orbitron',
      body: 'Rajdhani'
    },
    colors: {
      bg: 0x0d1326,
      bgTop: 0x141d3a,
      bgBottom: 0x0a0f1f,
      panel: 0x1a2238,
      panelBorder: 0x2e3a5c,
      boardPlayer: 0x141d33,
      boardAI: 0x231634,
      gridLine: 0x2a3556,
      hoverCell: 0x3a4a78,
      accent: 0x38bdf8,
      westUnit: 0x38bdf8,
      eastUnit: 0xf87171,
      gold: 0xfbbf24,
      creep: 0x86efac,
      hpFull: 0x4ade80,
      hpMid: 0xfacc15,
      hpLow: 0xf87171
    },
    king: {
      hp: 2000, size: 2,            // Size 2 berarti 2x2 grid cell
      atkDmg: 22, atkRange: 120, atkSpeed: 1.0, // King menyerang creep di dekat goal
      // biaya upgrade (lumber) = base * (level+1); amount = penambahan per level
      upgrades: {
        hp:     { base: 2, amount: 600 },
        attack: { base: 2, amount: 16 },
        regen:  { base: 2, amount: 0.9 }  // +0.9 HP/detik per level
      }
    },
    economy: {
      startGold: 175, baseIncome: 25,
      startLumber: 1, baseLumber: 1, // lumber regen dasar tiap wave
      wispCost: 20, wispLumber: 1,    // tiap wisp menambah +1 lumber/wave
      incomePerLumber: 2              // tiap 1 lumber yang dibelanjakan -> +2 gold income/wave
    },
    // pilihan creep yang bisa dikirim ke lane musuh (pakai lumber)
    sendOptions: [
      { key: 'basic', name: 'Basic', lumber: 1 },
      { key: 'fast', name: 'Fast', lumber: 2 },
      { key: 'armored', name: 'Armored', lumber: 3 },
      { key: 'brute', name: 'Brute', lumber: 5 }
    ],
    // tingkat kesulitan AI: bonus lumber & income gold per ronde
    difficulties: {
      easy:   { name: 'Easy',   lumber: 0, income: 0 },
      normal: { name: 'Normal', lumber: 1, income: 10 },
      hard:   { name: 'Hard',   lumber: 2, income: 20 }
    },
    // scaling creep tiap wave (kumulatif) — berlaku untuk kedua lane (kamu & AI)
    creepScale: { hpPerWave: 0.08, dmgPerWave: 0.05 },
    // creep ekstra otomatis yang ditambahkan ke KEDUA lane tiap wave; jumlah tumbuh eksponensial
    // count = round(base * growth^(wave-1)), dibatasi cap
    waveExtra: { base: 2, growth: 1.3, cap: 80 },
    timings: { prepPhase: 30000, fightSpawnDelay: 500, waveComplete: 2000 }
  };
