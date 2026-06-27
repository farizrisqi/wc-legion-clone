export const CREEPS = {
    // dmg/atkSpeed/range = stat creep menyerang unit kita (range 1 = melee)
    basic:   { key: 'basic',   hp: 50,  speed: 80,  armor: 0,  bounty: 3,  leakDmg: 40,  dmg: 8,  atkSpeed: 1.0, range: 2 },
    armored: { key: 'armored', hp: 120, speed: 60,  armor: 12, bounty: 5,  leakDmg: 60,  dmg: 12, atkSpeed: 0.9, range: 2 },
    fast:    { key: 'fast',    hp: 40,  speed: 150, armor: 0,  bounty: 3,  leakDmg: 40,  dmg: 6,  atkSpeed: 1.4, range: 2 },
    swarm:   { key: 'swarm',   hp: 30,  speed: 175, armor: 0,  bounty: 2,  leakDmg: 30,  dmg: 5,  atkSpeed: 1.5, range: 2 },
    brute:   { key: 'brute',   hp: 240, speed: 55,  armor: 8,  bounty: 8,  leakDmg: 90,  dmg: 20, atkSpeed: 0.9, range: 2 },
    boss:    { key: 'boss',    hp: 700, speed: 50,  armor: 18, bounty: 30, leakDmg: 200, dmg: 40, atkSpeed: 1.0, range: 2 }
  };
