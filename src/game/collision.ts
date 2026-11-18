import type { Rect } from './types';
export function circleRect(x: number, y: number, radius: number, rect: Rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}
export function circleCircle(ax: number, ay: number, ar: number, bx: number, by: number, br: number) {
  return (ax - bx) ** 2 + (ay - by) ** 2 <= (ar + br) ** 2;
}
