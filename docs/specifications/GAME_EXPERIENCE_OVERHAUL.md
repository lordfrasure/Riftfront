# Riftfront: Ages Under Siege — Game Experience Overhaul

**Status:** Master product specification\
**Scope:** Visual quality, UI/UX, gameplay depth, progression, and replayability\
**Execution:** Incremental milestones, with playtesting and approval between milestones

## 1. Product vision

Riftfront should become a polished, original, replayable 2D strategy game combining formation-based tower defense, automatic combat, meaningful unit upgrades, technological progression, and persistent player development.

The game should capture the accessibility and charm of classic browser strategy games while offering enough strategic depth to encourage repeated play.

Relevant inspirations include Squadron TD, Legion TD 2, Bloons TD, Plants vs. Zombies, and Age of War. Study the design principles behind these games without copying proprietary assets, characters, interfaces, or content.

**Primary objective:** Create a game that players voluntarily return to because the combat is satisfying, strategic experimentation is rewarding, and progression offers meaningful new possibilities.

Feature count is not a success metric. Player enjoyment, clarity, strategic depth, and execution quality take priority.

## 2. Current state and assessment

Inspect the repository before beginning implementation. Treat this document as product direction, not an assertion that every listed feature is currently missing.

The November 22, 2026 version includes:

- Phaser 4, TypeScript, and Vite.
- A deterministic, fixed-tick combat simulation.
- Three lanes with formation positions.
- Six defender types and six enemy types.
- Ten waves, including a boss encounter.
- Ember and Coil technological eras.
- Limited unit movement and automatic combat.
- Four functional unit retrofits.
- Combat effects, sound, wave reports, and balance tests.

The current implementation is a functional prototype, but it lacks the visual quality, interface polish, customization, progression, and strategic discovery expected of a compelling finished game.

Before implementing changes, identify which existing systems are worth preserving, which need redesign, and which are missing.

## 3. Visual identity and character artwork

Establish a cohesive, original 2D art direction.

The game should look like a deliberately illustrated strategy game rather than a collection of basic programming shapes.

### Character requirements

Every defender and enemy should have:

- A distinctive silhouette, equipment, and recognizable visual identity.
- Consistent proportions and art direction.
- Idle, movement, attack, hit, and death animations as appropriate.
- Distinctive weapons and attack effects.
- Clear visual differentiation between unit classes.
- Upgraded appearances that communicate mechanical changes.
- Era-specific design language.
- Appropriate size, contrast, and readability during crowded battles.

Bosses should have exceptional visual presence, distinctive animation, and readable attack telegraphs.

### Art pipeline

Evaluate the most suitable production approach for Phaser, including original sprite sheets, layered 2D assets, vector art, or another maintainable system.

Create an asset manifest and reusable animation conventions.

Prefer consistent, production-quality artwork over a larger quantity of inconsistent assets.

If image-generation tools are available, use them where appropriate. If not, establish an asset pipeline that supports future professionally generated or illustrated sprites.

Do not misrepresent placeholder artwork as finished artwork.

Do not copy copyrighted game assets.

## 4. Interface and user experience

Redesign the game interface around clarity, visual hierarchy, satisfying interaction, and accessibility.

### Main menu

Provide navigation to:

- Play
- Player Profile
- Army / Unit Collection
- Upgrades / Progression
- Achievements
- Settings

### Pre-match preparation

Allow players to inspect their available units, review loadout options, examine the upcoming challenge, and understand their objective before beginning a run.

### Battle interface

The battlefield should dominate the screen.

Provide an attractive, compact interface showing:

- Core health.
- Current wave and era.
- Available resources.
- Defender selection and placement.
- Unit inspection and upgrade choices.
- Upcoming enemy threats.
- Active unit synergies.
- Pause, speed, and sound controls.

Use polished unit cards with artwork, clear costs, concise roles, and useful interaction states.

Avoid clutter and excessive text during combat.

### Post-match interface

Create a satisfying victory/defeat presentation displaying:

- Match outcome.
- Performance statistics.
- Experience earned.
- Player level progress.
- Unit mastery progress.
- Achievements earned.
- New unlocks.
- Replay and main-menu navigation.

### UX standards

Implement consistent visual components, tooltips, feedback animations, keyboard focus states, and responsive layouts.

Use progressive disclosure: show concise information by default and detailed information when requested.

Ensure that important actions are discoverable and that the player understands why a purchase, upgrade, or strategic decision matters.

## 5. Unit information and descriptions

Create a comprehensive Unit Codex / Collection interface.

Each defender should display:

- Name, class, portrait, and thematic description.
- Combat role and detailed mechanical explanation.
- Accurate health, damage, attack speed, range, armor, and special stats.
- Strengths and weaknesses.
- Recommended enemy counters.
- Useful combinations with other units.
- Available upgrade branches.
- Unlock requirements.
- Mastery progression.

