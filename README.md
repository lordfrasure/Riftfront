# Riftfront: Ages Under Siege

Build a living formation, advance from the Ember Age to the Coil Age, and defend the core through ten assaults in this single-player, three-lane strategy game. Built with Phaser 4, TypeScript, and Vite.

## Run locally

Use Node.js 18 or newer and npm.

```sh
npm ci
npm run build
npm run preview -- --host 127.0.0.1
```

Open http://127.0.0.1:4173/ or the local URL printed by Vite. Review the roster in the Unit Collection or choose **Begin siege**. Recruit defenders and assign them to lane pads. Guards advance to meet enemies, while ranged and support units work behind them. Check the forecast before deploying and inspect an occupied pad to redeploy, retire, or retrofit a defender.

Use Tab and Enter or Space to play with a keyboard. The battle controls offer pause, double speed, and optional sound. Check the wave report before committing to the next assault.

Vite's development server returns a 403 for project paths containing a colon, including `Riftfront: Ages Under Siege`. The preview commands above work from that folder. To use hot reload, open the project from a path without a colon and run `npm run dev -- --host 127.0.0.1`.

## Verify changes

```sh
npm test
npm run build
npm run balance -- --sweep
```

The test command compiles the simulation without browser types and runs the headless scenarios in Node. The build type-checks the full application and writes the production site to `dist/`. For gameplay changes, also check placement, battle progression, the wave report, and restart in a browser at desktop and narrow widths.

- [Current rules and architecture](docs/GAME_DESIGN.md)
- [Development milestones and verification](docs/DEVELOPMENT_PLAN.md)
- [Art manifest and animation conventions](docs/ART_PIPELINE.md)
- [Playtest priorities](docs/ROADMAP.md)
- [Long-term design context](docs/RIFTFRONT_AGENT_BRIEF.md)
