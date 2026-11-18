import type { Obstacle, Pickup } from './types';
import { WORLD } from './config';

type Pattern = (y: number, difficulty: number, seed: number, width: number) => Obstacle[];
const item = (id: number, x: number, y: number, w: number, h: number, kind: Obstacle['kind'], phase = 0, amplitude = 0): Obstacle => ({ id, x, y, w, h, kind, phase, amplitude, period: 3.2, angle: 0, baseX: x });

// Patterns distribute compact hazards across the full course while preserving open routes.
const patterns: Pattern[] = [
  (y, d, s, w) => [0, 1, 2].map(i => {
    const x = w * (.12 + ((s * 37 + i * 31) % 70) / 100);
    const size = w * (.12 + Math.min(.09, d * .004));
    return item(s * 10 + i, Math.min(w - size - 14, x), y - i * 150, size, 30 + (i % 2) * 12, 'block');
  }),
  (y, d, s, w) => [item(s * 10, w * .12, y, w * .17, 25, 'moving', s, Math.min(w * .12, 24 + d * 5)), item(s * 10 + 1, w * .68, y - 170, w * .17, 25, 'moving', s + 1.8, Math.min(w * .12, 24 + d * 5)), item(s * 10 + 2, w * (.36 + (s % 2) * .28), y - 330, w * .13, 32, 'block')],
  (y, _d, s, w) => [item(s * 10, w * (.18 + (s % 3) * .11), y, w * .11, w * .11, 'orb'), item(s * 10 + 1, w * (.62 - (s % 3) * .08), y - 130, w * .12, w * .12, 'orb'), item(s * 10 + 2, w * (.27 + (s % 2) * .38), y - 270, w * .14, 32, 'block'), item(s * 10 + 3, w * (.71 - (s % 2) * .35), y - 420, w * .105, w * .105, 'orb')],
  (y, d, s, w) => [item(s * 10, w * .08, y, w * .25, 26, 'block'), item(s * 10 + 1, w * .66, y - 125, w * .25, 26, 'block'), item(s * 10 + 2, w * (.32 + (s % 2) * .22), y - 250, w * .19, 38, 'block'), item(s * 10 + 3, w * .12, y - 390, w * .16, 24, 'moving', s, Math.min(w * .1, 20 + d * 4))]
];

export function generateSection(y: number, difficulty: number, id: number, _previousCenter: number = WORLD.width / 2, width: number = WORLD.width) {
  // Seeded pattern sequence is varied but reproducible, which keeps route tuning manageable.
  const pattern = patterns[(id + Math.floor(id / patterns.length)) % patterns.length];
  return pattern(y, difficulty, id + 3, width);
}

export function createPickup(id: number, y: number, width: number = WORLD.width): Pickup {
  return { id, x: width * (.16 + ((id * 29) % 68) / 100), y, type: 'slow', taken: false };
}
