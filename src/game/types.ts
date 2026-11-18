export type Rect = { x: number; y: number; w: number; h: number };
export type Obstacle = Rect & { id: number; kind: 'barrier' | 'moving' | 'block' | 'orb'; phase: number; amplitude: number; period: number; angle: number; baseX?: number };
export type Pickup = { id: number; x: number; y: number; type: 'slow'; taken: boolean };
export type GameStatus = 'menu' | 'playing' | 'paused' | 'over';
export type InputState = { left: boolean; right: boolean };
