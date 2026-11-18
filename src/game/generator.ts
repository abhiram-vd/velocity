import { PHYSICS, WORLD } from './config';
import { collidesObstacle } from './collision';
import { recoverySection } from './progression';
import { stepPlayer, type Player } from './physics';
import type { Obstacle, Pickup } from './types';

type Build = (y: number, tier: number, seed: number, width: number) => Obstacle[];
export type GeneratorOptions = { playerX?: number; playerVx?: number; playerY?: number; speed?: number; elapsed?: number; recentPatternIds?: number[] };
const make = (id: number, x: number, y: number, w: number, h: number, kind: Obstacle['kind'], opts: Partial<Obstacle> = {}): Obstacle => ({ id, x, y, w, h, kind, phase: 0, amplitude: 0, period: 3, angle: 0, baseX: x, ...opts });
const assign = (items: Obstacle[], patternId: number) => items.map(o => ({ ...o, patternId }));

const builds: Build[] = [
  // Recovery: edge hazards leave the center open and preserve the player's current line.
  (y, _tier, seed, w) => [make(seed * 20, w * .10, y, w * .12, 28, 'block'), make(seed * 20 + 1, w * .76, y - 210, w * .12, 28, 'block'), make(seed * 20 + 2, w * .17, y - 410, w * .12, 28, 'block')],
  // Broad alternating openings; each gate is a pair of real collision objects.
  (y, tier, seed, w) => [0, 1, 2].flatMap(i => { const gap = w * (.40 - tier * .045), center = w * (.36 + ((seed + i) % 3) * .14), left = center - gap / 2, right = center + gap / 2; return [make(seed * 20 + i * 2, 0, y - i * 205, left, 26, 'block'), make(seed * 20 + i * 2 + 1, right, y - i * 205, w - right, 26, 'block')]; }),
  // Staggered blocks invite early changes of direction without sealing a row.
  (y, tier, seed, w) => [0,1,2,3].map(i => { const size = w * (.14 + tier * .045), x = w * ([.16,.68,.36,.76][(i + seed) % 4]); return make(seed * 20 + i, Math.min(w - size - 10, x), y - i * 145, size, 32 + i % 2 * 10, 'block'); }),
  // Small groups alternate with open beats to teach players to read sequences.
  (y, tier, seed, w) => [make(seed * 20, w * .20, y, w * .085, w * .085, 'orb'), make(seed * 20 + 1, w * .34, y - 55, w * .09, 28, 'block'), make(seed * 20 + 2, w * .69, y - 195, w * .09, w * .09, 'orb'), make(seed * 20 + 3, w * .48, y - 360, w * (.13 + tier * .04), 28, 'block')],
  // Moving gates have different motion profiles and are introduced after the basics.
  (y, tier, seed, w) => [make(seed * 20, w * .12, y, w * .20, 24, 'moving', { phase: seed, amplitude: w * (.08 + tier * .035), period: 3.8, motion: 'sine' }), make(seed * 20 + 1, w * .65, y - 185, w * .18, 25, 'moving', { phase: seed * .7, amplitude: w * (.11 + tier * .03), period: 2.8, motion: 'sweep' }), make(seed * 20 + 2, w * .34, y - 370, w * .12, 32, 'block')],
  // Narrow vertical pieces and diamonds create varied collision silhouettes.
  (y, _tier, seed, w) => [make(seed * 20, w * .28, y, w * .065, 82, 'vertical'), make(seed * 20 + 1, w * .68, y - 155, w * .12, w * .12, 'diamond'), make(seed * 20 + 2, w * .39, y - 310, w * .065, 94, 'vertical'), make(seed * 20 + 3, w * .74, y - 465, w * .10, w * .10, 'orb')],
  // A turning square is a real rotating collider, with an open response lane.
  (y, tier, seed, w) => [make(seed * 20, w * .42, y, w * (.12 + tier * .025), w * (.12 + tier * .025), 'rotor', { angularVelocity: 1.1 + tier * .5 }), make(seed * 20 + 1, w * .12, y - 235, w * .15, 30, 'block'), make(seed * 20 + 2, w * .72, y - 410, w * .13, w * .13, 'diamond')],
  // Late combinations reward preparing a line several obstacles ahead.
  (y, tier, seed, w) => [make(seed * 20, w * .10, y, w * .22, 25, 'moving', { phase: seed, amplitude: w * .1, period: 2.7, motion: 'sweep' }), make(seed * 20 + 1, w * .60, y - 135, w * .12, w * .12, 'orb'), make(seed * 20 + 2, w * .35, y - 270, w * .11, w * .11, 'diamond'), make(seed * 20 + 3, w * .72, y - 405, w * .065, 100, 'vertical'), make(seed * 20 + 4, w * .20, y - 545, w * (.16 + tier * .04), 28, 'block')]
];

