import { COLLECTIBLE_RADIUS, PHYSICS, POWERUP_CONFIG } from './config';
import { collidesObstacle } from './collision';
import type { Coin, Obstacle } from './types';

export function generateCoinPattern(
  section: number,
  width: number,
  y: number,
  obstacles: Obstacle[],
): Coin[] {
  const mode = section % 4,
    candidates: Array<{ x: number; y: number; value?: number }> = [];
  if (mode === 0) {
    const x = width * [0.5, 0.78, 0.38, 0.62][section % 4];
    for (let i = 0; i < 4; i++) candidates.push({ x, y: y - i * 48 });
  } else if (mode === 1) {
    for (let i = 0; i < 5; i++)
      candidates.push({ x: width * [0.22, 0.72, 0.36, 0.78, 0.48][i], y: y - i * 58 });
  } else if (mode === 2) {
    const x = section % 2 ? 0.82 : 0.18;
    for (let i = 0; i < 4; i++)
      candidates.push({
        x: width * (x + (i % 2 ? -0.045 : 0.045)),
        y: y - i * 60,
        value: section % 8 === 2 ? 2 : 1,
      });
  } else {
    const hazard = obstacles[Math.abs(section * 3) % Math.max(1, obstacles.length)];
    const center = hazard ? hazard.x + hazard.w / 2 : width / 2;
    for (let i = 0; i < 4; i++)
      candidates.push({
        x: Math.max(
          width * 0.12,
          Math.min(width * 0.88, center + (i % 2 === 0 ? -1 : 1) * width * 0.27),
        ),
        y: y - i * 64,
        value: 2,
      });
  }
  const clear = candidates.filter(
    (p) =>
      p.x > COLLECTIBLE_RADIUS + 4 &&
      p.x < width - COLLECTIBLE_RADIUS - 4 &&
      !obstacles.some((o) =>
        collidesObstacle(p.x, p.y, COLLECTIBLE_RADIUS + PHYSICS.radius + 6, o),
      ),
  );
  return clear.map((p, i) => ({
    id: section * 100 + i,
    x: p.x,
    y: p.y,
    vx: 0,
    vy: 0,
    value: p.value ?? POWERUP_CONFIG.coinValue,
    phase: (section + i) * 0.75,
  }));
}
export function pullCoin(
  coin: Coin,
  x: number,
  y: number,
  dt: number,
  radius: number,
  strength: number,
): Coin {
  const dx = x - coin.x,
    dy = y - coin.y,
    distance = Math.hypot(dx, dy);
  if (distance <= 1 || distance >= radius) return coin;
  const force = strength * (1 - distance / radius),
    vx = coin.vx + (dx / distance) * force * dt,
    vy = coin.vy + (dy / distance) * force * dt;
  return { ...coin, vx, vy, x: coin.x + vx * dt, y: coin.y + vy * dt };
}
