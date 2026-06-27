// Komposisi 15 wave; makin lama makin banyak & variatif.
// Setelah wave 15 akan diulang dengan multiplier HP (di-handle WaveManager/GameScene).
// Melee (disc): basic, armored, swarm, brute
// Ranged (diamond): fast, archer, spitter, boss
const A = (n, k) => Array(n).fill(k);

export const WAVES = [
  /* W1  */ A(8, 'basic'),
  /* W2  */ A(12, 'basic'),
  /* W3  */ [...A(10, 'basic'), ...A(3, 'armored')],
  /* W4  */ [...A(8, 'fast'), ...A(6, 'basic')],                                              // fast (ranged) debut
  /* W5  */ [...A(6, 'armored'), ...A(8, 'basic'), 'boss'],
  /* W6  */ [...A(10, 'swarm'), ...A(4, 'armored'), ...A(3, 'archer')],                       // archer (ranged) debut
  /* W7  */ [...A(4, 'brute'), ...A(6, 'basic'), ...A(4, 'archer')],
  /* W8  */ [...A(6, 'fast'), ...A(4, 'armored'), ...A(4, 'spitter')],                        // spitter (ranged) debut
  /* W9  */ [...A(6, 'brute'), ...A(4, 'spitter'), ...A(2, 'archer'), 'boss'],
  /* W10 */ [...A(12, 'swarm'), ...A(4, 'brute'), ...A(4, 'archer'), ...A(2, 'boss')],
  /* W11 */ [...A(8, 'armored'), ...A(6, 'spitter'), ...A(4, 'archer')],
  /* W12 */ [...A(6, 'brute'), ...A(6, 'fast'), ...A(4, 'spitter'), ...A(2, 'boss')],
  /* W13 */ [...A(16, 'swarm'), ...A(6, 'armored'), ...A(4, 'archer'), ...A(2, 'spitter')],
  /* W14 */ [...A(8, 'brute'), ...A(6, 'spitter'), ...A(4, 'archer'), ...A(2, 'boss')],
  /* W15 */ [...A(6, 'brute'), ...A(6, 'armored'), ...A(5, 'spitter'), ...A(4, 'archer'), ...A(3, 'boss')]
];
