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
- `src/game/generator.ts` — staged patterns, recovery beats, and a fixed-step route simulation using the player's momentum physics.
- `src/game/progression.ts` — gradual speed ramp, pattern unlock tiers, recovery rhythm, and section spacing.
- `src/game/collision.ts` — circle-to-rectangle and circle-to-circle collision geometry.
- `src/game/lives.ts` — three-life damage and invulnerability rules.
- `src/game/engine.ts` — fixed-step simulation, difficulty, effects, pickups, and Canvas rendering.
- `src/ui/` — minimal overlaid HUD, pause/game-over states, and touch steering.

Each run begins with three lives. Hits trigger a short invulnerability window and visible damage burst; distance and best distance remain visible in the HUD/game-over state. Slow-motion pickups are retained from the earlier version. Scroll speed eases from 235 to a hard cap of 625 over 18,000 distance units. Obstacle families unlock in stages, and every fifth pattern is an easier recovery beat.

Obstacle patterns include broad opening gates, staggered blocks, grouped circular hazards, moving blocks with sine and sweep motion, vertical barriers, diamonds, and rotating squares. The generator runs a simplified three-input rollout from the player's current position and velocity, rejecting candidates without a reachable route. This simulation is deliberately bounded and approximate; longer play-testing is still needed to tune the rollout and late-game spacing.
