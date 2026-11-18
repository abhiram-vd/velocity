import { PHYSICS } from './config';
import type { InputState } from './types';

export type Player = { x: number; vx: number; invulnerable: number };
export function stepPlayer(
  player: Player,
  input: InputState,
  dt: number,
  width: number,
  brakeMultiplier = 1,
) {
  const initialVx = player.vx;
  const direction = Number(input.right) - Number(input.left);
  if (direction) player.vx += direction * PHYSICS.acceleration * dt;
  else player.vx = approach(player.vx, 0, PHYSICS.drag * dt);
  // Intentional braking during a reversal makes momentum matter without locking control.
  if (direction && Math.sign(player.vx) !== direction)
    player.vx = approach(player.vx, 0, PHYSICS.brake * brakeMultiplier * dt);
  player.vx = Math.max(-PHYSICS.maxSpeed, Math.min(PHYSICS.maxSpeed, player.vx));
  player.x += (initialVx + player.vx) * 0.5 * dt;
  const edge = PHYSICS.radius + 8;
  if (player.x < edge) {
    player.x = edge;
    player.vx = Math.max(0, player.vx);
  }
  if (player.x > width - edge) {
    player.x = width - edge;
    player.vx = Math.min(0, player.vx);
  }
  player.invulnerable = Math.max(0, player.invulnerable - dt);
}
function approach(value: number, target: number, amount: number) {
  return value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);
}
