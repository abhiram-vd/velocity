import type { ActivePowerUps, PowerUpId } from './types';
import { DEFAULT_EQUIPPED, COSMETICS, type CosmeticSlot } from './cosmetics';

export type SaveData = {
  version: 1;
  coins: number;
  bestScore: number;
  bestDistance: number;
  upgrades: Record<PowerUpId, number>;
  ownedCosmetics: string[];
  equipped: Record<CosmeticSlot, string>;
  settings: { sound: boolean; screenShake: boolean };
};
export const SAVE_KEY = 'velocity-save-v1';
export const DEFAULT_SAVE: SaveData = {
  version: 1,
  coins: 0,
  bestScore: 0,
  bestDistance: 0,
  upgrades: { shield: 0, magnet: 0, multiplier: 0, freeze: 0, grip: 0 },
  ownedCosmetics: ['ball-pulse', 'trail-none', 'theme-midnight'],
  equipped: { ...DEFAULT_EQUIPPED },
  settings: { sound: true, screenShake: true },
};
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
function storageOrNull(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
const nonnegative = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
export function normalizeSave(value: unknown): SaveData {
  const raw = value && typeof value === 'object' ? (value as Partial<SaveData>) : {};
  const levels =
    raw.upgrades && typeof raw.upgrades === 'object' ? raw.upgrades : ({} as SaveData['upgrades']);
  const known = new Set(COSMETICS.map((c) => c.id));
  const owned = Array.isArray(raw.ownedCosmetics)
    ? [
        ...new Set(
          raw.ownedCosmetics.filter((id): id is string => typeof id === 'string' && known.has(id)),
        ),
      ]
    : [...DEFAULT_SAVE.ownedCosmetics];
  for (const id of DEFAULT_SAVE.ownedCosmetics) if (!owned.includes(id)) owned.push(id);
  const equippedRaw =
    raw.equipped && typeof raw.equipped === 'object' ? raw.equipped : ({} as SaveData['equipped']);
  const equipped = { ...DEFAULT_EQUIPPED };
  for (const slot of ['ball', 'trail', 'theme'] as const) {
    const id = equippedRaw[slot];
    if (
      typeof id === 'string' &&
      owned.includes(id) &&
      COSMETICS.some((c) => c.id === id && c.slot === slot)
    )
      equipped[slot] = id;
  }
  const settingsRaw =
    raw.settings && typeof raw.settings === 'object' ? raw.settings : ({} as SaveData['settings']);
  const level = (id: PowerUpId) => Math.max(0, Math.min(5, Math.floor(nonnegative(levels[id]))));
  return {
    version: 1,
    coins: nonnegative(raw.coins),
    bestScore: nonnegative(raw.bestScore),
    bestDistance: nonnegative(raw.bestDistance),
    upgrades: {
      shield: level('shield'),
      magnet: level('magnet'),
      multiplier: level('multiplier'),
      freeze: level('freeze'),
      grip: level('grip'),
    },
    ownedCosmetics: owned,
    equipped,
    settings: {
      sound: typeof settingsRaw.sound === 'boolean' ? settingsRaw.sound : true,
      screenShake: typeof settingsRaw.screenShake === 'boolean' ? settingsRaw.screenShake : true,
    },
  };
}
export function loadSave(storage = storageOrNull()): SaveData {
  if (!storage) return normalizeSave(DEFAULT_SAVE);
  try {
    const text = storage.getItem(SAVE_KEY);
    if (text) return normalizeSave(JSON.parse(text));
    const legacyBest = nonnegative(Number(storage.getItem('velocity-best')));
    return normalizeSave({ ...DEFAULT_SAVE, bestScore: legacyBest, bestDistance: legacyBest });
  } catch {
    return normalizeSave(DEFAULT_SAVE);
  }
}
export function persistSave(save: SaveData, storage = storageOrNull()) {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(normalizeSave(save)));
  } catch {
    /* Storage can be unavailable in private contexts. */
  }
}
export function freshActivePowerUps(): ActivePowerUps {
  return { shield: 0, magnet: 0, multiplier: 0, freeze: 0, grip: 0 };
}
export function bankRun(
  save: SaveData,
  run: { coins: number; score: number; distance: number },
  alreadyBanked: boolean,
) {
  if (alreadyBanked) return { save, newBest: false, banked: false };
  const newBest = run.score > save.bestScore;
  return {
    save: {
      ...save,
      coins: save.coins + Math.floor(run.coins),
      bestScore: Math.max(save.bestScore, Math.floor(run.score)),
      bestDistance: Math.max(save.bestDistance, Math.floor(run.distance)),
    },
    newBest,
    banked: true,
  };
}
