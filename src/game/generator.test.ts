import { describe, expect, it } from 'vitest';
import { WORLD } from './config';
import { generateSection, isReachable } from './generator';

describe('arcade obstacle patterns', () => {
  it('keeps hazards within the full course width and ahead of the player at spawn', () => {
    for (let seed = 0; seed < 80; seed++) {
      const tier = Math.min(3, Math.floor(seed / 20));
      const obstacles = generateSection(-120, tier, seed, 800, {
        playerX: 400,
        playerY: 650,
        speed: 235,
      });
      expect(obstacles.length).toBeGreaterThan(0);
      expect(
        obstacles.every((o) => o.x >= 0 && o.x + o.w <= 800 && o.y + o.h < 400),
        `seed ${seed}: ${JSON.stringify(obstacles)}`,
      ).toBe(true);
      expect(
        isReachable(obstacles, { width: 800, playerX: 400, playerVx: 0, playerY: 650, speed: 235 }),
      ).toBe(true);
      expect(obstacles[0]?.patternId).toBeDefined();
    }
  });

  it('leaves a broad horizontal route through every generated row', () => {
    for (let seed = 0; seed < 80; seed++) {
      const tier = Math.min(3, Math.floor(seed / 20));
      const obstacles = generateSection(-120, tier, seed, 800, {
        playerX: 400,
        playerY: 650,
        speed: 235,
      });
      const rows = [...new Set(obstacles.map((o) => o.y))];
      for (const y of rows) {
        const row = obstacles.filter((o) => o.y === y).sort((a, b) => a.x - b.x);
        let cursor = 0,
          widest = 0;
        for (const o of row) {
          widest = Math.max(widest, o.x - cursor);
          cursor = Math.max(cursor, o.x + o.w);
        }
        widest = Math.max(widest, 800 - cursor);
        expect(widest).toBeGreaterThan(180);
      }
    }
  });

  it('keeps a route from varied positions and existing horizontal momentum', () => {
    const cases = [
      { tier: 0, x: 120, vx: 380, speed: 250 },
      { tier: 1, x: 650, vx: -320, speed: 330 },
      { tier: 2, x: 300, vx: 260, speed: 470 },
      { tier: 3, x: 720, vx: -460, speed: 610 },
      { tier: 3, x: 80, vx: 410, speed: 625 },
    ];
    cases.forEach((scenario, index) => {
      const config = {
        width: 800,
        playerX: scenario.x,
        playerVx: scenario.vx,
        playerY: 650,
        speed: scenario.speed,
      };
      const obstacles = generateSection(-120, scenario.tier, 20 + index, 800, {
        ...config,
        recentPatternIds: [1, 2],
      });
      expect(isReachable(obstacles, config)).toBe(true);
    });
  });

  it('keeps the 9:16 logical viewport playable at early and late speeds', () => {
    expect(WORLD.width / WORLD.height).toBe(9 / 16);
    for (const [tier, speed, seed] of [
      [0, 330, 2],
      [1, 430, 8],
      [2, 600, 15],
      [3, 760, 24],
    ]) {
      const config = {
        width: WORLD.width,
        playerX: WORLD.width / 2,
        playerVx: 0,
        playerY: WORLD.height * 0.73,
        speed,
      };
      const obstacles = generateSection(-100, tier, seed, WORLD.width, config);
      expect(obstacles.length).toBeGreaterThan(0);
      expect(obstacles.every((o) => o.x >= 0 && o.x + o.w <= WORLD.width)).toBe(true);
      expect(isReachable(obstacles, config)).toBe(true);
    }
  });

  it('avoids recent patterns and inserts a recovery section on schedule', () => {
    const seen: number[] = [];
    for (let section = 0; section < 5; section++) {
      const obstacles = generateSection(-120, 0, section, 800, {
        playerX: 400,
        playerVx: 0,
        playerY: 650,
        speed: 235,
        recentPatternIds: seen.slice(-2),
      });
      const patternId = obstacles[0]?.patternId;
      expect(patternId).toBeDefined();
      if (section > 0 && section < 4) expect(patternId).not.toBe(seen[seen.length - 1]);
      if (section === 4) expect(patternId).toBe(0);
      seen.push(patternId!);
    }
  });
});
