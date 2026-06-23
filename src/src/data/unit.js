// 4 ras, masing-masing 5 unit dengan tier biaya 30/50/60/80/120.
// Stat dasar sama antar ras (biar seimbang), beda nama, warna, & special tier 4-5.
export const UNITS = {
    human: {
      peasant:   { key: 'peasant',   name: 'Peasant',   cost: 30,  hp: 130, dmg: 16, range: 2, atkSpeed: 1.0, special: null },
      footman:   { key: 'footman',   name: 'Footman',   cost: 50,  hp: 240, dmg: 22, range: 2, atkSpeed: 1.0, special: null },
      rifleman:  { key: 'rifleman',  name: 'Rifleman',  cost: 60,  hp: 120, dmg: 34, range: 3, atkSpeed: 1.3, special: null },
      sorceress: { key: 'sorceress', name: 'Sorceress', cost: 80,  hp: 100, dmg: 24, range: 3, atkSpeed: 0.9, special: 'slow' },
      knight:    { key: 'knight',    name: 'Knight',    cost: 120, hp: 480, dmg: 58, range: 2, atkSpeed: 0.9, special: 'splash' }
    },
    orc: {
      peon:        { key: 'peon',        name: 'Peon',         cost: 30,  hp: 130, dmg: 16, range: 2, atkSpeed: 1.0, special: null },
      grunt:       { key: 'grunt',       name: 'Grunt',        cost: 50,  hp: 240, dmg: 22, range: 2, atkSpeed: 1.0, special: null },
      headhunter:  { key: 'headhunter',  name: 'Headhunter',   cost: 60,  hp: 120, dmg: 34, range: 3, atkSpeed: 1.3, special: null },
      witchDoctor: { key: 'witchDoctor', name: 'Witch Doctor', cost: 80,  hp: 100, dmg: 18, range: 3, atkSpeed: 0.9, special: 'poison' },
      tauren:      { key: 'tauren',      name: 'Tauren',       cost: 120, hp: 480, dmg: 50, range: 2, atkSpeed: 0.9, special: 'cleave' }
    },
    undead: {
      acolyte:     { key: 'acolyte',     name: 'Acolyte',      cost: 30,  hp: 130, dmg: 16, range: 2, atkSpeed: 1.0, special: null },
      ghoul:       { key: 'ghoul',       name: 'Ghoul',        cost: 50,  hp: 240, dmg: 22, range: 2, atkSpeed: 1.0, special: null },
      cryptFiend:  { key: 'cryptFiend',  name: 'Crypt Fiend',  cost: 60,  hp: 120, dmg: 34, range: 3, atkSpeed: 1.3, special: null },
      banshee:     { key: 'banshee',     name: 'Banshee',      cost: 80,  hp: 100, dmg: 24, range: 3, atkSpeed: 0.9, special: 'slow' },
      abomination: { key: 'abomination', name: 'Abomination',  cost: 120, hp: 480, dmg: 50, range: 2, atkSpeed: 0.9, special: 'cleave' }
    },
    nightelf: {
      treant:    { key: 'treant',    name: 'Treant',        cost: 30,  hp: 130, dmg: 16, range: 2, atkSpeed: 1.0, special: null },
      huntress:  { key: 'huntress',  name: 'Huntress',      cost: 50,  hp: 240, dmg: 22, range: 2, atkSpeed: 1.0, special: null },
      archer:    { key: 'archer',    name: 'Archer',        cost: 60,  hp: 120, dmg: 34, range: 3, atkSpeed: 1.3, special: null },
      dryad:     { key: 'dryad',     name: 'Dryad',         cost: 80,  hp: 100, dmg: 18, range: 3, atkSpeed: 0.9, special: 'poison' },
      mountainGiant: { key: 'mountainGiant', name: 'Mtn Giant', cost: 120, hp: 480, dmg: 58, range: 2, atkSpeed: 0.9, special: 'splash' }
    }
  };

// Metadata ras: nama tampilan, warna unit, tema
export const RACES = {
    human:    { key: 'human',    name: 'HUMAN',     color: 0x38bdf8, theme: 'Alliance' },
    orc:      { key: 'orc',      name: 'ORC',       color: 0xf87171, theme: 'Horde' },
    undead:   { key: 'undead',   name: 'UNDEAD',    color: 0xa78bfa, theme: 'Scourge' },
    nightelf: { key: 'nightelf', name: 'NIGHT ELF', color: 0x34d399, theme: 'Sentinels' }
  };
