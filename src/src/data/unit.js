// 4 ras, masing-masing 5 unit dengan tier biaya 30/50/60/80/120.
// Setiap ras punya skill unik — lihat Unit.js fire() untuk implementasi.
export const UNITS = {
    human: {
      peasant:   { key: 'peasant',   name: 'Peasant',   cost: 30,  hp: 130, dmg: 16, range: 2, atkSpeed: 1.0, special: null },
      footman:   { key: 'footman',   name: 'Footman',   cost: 50,  hp: 240, dmg: 22, range: 2, atkSpeed: 1.0, special: 'block' },    // 30% chance damage masuk dikurangi 50%
      rifleman:  { key: 'rifleman',  name: 'Rifleman',  cost: 60,  hp: 120, dmg: 34, range: 3, atkSpeed: 1.3, special: 'pierce' },   // peluru nembus semua creep segaris
      sorceress: { key: 'sorceress', name: 'Sorceress', cost: 80,  hp: 100, dmg: 24, range: 3, atkSpeed: 0.9, special: 'slow' },     // slow 35% selama 2.5s
      knight:    { key: 'knight',    name: 'Knight',    cost: 120, hp: 480, dmg: 58, range: 2, atkSpeed: 0.9, special: 'splash' }    // AoE 50% dmg radius 1.5 tile
    },
    orc: {
      peon:        { key: 'peon',        name: 'Peon',         cost: 30,  hp: 130, dmg: 16, range: 2, atkSpeed: 1.0, special: null },
      grunt:       { key: 'grunt',       name: 'Grunt',        cost: 50,  hp: 240, dmg: 22, range: 2, atkSpeed: 1.0, special: 'cleave' },    // tebas target + 2 creep terdekat 60% dmg
      headhunter:  { key: 'headhunter',  name: 'Headhunter',   cost: 60,  hp: 120, dmg: 34, range: 3, atkSpeed: 1.3, special: 'ensnare' },   // jaring: freeze 1.5s
      witchDoctor: { key: 'witchDoctor', name: 'Witch Doctor', cost: 80,  hp: 100, dmg: 18, range: 3, atkSpeed: 0.9, special: 'poison' },    // racun DoT 60%dmg/s selama 3s
      tauren:      { key: 'tauren',      name: 'Tauren',       cost: 120, hp: 480, dmg: 50, range: 2, atkSpeed: 0.9, special: 'stomp' }      // slow 50% semua creep radius 2 tile dari diri sendiri
    },
    undead: {
      acolyte:     { key: 'acolyte',     name: 'Acolyte',      cost: 30,  hp: 130, dmg: 16, range: 2, atkSpeed: 1.0, special: null },
      ghoul:       { key: 'ghoul',       name: 'Ghoul',        cost: 50,  hp: 240, dmg: 22, range: 2, atkSpeed: 1.0, special: 'devour' },    // heal 25% dari dmg yang didealt
      cryptFiend:  { key: 'cryptFiend',  name: 'Crypt Fiend',  cost: 60,  hp: 120, dmg: 34, range: 3, atkSpeed: 1.3, special: 'web' },       // jaring laba2: freeze 2s (lebih lama dari ensnare)
      banshee:     { key: 'banshee',     name: 'Banshee',      cost: 80,  hp: 100, dmg: 24, range: 3, atkSpeed: 0.9, special: 'curse' },     // kurangi armor target -8 selama 3s
      abomination: { key: 'abomination', name: 'Abomination',  cost: 120, hp: 480, dmg: 50, range: 2, atkSpeed: 0.9, special: 'disease' }   // sebarkan poison ke creep di sekitar target
    },
    nightelf: {
      treant:    { key: 'treant',    name: 'Treant',        cost: 30,  hp: 130, dmg: 16, range: 2, atkSpeed: 1.0, special: null },
      huntress:  { key: 'huntress',  name: 'Huntress',      cost: 50,  hp: 240, dmg: 22, range: 2, atkSpeed: 1.0, special: 'multishot' },  // tembak 2 creep sekaligus
      archer:    { key: 'archer',    name: 'Archer',        cost: 60,  hp: 120, dmg: 34, range: 3, atkSpeed: 1.3, special: 'crit' },        // 25% chance 2.5x dmg
      dryad:     { key: 'dryad',     name: 'Dryad',         cost: 80,  hp: 100, dmg: 18, range: 3, atkSpeed: 0.9, special: 'poison' },      // racun DoT
      mountainGiant: { key: 'mountainGiant', name: 'Mtn Giant', cost: 120, hp: 480, dmg: 58, range: 2, atkSpeed: 0.9, special: 'pulverize' } // 40% chance slow kuat 50% selama 3s
    }
  };

// Deskripsi singkat tiap skill (untuk tooltip & FactionScene)
export const SKILL_DESC = {
  block:     'Blok — 30% chance potong 50% damage masuk',
  pierce:    'Tembus — peluru menembus semua musuh segaris',
  slow:      'Perlambat — kurangi kecepatan 35% selama 2.5 detik',
  splash:    'Ledak — AoE 50% dmg radius 1.5 tile dari target',
  cleave:    'Tebas — hajar target + 2 musuh terdekat (60% dmg)',
  ensnare:   'Jebak — bekukan musuh 1.5 detik, tidak bisa gerak',
  poison:    'Racun — DoT 60%×dmg per detik selama 3 detik',
  stomp:     'Hantam — slow 50% semua musuh dalam radius 2 tile',
  devour:    'Lahap — pulihkan HP sebesar 25% dari dmg didealt',
  web:       'Jaring — bekukan musuh selama 2 detik',
  curse:     'Kutuk — kurangi armor musuh -8 selama 3 detik',
  disease:   'Wabah — sebarkan racun ke musuh di sekitar target',
  multishot: 'Ganda — tembak 2 musuh secara bersamaan',
  crit:      'Kritikal — 25% chance damage 2.5× lipat',
  pulverize: 'Hancur — 40% chance slow kuat 50% selama 3 detik',
};

// Metadata ras: nama tampilan, warna unit, tema
export const RACES = {
    human:    { key: 'human',    name: 'HUMAN',     color: 0x38bdf8, theme: 'Alliance' },
    orc:      { key: 'orc',      name: 'ORC',       color: 0xf87171, theme: 'Horde' },
    undead:   { key: 'undead',   name: 'UNDEAD',    color: 0xa78bfa, theme: 'Scourge' },
    nightelf: { key: 'nightelf', name: 'NIGHT ELF', color: 0x34d399, theme: 'Sentinels' }
  };
