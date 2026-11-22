# Riftfront coding rules

- Keep simulation modules independent of Phaser, the DOM, wall-clock time, and browser APIs. Drive the simulation with fixed ticks.
- Route player actions through typed commands and validate them in the simulation. Render from the read-only match view and use emitted effects for presentation.
- Put unit stats and wave schedules in the data module. Compose behavior from reusable rules. Introduce seeded randomness only when a mechanic requires it.
- Use strict TypeScript and keep dependencies and abstractions proportionate to the current milestone.
- Use original names, rules, and assets. Keep documentation aligned with player-facing rule changes.
- Run `npm test` and `npm run build` before handing off gameplay changes. Smoke-test rendering and controls in a browser when available and report any verification gaps.
