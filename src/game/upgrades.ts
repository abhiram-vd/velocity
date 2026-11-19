import { POWERUP_CONFIG, UPGRADE_CONFIG } from './config';
import type { PowerUpId } from './types';
import type { SaveData } from './save';

export const POWERUP_IDS: PowerUpId[] = ['shield', 'magnet', 'multiplier', 'freeze', 'grip'];
export const UPGRADE_NAMES: Record<PowerUpId, string> = {
  shield: 'Shield',
  magnet: 'Magnet',
  multiplier: '2× Multiplier',
  freeze: 'Invincibility',
  grip: 'Grip',
};
export const UPGRADE_DESCRIPTIONS: Record<PowerUpId, string> = {
  shield: 'Longer protection. Level 3 adds a second hit charge.',
  magnet: 'Attract coins from farther away and pull them faster.',
  multiplier: 'Keep double score active for longer.',
  freeze: 'Become collision-proof for a short window.',
  grip: 'Brake harder on reversals while keeping momentum.',
};
export function upgradeCost(level: number) {
  return UPGRADE_CONFIG.costs[Math.min(level, UPGRADE_CONFIG.costs.length - 1)] ?? Infinity;
}
export function upgradeGemCost(level: number) {
  return UPGRADE_CONFIG.gemCosts[Math.min(level, UPGRADE_CONFIG.gemCosts.length - 1)] ?? Infinity;
}
export function buyUpgrade(save: SaveData, id: PowerUpId) {
  const level = save.upgrades[id],
    cost = upgradeCost(level),
    gemCost = upgradeGemCost(level);
  if (level >= UPGRADE_CONFIG.maxLevel || save.coins < cost || save.gems < gemCost)
    return { ok: false, cost: level >= UPGRADE_CONFIG.maxLevel ? 0 : cost, gemCost, save };
  return {
    ok: true,
    cost,
    gemCost,
    save: {
      ...save,
      coins: save.coins - cost,
      gems: save.gems - gemCost,
      upgrades: { ...save.upgrades, [id]: level + 1 },
    },
  };
}
export function powerUpDuration(id: PowerUpId, level: number) {
  const c = POWERUP_CONFIG;
  if (id === 'shield') return c.shieldBaseDuration + level * c.shieldDurationPerLevel;
  if (id === 'magnet') return c.magnetBaseDuration + level * c.magnetDurationPerLevel;
  if (id === 'multiplier') return c.multiplierBaseDuration + level * c.multiplierDurationPerLevel;
  if (id === 'freeze') return c.invincibilityBaseDuration + level * c.invincibilityDurationPerLevel;
  return c.gripBaseDuration + level * c.gripDurationPerLevel;
}
export function magnetRadius(level: number) {
  return POWERUP_CONFIG.magnetBaseRadius + level * POWERUP_CONFIG.magnetRadiusPerLevel;
}
export function magnetStrength(level: number) {
  return POWERUP_CONFIG.magnetBaseStrength + level * POWERUP_CONFIG.magnetStrengthPerLevel;
}
export function gripBrake(level: number) {
  return POWERUP_CONFIG.gripBrakeBase + level * POWERUP_CONFIG.gripBrakePerLevel;
}
export function upgradeEffect(id: PowerUpId, level: number) {
  const seconds = `${powerUpDuration(id, level).toFixed(1)}s`;
  if (id === 'shield')
    return `${1 + Math.floor(level / 3)} hit${level >= 3 ? 's' : ''} absorbed · ${seconds}`;
  if (id === 'magnet')
    return `${magnetRadius(level)}px pull · ${magnetStrength(level)} force · ${seconds}`;
  if (id === 'multiplier') return `2× score · ${seconds}`;
  if (id === 'freeze') return `Invincible · ${seconds}`;
  return `${gripBrake(level).toFixed(2)}× reversal brake · ${seconds}`;
}
