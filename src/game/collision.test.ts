import { describe, expect, it } from 'vitest';
import { circleRect } from './collision';

describe('circle to rectangle collision', () => {
  it('detects overlap including rounded corners', () => {
    expect(circleRect(0, 0, 10, { x: 7, y: 7, w: 20, h: 20 })).toBe(true);
  });
  it('does not report a collision beyond the radius', () => {
    expect(circleRect(0, 0, 10, { x: 7, y: 7, w: 20, h: 20 })).toBe(true);
    expect(circleRect(0, 0, 10, { x: 7, y: 8, w: 20, h: 20 })).toBe(false);
  });
});
