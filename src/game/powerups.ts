import { COLLECTIBLE_RADIUS, PHYSICS, POWERUP_CONFIG } from './config';
import { collidesObstacle } from './collision';
import type { Obstacle, PowerUpId, PowerUpPickup } from './types';
import { takeHit } from './lives';

export const POWERUPS: Record<PowerUpId, { label: string; glyph: string; color: string }> = {
  shield: { label: 'SHIELD', glyph: '◇', color: '#6ee7f2' },
  magnet: { label: 'MAGNET', glyph: '⌁', color: '#ed79ce' },
  multiplier: { label: '2×', glyph: '×2', color: '#ffd467' },
  freeze: { label: 'INVINCIBLE', glyph: '✦', color: '#8bc8ff' },
  grip: { label: 'GRIP', glyph: '▧', color: '#a7e77c' },
};
const weights = [
  { shield: 1, magnet: 4, multiplier: 1, freeze: 0, grip: 4 },
  { shield: 2, magnet: 3, multiplier: 2, freeze: 1, grip: 3 },
  { shield: 3, magnet: 2, multiplier: 3, freeze: 3, grip: 2 },
  { shield: 3, magnet: 2, multiplier: 3, freeze: 3, grip: 2 },
];
export function choosePowerUp(
  stage: number,
  seed: number,
  recent: PowerUpId[] = [],
  shieldLevel = 0,
): PowerUpId {
  const pool = weights[Math.min(3, stage)],
    avoid = new Set(recent.slice(-2));
  const candidates = (Object.keys(pool) as PowerUpId[]).filter(
    (id) => pool[id] > 0 && !avoid.has(id),
  );
  const available = candidates.length ? candidates : (Object.keys(pool) as PowerUpId[]);
  const total = available.reduce(
    (sum, id) => sum + pool[id] * (id === 'shield' ? 1 + shieldLevel * 0.12 : 1),
    0,
  );
  let pick = randomUnit(seed) * total;
  for (const id of available) {
    pick -= pool[id] * (id === 'shield' ? 1 + shieldLevel * 0.12 : 1);
    if (pick <= 0) return id;
  }
  return available[0] ?? 'magnet';
}
export function powerUpInterval(stage: number) {
  return stage === 0
    ? POWERUP_CONFIG.earlyInterval
    : stage === 1
      ? POWERUP_CONFIG.midInterval
      : POWERUP_CONFIG.lateInterval;
}
export function powerUpShouldSpawn(stage: number, seed: number) {
  return randomUnit(seed + 71) < POWERUP_CONFIG.spawnChance[Math.min(3, stage)];
}
// Kept as a standalone helper for callers that need a temporary world pause.
export function worldScrollSpeed(speed: number, freezeRemaining: number) {
  return freezeRemaining > 0 ? 0 : speed;
}
export function findPowerUpSpot(
  seed: number,
  width: number,
  y: number,
  obstacles: Obstacle[],
  playerX: number,
  occupied: Array<{ x: number; y: number }> = [],
): { x: number; y: number } | null {
  const xs = [0.16, 0.28, 0.4, 0.5, 0.6, 0.72, 0.84]
      .map((n) => width * n)
      .sort((a, b) => Math.abs(a - playerX) - Math.abs(b - playerX)),
    ys = [y, y - 150, y - 290];
  for (const x of xs)
    for (let offset = 0; offset < ys.length; offset++) {
      const py = ys[(offset + seed) % ys.length];
      if (occupied.some((p) => Math.hypot(p.x - x, p.y - py) < 55)) continue;
      if (
        obstacles.some((o) => collidesObstacle(x, py, COLLECTIBLE_RADIUS + PHYSICS.radius + 6, o))
      )
        continue;
      return { x, y: py };
    }
  return null;
}
export function makePowerUp(
  id: number,
  type: PowerUpId,
  position: { x: number; y: number },
): PowerUpPickup {
  return { id, type, x: position.x, y: position.y, phase: randomUnit(id) * Math.PI * 2 };
}
export function powerUpCollision(
  lives: number,
  invulnerable: number,
  shieldRemaining: number,
  shieldCharges = 1,
) {
  if (shieldRemaining > 0 && shieldCharges > 0) {
    const charges = shieldCharges - 1;
    return {
      lives,
      invulnerable: Math.max(invulnerable, 0.65),
      shieldRemaining: charges ? shieldRemaining : 0,
      shieldCharges: charges,
      hit: false,
      absorbed: true,
    };
  }
  return { ...takeHit(lives, invulnerable), shieldRemaining, shieldCharges, absorbed: false };
}
export function randomUnit(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}
