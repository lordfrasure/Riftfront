# Riftfront development plan

The [experience overhaul](specifications/GAME_EXPERIENCE_OVERHAUL.md) is the product direction. Each milestone must remain independently playable. Begin Milestone 2 only after the Milestone 1 playtest and player feedback.

## Repository assessment

- Preserve the ten-wave Ember-to-Coil campaign, fixed-tick simulation, typed orders, read-only view, effect events, headless tests, and balance harness. Existing leashes, armor exposure, healing, and retrofits already support meaningful formations.
- Replace the shared geometric fighter template and glyph cards. The current renderer has interpolated movement, contact feedback and telegraphs, but limited visual identity and no reusable character asset manifest.
- Give briefing, preparation, battle, inspection, and results distinct visual roles. The current page opens directly into orders and already has lane forecasts, validation feedback, wave reports and basic pause support.
- Explicit synergy rules and broader branches, profile saves and rewards, selectable loadouts, and additional challenges are missing. They depend on validated rules and match telemetry.

## Priorities and acceptance

| Milestone | Scope and dependencies | Acceptance and verification |
| --- | --- | --- |
| 1. Visual quality and core UI/UX | Battlefield and readable combat first, then shared character assets, briefing, collection, orders, and debrief. Phaser presents fixed-tick state and effects. Derive displayed stats from match definitions. | Distinct art for six defenders, six enemies and four retrofits. Readable motion, hits, falls and boss warning. Play, collection, settings and debrief navigation. Recruit, inspect, redeploy, retrofit and start waves through existing orders. Test desktop and narrow touch layouts, keyboard, pause, speed, replay, and capture screenshots. Run tests, production build and balance sweep. |
| 2. Unit depth and strategic combinations | Add branches and explicit simulation rules after Milestone 1 feedback. Extend collection and battle feedback from the same definitions. | At least four tested functional synergies, understandable tradeoffs and stat comparisons. Sweep the expanded rules and demonstrate at least two viable approaches. Playtest discovery and tactics. |
| 3. Player profiles and progression | Versioned local saves and validated match summaries first. Build XP, unlocks, achievements and mastery on those records. | A profile survives refresh, handles migration/corruption and awards each match once. At least 12 meaningful achievements and visible mastery. Test reward rules and save recovery. Verify a fresh profile can win the standard siege. |
| 4. Replayability and refinement | Use playtest findings, validated progression and the balance harness to prioritize optional onboarding, challenges and pacing. | New players can explain placement and counterplay. Returning players can select a meaningfully different challenge. Check discovery, pacing, balance and completion in desktop and narrow playtests. |

Milestone 1 leaves Profile, Progression, and Achievements for Milestone 3 and loadout choices for when alternatives exist. The collection previews the existing roster and retrofits.

## Milestone 1 delivery

The briefing, unit collection, settings, battle controls, inspector, and campaign debrief now share a visual system. The [art pipeline](ART_PIPELINE.md) documents scene art, all 16 fighter variants, and the layer rig. The simulation change adds actor IDs to fall effects so presentation can animate the correct unit.

- `npm test` passed all 9 existing tests. The production build passed with Vite's large-chunk warning.
- `npm run balance -- --sweep` matched the pre-milestone output byte for byte. Economy, balanced, and artillery won their named runs. Bastion won all 16 branch combinations in the sweep, while Vanguard won 5 of 16. Treat that disparity as a Milestone 2 playtest and tuning input.
- Chromium smoke testing used the production build at 1440 × 900 and a touch viewport at 390 × 844. The scripted campaign reached wave 10 victory at 100 core, matching the headless core and scrap at every wave. Checks covered keyboard range preview and placement, inspection, redeploy, retrofits, pause, speed, sound toggle, collection and settings, replay, restart, defeat, return to briefing and touch placement. Screenshots were captured for planning, battle and outcomes.
- The next gate is a human playtest. Evaluate whether players can identify roles under pressure, understand available orders, and find the next wave forecast and the debrief.
