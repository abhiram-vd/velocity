# VELOCITY

Full-screen vertical arcade runner built with React, Vite, TypeScript, and Canvas. It opens to an animated home screen, then runs on a fixed-step canvas simulation.

## Run locally

```sh
npm install
npm run dev
```

`npm run build` creates the production bundle. `npm test` runs the game-system checks.

## Controls

- **Left / A** and **Right / D** accelerate. Releasing coasts; reversing brakes existing momentum.
- **Space / Escape** pauses or resumes.
- On touch screens, hold the on-screen arrows.

## Game systems

- `src/game/physics.ts` — momentum movement, including the Grip braking modifier.
- `src/game/progression.ts` — eased speed curve, staged complexity, and recovery rhythm.
- `src/game/generator.ts` — reusable obstacle patterns validated with a bounded physics rollout.
- `src/game/powerups.ts` — Shield, Magnet, 2× Multiplier, Freeze, and Grip rules/spawning.
- `src/game/coins.ts` and `src/game/scoring.ts` — coin patterns, Magnet pull, and score accounting.
- `src/game/upgrades.ts`, `src/game/shop.ts`, `src/game/cosmetics.ts` — upgrade paths and cosmetic inventory.
- `src/game/save.ts` — validated local save data, migration, and one-time run banking.
- `src/game/engine.ts` — fixed-step simulation, collision, collection, Canvas rendering, and effects.
- `src/ui/` — home, gameplay HUD, shop, upgrades, settings, and game-over screens.

Coins are banked when a run ends or the player leaves a paused run. Best score, best distance, settings, upgrade levels, cosmetic purchases, and equipped cosmetics persist in local storage. The speed curve starts at 260 and caps at 625 after 17,000 distance units; obstacle families and power-up weights change by game phase. Upgrade costs, effect scaling, and spawn intervals live in `src/game/config.ts`.

The route check models three steering choices and bins horizontal position/velocity to keep validation fast. It is a practical approximation rather than an exhaustive proof for every frame-level trajectory, so late-game tuning still benefits from play-testing.
