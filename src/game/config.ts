export const PHYSICS = { acceleration: 1180, maxSpeed: 520, drag: 760, brake: 1550, radius: 12 } as const;
export const WORLD = { width: 800, height: 900, fixedStep: 1 / 120 } as const;
export const DIFFICULTY = {
  startSpeed: 260,
  maxSpeed: 625,
  speedCapDistance: 17_000,
  stageDistances: [1_000, 3_000, 6_500] as const,
  recoveryEvery: 5,
  sectionGapStart: 720,
  sectionGapEnd: 590,
} as const;
export const POWERUP_CONFIG = {
  earlyInterval: 1_050, midInterval: 1_320, lateInterval: 1_600,
  spawnChance: [.76, .78, .82, .82] as const,
  magnetBaseRadius: 145, magnetRadiusPerLevel: 34, magnetBaseStrength: 210, magnetStrengthPerLevel: 70,
  shieldBaseDuration: 13, shieldDurationPerLevel: 2,
  magnetBaseDuration: 11, magnetDurationPerLevel: 1.5,
  multiplierBaseDuration: 10, multiplierDurationPerLevel: 2,
  freezeBaseDuration: 3.2, freezeDurationPerLevel: .55,
  gripBaseDuration: 8, gripDurationPerLevel: 1.5, gripBrakeBase: 1.48, gripBrakePerLevel: .11,
  coinValue: 1, coinScore: 12,
} as const;
export const UPGRADE_CONFIG = { maxLevel: 5, costs: [8, 14, 23, 36, 54] as const } as const;
export const COLORS = { background: '#080b12', cyan: '#55d8ce', purple: '#d47ac5', orange: '#f2a65a', red: '#ff6477', cream: '#f5e8c8', yellow: '#f5d26a' } as const;
