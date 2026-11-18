import type { Obstacle, Rect } from './types';

export function circleRect(x: number, y: number, radius: number, rect: Rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}
export function circleCircle(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
) {
  return (ax - bx) ** 2 + (ay - by) ** 2 <= (ar + br) ** 2;
}
export function circleRotatedRect(x: number, y: number, radius: number, rect: Rect, angle: number) {
  const dx = x - (rect.x + rect.w / 2),
    dy = y - (rect.y + rect.h / 2),
    cos = Math.cos(angle),
    sin = Math.sin(angle);
  return circleRect(dx * cos + dy * sin, -dx * sin + dy * cos, radius, {
    x: -rect.w / 2,
    y: -rect.h / 2,
    w: rect.w,
    h: rect.h,
  });
}
export function circlePolygon(
  x: number,
  y: number,
  radius: number,
  points: Array<[number, number]>,
) {
  let inside = false,
    minDistance = Infinity;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i],
      [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    const dx = xj - xi,
      dy = yj - yi,
      t = Math.max(0, Math.min(1, ((x - xi) * dx + (y - yi) * dy) / (dx * dx + dy * dy)));
    minDistance = Math.min(minDistance, Math.hypot(x - (xi + t * dx), y - (yi + t * dy)));
  }
  return inside || minDistance <= radius;
}
export function collidesObstacle(x: number, y: number, radius: number, obstacle: Obstacle) {
  if (obstacle.kind === 'orb')
    return circleCircle(
      x,
      y,
      radius,
      obstacle.x + obstacle.w / 2,
      obstacle.y + obstacle.h / 2,
      Math.min(obstacle.w, obstacle.h) * 0.43,
    );
  if (obstacle.kind === 'rotor') return circleRotatedRect(x, y, radius, obstacle, obstacle.angle);
  if (obstacle.kind === 'diamond')
    return circlePolygon(x, y, radius, [
      [obstacle.x + obstacle.w / 2, obstacle.y],
      [obstacle.x + obstacle.w, obstacle.y + obstacle.h / 2],
      [obstacle.x + obstacle.w / 2, obstacle.y + obstacle.h],
      [obstacle.x, obstacle.y + obstacle.h / 2],
    ]);
  return circleRect(x, y, radius, obstacle);
}

/** Minimum separation between a moving circle's collision boundary and an obstacle. */
export function obstacleClearance(
  x: number,
  y: number,
  radius: number,
  obstacle: Obstacle,
  maxGap: number,
) {
  if (collidesObstacle(x, y, radius, obstacle)) return -1;
  if (!collidesObstacle(x, y, radius + maxGap, obstacle)) return Infinity;
  let clear = radius,
    hit = radius + maxGap;
  for (let i = 0; i < 9; i++) {
    const mid = (clear + hit) / 2;
    if (collidesObstacle(x, y, mid, obstacle)) hit = mid;
    else clear = mid;
  }
  return hit - radius;
}

export function qualifiesNearMiss(closestGap: number, collided: boolean, threshold: number) {
  return !collided && closestGap > 0 && closestGap <= threshold;
}
