import { POWERUP_CONFIG, UPGRADE_CONFIG } from './config';
import type { PowerUpId } from './types';
import type { SaveData } from './save';

export const POWERUP_IDS: PowerUpId[] = ['shield', 'magnet', 'multiplier', 'freeze', 'grip'];
export const UPGRADE_NAMES: Record<PowerUpId, string> = { shield: 'Shield', magnet: 'Magnet', multiplier: '2× Multiplier', freeze: 'Freeze', grip: 'Grip' };
export const UPGRADE_DESCRIPTIONS: Record<PowerUpId, string> = { shield: 'Longer shield window. Still absorbs one hit.', magnet: 'Pull coins from farther away, faster.', multiplier: 'Extend the score boost.', freeze: 'Hold the course still for longer.', grip: 'Improve reversal control without removing inertia.' };
export function upgradeCost(level: number) { return UPGRADE_CONFIG.costs[Math.min(level, UPGRADE_CONFIG.costs.length - 1)] ?? Infinity; }
export function buyUpgrade(save: SaveData, id: PowerUpId) {
  const level = save.upgrades[id], cost = upgradeCost(level);
  if (level >= UPGRADE_CONFIG.maxLevel || save.coins < cost) return { ok: false, cost: level >= UPGRADE_CONFIG.maxLevel ? 0 : cost, save };
  return { ok: true, cost, save: { ...save, coins: save.coins - cost, upgrades: { ...save.upgrades, [id]: level + 1 } } };
}
export function powerUpDuration(id: PowerUpId, level: number) {
  const c = POWERUP_CONFIG;
  if (id === 'shield') return c.shieldBaseDuration + level * c.shieldDurationPerLevel;
  if (id === 'magnet') return c.magnetBaseDuration + level * c.magnetDurationPerLevel;
  if (id === 'multiplier') return c.multiplierBaseDuration + level * c.multiplierDurationPerLevel;
  if (id === 'freeze') return c.freezeBaseDuration + level * c.freezeDurationPerLevel;
  return c.gripBaseDuration + level * c.gripDurationPerLevel;
}
export function magnetRadius(level: number) { return POWERUP_CONFIG.magnetBaseRadius + level * POWERUP_CONFIG.magnetRadiusPerLevel; }
export function magnetStrength(level: number) { return POWERUP_CONFIG.magnetBaseStrength + level * POWERUP_CONFIG.magnetStrengthPerLevel; }
export function gripBrake(level: number) { return POWERUP_CONFIG.gripBrakeBase + level * POWERUP_CONFIG.gripBrakePerLevel; }
