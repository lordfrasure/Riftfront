# Riftfront — Strategic Depth & Replayability Redesign

**Status:** Active strategic design specification  
**Priority:** P0 — Supersedes earlier gameplay-expansion priorities when they conflict  
**Project:** Riftfront: Ages Under Siege  
**Core objective:** Create an engaging, challenging, strategically deep single-player tower defense / formation auto-battler.

## 1. The fundamental problem

After playing the current game, the project owner completed the entire campaign on the first attempt with almost no strategic effort.

Despite recent improvements to artwork, battlefield size, units, upgrades, and fusion, the game remains fundamentally unsatisfying.

Observed problems:

- The game is far too easy.
- Poor decisions rarely cause meaningful consequences.
- Investing in economy early is consistently safe and effective.
- Nearly every reasonable army composition succeeds.
- Unit positioning and specialization have insufficient consequences.
- Combat lacks tension and meaningful reversals.
- There is little incentive to experiment with alternative builds.
- The interface overwhelms the player with information without clarifying decisions.
- The existing lane design may be limiting meaningful tactical interactions.
- Replayability is extremely low.

**Do not interpret this as a request to add more content.**

The problem is insufficient strategic tension and decision quality.

Adding another ten units, more upgrades, additional lanes, or additional menus will not solve the underlying issue.

The next development phase must focus on making the existing systems produce meaningful decisions, identifiable strategic weaknesses, and interesting outcomes.

## 2. Product vision

Riftfront should combine the strongest design principles of:

- Squadron TD: army construction, builder identity, branching evolution, positioning, risky economy, wave knowledge.
- Legion TD 2: fighter efficiency, meaningful economic sacrifice, combat counters, escalating waves.
- Plants vs. Zombies: intuitive rules, distinct enemy threats, approachable but challenging resource management.
- South Park: Phone Destroyer: constrained build selection, tactical identity, resource timing, and useful counterplay.
- Bloons TD: impactful upgrade branches, specialized counters, and satisfying power development.

Use these as references for design principles.

Create original gameplay systems, art, terminology, and content.

### Desired player experience

The player should regularly:

1. Consider multiple reasonable strategic options.
2. Understand the resources or capabilities sacrificed by each option.
3. Commit to a particular build direction.
4. Face an enemy encounter that tests the build.
5. Experience meaningful tension during combat.
6. Discover whether their strategic assumptions were correct.
7. Learn something useful from the outcome.
8. Adapt their army or approach.
9. Want to attempt another run with a different strategy.

A player should be able to enjoy many runs through learning, experimentation, specialization, and mastery.

## 3. Mandatory initial audit

Before modifying gameplay, inspect the actual repository and run the existing balance harness.

Investigate why the campaign is so reliably defeated.

The latest reviewed version had several potentially problematic characteristics:

- Three combat lanes with seven deployment pads each.
- Eight recruitable defender types.
- Multiple upgrade branches and two fusion recipes.
- Scavengers costing 32 scrap and generating 11 scrap per successful wave.
- A starting resource pool of 128 scrap.
- Routed and damaged defenders automatically restored to full health after cleared waves.
- Relatively weak persistent consequences for losing defenders.
- Combat and targeting primarily restricted to the same lane.
- A balance report showing eight out of eight named strategies winning on the selected battlefield layout.

Verify these details against the current code. Do not assume they remain unchanged.

Evaluate:

- Resource income and expenditure per wave.
- Early economy break-even points.
- Damage output and damage intake.
- Unit survivability.
- Overinvestment in frontline units.
- Underinvestment in counters.
- Wave duration and idle time.
- How effectively enemies threaten support and ranged units.
- How frequently units or upgrades are strategically unnecessary.
- Whether wave rewards are too generous.
- Whether the player can afford nearly everything desirable.
- Whether most mistakes are erased between waves.

Create a baseline analysis in the development plan.

Separate verified code findings from design hypotheses.

## 4. Design pillar: scarcity and opportunity cost

The player must not be able to purchase every useful option.

Create meaningful competition among:

- Immediate defensive strength.
- Future economic income.
- New unit recruitment.
- Upgrading existing units.
- Fusion.
- Technological advancement.
- Army capacity.
- Specialized counters.

### Economy

Rework the economy so that greed can produce significant rewards but also exposes the player to danger.

An early economic investment should reduce immediate defensive capability enough that the next wave matters.

The strongest economic opening must not be automatically correct against every encounter.

Consider changing:

- Starting scrap.
- Economic-unit cost.
- Economic payout timing.
- Economic payout conditions.
- Wave grants.
- Kill bounties.
- Investment limits.
- Opportunity costs for economic units.

Do not introduce arbitrary penalties merely to force difficulty.

