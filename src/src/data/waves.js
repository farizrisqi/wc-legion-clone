// Komposisi 15 wave; makin lama makin banyak & variatif.
// Setelah wave 15 akan diulang dengan multiplier HP (di-handle WaveManager/GameScene).
const A = (n, k) => Array(n).fill(k);

export const WAVES = [
  /* W1  */ A(8, 'basic'),
  /* W2  */ A(12, 'basic'),
  /* W3  */ [...A(10, 'basic'), ...A(3, 'armored')],
  /* W4  */ [...A(8, 'fast'), ...A(6, 'basic')],
  /* W5  */ [...A(6, 'armored'), ...A(8, 'basic'), 'boss'],
  /* W6  */ [...A(12, 'swarm'), ...A(4, 'armored')],
  /* W7  */ [...A(4, 'brute'), ...A(10, 'basic')],
  /* W8  */ [...A(10, 'fast'), ...A(6, 'armored')],
  /* W9  */ [...A(6, 'brute'), ...A(6, 'armored'), 'boss'],
  /* W10 */ [...A(16, 'swarm'), ...A(4, 'brute'), ...A(2, 'boss')],
  /* W11 */ [...A(12, 'armored'), ...A(6, 'brute')],
  /* W12 */ [...A(8, 'brute'), ...A(10, 'fast'), ...A(2, 'boss')],
  /* W13 */ [...A(20, 'swarm'), ...A(10, 'armored')],
  /* W14 */ [...A(10, 'brute'), ...A(8, 'armored'), ...A(2, 'boss')],
  /* W15 */ [...A(8, 'brute'), ...A(8, 'armored'), ...A(8, 'fast'), ...A(3, 'boss')]
];
