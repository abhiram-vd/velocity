import { describe, expect, it } from 'vitest';
import { ScreenShake } from './screenShake';

describe('temporary death camera shake', () => {
  it('fades to zero and explicitly clears camera offsets when time expires', () => {
    const shake = new ScreenShake();
    shake.trigger(14, 1.35);
    expect(shake.offset(() => 1)).toEqual({ x: 14, y: 10.5 });
    shake.advance(0.6);
    expect(shake.offset(() => 1).x).toBeCloseTo((14 * 0.75) / 1.35);
    shake.advance(2);
    expect(shake.remaining).toBe(0);
    expect(shake.intensity).toBe(0);
    expect(shake.offset()).toEqual({ x: 0, y: 0 });
  });

  it('clears immediately when returning home or starting a new run', () => {
    const shake = new ScreenShake();
    shake.trigger(8, 0.8);
    shake.offset(() => 1);
    shake.clear();
    expect(shake).toMatchObject({
      remaining: 0,
      duration: 0,
      intensity: 0,
      offsetX: 0,
      offsetY: 0,
    });
  });
});
