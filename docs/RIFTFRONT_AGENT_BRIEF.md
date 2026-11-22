# Riftfront: Ages Under Siege — Short Agent Brief
**Version:** 2026-11-22. **Status:** Project context, not implementation status.

For the complete game-design research and rationale, see `RIFTFRONT_GAME_DESIGN_RESEARCH_AND_AGENT_CONTEXT.md`. Read the relevant portions for design decisions. Before touching code, inspect actual repository files and existing instructions.

## Mission
Create an **extremely fun, balanced, replayable single-player HTML5 tower defense game** before working on multiplayer. Develop in VS Code/Codex using **Phaser 4, TypeScript, and Vite**, subject to verifying the current project. The browser game should have the approachable, satisfying feel of classic Flash games, but use modern web technologies.

## Player fantasy
Build a living formation of frontline defenders, ranged attackers, support structures and income producers. Defend a Rift Core from successive waves. Make tradeoffs between defending now and building future income. Specialize units and ultimately evolve across eras, including **retrofits that keep early units relevant**. Make battles visually exciting while allowing players to understand *why* they won or lost.

## Core inspiration hierarchy
1. **Squadron Tower Defense / Legion TD 2:** Auto-fighting units, formation, frontline vs. backline, wave planning, risky economy investment. Legion TD 2 is an established comparable game; create an original solo-focused identity.
2. **Plants vs. Zombies:** Compact visible lanes, intuitive roles, economy occupying valuable defense space, clear special enemies, excellent pacing/onboarding.
3. **Bloons TD:** Function-changing upgrade branches, distinct counters, varied strategic builds, satisfying combat feedback.
4. **Age of War:** Thrilling and obvious advancement across technological eras; avoid simply replacing every old unit with a strictly better one.
5. **South Park Tower Defense:** Expressive humor, character, optional special actions. Avoid compulsory manual combat and character-swapping in solo play.

## Historical prototype baseline
- 1280×720 browser battlefield, **3 horizontal lanes**.
- Enemies come from right toward a core on left.
- **3 defenders:** Guard (frontline), Archer (ranged), Scavenger (resource income).
- **3 enemies:** Basic, Fast, Armored.
- **5 waves**, build/battle phases, resource and health HUD, win/loss, restart.
- Lane forecasts, range previews, defender health inspection, and a report after each wave. See [current game rules](GAME_DESIGN.md).
- Geometric placeholders are fine. Tests, build and runnable browser loop are required.

This baseline predates the ten-wave overhaul. See [the current gameplay rules](GAME_DESIGN.md) and [roadmap](ROADMAP.md) for implementation status. Do not interrupt or rewrite a working game just to incorporate this brief.

## Essential design rules
- **Meaningful choice above feature count.** Every new unit or upgrade must solve a distinct problem, create a synergy, or force a tradeoff.
- **Positioning must matter.** Test a living/leashed fighter model versus stationary blocking; don't assume more movement is always more fun.
- **Economy must be viable but risky.** Neither always-rush-income nor never-invest-income should dominate.
- **Show counterplay.** Enemy special rules must be visually indicated and previewed before they can create an unfair loss.
- **Solo auto-combat first.** No mandatory frantic clicking; commander abilities may come later.
- **Legible combat first.** Entire board visible, clear role silhouettes, distinguishable damage and enemy types, inspectable stats and wave outcomes.
- **Era progression later.** Do not shove three eras into the five-wave MVP; introduce eras after foundational combat is fun.
- **Balanced does not mean identical.** Multiple builds should win, but in meaningfully different ways, with recognizable weaknesses.
- **Distinct original IP.** No copied characters, screenshots, sprites, audio, level layouts, UI artwork, text, or source code from the inspiration games.

## Architecture and quality
- Keep **deterministic simulation separate from Phaser presentation**. Use a fixed timestep, data-driven definitions, and commands and events between the UI and simulation. Record a seed if a future mechanic introduces randomness.
- Support headless simulation for thousands of balance scenarios later.
- Test wave progression, targeting, damage, resource awards, placement validation, win/loss, restart, and deterministic reproducibility.
- Add UI information to explain leaks, unit strengths/weaknesses, income, and next wave threats.
- Integrate one small gameplay improvement at a time; run typecheck/tests/build and a browser smoke test when possible. Never invent test or playtest outcomes.

## Roadmap
**P0:** Stabilize and personally play the five-wave prototype.  
**P1:** Improve placement/formation sensitivity, economy tension, wave previews, and feedback.  
**P2:** Add a few specialized units/towers and two useful upgrade alternatives; trial one era retrofit.  
**P3:** Polished ~12–15-wave single-player run with three eras, distinct threats, strong onboarding, balance harness, repeated external playtests.  
**Later:** Extra maps, challenge modifiers, factions, perhaps co-op/PvP. No networking now.

## Success test for every change
1. **What specific player decision becomes more interesting?**
2. **What behavior should a test or playtest reveal if it works?**
3. **How might it harm readability, fairness, pacing, or an existing build?**
4. **Can it be added incrementally without destabilizing the running game?**

User's overriding objective: **a fun, balanced, understandable, strategically deep single-player game that people voluntarily want to replay.**
