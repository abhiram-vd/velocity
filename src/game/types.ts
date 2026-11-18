export type Rect = { x: number; y: number; w: number; h: number };
export type Obstacle = Rect & { id: number; kind: 'moving' | 'block' | 'orb' | 'rotor' | 'diamond' | 'vertical'; phase: number; amplitude: number; period: number; angle: number; angularVelocity?: number; motion?: 'sine' | 'sweep'; baseX?: number; patternId?: number };
export type Pickup = { id: number; x: number; y: number; type: 'slow'; taken: boolean };
export type GameStatus = 'menu' | 'playing' | 'paused' | 'over';
export type InputState = { left: boolean; right: boolean };
