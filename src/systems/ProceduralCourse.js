const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

// 9-hole routing: [colCenterPct, teePct, greenPct]
// Laid out like a real course — goes out then loops back
const HOLE_ZONES = [
  [0.20, 0.85, 0.60],
  [0.70, 0.85, 0.60],
  [0.45, 0.75, 0.45],
  [0.20, 0.60, 0.35],
  [0.70, 0.60, 0.35],
  [0.45, 0.45, 0.15],
  [0.20, 0.38, 0.58],
  [0.70, 0.38, 0.58],
  [0.45, 0.52, 0.82],
];

const HOLE_PARS = [4, 3, 5, 4, 4, 3, 5, 4, 4];

function generateRouting(cols, rows) {
  return HOLE_ZONES.map(([cPct, teePct, greenPct], i) => {
    const midCol = Math.floor(cPct * cols);
    return {
      tee: {
        col: clamp(midCol + randInt(-5, 5), 5, cols - 6),
        row: clamp(Math.floor(teePct * rows) + randInt(-3, 3), 5, rows - 6),
      },
      green: {
        col: clamp(midCol + randInt(-6, 6), 5, cols - 6),
        row: clamp(Math.floor(greenPct * rows) + randInt(-3, 3), 5, rows - 6),
      },
      par: HOLE_PARS[i],
    };
  });
}

function bezierPath(tee, green) {
  const midCol = Math.floor((tee.col + green.col) / 2) + randInt(-10, 10);
  const midRow = Math.floor((tee.row + green.row) / 2) + randInt(-6, 6);
  const points = [];
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    points.push({
      col: Math.round((1-t)*(1-t)*tee.col + 2*(1-t)*t*midCol + t*t*green.col),
      row: Math.round((1-t)*(1-t)*tee.row + 2*(1-t)*t*midRow + t*t*green.row),
    });
  }
  return points;
}

function paintRadius(grid, col, row, radius, tile, cols, rows, blocklist = []) {
  for (let dc = -radius; dc <= radius; dc++) {
    for (let dr = -radius; dr <= radius; dr++) {
      const c = col + dc, r = row + dr;
      if (c >= 0 && c < cols && r >= 0 && r < rows) {
        if (Math.sqrt(dc*dc + dr*dr) <= radius && !blocklist.includes(grid[r][c])) {
          grid[r][c] = tile;
        }
      }
    }
  }
}

function paintFairway(grid, path, cols, rows) {
  path.forEach(({ col, row }) => paintRadius(grid, col, row, 3, 'FAIRWAY', cols, rows, ['GREEN', 'TEE']));
}

function paintGreen(grid, green, cols, rows) {
  paintRadius(grid, green.col, green.row, 3, 'GREEN', cols, rows);
}

function paintTeeBox(grid, tee, cols, rows) {
  for (let dc = -1; dc <= 1; dc++) {
    for (let dr = -1; dr <= 2; dr++) {
      const c = tee.col + dc, r = tee.row + dr;
      if (c >= 0 && c < cols && r >= 0 && r < rows) grid[r][c] = 'TEE';
    }
  }
}

function addBunkers(grid, green, cols, rows) {
  const count = randInt(1, 3);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = randInt(4, 7);
    const bc = Math.round(green.col + Math.cos(angle) * dist);
    const br = Math.round(green.row + Math.sin(angle) * dist);
    paintRadius(grid, bc, br, 1, 'BUNKER', cols, rows, ['GREEN', 'TEE']);
  }
}

function addTrees(grid, cols, rows) {
  const count = Math.floor(cols * rows * 0.04);
  for (let i = 0; i < count; i++) {
    const c = randInt(0, cols - 1), r = randInt(0, rows - 1);
    if (grid[r][c] === 'ROUGH') grid[r][c] = 'TREE';
  }
}

function degradeCourse(grid, cols, rows) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === 'FAIRWAY' && Math.random() < 0.40) grid[r][c] = 'ROUGH';
    }
  }
}

export function generateCourse(cols, rows, options = {}) {
  const { quality = 'poor' } = options;
  const grid = Array.from({ length: rows }, () => Array(cols).fill('ROUGH'));
  const routing = generateRouting(cols, rows);

  routing.forEach(({ tee, green, par }) => {
    paintFairway(grid, bezierPath(tee, green), cols, rows);
    paintTeeBox(grid, tee, cols, rows);
    paintGreen(grid, green, cols, rows);
    addBunkers(grid, green, cols, rows);
  });

  addTrees(grid, cols, rows);
  if (quality === 'poor') degradeCourse(grid, cols, rows);

  return {
    grid,
    holes: routing.map(({ tee, green, par }, i) => ({
      id: i + 1,
      teeCol: tee.col, teeRow: tee.row,
      greenCol: green.col, greenRow: green.row,
      par,
    })),
  };
}
