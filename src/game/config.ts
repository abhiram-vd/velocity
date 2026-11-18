export const PHYSICS = { acceleration: 1180, maxSpeed: 520, drag: 760, brake: 1550, radius: 12 } as const;
export const WORLD = { width: 800, height: 900, fixedStep: 1 / 120 } as const;
export const DIFFICULTY = {
  startSpeed: 235,
  maxSpeed: 625,
  speedCapDistance: 18_000,
  stageDistances: [1_200, 3_600, 7_600] as const,
  recoveryEvery: 5,
  sectionGapStart: 780,
  sectionGapEnd: 610,
} as const;
export const COLORS = { background: '#080b12', cyan: '#55d8ce', purple: '#d47ac5', orange: '#f2a65a', red: '#ff6477', cream: '#f5e8c8', yellow: '#f5d26a' } as const;