Create economic decisions where defense, investment, and specialization are situationally preferable.

### Army capacity

Evaluate a separate deployment-capacity limit.

For example, the battlefield might have 21 possible positions while initially supporting fewer deployed units.

Capacity could grow through wave milestones, technology, or explicit investment.

This creates a reason to choose between:

- Several cheap specialists.
- Fewer expensive evolved units.
- Combined/fused units.
- Support units occupying valuable capacity.
- Economy units consuming capacity that could be used defensively.

Capacity must create strategic depth, not tedious restrictions.

Test whether it improves actual decision-making before committing to it permanently.

## 5. Design pillar: meaningful consequences

Bad decisions must have visible consequences.

Investigate the current rule that restores all surviving and routed defenders to full health after each cleared wave.

Evaluate alternatives such as:

- Temporary recovery costs for routed defenders.
- Losing a portion of income after a damaging wave.
- Limited repairs or recoveries.
- Increased opportunity costs for replacing ineffective units.
- A meaningful benefit for efficiently clearing a wave.
- Persistent core damage that is difficult but not impossible to recover.

Do not make permanent unit death mandatory.

Do not create unavoidable defeat spirals where one mistake guarantees failure several waves later.

The desired outcome is recoverable failure with real costs.

A player who barely survives a wave should feel relief, recognize the damage done, and face a difficult recovery decision.

## 6. Design pillar: counterplay and specialized threats

Enemy design must challenge specific army compositions.

Do not rely primarily on increasing enemy health, armor, count, or attack damage.

Introduce encounters that reward different capabilities.

Examples of threat roles to prototype:

### Anti-frontline

Enemies that punish reliance on a single durable blocker or overly clustered defensive wall.

### Anti-backline

Enemies that create pressure on poorly protected ranged or economic units through clearly telegraphed movement or special targeting.

### Anti-support

Enemies that temporarily disrupt healing, buffs, links, or support networks.

### Anti-swarm

Enemies or encounter compositions that punish armies built entirely around splash damage or rapid low-damage attacks.

### Anti-armor

Enemies that challenge defensive builds relying on extremely high armor or healing efficiency.

Every threat should provide:

- A readable visual identity.
- A clear, understandable mechanical rule.
- Available counterplay.
- A meaningful strategic implication.
- Fair warning when a dangerous ability is introduced.
- Automated simulation tests.

The goal is to force adaptation, not create artificial hard counters that make an encounter impossible with the wrong loadout.

## 7. Design pillar: multiple meaningful build identities

The eventual game should support several distinct ways of constructing an army.

Examples:

### Defensive attrition

Heavy frontline units, healing, armor, and control.

Strong against sustained attacks. Vulnerable to disruption, anti-armor pressure, and certain ranged threats.

### Precision elimination

Specialized long-range damage, armor penetration, and priority targeting.

Strong against elites and support enemies. Vulnerable to swarms and frontline collapse.

### Economy and scaling

Sacrifice early defensive power for future investments and sophisticated late-game compositions.

Strong when early defenses are sufficiently efficient. Vulnerable to unexpected pressure and greedy opening decisions.

### Construct evolution

A Foundry-style builder using branching specializations, linked support units, and specialized fusion.

Strong when the formation is planned carefully. Vulnerable to disruption or poorly chosen evolution branches.

### Aggressive disruption

Mobile frontline units and offensive control that prevent enemies from establishing pressure.

Strong against certain ranged and support-heavy formations. Vulnerable to prolonged high-damage engagements.

These are design directions, not promises that every archetype must be built immediately.

Each archetype should have encounters where it excels and encounters where it struggles.

Avoid creating one dominant composition.

## 8. Build-defining evolutions and fusion

Unit upgrades and fusions should transform the player's strategy.

A specialization should change how the unit operates, not simply increase its damage or health.

For every evolution branch, identify:

- The problem it solves.
- The enemy types it counters.
- The opportunity cost.
- Its weaknesses.
- Its positional implications.
- Compatible and incompatible combinations.
- A situation where choosing another branch is superior.

### Fusion

Fusion must create trade-offs.

A fused unit should not necessarily be stronger than its ingredients in every circumstance.

Its value may come from:

- Conserving deployment capacity.
- Combining roles.
- Creating specialized attacks.
- Enabling unusual formation interactions.
- Unlocking a new upgrade path.

Retaining two separate units must sometimes be preferable.

Add comparative tests for fused versus separate formations.

### Combinations

Prioritize synergies that change tactics rather than simply add small numerical bonuses.

A build-defining synergy should influence some combination of positioning, economy, timing, target selection, enemy counterplay, or upgrade strategy.

