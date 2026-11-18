import { describe, expect, it } from 'vitest';
import {
  circlePolygon,
  circleRect,
  circleRotatedRect,
  collidesObstacle,
  obstacleClearance,
  qualifiesNearMiss,
} from './collision';

describe('circle to rectangle collision', () => {
  it('detects overlap including rounded corners', () => {
    expect(circleRect(0, 0, 10, { x: 7, y: 7, w: 20, h: 20 })).toBe(true);
  });
  it('does not report a collision beyond the radius', () => {
    expect(circleRect(0, 0, 10, { x: 7, y: 7, w: 20, h: 20 })).toBe(true);
    expect(circleRect(0, 0, 10, { x: 7, y: 8, w: 20, h: 20 })).toBe(false);
  });
});

describe('special obstacle hitboxes', () => {
  it('checks a rotated rectangle in its rotated space', () => {
    expect(circleRotatedRect(0, 14, 3, { x: -24, y: -4, w: 48, h: 8 }, Math.PI / 2)).toBe(true);
    expect(circleRotatedRect(0, 27, 2, { x: -24, y: -4, w: 48, h: 8 }, Math.PI / 2)).toBe(false);
  });
  it('checks polygon edges and interiors', () => {
    const diamond: Array<[number, number]> = [
      [0, -10],
      [10, 0],
      [0, 10],
      [-10, 0],
    ];
    expect(circlePolygon(0, 0, 1, diamond)).toBe(true);
    expect(circlePolygon(12, 12, 1, diamond)).toBe(false);
    expect(circlePolygon(10, 0, 1, diamond)).toBe(true);
  });
  it('uses each obstacle type’s collision geometry', () => {
    const base = { id: 1, x: 0, y: 0, w: 30, h: 30, phase: 0, amplitude: 0, period: 1, angle: 0 };
    expect(collidesObstacle(15, 15, 4, { ...base, kind: 'block' })).toBe(true);
    expect(collidesObstacle(10, 15, 3, { ...base, kind: 'vertical', w: 8 })).toBe(true);
    expect(collidesObstacle(15, 15, 4, { ...base, kind: 'orb' })).toBe(true);
    expect(collidesObstacle(15, 15, 4, { ...base, kind: 'rotor' })).toBe(true);
    expect(collidesObstacle(15, 15, 4, { ...base, kind: 'diamond' })).toBe(true);
    expect(collidesObstacle(60, 60, 4, { ...base, kind: 'diamond' })).toBe(false);
  });
});

describe('near-miss clearance', () => {
  const obstacle = {
    id: 7,
    x: 20,
    y: 0,
    w: 20,
    h: 20,
    kind: 'block' as const,
    phase: 0,
    amplitude: 0,
    period: 1,
    angle: 0,
  };
  it('measures only a narrow gap from the player collision boundary', () => {
    expect(obstacleClearance(10, 10, 5, obstacle, 8)).toBeCloseTo(5, 1);
    expect(obstacleClearance(15, 10, 5, obstacle, 8)).toBe(-1);
    expect(obstacleClearance(5, 10, 5, obstacle, 6)).toBe(Infinity);
  });
  it('uses the rotated obstacle collider when measuring a close pass', () => {
    const rotor = {
      ...obstacle,
      x: 0,
      y: 0,
      w: 40,
      h: 8,
      kind: 'rotor' as const,
      angle: Math.PI / 2,
    };
    expect(obstacleClearance(32, 4, 4, rotor, 6)).toBeCloseTo(4, 1);
  });
  it('never rewards an encounter that contained a collision', () => {
    expect(qualifiesNearMiss(3, false, 6)).toBe(true);
    expect(qualifiesNearMiss(0, false, 6)).toBe(false);
    expect(qualifiesNearMiss(3, true, 6)).toBe(false);
    expect(qualifiesNearMiss(7, false, 6)).toBe(false);
  });
});
