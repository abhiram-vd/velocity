import { describe, expect, it } from 'vitest';
import { generateSection } from './generator';

describe('arcade obstacle patterns', () => {
  it('keeps hazards within the full course width and ahead of the player at spawn', () => {
    for (let seed = 0; seed < 80; seed++) {
      const obstacles = generateSection(-120, seed / 6, seed, 400, 800);
      expect(obstacles.length).toBeGreaterThan(0);
      expect(obstacles.every(o => o.x >= 0 && o.x + o.w <= 800 && o.y + o.h < 0)).toBe(true);
    }
  });

  it('leaves a broad horizontal route through every generated row', () => {
    for (let seed = 0; seed < 80; seed++) {
      const obstacles = generateSection(-120, seed / 6, seed, 400, 800);
      const rows = [...new Set(obstacles.map(o => o.y))];
      for (const y of rows) {
        const row = obstacles.filter(o => o.y === y).sort((a, b) => a.x - b.x);
        let cursor = 0, widest = 0;
        for (const o of row) { widest = Math.max(widest, o.x - cursor); cursor = Math.max(cursor, o.x + o.w); }
        widest = Math.max(widest, 800 - cursor);
        expect(widest).toBeGreaterThan(180);
      }
    }
  });
});
