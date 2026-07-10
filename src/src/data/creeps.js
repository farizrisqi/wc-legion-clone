export const CREEPS = {
    // dmg/atkSpeed/range = stat creep menyerang unit kita
    // range 1 = melee (harus nempel), range 2 = ranged (bisa serang dari jauh)
    // MELEE (disc bulat)
    basic:   { key: 'basic',   hp: 50,  speed: 80,  armor: 0,  bounty: 3,  leakDmg: 40,  dmg: 8,  atkSpeed: 1.0, range: 1 },
    armored: { key: 'armored', hp: 120, speed: 60,  armor: 12, bounty: 5,  leakDmg: 60,  dmg: 12, atkSpeed: 0.9, range: 1 },
    swarm:   { key: 'swarm',   hp: 30,  speed: 175, armor: 0,  bounty: 2,  leakDmg: 30,  dmg: 5,  atkSpeed: 1.5, range: 1 },
    brute:   { key: 'brute',   hp: 240, speed: 55,  armor: 8,  bounty: 8,  leakDmg: 90,  dmg: 20, atkSpeed: 0.9, range: 1 },
    // RANGED (diamond berlian) - bisa serang unit dari jarak 2 sel
    fast:    { key: 'fast',    hp: 40,   speed: 150, armor: 0,  bounty: 3,   leakDmg: 40,  dmg: 6,  atkSpeed: 1.4, range: 2 },
    archer:  { key: 'archer',  hp: 65,   speed: 85,  armor: 0,  bounty: 4,   leakDmg: 50,  dmg: 10, atkSpeed: 1.1, range: 2 },
    spitter: { key: 'spitter', hp: 80,   speed: 70,  armor: 3,  bounty: 5,   leakDmg: 55,  dmg: 14, atkSpeed: 0.8, range: 2 },
    // resist: true = tahan CC (slow 50% lebih lemah, root 50% lebih singkat)
    boss:    { key: 'boss',    hp: 700,  speed: 50,  armor: 18, bounty: 30,  leakDmg: 200, dmg: 40, atkSpeed: 1.0, range: 2, resist: true },
    // SUPER UNIT (bisa dikirim, jauh lebih kuat dari boss)
    titan:   { key: 'titan',   hp: 2000, speed: 42,  armor: 22, bounty: 80,  leakDmg: 400, dmg: 55, atkSpeed: 0.8, range: 2, resist: true },
    // ULTIMATE BOSS (muncul otomatis di wave 15, 20, 25, ...)
    overlord:{ key: 'overlord',hp: 5000, speed: 35,  armor: 30, bounty: 150, leakDmg: 800, dmg: 70, atkSpeed: 0.7, range: 2, resist: true }
  };
