import { describe, expect, it } from 'vitest';
import { bankRun, DEFAULT_SAVE, loadSave, normalizeSave, persistSave, SAVE_KEY } from './save';
import {
  buyUpgrade,
  gripBrake,
  magnetRadius,
  magnetStrength,
  powerUpDuration,
  upgradeEffect,
} from './upgrades';
import { buyCosmetic, equipCosmetic } from './shop';
import { choosePowerUp, powerUpCollision } from './powerups';

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}
describe('persistent arcade progression', () => {
  it('loads defaults and recovers from missing or malformed saves', () => {
    const storage = new MemoryStorage();
    expect(loadSave(storage)).toEqual(DEFAULT_SAVE);
    storage.setItem(SAVE_KEY, '{bad');
    expect(loadSave(storage).coins).toBe(0);
    expect(
      normalizeSave({
        coins: -2,
        upgrades: { magnet: 99 },
        ownedCosmetics: ['unknown'],
        equipped: { ball: 'unknown' },
      }).coins,
    ).toBe(0);
    expect(
      normalizeSave({
        coins: -2,
        upgrades: { magnet: 99 },
        ownedCosmetics: ['unknown'],
        equipped: { ball: 'unknown' },
      }).upgrades.magnet,
    ).toBe(5);
  });
  it('persists currency, upgrades, and equipped cosmetics', () => {
    const storage = new MemoryStorage(),
      save = { ...DEFAULT_SAVE, coins: 100 };
    const improved = buyUpgrade(save, 'freeze');
    expect(improved.ok).toBe(true);
    expect(improved.save.coins).toBe(92);
    expect(powerUpDuration('freeze', 1)).toBeGreaterThan(powerUpDuration('freeze', 0));
    expect(magnetRadius(2)).toBeGreaterThan(magnetRadius(0));
    expect(magnetStrength(2)).toBeGreaterThan(magnetStrength(0));
    expect(gripBrake(2)).toBeGreaterThan(gripBrake(0));
    for (const id of ['shield', 'magnet', 'multiplier', 'freeze', 'grip'] as const)
      expect(powerUpDuration(id, 2)).toBeGreaterThan(powerUpDuration(id, 0));
    const bought = buyCosmetic(improved.save, 'ball-solar');
    expect(bought.ok).toBe(true);
    const equipped = equipCosmetic(bought.save, 'ball-solar');
    expect(equipped.save.equipped.ball).toBe('ball-solar');
    persistSave(equipped.save, storage);
    expect(loadSave(storage)).toEqual(equipped.save);
  });
  it('refuses unaffordable or duplicate purchases', () => {
    expect(buyUpgrade(DEFAULT_SAVE, 'shield').ok).toBe(false);
    expect(buyCosmetic(DEFAULT_SAVE, 'ball-solar').ok).toBe(false);
    expect(
      buyUpgrade(
        { ...DEFAULT_SAVE, coins: 1000, upgrades: { ...DEFAULT_SAVE.upgrades, grip: 5 } },
        'grip',
      ).ok,
    ).toBe(false);
    expect(buyCosmetic({ ...DEFAULT_SAVE, coins: 100 }, 'ball-solar').ok).toBe(true);
    expect(
      buyCosmetic(
        {
          ...DEFAULT_SAVE,
          coins: 100,
          ownedCosmetics: [...DEFAULT_SAVE.ownedCosmetics, 'ball-solar'],
        },
        'ball-solar',
      ).ok,
    ).toBe(false);
  });
  it('makes all five upgrade paths change their active effect', () => {
    for (const id of ['shield', 'magnet', 'multiplier', 'freeze', 'grip'] as const)
      expect(upgradeEffect(id, 1)).not.toBe(upgradeEffect(id, 0));
    expect(upgradeEffect('shield', 3)).toContain('2 hits');
    const first = powerUpCollision(3, 0, 10, 2),
      second = powerUpCollision(
        first.lives,
        first.invulnerable,
        first.shieldRemaining,
        first.shieldCharges,
      );
    expect(first).toMatchObject({ absorbed: true, shieldRemaining: 10, shieldCharges: 1 });
    expect(second).toMatchObject({
      absorbed: true,
      shieldRemaining: 0,
      shieldCharges: 0,
      lives: 3,
    });
  });
  it('weights early power-ups toward magnet and grip and avoids recent repeats', () => {
    const early = Array.from({ length: 30 }, (_, i) => choosePowerUp(0, i));
    expect(
      early.every((p) => p === 'magnet' || p === 'grip' || p === 'shield' || p === 'multiplier'),
    ).toBe(true);
    for (let seed = 0; seed < 20; seed++)
      expect(choosePowerUp(2, seed, ['shield', 'magnet'])).not.toBe('shield');
  });
  it('banks run currency once and records a new best', () => {
    const first = bankRun(DEFAULT_SAVE, { coins: 7, score: 90, distance: 82 }, false),
      again = bankRun(first.save, { coins: 7, score: 90, distance: 82 }, true);
    expect(first.newBest).toBe(true);
    expect(first.save.coins).toBe(7);
    expect(again.banked).toBe(false);
    expect(again.save.coins).toBe(7);
  });
});
