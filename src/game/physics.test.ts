import { describe, expect, it } from 'vitest';
import { stepPlayer, type Player } from './physics';
import { generateSection } from './generator';

describe('momentum physics', () => {
  it('coasts down gradually after releasing input', () => {
    const p: Player = { x: 400, vx: 400, invulnerable: 0 };
    stepPlayer(p, { left: false, right: false }, 0.1, 800);
    expect(p.vx).toBeGreaterThan(0);
    expect(p.vx).toBeLessThan(400);
  });
  it('takes time to reverse direction', () => {
    const p: Player = { x: 400, vx: 300, invulnerable: 0 };
    stepPlayer(p, { left: true, right: false }, 0.1, 800);
    expect(p.vx).toBeGreaterThan(0);
    expect(p.x).toBeGreaterThan(400);
  });
  it('applies the same acceleration over equal elapsed time at different step sizes', () => {
    const a: Player = { x: 300, vx: 0, invulnerable: 0 },
      b = { ...a };
    for (let i = 0; i < 60; i++) stepPlayer(a, { left: false, right: true }, 1 / 60, 800);
    for (let i = 0; i < 120; i++) stepPlayer(b, { left: false, right: true }, 1 / 120, 800);
    expect(a.vx).toBeCloseTo(b.vx, 6);
    expect(a.x).toBeCloseTo(b.x, 0);
  });
});

describe('pattern generation', () => {
  it('keeps generated obstacles inside course bounds and leaves open lanes', () => {
    for (let id = 0; id < 30; id++) {
      const pieces = generateSection(-100, Math.min(3, Math.floor(id / 10)), id, 800, {
        playerX: 400,
        playerY: 650,
        speed: 235,
      });
      expect(pieces.every((o) => o.x >= 0 && o.x + o.w <= 800)).toBe(true);
      expect(pieces.length).toBeGreaterThan(0);
    }
  });
});