The long-term goal is an original construct-style builder inspired by the strategic appeal of Squadron TD's Automaton evolution and fusion-oriented mechanics.

Develop this deeply before building several additional shallow unit families.

## 9. Design pillar: positioning and battlefield depth

The current battlefield contains three primarily independent horizontal combat lanes.

Evaluate whether meaningful tactical depth can be created through:

- Restricted deployment capacity.
- Cross-lane ranged support.
- Cross-lane defensive or support abilities.
- Enemy lane-switching at telegraphed junctions.
- Position-dependent attacks.
- Defensive interception.
- Formation spacing.
- Enemies that threaten specific positions.
- Terrain or battlefield modifiers.

Do not automatically increase lane count or slot count.

Prototype changes using the existing layout first.

If the lane model fundamentally limits the desired experience, create a separate experimental branch or prototype demonstrating an alternative.

Compare both models before replacing the main battlefield.

Avoid changing to full 2D pathfinding without evidence that it improves the actual player experience.

## 10. Design pillar: structured replayability

The current fixed campaign risks being solved through memorization.

Longer-term replayability should come from several interacting sources:

### Builder and loadout selection

Players select a restricted collection of units and technologies before a run.

They cannot bring every available counter.

### Strategic rewards

Offer occasional mutually exclusive choices that substantially influence the run.

Examples include new specialization access, modified fusion behavior, or additional army capacity.

### Curated encounter variation

Introduce controlled variation in enemy formations, lane pressure, and boss mechanics.

Use seeded randomness to preserve reproducibility.

Avoid unpredictable encounters that defeat a build with no reasonable warning or response opportunity.

### Distinct challenges

Eventually support different arenas, enemy themes, challenge modifiers, and specialized builder trials.

### Persistent progression

Player levels, mastery, achievements, and unlocks should expand possible strategies.

Avoid permanent stat inflation that trivializes early content.

These systems must not be prioritized before the core game is enjoyable.

## 11. UX/UI simplification

The current game presents more information than the player can comfortably use.

Redesign the battle interface around the player's immediate decision.

### Always visible

- Battlefield.
- Core health.
- Scrap.
- Wave number.
- Army capacity, if implemented.
- Accessible recruitment choices.
- Primary start-wave action.
- A concise preview of the most significant upcoming threats.

### Contextual

- Unit statistics.
- Upgrade comparisons.
- Fusion partners and resulting unit.
- Synergy details.
- Relevant enemy counters.
- Placement range and interaction previews.

### Outside the battle screen

- Full unit encyclopedia.
- Complete upgrade trees.
- Detailed fusion recipes.
- Historical performance statistics.
- Long-form descriptions.
- Progression and achievement information.

Do not remove strategically necessary information.

Reduce cognitive load by showing information when it can affect the player's next decision.

### Wave forecasting

Forecast the problem rather than explicitly recommending the solution.

Prefer:

"Lane 2: Protected armored assault."

Avoid:

"Use a Longshot Archer to kill the Herald."

Players should learn to recognize problems and develop their own solutions.

### Combat reports

Focus on why the player succeeded or failed.

Track actual combat evidence such as:

- Frontline collapses.
- Damage absorbed.
- Damage blocked by armor.
- Support-unit contributions.
- Upgrade performance.
- Fusion performance.
- Economic returns.
- Core damage.
- Enemy units responsible for significant losses.

Do not present speculative explanations as factual results.

## 12. Improve learning through losses

A loss should teach the player something.

Implement appropriate gameplay telemetry to explain:

- What broke through.
- Where the frontline failed.
- Which counters were missing.
- Which investments failed to produce value.
- Which enemy abilities created the most pressure.

Do not display excessive analytics during the battle.

After a failure, explain the most significant contributing factors.

Eventually consider a replay/retry-wave tool so players can experiment with formation adjustments, but do not prioritize this before core difficulty and balance improve.

## 13. Balance validation must test bad decisions

The current balance harness primarily verifies that scripted strategies can complete the campaign.

That is insufficient.

Extend the harness to evaluate:

- Greedy economic openings.
- Defensive overinvestment.
- Fragile ranged-heavy armies.
- Poor positioning.
- Inappropriate upgrades.
- Missing enemy counters.
- Fusion versus separate-unit choices.
- Specialized build identities.
- Underspending and inefficient resource allocation.
- Different encounter sequences.

A balance system that reports nearly every sensible strategy winning with full core health is not demonstrating strategic depth.

Construct scenarios where:

- Some strategies win decisively.
- Some strategies narrowly survive.
- Some strategies fail for identifiable reasons.
- Small, meaningful changes to positioning or purchases alter outcomes.

Ensure the tests represent comparable resources and encounter conditions.

Do not hardcode scenarios merely to force expected outcomes.

