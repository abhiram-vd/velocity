# VELOCITY

Full-screen vertical arcade runner built with React, Vite, TypeScript, and Canvas. Play starts immediately; the canvas fills the browser viewport and the HUD sits over the action.

## Run locally

```sh
npm install
npm run dev
```

Use `npm run build` for a production build and `npm test` for game-system checks.

## Controls

- **Left / A** and **Right / D** accelerate. Releasing coasts; reversing direction brakes existing momentum.
- **Space / Escape** pauses or resumes.
- Touch screens can hold the on-screen arrows.

## Game systems

- `src/game/physics.ts` — frame-rate independent momentum movement.
- `src/game/generator.ts` — seeded obstacle families with blocks, moving hazards, and circular mines spread across the full screen.
- `src/game/collision.ts` — circle-to-rectangle and circle-to-circle collision geometry.
- `src/game/lives.ts` — three-life damage and invulnerability rules.
- `src/game/engine.ts` — fixed-step simulation, difficulty, effects, pickups, and Canvas rendering.
- `src/ui/` — minimal overlaid HUD, pause/game-over states, and touch steering.

Each run begins with three lives. Hits trigger a short invulnerability window and visible damage burst; distance and best distance remain visible in the HUD/game-over state. Slow-motion pickups are retained from the earlier version.

Obstacle patterns are varied, seeded arrangements with broad open paths. The generator does not yet run a full trajectory simulation over future rows, so obstacle spacing and top speeds still need play-testing and tuning.
