import { POWERUP_CONFIG } from './config';
export function scoreDistance(distanceDelta: number, multiplierActive: boolean) {
  return distanceDelta * (multiplierActive ? 2 : 1);
}
export function scoreCoin(value: number, multiplierActive: boolean) {
  return value * POWERUP_CONFIG.coinScore * (multiplierActive ? 2 : 1);
}
