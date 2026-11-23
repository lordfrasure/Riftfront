# Riftfront — Core Gameplay, Army Construction & Battlefield Expansion

**Status:** Active gameplay development specification

**Priority:** High

**Focus:** Battlefield depth, army variety, upgrades, unit fusion, positioning, and replayability

## 1. Mission

Riftfront has recently undergone a visual and UI overhaul. The next priority is improving the **actual strategic gameplay**.

The game needs a substantially larger decision space.

At present, the battlefield is too constrained, unit choices are limited, and upgrades lack the depth necessary to support many distinctive army compositions.

The objective is to make constructing an army, positioning its units, discovering combinations, and developing specialized units the central attraction of Riftfront.

This is not a request to make the game more complicated simply for the sake of complexity.

Every new mechanic should create meaningful decisions and satisfying consequences.

## 2. Design inspiration

Study the strategic design of Squadron TD, particularly its Automaton builder, and the merging mechanics associated with the Sylphy builder.

Important inspirations include:

- The ability to evolve relatively simple units into several different specializations.
- Broad rosters with different tactical roles.
- Combinations of units that reinforce one another.
- Positioning that changes the outcome of battles.
- Powerful late-game formations assembled over time.
- Deciding whether to buy more basic units, upgrade existing ones, or invest in economy.
- Creating specialized units through meaningful combinations and transformations.

Use these principles to create original Riftfront mechanics.

Do not copy names, characters, artwork, exact abilities, or other proprietary game content.

### Design philosophy

A player should be able to replay the same siege with different armies and experience substantially different battles.

For example:

- A heavily armored defensive formation with sustained healing.
- A fragile long-range army specializing in eliminating priority targets.
- An economy-heavy opening that transitions into expensive advanced units.
- An aggressive army built around area damage and disruption.
- A technological army specializing in constructs, fusions, and linked units.

These strategies should differ in strengths, weaknesses, positioning, timing, and resource demands.

## 3. Battlefield expansion — highest priority

The current battlefield provides three lanes with four deployment positions per lane.

Twelve positions substantially constrain formation design.

Evaluate a larger battlefield before expanding the roster extensively.

### Layout candidates

Prototype and evaluate:

**Option A: Three lanes × six positions**

Eighteen positions. More room for supporting formations without dramatically increasing interface complexity.

**Option B: Three lanes × seven positions**

Twenty-one positions. Greater front-to-back depth and room for multiple support and specialized units.

**Option C: Four lanes × six positions**

Twenty-four positions. Additional lane-management pressure, but higher demands on player attention and screen space.

My initial preference is **three lanes × seven positions**, subject to gameplay and usability testing.

Do not automatically choose the option with the most positions.

Evaluate each configuration based on:

- Strategic positioning options.
- Formation diversity.
- Frontline and backline relationships.
- Support-unit placement.
- Visual readability.
- Interaction speed.
- Screen-space limitations.
- Combat pacing.
- Economy and resource availability.
- Complexity for new players.

### Make position matter

More positions must create more strategic decisions.

Implement or improve relevant spatial mechanics, such as:

- Frontline versus backline protection.
- Adjacent-unit bonuses.
- Support areas and overlapping auras.
- Units whose abilities influence adjacent lanes.
- Enemy attacks that threaten clustered formations.
- Long-range versus short-range deployment tradeoffs.
- Position-dependent unit abilities.
- Movement, interception, and target-acquisition behavior.

Do not implement all of these indiscriminately.

Choose mechanics that work together and remain understandable.

A strong formation should result from how units are arranged, not simply the amount of money spent.

### Battlefield presentation

The expanded board must remain readable.

Reevaluate lane spacing, deployment markers, character scale, health bars, effects, and responsive layouts.

Avoid shrinking every character until the artwork becomes meaningless.

Prefer a clear complete-battlefield overview where practical.

Do not introduce awkward scrolling that prevents players from understanding simultaneous attacks.

### Architecture

Replace assumptions that deployment is permanently limited to three hardcoded lanes and four slots.

Use data-driven battlefield layouts and validated placement rules.

Keep the deterministic simulation and Phaser presentation synchronized.

Update automated tests, targeting rules, layout overlays, wave forecasts, and coordinate calculations.

## 4. Expand the unit roster