Descriptions must be informative, readable, and consistent with actual game mechanics.

For example, a Coilcaster description should explain that it slows enemies and exposes armor, why those effects matter, and which allied units benefit.

Show exact numerical effects separately from thematic descriptions.

Provide similarly useful information for enemy abilities and counterplay.

Avoid hardcoded displayed stats that become inaccurate after balance changes.

## 6. Persistent player profiles

Implement local player profiles that survive browser refreshes and restarts.

Online accounts and cloud synchronization are not required for the initial implementation.

Support a named profile and, preferably, multiple selectable local profiles.

Track:

- Player level and total experience.
- Games played, wins, and losses.
- Highest wave reached and best score.
- Enemies and bosses defeated.
- Resources earned.
- Achievements.
- Unlocked units and upgrades.
- Unit mastery.
- Selected loadout.
- Relevant preferences.

Use versioned, validated local save data with a clear migration strategy.

Handle corrupted or outdated saves gracefully.

Support deliberate profile reset and preferably JSON export/import.

Prevent duplicate rewards from refreshes, repeated completion events, or other unintended triggers.

Keep persistence separate from the deterministic combat simulation.

## 7. Experience and leveling

Implement player experience and levels.

A starting progression range of approximately 30 levels is appropriate, provided the progression curve remains reasonable.

Award experience for meaningful accomplishments, such as:

- Completing waves.
- Winning matches.
- Defeating bosses.
- Achieving performance objectives.
- Earning achievements.

Show experience gains and level-up progress in a satisfying, readable way.

Early progression should be accessible, while later progression should reflect sustained achievement.

Avoid artificial grinding and repetitive reward farming.

Player levels should primarily unlock new strategic choices and customization rather than overwhelming permanent combat advantages.

## 8. Achievements

Implement at least 12 meaningful achievements across multiple categories.

Examples include:

- First victory.
- First boss defeat.
- Perfect core defense.
- Winning with a specialized formation.
- Winning with an economy-focused strategy.
- Triggering specific unit combinations.
- Completing a restricted-unit challenge.
- Reaching mastery or player-level milestones.

Each achievement should have a name, icon, description, unlock condition, persistent state, and appropriate reward.

Display progress toward incomplete achievements when measurable.

Evaluate achievements from validated gameplay events and match results.

Ensure achievement rewards cannot be awarded repeatedly.

## 9. Unlocks and permanent progression

Introduce unlockable units, specializations, upgrades, cosmetics, and optional challenges.

Favor **horizontal progression**: new options should expand strategy rather than strictly replace earlier options.

A skilled new player should remain capable of winning the standard campaign.

Avoid locking essential counters behind extensive experience requirements.

Ensure early play sessions provide meaningful discoveries and rewards.

Clearly distinguish permanent unlocks from in-match purchases.

## 10. Unit mastery

Give each defender its own mastery progression.

Track relevant statistics such as damage dealt, damage absorbed, enemies defeated, healing performed, resources generated, and synergy activations.

Mastery should reward meaningful use of the unit.

Possible mastery rewards include visual variations, lore entries, badges, and balanced specialization choices.

Display mastery progression in the Unit Collection and post-match results.

Avoid encouraging repetitive or strategically harmful actions simply to farm mastery.

## 11. Unit combinations and synergies

Implement an explicit system that rewards thoughtful unit compositions and formations.

At least four distinct functional synergies should be available in the initial expanded system.

Potential examples:

**Iron Sanctuary — Bastion + Mender**

A durable frontline position that gains additional defensive or healing benefits when the units support each other.

**Overload — Coilcaster + Volley Archer**

Rapid attacks against electrically exposed targets trigger additional damage or a conditional electrical effect.

**Scorched Earth — Vanguard + Cinder Lobber**

Aggressive frontline disruption enables stronger area damage against grouped enemies.

**Precision Rupture — Coilcaster + Longshot**

Armor exposure creates an opportunity for specialized precision attacks.

These are starting concepts, not mandatory final designs.

Every implemented synergy needs:

- A clear activation requirement.
- A meaningful gameplay effect.
- Visible feedback.
- A concise explanation.
- Strategic counterplay or opportunity cost.
- Automated tests.
- Balance validation.

Allow players to discover and review combinations through the interface.

Active synergies should be visible without cluttering the battlefield.

Combinations must genuinely affect the simulation, not merely display labels.

## 12. Expanded unit upgrades

Significantly expand the existing retrofit system.

Preserve useful upgrades while adding meaningful choices for other principal defenders.

Target multiple distinctive branches per unit over the course of development.

Each upgrade should include:

- A unique identity and visual appearance.
- A mechanical change that affects strategy.
- Clear advantages and tradeoffs.
- Accurate stat comparisons.
- Synergy implications.
- An understandable purchase interface.

