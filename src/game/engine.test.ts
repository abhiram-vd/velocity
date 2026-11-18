import { afterEach, describe, expect, it, vi } from 'vitest';
import { WORLD } from './config';
import { GameEngine } from './engine';
import { DEFAULT_SAVE } from './save';

afterEach(() => vi.unstubAllGlobals());

describe('death camera reset', () => {
  it('fades on death and clears before returning home or starting another run', () => {
    vi.stubGlobal('devicePixelRatio', 1);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const context = { setTransform: vi.fn() } as unknown as CanvasRenderingContext2D;
    const canvas = {
      getContext: () => context,
      getBoundingClientRect: () => ({ width: 450, height: 800 }),
    } as unknown as HTMLCanvasElement;
    const engine = new GameEngine(canvas, DEFAULT_SAVE, vi.fn());
    const die = () => {
      engine.start();
      engine.lives = 1;
      engine.obstacles = [
        {
          id: 9,
          x: WORLD.width / 2 - 20,
          y: WORLD.height * 0.73 - 20,
          w: 40,
          h: 40,
          kind: 'block',
          phase: 0,
          amplitude: 0,
          period: 1,
          angle: 0,
        },
      ];
      (engine as unknown as { checkCollision: () => void }).checkCollision();
      expect(engine.status).toBe('over');
      expect(engine.cameraShake.remaining).toBe(1.8);
      engine.cameraShake.advance(0.4);
      expect(engine.cameraShake.remaining).toBeLessThan(1.8);
      engine.showHome();
      expect(engine.cameraShake).toMatchObject({
        remaining: 0,
        duration: 0,
        intensity: 0,
        offsetX: 0,
        offsetY: 0,
      });
    };
    die();
    die();
    expect(engine.cameraShake.offset()).toEqual({ x: 0, y: 0 });
    engine.destroy();
  });
});

describe('near-miss encounters', () => {
  it('cancels a pending reward when a shield absorbs an actual collision', () => {
    vi.stubGlobal('devicePixelRatio', 1);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() });
    const context = { setTransform: vi.fn() } as unknown as CanvasRenderingContext2D;
    const canvas = {
      getContext: () => context,
      getBoundingClientRect: () => ({ width: 450, height: 800 }),
    } as unknown as HTMLCanvasElement;
    const engine = new GameEngine(canvas, DEFAULT_SAVE, vi.fn());
    engine.start();
    engine.active.shield = 10;
    engine.shieldCharges = 1;
    const obstacle = {
      id: 11,
      x: engine.player.x - 20,
      y: WORLD.height * 0.73 - 20,
      w: 40,
      h: 40,
      kind: 'block' as const,
      phase: 0,
      amplitude: 0,
      period: 1,
      angle: 0,
    };
    engine.obstacles = [obstacle];
    (engine as unknown as { checkNearMisses: () => void }).checkNearMisses();
    (engine as unknown as { checkCollision: () => void }).checkCollision();
    obstacle.y += 50;
    (engine as unknown as { checkNearMisses: () => void }).checkNearMisses();
    expect(engine.lives).toBe(3);
    expect(engine.score).toBe(0);
    engine.destroy();
  });
});