The existing six defenders are insufficient for the intended strategic depth.

Develop a roadmap toward approximately 10–12 genuinely distinct recruitable base classes, plus their upgrade specializations and fused forms.

Do not implement all of them in one rushed pass.

Each new class must have a distinct purpose.

Evaluate gaps in the current roster before designing additions.

Possible archetypes include:

**Skirmisher**

A mobile melee fighter capable of quickly closing on ranged enemies, but with limited durability against sustained attacks.

**Saboteur**

A specialist that disrupts enemy support abilities, weakens formations, or interferes with dangerous targets.

**Fabricator**

A unit capable of deploying temporary mechanical drones or constructs, trading immediate damage for battlefield presence.

**Rift Engineer**

A positional support unit that links allies, manipulates support ranges, or grants benefits to deliberately constructed formations.

**Foundry Chassis**

A relatively simple construct that can evolve into substantially different specialized units.

These are design proposals, not compulsory final names or abilities.

Research and reason about which additions would create the most meaningful new playstyles.

For every new unit, implement:

- Original visual identity.
- Gameplay role.
- Stats and abilities.
- Counterplay and weaknesses.
- Useful upgrade choices.
- Interactions with existing units.
- Accurate descriptions and previews.
- Automated behavioral tests.

Avoid redundant classes differentiated only by numerical statistics.

## 5. Branching unit evolution — Automaton-inspired system

This is a centerpiece of the proposed gameplay overhaul.

Introduce at least one original construct-style unit that can evolve into multiple highly differentiated forms.

For example:

### Foundry Chassis

A foundational mechanical unit that can be developed into one of three specializations.

**Sentinel Configuration**

Durable defensive construct specializing in protecting nearby units and controlling enemy movement.

**Conduit Configuration**

Support construct that enhances linked allies and distributes beneficial effects within a defined range.

**Siege Configuration**

Heavy offensive construct specializing in long-range attacks and clustered enemies.

These branches should differ in:

- Visual appearance.
- Attack patterns or support behavior.
- Resource cost.
- Positioning requirements.
- Enemy matchups.
- Potential combinations.
- Strategic weaknesses.

The player should genuinely debate which specialization is best for the current army.

### Upgrade architecture

Support branching upgrade definitions rather than hardcoding a single upgrade property per unit.

Design an expandable system allowing:

- Multiple upgrade choices.
- Tier prerequisites.
- Era requirements.
- Different mechanical effects.
- Branch exclusivity where appropriate.
- Clear purchase validation.
- Accurate stat comparisons.
- Visual transformations.

Allow upgrades earlier in a run when strategically justified. Do not force every meaningful upgrade behind Coil Age.

Do not grant the player free persistent combat power through an unfinished construct.

## 6. True unit fusion / merging

Implement a distinct **fusion system** that allows certain compatible units to combine into new, specialized units.

This must be different from ordinary upgrades and passive synergies.

### Core fusion mechanic

A fusion consumes two compatible deployed units and creates a new composite unit.

Proposed initial rules:

- Fusion is performed during the planning phase.
- Both units must belong to the player's army.
- Recipes specify which unit combinations are valid.
- Position or proximity requirements should create strategic choices.
- Both inputs are consumed.
- The resulting unit occupies one deployment position.
- The other position becomes available.
- Fusion may require an additional resource payment.
- The result has its own identity, stats, abilities, appearance, and upgrade possibilities.

Allow the player to preview the result and confirm the merge.

### Example original fusion concepts

**Guard + Mender → Wardkeeper**

A defensive hybrid that absorbs damage and periodically repairs nearby allies, but deals less damage than a dedicated offensive frontline unit.

**Archer + Coilcaster → Arc Ranger**

An advanced ranged unit that combines precision fire with electrical effects. Especially effective against exposed targets, but expensive and fragile.

**Scavenger + Cinder Lobber → Furnace Rig**

A hybrid that uses recovered battlefield materials to fuel explosive attacks, with a tradeoff between resource production and offensive output.

These examples should be evaluated and refined for balance.

### Why fusion matters

Fusion should create a meaningful choice:

Keep two specialized units with separate functions and positions, or sacrifice them to produce one stronger hybrid and free a deployment space.

The fused unit should not automatically be better in every situation.

Sometimes maintaining two separate units should be more effective.

### Safeguards