Prefer changes to unit behavior, abilities, targeting, utility, or tactical role over generic percentage increases.

Clearly distinguish:

1. In-match upgrades purchased using match resources.
2. Permanent options unlocked through player progression.
3. Unit mastery rewards earned through repeated use.

Balance upgrades so that multiple choices remain situationally useful.

## 13. Combat satisfaction and game feel

Improve the quality of the moment-to-moment experience.

Priorities include:

- Responsive placement and purchase feedback.
- Readable attack animations and impact effects.
- Distinctive sound cues.
- Clear health and damage feedback.
- Satisfying upgrade transformations.
- Readable enemy abilities and boss telegraphs.
- Reduced idle waiting.
- Better wave pacing.
- Stronger escalation and climactic encounters.
- Useful post-wave performance summaries.

Maintain the game's identity as a strategy-focused automatic-combat experience.

Players should win primarily through planning, positioning, composition, and upgrades rather than rapid clicking.

## 14. Onboarding and discoverability

Provide concise, optional contextual onboarding.

Teach:

- Recruiting and placement.
- Frontline and backline roles.
- Wave preparation.
- Resource management.
- Unit upgrades.
- Synergy discovery.
- Era advancement.
- Persistent progression.

Avoid long compulsory tutorials.

Allow experienced players to skip or revisit guidance.

## 15. Architecture and technical quality

Retain Phaser 4 and TypeScript unless there is a compelling technical reason to change them.

Preserve deterministic, fixed-step combat simulation and headless testing.

Separate concerns appropriately:

- Simulation and combat.
- Rendering and animations.
- Assets.
- Unit definitions.
- Upgrade systems.
- Synergies.
- Profiles and persistence.
- Experience and achievements.
- Unlocks and mastery.
- UI and navigation.
- Audio and settings.

Use typed, data-driven systems where beneficial.

Avoid expanding existing monolithic modules unnecessarily.

Keep gameplay mechanics testable independently of browser rendering.

## 16. Verification

Run:

```bash
npm test
npm run build
npm run balance -- --sweep
```

Add appropriate tests for new functionality.

These should eventually include profile persistence, save migration, duplicate reward prevention, experience calculations, achievement conditions, mastery tracking, upgrade purchases, synergy activation, and deterministic combat.

Use browser automation and screenshot inspection where available.

Verify desktop and narrow layouts.

Do not claim visual or browser verification unless it actually occurred.

Maintain at least two viable strategic approaches and investigate dominant or ineffective compositions.

## 17. Development milestones

Implement the overhaul incrementally.

### Milestone 1 — Visual Quality and Core UI/UX

Redesign character presentation, animations, battlefield presentation, unit cards, menus, inspection panels, and the overall interface.

Establish the reusable art and UI foundations needed for later features.

Deliver a playable, visually improved game.

### Milestone 2 — Unit Depth and Strategic Combinations

Expand upgrade branches, implement functional unit synergies, improve descriptions, and introduce useful combination discovery.

Validate balance and strategic diversity.

### Milestone 3 — Player Profiles and Progression

Implement persistent profiles, player experience, levels, achievements, mastery, unlocks, and post-match rewards.

### Milestone 4 — Replayability and Refinement

Improve onboarding, challenge variety, pacing, balance, reward presentation, and remaining gameplay friction.

The exact milestones may be refined after codebase inspection, but changes must remain independently playable and testable.

## 18. Execution requirements

This document describes the long-term product direction. **It is not authorization to implement all milestones in one pass.**

Before beginning major work:

1. Inspect the latest repository and existing design documentation.
2. Identify dependencies, architectural constraints, and implementation risks.
3. Create or update `docs/DEVELOPMENT_PLAN.md`.
4. Define measurable acceptance criteria for each milestone.
5. Prioritize based on expected impact on player enjoyment.

Implement one approved milestone at a time.

For each milestone:

1. Implement complete, integrated functionality.
2. Run automated tests and production build verification.
3. Inspect the game in a browser when possible.
4. Fix identified defects.
5. Update documentation.
6. Commit the completed work.
7. Report completed features, tests, limitations, and outstanding tasks.

**Stop after the approved milestone and wait for player feedback.**

Do not silently proceed to later milestones.

Do not confuse proposed features with implemented features.

## 19. Success criteria

The project should progress toward a game where:

- Characters look distinctive, polished, and animated.
- The UI feels cohesive and enjoyable to use.
- Unit information supports meaningful decisions.
- Upgrades visibly and mechanically transform units.
- Combinations reward strategic experimentation.
- Player progression creates reasons to return.
- Unlocks expand available strategies.
- Combat remains readable and satisfying.
- Multiple approaches are viable.
- Saves and game systems are reliable.
- The game is enjoyable independently of achievement grinding.

**The ultimate objective is not a longer feature list. It is a significantly better game.**
