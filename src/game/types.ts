export type Rect = { x: number; y: number; w: number; h: number };
export type Obstacle = Rect & {
  id: number;
  kind: 'moving' | 'block' | 'orb' | 'rotor' | 'diamond' | 'vertical';
  phase: number;
  amplitude: number;
  period: number;
  angle: number;
  angularVelocity?: number;
  motion?: 'sine' | 'sweep';
  baseX?: number;
  patternId?: number;
};
export type PowerUpId = 'shield' | 'magnet' | 'multiplier' | 'freeze' | 'grip';
export type ActivePowerUps = Record<PowerUpId, number>;
export type PowerUpPickup = { id: number; x: number; y: number; type: PowerUpId; phase: number };
export type Coin = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  phase: number;
};
export type Gem = { id: number; x: number; y: number; phase: number };
export type GameStatus = 'menu' | 'playing' | 'paused' | 'over';
export type InputState = { left: boolean; right: boolean };