Prevent:

- Infinite merging loops.
- Resource duplication.
- Exploitable refunds.
- Incorrect upgrade inheritance.
- Free stat multiplication.
- Unintended recursive combinations.
- Invalid fusion targets.
- Broken interaction with unit caps.

Define explicit rules for previously upgraded units, compatibility, investment accounting, and fusion reversibility.

Use data-defined recipes and simulation-validated commands.

## 7. Positional unit synergies

Passive unit combinations should remain a separate system from fusion.

For example, a Guard and Mender positioned close together might activate a defensive synergy while remaining two independent units.

Fusing them instead would replace both with a Wardkeeper.

Both should be valid strategic choices with different strengths.

Improve the positional synergy system with:

- Clear activation rules.
- Range or adjacency requirements.
- Meaningful mechanical effects.
- Visible activation feedback.
- Unit-card and inspection descriptions.
- Reliable behavior when units move or are removed.
- Caps or diminishing returns where necessary.

Consider combinations involving three units only when they remain understandable.

Prefer synergies that naturally arise from sensible army design.

Avoid large, arbitrary bonuses that make a specific arrangement mandatory in every match.

## 8. Upgrade variety across the roster

The existing Guard and Archer branches are insufficient.

Create useful specializations for other defenders, including support, artillery, economy, and technological units.

Potential directions:

- Scavenger: reliable income versus riskier combat-driven salvage.
- Cinder Lobber: wide-area suppression versus powerful concentrated bombardment.
- Mender: focused emergency healing versus smaller area healing and defensive support.
- Coilcaster: stronger armor disruption versus electrical chaining and crowd control.

Each branch should meaningfully alter unit behavior, rather than simply providing a small stat increase.

Make it easy to compare:

- Current performance.
- Upgrade cost.
- New mechanics.
- Stat changes.
- Synergies gained or lost.
- Tradeoffs.

An upgrade should feel consequential during the next battle.

## 9. Army-building interface

Upgrade the interface to support the growing number of decisions.

Add a coherent unit construction and evolution interface.

When selecting a unit, display relevant actions:

- Inspect.
- Upgrade.
- Change specialization when allowed.
- View active synergies.
- View potential synergies.
- Fuse with an eligible unit.
- Redeploy.
- Retire.

Show available branches and fusion recipes through understandable visual connections.

For fusion, use a clear interaction such as:

Select first unit → Choose Fuse → Highlight eligible units → Select second unit → Preview result → Confirm.

Avoid making players memorize hidden commands.

Include a visual progression tree or branching graph for units with multiple specializations.

Show costs, requirements, and resulting mechanical differences.

Maintain a clear battlefield view while using these interfaces.

## 10. Enemy design must challenge the new systems

A larger board and more powerful combinations require enemies that challenge formation design.

Evaluate adding threats that:

- Punish excessive clustering.
- Counter unsupported frontline units.
- Disrupt support networks.
- Threaten fragile rear positions.
- Resist particular forms of damage.
- Reward specialized counter-units.
- Force decisions about which lane receives valuable upgraded units.

Telegraph dangerous abilities.

Avoid unfair surprises and unavoidable losses.

The goal is to create situations where players must adapt their army construction, not simply purchase more damage.

## 11. Economy and game pacing

Rebalance resource generation and expenditure for a larger battlefield.

The existing economy was designed for twelve slots and a smaller roster.

Consider:

- Starting resources.
- Wave-completion income.
- Kill rewards.
- Scavenger income and limits.
- Upgrade costs.
- Fusion costs.
- Availability of early specializations.
- The opportunity cost of occupying deployment space.

Do not assume expanding the map means every slot should be filled.

The player should face meaningful scarcity.

A larger battlefield should offer options rather than require repetitive purchases.

Review the ten-wave structure.

Determine whether the expanded unit systems benefit from a longer campaign, such as twelve to fifteen waves, or whether ten well-designed waves can showcase sufficient complexity.

Keep early waves fast.

Prevent long periods where the player has nothing meaningful to do.

## 12. Balance and strategic diversity

The current balance report indicates a substantial difference between Bastion and Vanguard effectiveness in the scripted sweep.

Treat this as a reason to investigate—not proof that any particular unit is universally overpowered.

Create or extend automated scenarios for:

- Defensive formations.
- Aggressive formations.
- Economy-focused openings.
- Ranged-heavy strategies.
- Fusion-focused strategies.
- Multiple construct specializations.
- Individual unit counters.
- Different battlefield layouts.

Track useful metrics such as:

- Win rate under defined scripted policies.
- Core damage.
- Resource efficiency.
- Surviving units.
- Damage by unit type.
- Synergy contributions.
- Fusion utilization.
- Unspent resources.
- Battle duration.

Do not rely on a single scripted purchase strategy to determine balance.

The goal is multiple viable approaches with different strengths and weaknesses, not identical performance in every circumstance.

## 13. Technical implementation

Keep the established Phaser 4 and TypeScript architecture.

Preserve:

- Deterministic fixed-tick simulation.
- Typed player commands.
- Separation between game mechanics and rendering.
- Headless verification.
- Existing playable content and visual improvements.

Introduce reusable definitions for:

- Battlefield layouts.
- Unit classes.
- Upgrade trees.
- Fusion recipes.
- Synergy effects.
- Combat abilities and statuses.
- Formation relationships.

Avoid filling the main simulation with dozens of isolated unit-name conditions.

Prefer composable behavior systems where their complexity is justified.

Keep the code understandable, extensible, and testable.

## 14. Implementation plan

This specification defines the overall next gameplay phase, not a requirement to implement every feature immediately.

Break development into independently playable milestones.

### Milestone 2A — Expanded Battlefield and First Evolution Systems

Deliver a coherent vertical slice containing:

1. An expanded battlefield layout selected through deliberate comparison of alternatives.
2. Meaningful position-based gameplay enabled by that layout.
3. At least two new strategically distinct base units.
4. One construct-style unit with three functional specialization choices.
5. At least two functional fusion recipes.
6. At least two meaningful positional synergies.
7. Clear interfaces for upgrading, fusing, inspecting, and positioning.
8. Adjusted economy and enemy pacing to support the larger battlefield.
9. Automated tests, balance scenarios, and browser verification.

All implemented units and fusions must have functional gameplay, accurate descriptions, and recognizable visual identities.

If the scope proves too large for a coherent delivery, implement complete vertical slices in recoverable commits and document any unfinished acceptance criteria. Do not represent partial mechanics as complete.

### Milestone 2B — Roster and Combination Expansion

After playtesting 2A, expand toward:

- Approximately 10–12 distinct base classes.
- More branching upgrades.
- Four to six meaningful fusion recipes.
- A broader network of useful unit synergies.
- Distinct strategies built around different combinations.

Prioritize quality, variety, and balance over arbitrary counts.

### Milestone 2C — Strategic Refinement

Improve:

- Counterplay.
- Battlefield layout based on playtesting.
- Midgame and late-game decisions.
- Economy tension.
- Enemy variety.
- Formation responsiveness.
- Replayability.
- Combat clarity.

Do not introduce multiplayer during this phase.

## 15. Acceptance and testing

Verify that:

- The expanded board functions without invalid positions or rendering errors.
- The entire battlefield is readable on supported screens.
- Additional positions create useful strategic decisions.
- New units have identifiable combat roles.
- Specializations actually alter behavior.
- Fusion consumes correct inputs and resources.
- Fused units behave as documented.
- Positional synergies activate and deactivate correctly.
- Combat remains deterministic.
- Existing functional gameplay remains intact.
- At least two distinct army-building approaches are viable under appropriate test conditions.
- The UI clearly explains upgrades and merging.
- The game can be completed from start to finish.

Run the existing test, build, and balance commands.

Expand automated tests for new mechanics.

Perform browser testing and screenshot inspection when tools are available.

Report verification limitations explicitly.

## 16. Final objective

The player should feel that they are constructing an increasingly sophisticated army.

During a run, they should regularly face interesting questions:

- Should I recruit another defender or evolve one I already own?
- Is it better to merge these two units or preserve their separate abilities?
- Would changing their positions activate a stronger combination?
- Should I invest in support, economy, or direct damage?
- Which specialization counters the next wave?
- Can I develop a stronger formation without relying on the same strategy every run?

The intended result is a game that rewards experimentation, planning, discovery, and adaptation.

**Riftfront should become a game about building clever armies—not simply filling deployment slots until the next wave begins.**
