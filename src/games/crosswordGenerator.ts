import type { ContentItem } from '../types';

export interface PlacedWord {
  itemId: string;
  term: string;
  clue: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
  number: number;
}

export interface CrosswordCell {
  row: number;
  col: number;
  char: string;
  number?: number;
}

export interface CrosswordLayout {
  cells: Map<string, CrosswordCell>;
  words: PlacedWord[];
  rows: number;
  cols: number;
}

const key = (r: number, c: number) => `${r},${c}`;

export function generateCrossword(items: ContentItem[]): CrosswordLayout {
  const sorted = [...items].sort((a, b) => b.term.length - a.term.length);
  const GRID = 20;
  const cells = new Map<string, CrosswordCell>();
  const words: PlacedWord[] = [];

  function canPlace(term: string, row: number, col: number, dir: 'across' | 'down'): boolean {
    for (let i = 0; i < term.length; i++) {
      const r = dir === 'down' ? row + i : row;
      const c = dir === 'across' ? col + i : col;
      if (r < 0 || c < 0 || r >= GRID || c >= GRID) return false;
      const existing = cells.get(key(r, c));
      if (existing && existing.char !== term[i]) return false;
    }
    return true;
  }

  function place(item: ContentItem, row: number, col: number, dir: 'across' | 'down') {
    const term = item.term.toUpperCase().replace(/[^A-Z]/g, '');
    for (let i = 0; i < term.length; i++) {
      const r = dir === 'down' ? row + i : row;
      const c = dir === 'across' ? col + i : col;
      cells.set(key(r, c), { row: r, col: c, char: term[i] });
    }
    words.push({ itemId: item.id, term, clue: item.clue, row, col, direction: dir, number: 0 });
  }

  sorted.forEach((item, idx) => {
    const term = item.term.toUpperCase().replace(/[^A-Z]/g, '');
    if (!term) return;

    if (idx === 0) {
      place(item, Math.floor(GRID / 2), Math.floor(GRID / 2) - Math.floor(term.length / 2), 'across');
      return;
    }

    // try to find an intersection with an already-placed letter
    let placed = false;
    for (const cell of cells.values()) {
      if (placed) break;
      for (let i = 0; i < term.length && !placed; i++) {
        if (term[i] !== cell.char) continue;
        // try placing perpendicular through this cell
        const dir: 'across' | 'down' = 'down';
        const row = cell.row - i;
        const col = cell.col;
        if (canPlace(term, row, col, dir)) {
          place(item, row, col, dir);
          placed = true;
        } else {
          const dir2: 'across' | 'down' = 'across';
          const row2 = cell.row;
          const col2 = cell.col - i;
          if (canPlace(term, row2, col2, dir2)) {
            place(item, row2, col2, dir2);
            placed = true;
          }
        }
      }
    }

    if (!placed) {
      // fallback: place isolated in a fresh row near the bottom of used area
      const usedRows = words.length ? Math.max(...words.map(w => w.row + (w.direction === 'down' ? w.term.length : 1))) : 0;
      const row = Math.min(usedRows + 1, GRID - 1);
      place(item, row, 1, 'across');
    }
  });

  // normalize coordinates to start at 0,0 and assign clue numbers
  const allRows = [...cells.values()].map((c) => c.row);
  const allCols = [...cells.values()].map((c) => c.col);
  const minRow = Math.min(...allRows);
  const minCol = Math.min(...allCols);

  const normalizedCells = new Map<string, CrosswordCell>();
  for (const cell of cells.values()) {
    const r = cell.row - minRow;
    const c = cell.col - minCol;
    normalizedCells.set(key(r, c), { row: r, col: c, char: cell.char });
  }
  words.forEach((w) => { w.row -= minRow; w.col -= minCol; });

  // number words in reading order (top-to-bottom, left-to-right start cells)
  const startCells = words
    .map((w) => ({ w, r: w.row, c: w.col }))
    .sort((a, b) => (a.r - b.r) || (a.c - b.c));
  let n = 1;
  const numberedAt = new Map<string, number>();
  startCells.forEach(({ w, r, c }) => {
    const k = key(r, c);
    if (!numberedAt.has(k)) numberedAt.set(k, n++);
    w.number = numberedAt.get(k)!;
  });
  for (const [k, num] of numberedAt) {
    const [r, c] = k.split(',').map(Number);
    const cell = normalizedCells.get(key(r, c));
    if (cell) cell.number = num;
  }

  const rows = Math.max(...[...normalizedCells.values()].map((c) => c.row)) + 1;
  const cols = Math.max(...[...normalizedCells.values()].map((c) => c.col)) + 1;

  return { cells: normalizedCells, words, rows, cols };
}