Avoid tuning to one scripted policy while accidentally making others dominant.

Balance for multiple viable strategies, not universally successful strategies.

## 14. Player-experience testing

Automated simulation is necessary but not sufficient.

Evaluate player decisions using questions such as:

- Was the best purchase obvious?
- Was there a real cost to investing in economy?
- Did positioning materially change the outcome?
- Was an upgrade exciting and strategically significant?
- Did the player experience a close call?
- Could the player explain why a wave was difficult?
- Did losing teach the player something?
- Would the player want to attempt a different build?
- Was the next decision understandable without opening multiple information panels?

Treat the project owner's playtesting as essential product feedback.

Never claim that automated victories prove the game is enjoyable.

## 15. Development milestones

### SD1 — Strategic Tension Foundation

This is the immediate implementation milestone.

Focus on:

1. Baseline economy, difficulty, and strategy analysis.
2. Economic investment risk.
3. Meaningful consequences for defensive mistakes.
4. A prototype deployment-capacity constraint.
5. Three carefully designed enemy/encounter counterplay challenges.
6. Rebalanced waves with genuine pressure.
7. Simplified next-wave information.
8. Expanded automated tests covering successful and unsuccessful strategies.

The core deliverable is a ten-wave campaign where the player must make meaningful choices and can realistically lose through poor decisions.

Avoid introducing large new unit families or unrelated progression systems during SD1.

### SD2 — One Deep Builder

Develop the Foundry/construct builder into a cohesive strategic system.

Focus on:

- Several distinctive unit lines.
- Branching specializations.
- Build-defining synergies.
- Situational fusions.
- Meaningful weaknesses.
- Clear evolution interfaces.
- Enemy counterplay specifically testing those combinations.

This milestone begins only after SD1 playtesting.

### SD3 — Battlefield and Build Variety

Prototype:

- Limited cross-lane interaction.
- More advanced enemy positioning mechanics.
- Restricted pre-match loadouts.
- Mutually exclusive run technologies.
- Curated seeded encounter variation.

Evaluate whether the current lane structure remains appropriate.

### SD4 — Progression and Replayability

Add or improve:

- Persistent player profiles.
- Player experience and levels.
- Unit mastery.
- Achievements.
- Unlockable builder options.
- Additional challenge modes.

Progression should reward strategic experimentation without trivializing the base campaign.

### SD5 — Content Expansion

Expand with additional builders, encounters, bosses, fusion recipes, and arenas after the strategic foundation is proven enjoyable.

## 16. Technical requirements

Preserve:

- Phaser 4 and TypeScript.
- Deterministic fixed-tick simulation.
- Typed player commands.
- Separation of mechanics and rendering.
- Existing working UI and artwork.
- Headless automated tests.
- Reproducible balance scenarios.

Implement new mechanics with clear data definitions and reusable rules.

For major behavioral changes, add automated tests demonstrating the intended consequences.

Keep documentation synchronized with shipped functionality.

## 17. Milestone SD1 acceptance criteria

Milestone SD1 must provide evidence of all the following:

1. Economic investment has a meaningful opportunity cost.
2. At least one greedy opening performs substantially worse than an appropriate defensive opening under a representative early threat.
3. There are encounters where an inappropriate unit composition suffers while an appropriate counter performs better.
4. Poor positioning can materially change an encounter outcome.
5. Defensive mistakes create meaningful, understandable consequences without guaranteeing an unrecoverable defeat spiral.
6. Deployment capacity is evaluated through a working prototype or comparative simulation.
7. At least two strategically different approaches can complete the campaign.
8. The interface more clearly communicates upcoming threats and current options.
9. Automated tests cover new mechanics and relevant failure cases.
10. Existing functionality remains playable.
11. The production build and balance harness succeed.
12. Browser verification is performed where available.
13. A clear report explains what changed, why, and what remains uncertain.

**These are design validation requirements, not instructions to manipulate tests into passing.**

If evidence suggests a proposed mechanic does not improve the game, revise or reject it.

## 18. Final development directive

The objective is not to make Riftfront artificially difficult.

The objective is to create a game in which knowledge, planning, positioning, economy, adaptation, and build construction genuinely matter.

A skilled player should be rewarded for understanding the systems.

An inexperienced player should sometimes fail, understand why, and feel motivated to improve.

A greedy build should feel exciting because it risks collapse.

A powerful fusion should feel earned because it sacrifices alternative possibilities.

A successful strategy should be satisfying because its strengths were deliberately constructed.

**The measure of success is whether the player wants to play again, experiment, learn, and improve—not whether more features have been implemented.**

Implement this direction through controlled, playable milestones.

Stop after each approved milestone for human playtesting and feedback.
