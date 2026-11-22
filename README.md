# Riftfront: Ages Under Siege

Defend a shared core through five waves in this single-player, three-lane tower defense prototype. Built with Phaser 4, TypeScript, and Vite.

## Run locally

Use Node.js 18 or newer and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Select a defender, choose an open pad, then start the wave. Use Tab and Enter or Space to play with a keyboard. Hover over or focus an open pad to preview the selected unit's attack range. Select an occupied pad during build to inspect its defender's health.

Check the forecast before spending scrap and read the wave report before reinforcing. Toggle **2× speed** to advance battles faster.

Vite's development server blocks paths with a colon, including a folder named `Riftfront: Ages Under Siege`. In that folder, use `npm run build` followed by `npm run preview`. Use a folder named `Riftfront` for development with hot reload.

## Verify changes

```sh
npm test
npm run build
```

The test command compiles the simulation without browser types and runs the headless scenarios in Node. The build type-checks the full application and writes the production site to `dist/`. For gameplay changes, also check placement, battle progression, the wave report, and restart in a browser at desktop and narrow widths.

- [Current rules and architecture](docs/GAME_DESIGN.md)
- [Development priorities and playtest criteria](docs/ROADMAP.md)
- [Long-term design context](docs/RIFTFRONT_AGENT_BRIEF.md)