export function patternsForStage(tier: number) {
  return tier < 1 ? [1, 2, 3] : tier < 2 ? [1, 2, 3, 4] : tier < 3 ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7];
}
export function generateSection(y: number, tier: number, id: number, width: number = WORLD.width, options: GeneratorOptions = {}) {
  const eligible = patternsForStage(tier);
  const recovering = recoverySection(id);
  const recent = new Set(options.recentPatternIds ?? []);
  const candidates = recovering ? [0] : eligible.filter(p => !recent.has(p));
  const available = candidates.length ? candidates : eligible;
  const rotation = Math.abs(id * 7 + Math.floor(tier * 11)) % available.length;
  const ordered = [...available.slice(rotation), ...available.slice(0, rotation)];
  const sim = { width, playerX: options.playerX ?? width / 2, playerVx: options.playerVx ?? 0, playerY: options.playerY ?? 650, speed: options.speed ?? DIFF_DEFAULT_SPEED, elapsed: options.elapsed ?? 0 };
  for (const patternId of ordered.slice(0, 2)) {
    const obstacles = assign(builds[patternId](y, tier, id + 3, width).map(o => {
      if (o.kind !== 'moving') return o;
      const safeAmplitude = Math.min(o.amplitude, Math.max(0, Math.min(o.x, width - o.x - o.w)));
      return { ...o, amplitude: safeAmplitude };
    }), patternId);
    if (isReachable(obstacles, sim)) return obstacles;
  }
  const fallback = assign(makeFallback(y, id, width, sim.playerX), 0);
  return isReachable(fallback, sim) ? fallback : [];
}

const DIFF_DEFAULT_SPEED = 260;
function makeFallback(y: number, seed: number, width: number, playerX: number) {
  const gap = width * .46, center = Math.max(gap / 2 + 12, Math.min(width - gap / 2 - 12, playerX));
  const left = center - gap / 2, right = center + gap / 2;
  return [make(seed * 20, 0, y, left, 25, 'block'), make(seed * 20 + 1, right, y, width - right, 25, 'block'), make(seed * 20 + 2, 0, y - 270, left, 25, 'block'), make(seed * 20 + 3, right, y - 270, width - right, 25, 'block')];
}

/** Discrete three-input rollout through the whole pattern; bins states to keep validation cheap. */
export function isReachable(obstacles: Obstacle[], config: { width: number; playerX: number; playerVx: number; playerY: number; speed: number; elapsed?: number }) {
  if (!obstacles.length) return true;
  const dt = .1, top = Math.min(...obstacles.map(o => o.y)), horizon = Math.max(0, (config.playerY + PHYSICS.radius * 2 - top) / config.speed);
  let states: Player[] = [{ x: config.playerX, vx: config.playerVx, invulnerable: 0 }];
  for (let time = 0; time <= horizon; time += dt) {
    const next = new Map<string, Player>();
    outer: for (const state of states) for (const direction of [-1, 0, 1]) {
      const p = { ...state }; stepPlayer(p, { left: direction < 0, right: direction > 0 }, dt, config.width);
      const valid = obstacles.every(o => {
        const t = (config.elapsed ?? 0) + time + dt / 2;
        const x = o.kind === 'moving' ? (o.baseX ?? o.x) + (o.motion === 'sweep' ? triangle(t / o.period + o.phase) : Math.sin(t * Math.PI * 2 / o.period + o.phase)) * o.amplitude : o.x;
        const y = o.y + config.speed * (time + dt / 2);
        if (y + o.h < config.playerY - PHYSICS.radius * 2 || y > config.playerY + PHYSICS.radius * 2) return true;
        const expanded = { ...o, x: x - PHYSICS.maxSpeed * dt * .45, y: y - config.speed * dt * .5, w: o.w + PHYSICS.maxSpeed * dt * .9, h: o.h + config.speed * dt };
        if (o.kind === 'rotor') expanded.angle = o.angle + (o.angularVelocity ?? 1) * (time + dt / 2);
        return !collidesObstacle(p.x, config.playerY, PHYSICS.radius, expanded);
      });
      if (!valid) continue;
      const key = `${Math.round(p.x / 18)}:${Math.round(p.vx / 90)}`;
      if (!next.has(key)) next.set(key, p);
      if (next.size >= 150) break outer;
    }
    states = [...next.values()];
    if (!states.length) return false;
  }
  return states.length > 0;
}
function triangle(value: number) { const phase = ((value % 1) + 1) % 1; return phase < .5 ? phase * 4 - 1 : 3 - phase * 4; }
export function movingOffset(obstacle: Obstacle, elapsed: number) {
  const phase = elapsed / obstacle.period + obstacle.phase;
  return (obstacle.motion === 'sweep' ? triangle(phase) : Math.sin(elapsed * Math.PI * 2 / obstacle.period + obstacle.phase)) * obstacle.amplitude;
}
export function createPickup(id: number, y: number, width: number = WORLD.width): Pickup { return { id, x: width * (.16 + ((id * 29) % 68) / 100), y, type: 'slow', taken: false }; }
