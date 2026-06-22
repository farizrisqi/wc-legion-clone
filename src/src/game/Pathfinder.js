// A* pathfinding sederhana di grid 8x8.
// grid[row][col] === 1 berarti blocked (ada unit), 0 berarti bisa dilewati.

export function findPath(grid, start, goal) {
  const rows = grid.length;
  const cols = grid[0].length;
  const key = (c, r) => `${c},${r}`;
  const h = (c, r) => Math.abs(c - goal.col) + Math.abs(r - goal.row); // Manhattan

  const open = [{ col: start.col, row: start.row, g: 0, f: h(start.col, start.row) }];
  const came = {};
  const gScore = { [key(start.col, start.row)]: 0 };
  const closed = new Set();

  while (open.length > 0) {
    // ambil node dengan f terkecil
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    const ck = key(cur.col, cur.row);

    if (cur.col === goal.col && cur.row === goal.row) {
      // rekonstruksi path
      const path = [{ col: cur.col, row: cur.row }];
      let k = ck;
      while (came[k]) {
        path.unshift(came[k]);
        k = key(came[k].col, came[k].row);
      }
      return path;
    }

    if (closed.has(ck)) continue;
    closed.add(ck);

    const neighbors = [
      { col: cur.col + 1, row: cur.row },
      { col: cur.col - 1, row: cur.row },
      { col: cur.col, row: cur.row + 1 },
      { col: cur.col, row: cur.row - 1 }
    ];

    for (const n of neighbors) {
      if (n.col < 0 || n.col >= cols || n.row < 0 || n.row >= rows) continue;
      if (grid[n.row][n.col] === 1) continue;
      const nk = key(n.col, n.row);
      if (closed.has(nk)) continue;
      const tentativeG = cur.g + 1;
      if (gScore[nk] === undefined || tentativeG < gScore[nk]) {
        gScore[nk] = tentativeG;
        came[nk] = { col: cur.col, row: cur.row };
        open.push({ col: n.col, row: n.row, g: tentativeG, f: tentativeG + h(n.col, n.row) });
      }
    }
  }
  return null; // tidak ada jalan
}
