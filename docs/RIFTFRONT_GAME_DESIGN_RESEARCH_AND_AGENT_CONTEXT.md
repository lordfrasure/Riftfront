# RIFTFRONT: AGES UNDER SIEGE
## Game-design research, product vision, mechanics specification, and context for coding agents

**Document version:** 1.0 — 2026-11-22  
**Status:** Product/design guidance; not a claim that the features have been implemented.  
**Project stage:** HTML5 browser prototype in development, using VS Code and Codex.  
**Primary audience:** The developer and AI coding/design agents contributing to this project.  
**Current priority:** Build and balance a genuinely fun **single-player** game before investing in multiplayer.  
**Implementation reference:** See [current game rules](GAME_DESIGN.md) and the [roadmap](ROADMAP.md).
**Reference games:** Squadron Tower Defense (StarCraft II Arcade), Age of War, Bloons TD (especially BTD6), Plants vs. Zombies (original), South Park: Let's Go Tower Defense Play!; Legion TD 2 as an important adjacent competitor/reference.

> **Read this first, agents:** This document states the intended direction and hypotheses, not permission to implement everything at once. First inspect the actual repository and existing `AGENTS.md`, `docs/GAME_DESIGN.md`, tests, and current running build. Preserve working code and prior user decisions. Reconcile any differences in a proposed change before editing. The user's highest priority is **fun, balanced single-player gameplay**. Multiplayer is a design constraint for architecture, not a current feature request.

---

## 1. Executive design brief

**One-sentence pitch.** Riftfront is a colorful, browser-first, single-player tower defense/army-builder in which the player arranges living defenders and supporting emplacements across clear lanes, weighs immediate survival against economic growth, and evolves an increasingly distinctive army across technological ages to survive escalating, readable waves.

**A stronger player-facing pitch.** Build your front line. Exploit enemy weaknesses. Decide when to invest instead of defend. Then turn primitive troops into unlikely combinations of ancient courage, industrial machinery, and future technology. Every wave asks a question; every army build should feel like an answer.

**Core promise:** Easy to understand in the first minute; hard to optimize across many matches; rewarding to watch; strategically variable without being unfair or needlessly complex.

**Product goals (ranked):**
1. **Compelling decisions:** Players consistently face non-obvious tradeoffs involving placement, composition, economy, upgrades, and technology timing.
2. **Readable cause and effect:** Players understand why a strategy succeeded or failed, and what they might try differently.
3. **Satisfying battles:** Auto-combat is entertaining to watch because formations and specialized abilities have visible consequences.
4. **Meaningful progression within a match:** The battlefield and combat possibilities visibly transform from early to late game.
5. **Replayability through systems, not grind:** Different build routes, wave modifiers, maps, and later factions produce new choices.
6. **Maintainability:** Browser-first TypeScript implementation, testable headless simulation, data-driven content, and careful integration with AI coding tools.
7. **Eventually multiplayer:** Future synchronous/cooperative/competitive play should be feasible but not distort the single-player MVP.

**Do not optimize for:** Maximum number of units, complex lore, a giant feature checklist, flashy visuals that hide combat information, compulsory micro-management, pay-to-win progression, daily-login pressure, or multiplayer before the core loop is fun.

### 1.1 Decisions by status

| Status | Decision | Interpretation |
|---|---|---|
| **Confirmed by developer** | Name/working concept: *Riftfront: Ages Under Siege* | Continue using as working project identity; final naming can change. |
| **Confirmed** | Single-player first; eventual multiplayer | Finish and balance single-player before multiplayer investment. |
| **Confirmed** | Browser game first (modern equivalent of Flash) | Build in HTML5, run locally in browser; no Adobe Flash runtime. |
| **Confirmed** | VS Code + Codex for AI-assisted development | Use small, verifiable tasks and persistent design context. |
| **Confirmed** | Inspiration is a thoughtful combination of five games | Borrow underlying design principles, not proprietary art/code/characters. |
| **Already prompted to Codex** | Phaser + TypeScript + Vite; initial 3-lane, 5-wave prototype with Guard, Archer, Scavenger | Treat as the **current prototype baseline** unless repository evidence differs. Do not casually restart or replace it. |
| **Strong recommendation, subject to playtesting** | Stationary placements that become living, auto-engaging defenders during combat | Captures Squadron's key differentiator and PvZ's readable setup phase. |
| **Strong recommendation** | Economy-versus-defense tradeoff | Should be visible by the first few waves, not a late-game gimmick. |
| **Design hypothesis** | Three eras in initial full single-player mode | Start with limited, meaningfully different eras; validate pacing. |
| **Design hypothesis** | Two meaningful upgrade branches per major unit | Simpler to teach and balance than BTD6's full branching system. |
| **Open experiment** | 3 vs. 5 lanes; anchored combat vs. greater mobility; strict wave pause vs. limited live actions | Prototype and compare. Never silently treat as final. |
| **Deferred** | Full PvP economy, mercenary sends, online co-op, factions, deck-building, meta-progression, procedural maps | Add only after strong evidence of a solid standalone single-player game. |

---

## 2. Reference-game research: what works, why, and what not to copy

The descriptions in this section distinguish **documented game mechanics** from **our design interpretation**. Citations use the research references in §17. These are design sources, not evidence that Riftfront features exist.

### 2.1 Squadron Tower Defense (StarCraft II Arcade): strategy comes before the battle

**Documented reference mechanics.** Squadron TD is a team-based tower defense in which placed towers become AI-controlled fighting units during waves. Players choose builders, invest in gas production, balance fighters against economy, send offensive units, and protect a shared security system. Positioning of tanks, damage dealers, and support units matters. The SC2 Arcade listing explicitly recommends balancing income against leaks and arranging tank/frontline and backline units deliberately. [R1, R2]

**Why it is compelling:**
- **Construction becomes a prediction:** You have to anticipate whether your composition and formation can survive the next wave, rather than directly rescuing every tactical mistake.
- **Economy is genuinely risky:** Buying income now means less protection now. A high-income opening can outperform later, but can lose early.
- **Formation creates hidden expertise:** A tank's location changes which troops are targeted, how enemies cluster, and how long damage dealers survive. Players discover sophisticated placements.
- **Combat resolves a hypothesis:** The battle demonstrates whether the player's plan worked, creating an immediate learning loop.
- **Distinct unit roles produce synergies:** Frontline, single-target damage, area damage, healing, auras, and control all have a reason to exist.
- **Knowing waves matters:** Enemy composition and damage/armor interactions reward planning rather than random purchases.

**Riftfront adaptation:**
- Build a living army, not just a firing-line of towers.
- Make placement, enemy access, and range matter in deterministic, explainable ways.
- Convert the original PvP-oriented income/risk concept into a compelling single-player economy.
- Keep a phase boundary so players can evaluate choices and review battle performance.

**Failure modes to avoid:**
- Opaque attack/armor relationships that demand a wiki.
- Complexity from many builders/factions before basic units are balanced.
- AI pathing that makes a good formation fail unpredictably.
- An economy opener that is nearly mandatory or nearly always a trap.
- Designing around teammates to compensate for a weak economy build; this is a solo game.

### 2.2 Legion TD 2: the closest existing competitor / evolved comparison

**Documented mechanics.** Legion TD 2 uses automated fighters, workers, periodic waves, attack/defense types, income, and PvP mercenaries. Fighters heal and return to their original positions between waves. Its manual says waves have known attack/defense types and its game balance is informed by data. It has builders/factions and drafting modes. [R3]

**Why study it:** It already occupies much of the standalone Squadron-like niche. Riftfront must be more than “Squadron TD in a browser with era skins.”

**What to borrow:** Predictable unit reset after battle, transparent wave information, distinct team roles, strong data-driven balancing discipline, and clear post-wave explanations.

**How Riftfront should differentiate:**
- First-class **solo-designed** progression, not a PvP economy mechanically stripped of an opponent.
- **Era evolution plus cross-era retrofits** that genuinely transform army roles and interactions.
- An approachable PvZ-style battlefield with a much gentler early learning curve.
- Compact, expressive Flash-era audiovisual charm rather than a complex RTS presentation.
- Scenario-driven single-player challenges, optional risk contracts, and purposeful in-run choices.

**Caution:** Match Legion TD 2's principles of transparency and auto-combat, not its exact numerical formulas, units, UI, or branded content.

### 2.3 Plants vs. Zombies: elegant simplicity that creates room for complexity

**Documented mechanics and designer insights.** The original PvZ uses constrained lanes and iconic units: resource-generating Sunflowers, attack-focused Peashooters, defensive blockers, and enemies with specific properties such as jump/armor behaviors. Creator George Fan described migrating from maze-building to a reduced lane system and simplifying fiddly resource gathering. His GDC presentation emphasizes unobtrusive tutorials, short instructions, visual teaching, and adaptive help. [R4, R5, R6]

**Why it is compelling:**
- Every piece has an instantly inferable job. Players do not need to read several paragraphs to understand a blocker versus a shooter.
- **Lane pressure** creates a readable spatial puzzle: a strong defense in one lane does not automatically save another.
- **Economic investment is physical and legible:** A generator occupies space that could be a weapon.
- **Threat escalation is educational:** Each new enemy tends to teach a useful response, expanding the player's mental model.
- **Humor and distinctive silhouettes** make the units memorable without becoming hard to read.
- The screen stays compact; players are not forced to track off-screen disasters constantly.

**Riftfront adaptation:**
- Small, fully visible battlefield; initial three lanes, optionally five later if it improves play.
- An economy unit whose opportunity cost is visible on the battlefield.
- Enemies with **behavioral** distinctions, not just bigger HP bars.
- Unlock complexity gradually: teach Guard, then Archer, then Scavenger, then specialized counters.
- Strong visual language for each role and threat, with optional tooltip depth for experts.

**Failure modes to avoid:**
- Copying PvZ's immobile plant behavior too literally would erase Squadron-style living armies.
- Constant manual collection could distract from the intended thinking-based play.
- A simple lane grid can become boring if unit positioning and cross-lane interactions have no meaningful variation.
- Introducing enemies with hard counters before players can access those counters is unfair.

### 2.4 Bloons TD 6: thousands of build questions from a legible ruleset

**Documented mechanics.** BTD6 centers on specialized towers and heroes, maps and modes, and three upgrade paths per tower. Its upgrade system allows primary-path commitment plus limited secondary-path cross-upgrades. Attack interaction rules include enemy properties that counter particular damage or targeting methods. [R7, R8, R9]

**Why it is compelling:**
- **Upgrades change functions**, not just statistics: a tower can become better at crowds, bosses, support, or unusual enemies.
- **Map geometry matters:** Locations determine which unit investments make sense.
- **Enemy properties force adaptation:** A successful general-purpose build can still need specialized detection or damage.
- **Satisfying combat feedback:** Projectiles, bursts, pops, and transformations reinforce the impact of investments.
- **Depth unfolds over repeated games:** A novice can play basic towers; experts learn combinations and timing.
- Plenty of replayable formats can exist without requiring every match to have an entirely new narrative.

**Riftfront adaptation:**
- Branching functional upgrades, initially only two branches with a small number of tiers.
- Telegraph counters clearly; prefer soft counters and upgrade workarounds over opaque total immunities.
- Give each unit an obvious base job plus strategic specialization.
- Make upgrade purchase alter animation/silhouette/attacks so progression is exciting.
- Use maps and rules variants eventually, after the core arena works.

**Failure modes to avoid:**
- Implementing 3 × 5 upgrades per unit during the first prototype (content and balancing explosion).
- Overlapping particles/status effects that hide the actual battle.
- A mandatory best upgrade path or totally worthless upgrades.
- Scaling damage numbers without introducing new interactions.

### 2.5 Age of War: progression you can feel

**Documented mechanics.** In the original Age of War, the player creates fighting units and turrets to protect a base and advance across a side-scrolling battlefield. The developer's Kongregate description lists five historical ages, 16 units, and 15 turrets; combat and experience enable stronger era-specific units and defenses. [R10]

**Why it is compelling:**
- **A highly legible fantasy of escalating power:** The battle changes from primitive weapons to futuristic weapons.
- **Compact gameplay:** Very little explanation is needed to understand sending a stronger unit.
- **Milestone anticipation:** Unlocking the next age feels more important than an invisible +5% bonus.
- **Visual payoff:** New armies and turrets make the battlefield feel freshly exciting.
- **Short-term and long-term goals coexist:** Win the immediate skirmish; push toward the next era.

**Riftfront adaptation:**
- Keep the emotional rush of era changes, but integrate them into tower-defense strategy rather than converting the game into a single-lane tug-of-war.
- Add the unique concept of **retrofits**: early units can receive technology from later eras instead of automatically becoming obsolete.
- Give advancing an era an opportunity cost and a fresh tactical option; do not simply force a universal upgrade at a fixed wave.
- Allow old and new units to coexist with tradeoffs in efficiency, capacity, support, or specialized utility.

**Failure modes to avoid:**
- One-dimensional progression in which the newest unit always invalidates the previous roster.
- Waiting for an XP bar with little agency.
- Extremely powerful late-game attacks that trivialize all formation choices.

### 2.6 South Park: Let's Go Tower Defense Play!: character, spectacle, and a solo-design warning

**Documented mechanics.** This Xbox 360 game combines tower placement with movable playable characters, manual projectiles, distinct character specials, and up-to-four-player cooperative play. Contemporary reviews noted that active character control can become tedious or overwhelming, particularly when solo players must switch among multiple characters. [R11, R12]

**Why it is notable:** Humor, surprise enemies, striking character identities, and a sense that the player participates in the defense rather than only watching a spreadsheet simulation.

**Riftfront adaptation:**
- Original visual personality: funny unit behavior, little battlefield stories, satisfying reactions, and quirky technology combinations.
- Limited **commander powers** (for example emergency barricade, precision strike, temporary rally), with distinct identities.
- Optional tactical intervention during battle, without requiring constant clicking or character switching.
- Celebrate impressive wins and dramatic narrow saves with audiovisual feedback.

**Failure modes to avoid:**
- Making reflexes, repetitive clicking, and swapping characters the main solo challenge.
- IP imitation: do not use recognizable South Park characters, jokes, art style replication, names, voices, or licensed material.
- Overly long cooldowns on powers that players are supposed to enjoy using.

### 2.7 Cross-reference synthesis

| Source | Best design principle | Riftfront mechanic | Priority |
|---|---|---|---|
| Squadron TD | Pre-battle strategy; formation; income/defense risk | Living auto-fighters, positional combat, resource tension | Core |
| PvZ | Instant legibility; lane puzzle; gradual teaching | Lanes, clear roles, economic placement, telegraphed enemies | Core |
| BTD6 | Synergy, upgrades, powerful audiovisual feedback | Functional branches, role counters, evolving attack behaviors | Post-MVP core |
| Age of War | Exciting and visible technological progression | Era unlocks and retrofits that transform armies | Signature feature |
| South Park TD | Humor, character, active impact | Expressive personalities and limited commander powers | Polish / later |
| Legion TD 2 | Solo-visible battle information and mature simulation principles | Restore between rounds, type information, data-based balancing | Architecture / UX |

**Design thesis:** The strongest combination is **PvZ clarity × Squadron army placement × BTD specialization × Age of War evolution**. Humor and tactical powers support that foundation; they are not the foundation themselves.

---

## 3. The distinct Riftfront identity

### 3.1 Fantasy and setting

Time ruptures are causing unrelated civilizations and technologies to collide. The player protects a central **Rift Core** while preparing successive defensive formations. Each cleared wave yields resources and opportunities to study or steal new technology. Different eras may overlap in a single army: a veteran with a powered shield, a steam-driven ballista using smart targeting, or a primitive swarm warrior reinforced by futuristic medical drones.

**Tone:** Playful, adventurous, high-energy, slightly absurd, but mechanically serious. Visual evolution should be an emotional reward. Story is lightweight; it contextualizes mechanics rather than consuming match time.

**Originality guardrails:** All assets, unit designs, voice lines, icons, names, and scripts must be original or appropriately licensed. Do not reproduce Blizzard, PopCap/EA, Ninja Kiwi, South Park, or Age of War copyrighted expression. Do not import scraped sprites or music into the game without explicit rights review.

### 3.2 Design pillars

1. **Build a living formation.** Units have roles, engagement rules, health, and battlefield presence. Their positions change outcomes.
2. **Make every investment cost something.** Defense, economy, specialization, and research compete for limited resources.
3. **Every enemy teaches a strategic response.** Distinct tells and behaviors, clear counter options, and no unavoidable gotchas.
4. **Advance without erasing the past.** Era technology alters old units and makes new combinations possible.
5. **Simple to operate, deep to optimize.** A clear viewport, few clicks, strong previews, useful battle reports, and no compulsory micromanagement.
6. **Fail fairly and learn quickly.** Losses should have understandable explanations; players should want to try a better build next.

### 3.3 The ideal emotional cycle

- **Anticipation:** See the next wave and decide whether the defense is ready.
- **Commitment:** Make a risky choice (buy income, reposition frontline, specialize a unit).
- **Tension:** Watch auto-fighters meet threats; recognizable counters activate.
- **Payoff:** A strong tactic visibly pays off, or a near-failure teaches something.
- **Reward:** Receive resources, an upgrade option, or an era milestone.
- **Curiosity:** A new build idea suggests another run.

The goal is high engagement through clarity, mastery, experimentation, and satisfying feedback, not coercive retention mechanisms.

---

## 4. Product structure: prototype → validated single-player game → expansion

### 4.1 Phase A: already-requested initial prototype (0.1)

The original prototype brief specified:
- HTML5, TypeScript, Phaser, Vite.
- 1280×720 landscape presentation.
- One battlefield containing **three** horizontal lanes.
- Enemies enter from the right and approach the player core on the left.
- Placeable Guard (melee blocker), Archer (ranged damage), and Scavenger (income).
- Basic, Fast, and Armored enemies.
- Five waves, a build phase, a battle phase, a start-wave control, win/loss and restart.
- Initial resource counter, core health, wave counter, visible damage/health, geometric placeholder graphics.
- Simulation/rendering separation, fixed timestep, initial automated tests.

**Acceptance:** Launch locally, place defenders, start waves, observe auto-combat, earn/spend resources, and finish or lose a five-wave run. Gameplay should be understandable without reading a manual.

Use the original brief as a baseline for evaluating the playable slice. Verify the repository and playtest results before extending it.

### 4.2 Phase B: minimum *fun* single-player game (0.2–0.4)

Add only features that fix observed gameplay weaknesses:
- Formation meaningful enough that moving a frontline unit changes an outcome.
- One or two stationary tower/support options that interact with mobile units.
- A next-wave preview and concise post-wave explanation.
- A small, understandable armor/damage/counter model.
- Two functional upgrade alternatives for selected units.
- Clear visual/audio feedback for attacks, hits, upgrades, leaks, and ability effects.
- Balancing instrumentation and at least two genuinely viable opening strategies.

**Gate:** 5-wave replay feels meaningfully different when you change build order/placement, and losses make sense.

### 4.3 Phase C: full single-player vertical slice (0.5–0.9)

Proposed, subject to testing:
- Approximately 12–15 waves / ~15–25 minutes per run, not locked until actual pacing data.
- Three distinct technology eras.
- About 8–12 meaningful defender/tower/support archetypes total (not 8–12 per era).
- Roughly 8–10 enemy behaviors plus 1–2 bosses.
- A few branching upgrades and cross-era retrofits.
- One polished map and one alternate map, or one map plus meaningful rule modifiers.
- One or two optional commander abilities.
- Tutorials that teach organically, readable results screen, pause, faster speed, audio controls, save/resume if needed.

**Gate:** Unfamiliar playtesters can learn it independently, complete a run, explain why they lost, and voluntarily want a second match.

### 4.4 Phase D: replay systems and optional multiplayer preparation

Only after the prior gate is achieved:
- Distinct maps that alter important tactical decisions (cross-lane sites, chokepoints, split paths).
- Challenge modes and difficulty modifiers.
- Drafts/alternative tech combinations if the deterministic campaign has enough strategic depth.
- New factions with coherent mechanical identities rather than mere reskins.
- Experiment with co-op and competitive mechanics on a separate branch; keep authoritative simulation possible.

---

## 5. Core player loop and match pacing

### 5.1 Recommended loop

1. **Preview:** The next wave's main threats, lane distribution, and special properties are visible.
2. **Plan:** Place, upgrade, sell/reposition within documented rules, and consider an economy/research investment.
3. **Commit:** Start the wave when ready; optional fast-forward if stable.
4. **Resolve:** Living defenders auto-engage; towers fire; any limited commander actions can be used.
5. **Debrief:** Display leaks, core HP, resource outcome, noteworthy counters, and underperforming placements.
6. **Progress:** Receive resources and, at defined milestones, technology choices; return to Preview.

**Important:** Decide if a defender is reconstituted/healed between waves or permanently lost. **Recommendation:** Fighters return to their purchased positions at full health between waves (the Squad/Legion logic) so the player is primarily optimizing an enduring formation rather than replacing a dead army. Enemies reaching the core cause persistent core damage. This should be deliberately tested because it changes the value of tanks and risky economies. [R3]

### 5.2 Target pacing, not strict specifications

| Segment | Desired experience | Proposed length in full run |
|---|---|---|
| Waves 1–3 | Learn core, guard, ranged, resource tradeoffs; achieve small visible wins | Short, forgiving |
| Waves 4–6 | First difficult specialization/placement check; initial technology breakthrough | Moderate |
| Waves 7–9 | Formation/era combinations become necessary; encourage a second line of support | Moderate-to-tense |
| Waves 10–12+ | Synergy payoff, counter-rich mixed waves, climactic boss or siege | Fast, tense, satisfying |

In the first five-wave prototype, treat the waves as a **micro-arc**, not a tiny version of every future mechanic: teach, test fast enemies, show economic tension, test armor, then give a mixed/boss-like finale. Do not unlock three eras in five waves merely because the full design mentions eras.

### 5.3 Watch-versus-decide balance

Spectacle is valuable. Forced idle time is not. Support manual next-wave starts, 2× battle speed, and skip/accelerate controls once the battlefield outcome is effectively decided. Consider tactical powers only if they add strategic decisions rather than constant interrupting clicks. Avoid complex real-time repositioning until a controlled experiment shows it improves the core experience. [R13]

---

## 6. Battlefield and living-army combat

### 6.1 Proposed 0.1 and 0.2 spatial model

- Three horizontal lanes, all simultaneously visible at 1280×720.
- Enemies enter at the right boundary, travel left to the Rift Core.
- Defenders are placed on open slots within player deployment territory.
- **Mobile defenders:** During battle, leave their anchor positions to intercept/engage enemies within a bounded zone; obey a maximum leash distance and return or reset between waves.
- **Stationary emplacements:** Remain in place and attack within range or provide area support.
- **Economic structures/units:** Occupy valuable slots but do not directly intercept enemies.
- Avoid initially allowing towers to block a path into an impossible geometry; no dynamic maze/pathfinding MVP.

### 6.2 Why this hybrid may work

An ordinary PvZ-like Guard sitting immobile on the same spot every wave is easy to understand but may lack formation depth. Squadron-like free roaming creates exciting engagements but risks unpredictable pathing. An **anchored engagement-zone** hybrid is the best initial experiment: the player knows where the defender begins and what it can reach, while combat remains alive and physical.

Test three variants using the same units and waves:
- **A: Fixed blockers:** Guards only hold a particular slot (PvZ baseline).
- **B: Leashed fighters:** Guards step forward, intercept within a limited zone, and return (recommended candidate).
- **C: Free fighters:** Guards move more freely inside a lane (higher drama, higher pathing/readability risk).

Score them on: player ability to predict combat, difference made by placement, enjoyment watching the battle, bugs, and ease of understanding. Do not select purely on animated spectacle.

### 6.3 Combat rules recommended for clarity

- Use a **fixed simulation timestep** (e.g., 30 Hz), with rendering interpolating as desired.
- Each entity has ID, lane, anchor, current position, HP/maxHP, role, stats, attack parameters, status effects, and targeting rules.
- Targeting priority should be explicit and inspectable; default can be the nearest enemy threatening the core in the unit's lane/range.
- Melee units select one target, move within attack range, and attack at cooldown intervals.
- When engaged by a blocker, affected enemies stop or slow until the blocker is defeated, depending on enemy behavior.
- Ranged units target enemies according to range and line/lane rules, with predictable projectile travel or hitscan conventions.
- No hidden random targeting behavior during first balance passes. Randomness, if present, uses a recorded seed.
- Use simple soft crowd collision/spacing or deterministic combat slots; do not rely on nondeterministic physics to decide strategy outcomes.
- Restore between waves if the recommendation in §5.1 is accepted; permanent core health persists.
- Clean up all wave entities and effects on restart; no ghosts, doubled spawns, or accumulating listeners.

### 6.4 Formation logic

**A useful opening formation:** Guard forward, Archer behind, Scavenger safely behind but consuming a position/economic budget. The player should see why moving the Guard farther back, or stacking all fighters in one lane, can cause leaks.

Allow meaningful variations: a compact formation that maximizes aura benefits; separated ranged units that avoid splash; concentrated area damage at a chokepoint; a frontline that exposes enemies to a turret kill zone. Avoid fake positional depth where any placement in the same lane gives identical combat results.

### 6.5 Lane interactions: reserve for later

Initial lanes are independent except for a shared core/resource economy. Later cross-lane abilities (artillery supporting adjacent lanes, a scout who relocates, an aura that spans lanes) can create powerful positioning puzzles. Restrict these to a small number of clearly labeled units; otherwise lanes lose their explanatory value.

---

## 7. Economy: the engine of interesting decisions

### 7.1 First prototype: one understandable resource

Use one currency, provisionally **Scrap**, for buying Guard, Archer, and Scavenger. Scavenger generates income in a predictable, visible way. Wave rewards provide enough baseline currency to recover from minor errors. Explain exactly when income arrives.

**Recommended balance model:** Per-wave payout + enemy bounty (optional/simple) + Scavenger income. Consider using **end-of-wave payouts** for the prototype because they are easy to plan around and align with the build phase. If implemented as continuous income, communicate the rate and opportunity cost clearly.

**Illustrative economics only, NOT approved balance:** A Scavenger costing 60 and generating +25 after each completed wave recovers its purchase cost after three payouts. In a five-wave game, this investment is attractive if bought early and much weaker if bought late. This is the kind of clear risk/return we want; actual values require testing.

### 7.2 Prevent dominant economy strategies

Check four possible traps:
1. **Always rush income:** Early defense is too easy; Scavengers become a forced opening.
2. **Never buy income:** Runs are too short, Scavengers return too little, or enemies punish early eco too severely.
3. **Compounding explosion:** Reinvesting income makes late-game power scale faster than waves, eliminating choices.
4. **Unrecoverable death spiral:** One leak reduces income so badly that later waves become mathematically hopeless.

Countermeasures include wave-aware ROI, finite deployment slots, diminishing returns/caps, modest baseline rewards, fair sell/relocation options, and wave budget scaling. Prefer clean rules to hidden rubber-banding.

### 7.3 Research and era progression (later)

Do **not** introduce many currencies early. When enough core strategy exists, add **Research** as a second progression resource earned through defined objectives/milestones and spent to unlock eras or retrofits. The player should be able to understand the tradeoff at a glance: invest now in durable economic/combat improvement or survive with current technology.

Avoid resources that differ only by color. Scrap buys field assets; Research changes what can be built or upgraded. If Research fails to produce distinct decisions, simplify or remove it.

### 7.4 Optional single-player risk contracts (not MVP)

Instead of opponent mercenary sends, allow the player to voluntarily choose additional threats for a reward. Examples: a shielded commander joins the next wave; two runners arrive in another lane; the core cannot use its emergency defense for one round. Contracts should display their risks and rewards **before commitment**, and must be optional. This imports some competitive economic tension into a single-player format without inventing a fake opponent.

---

## 8. Unit design: roles before roster size

Each unit must have a distinct problem it solves, a weakness, clear feedback, and at least one meaningful synergy. Naming and numbers below are proposals, not existing implementation.

### 8.1 Prototype units (already planned)

| Unit | Role | Strength | Weakness | Visible teachable property |
|---|---|---|---|---|
| **Guard** | Melee intercept / frontline | Absorbs damage and slows enemy advance | Low damage; vulnerable to being overwhelmed or bypassed | Shield silhouette; physical blocking; HP bar |
| **Archer** | Single-target ranged damage | Efficient DPS behind protection | Fragile; can struggle against armor or swarms | Obvious arrows and attack line |
| **Scavenger** | Economy | Compounds Scrap income when bought early | Occupies space and purchase budget; little/no combat | Clear payout icon at wave end |

### 8.2 Candidate additions in priority order

| Unit / structure | Distinct job | Strategic interaction | Suitable stage |
|---|---|---|---|
| **Ballista** | Stationary piercing projectile | Hits lined-up enemies; benefits from blockers creating clumps | First expansion |
| **Sapper** | Armor breaking / debuff | Makes Guard+Archer builds more effective against armored waves | First expansion |
| **Field Medic** | Sustained healing/support | Makes frontline more durable, but vulnerable if exposed | First expansion |
| **Blast Cannon** | Area damage | Strong against swarms, slow against singular elites | Era II |
| **Mechanist** | Repair/buff machine structures | Encourages a mechanical sub-build | Era II |
| **Steam Guardian** | Tank retrofit | Old frontliner receives industrial armor; becomes durable but slower | Era II |
| **Pulse Tower** | Chain energy / control | Counters clustered enemies; weaker into special insulation | Era III |
| **Rail Sniper** | Long-range armor-piercing specialist | Strong versus bosses, inefficient against numerous weak enemies | Era III |
| **Time Binder** | Slow/temporal disruption | Buffs area-damage synergies, countered by temporal resistance | Era III |

**Rule:** Do not add a unit unless its addition creates a new decision, counter, or synergy that existing units cannot provide. A unit that is merely “Archer but +20% DPS and +50% cost” is probably an upgrade tier, not a new archetype.

### 8.3 Upgrades: choices, not pure accumulation

Each major unit might have **two functional paths**, initially two tiers deep. For Archer:
- **Volley branch:** More projectiles / splash / better against crowds, weaker single-target efficiency.
- **Piercer branch:** Armor penetration and strong elite damage, worse crowd handling.

For Guard:
- **Bulwark branch:** Extra HP/taunt/area mitigation; immobile or slow.
- **Counterstrike branch:** Reflect/counter damage when hit; less raw protection.

For Scavenger:
- **Yield branch:** More income, greater defensive risk and slot cost.
- **Utility branch:** Smaller income boost plus nearby support/repair.

**Later era retrofits** can combine prior specializations with era tech, but should not give every unit every capability. A retrofitted Archer should not automatically become the best AoE, boss damage, and support unit simultaneously.

**Upgrade rule of thumb:** Every notable upgrade must change at least one of: targeting behavior, damage profile, control effect, survivability role, lane interaction, resource decision, or visual behavior. Raw-stat upgrades can supplement, not dominate.

---

## 9. Enemy design and fair counterplay

### 9.1 Prototype enemy archetypes

| Enemy | Readable tell | Challenge | Useful response |
|---|---|---|---|
| **Grunt** | Plain silhouette | Baseline pacing/damage | Any balanced formation |
| **Runner** | Lean silhouette + rapid movement | Reaches the core before slow builds respond | Early engagement / ranged coverage / control |
| **Armored** | Obvious plating | Resists weak basic attacks | Piercing/armor-break/sustained damage |

### 9.2 Candidate later behaviors

- **Swarm:** Many fragile enemies; tests AoE and targeting throughput.
- **Leaper:** Skips first blocker or leaps a fixed distance; tests layered placement.
- **Banner Carrier:** Buffs nearby enemies; creates target-priority puzzles.
- **Saboteur:** Disables a turret briefly after a visible windup; encourages redundancy.
- **Flying enemy:** Avoids melee interception but can be attacked by designated ranged units; only introduce when relevant tools are available.
- **Regenerator:** Heals between attacks; asks for focus fire or anti-heal.
- **Shielded elite:** A visible temporary shield; asks for sustained or specific damage.
- **Boss:** Multiple stages or an interesting signature attack, not merely 30× health.

### 9.3 Counter design rules

1. Show an enemy's special behavior before it causes an irreversible loss, or warn in the wave preview.
2. **Prefer soft counters initially.** An Armored enemy taking reduced Archer damage is understandable; “immune to all accessible attacks” is not.
3. If a hard counter is introduced, give at least two attainable responses or a reasonable sell/upgrade option.
4. Use consistent shape/color/icon conventions plus text tooltips; color alone cannot communicate the threat.
5. Distinct enemy types should change placement, composition, specialization, or ability timing.
6. Limit simultaneous new enemy concepts: teach individually, then combine to test mastery.
7. After a leak, show which lane/behavior contributed to the failure.

### 9.4 Proposed five-wave MVP sequence

| Wave | Main purpose | Enemy composition (illustrative) |
|---|---|---|
| 1 | Teach placement and basic attack resolution | Slow Grunts in one lane |
| 2 | Teach multi-lane coverage and early speed | Grunts plus a few Runners |
| 3 | Test economy-vs-defense | Moderate mixed threat across lanes |
| 4 | Introduce armor and counter-preview | Armored + Grunts, with accessible responses |
| 5 | Test complete basic toolkit | Mixed lanes and one mini-boss/elite |

Do not bake exact counts into this document. Calibrate numbers after baseline simulations.

---

## 10. Era progression: the signature long-term system

### 10.1 Proposed three-era framework

- **Era I — Frontier / Primitive:** Shields, bows, improvised defenses, resource salvaging. Clarity and fundamentals.
- **Era II — Industry / Steam:** Armor, gears, artillery, repair, mechanization, larger battlefield control.
- **Era III — Rift / Future:** Energy shields, precision weapons, temporal effects, cross-era transformations.

The core fantasy is **not** “replace every primitive soldier with a futuristic equivalent.” It is “compose an army using both modern breakthroughs and unexpectedly useful older specialists.”

### 10.2 Example cross-era chains

- Guard → Bulwark Guard → Steam Guardian → **Chronoguard** (personal field shield, holds a line for limited bursts).
- Archer → Piercing Archer → Mechanical Repeater → **Rail Sniper** (long reach, devastating against elites).
- Ballista → Steam Launcher → **Guided Bolt Platform** (retains piercing geometry while tracking moving targets).
- Scavenger → Foundry Recycler → **Temporal Salvager** (resource income with a tactical support tradeoff).

These examples are conceptual; game balance may suggest different final identities.

### 10.3 Constraints that make evolution interesting

- Research is a scarce decision, not a compulsory every-four-waves button.
- Retrofitting retains certain investments or niches rather than fully refunding/invalidating everything.
- Higher-era units may be stronger per slot but expensive, slower to build, less synergistic with particular earlier-era structures, or specialized in different ways.
- Old units need genuine late-game roles (cheap blockers, aura carriers, efficient swarms, debuff enablers) or a valid retrofit path.
- A technology choice should be visible immediately in combat, appearance, sound, and new strategy.

### 10.4 Experiments to validate before expansion

1. **Fixed-era schedule vs. player-directed advancement:** Does choice create strategy or only trap inexperienced players?
2. **Replacement vs. retrofit:** Do players enjoy keeping an old core army and adapting it?
3. **Two branches vs. three:** Do additional choices increase distinct strategies enough to justify the complexity?
4. **Research earned by waves vs. generated by structures:** Which creates better economic tension without a runaway engine?
5. **Ages within one match vs. across campaign:** Does the entire evolution arc fit comfortably in the target match length?

---

## 11. The single-player experience: campaign, challenges, and replayability

**First obligation:** A standalone run should be satisfying without unlocks, daily tasks, or multiplayer. A player who plays one session should have a complete experience.

**Later content structure:**
- **Campaign/map progression:** New maps introduce a mechanic (split lane, turret vantage point, hazard), then combine it with previous knowledge.
- **Challenge contracts:** Optional, transparent risk/reward variations.
- **Difficulty settings:** Prefer understandable changes in enemy compositions/timings and limited economy pressure rather than opaque huge HP multipliers.
- **Endless mode:** A score-chasing option once normal wave tuning is stable.
- **Draft/roster mode:** Optional pre-match selection that varies available units/tech but does not trap beginners with unwinnable combinations.
- **Lightweight meta unlocks:** New tools and cosmetic variety rather than mandatory permanent power upgrades that make early balance irrelevant.

**Replay should come from three questions:** Could I build a better formation? Could I take a greedier economic line? What if I chose the other specialization or era retrofit?

**Avoid:** A campaign that requires repeating trivially easy levels; random drops that determine whether a run can be won; hidden systems; click-intensive maintenance; monetization mechanics that suppress player agency.

---

## 12. User experience, legibility, onboarding, and game feel

### 12.1 Screen layout for initial 1280×720

- **Top:** Core HP, Scrap, wave number, next wave summary, pause/speed.
- **Center (~70%+):** Entire battlefield visible without camera scrolling; all lanes, spawn side, enemy paths, core, range/engagement overlays on selection.
- **Bottom:** Unit purchase bar showing role, price, hotkey and availability; selected slot placement preview.
- **Context panel:** Unit stats, upgrade branches, targeting behavior, sell/refund rules; collapsible for small screens.
- **Battle end:** Brief report—core damage, total leaks, income, notable effectiveness/counters, next wave preview.

### 12.2 Teach with visuals

- Guard silhouette: broad, defensive posture and clear shield impact.
- Archer: obvious attack line, quick attack rhythm, low-HP silhouette.
- Scavenger: visible salvage collection animation and wave-end currency payout.
- Runner: speed trail and narrow silhouette.
- Armored: plating and a distinct armor feedback effect.
- Emergency power: concise cast indication and result.

Use short hints in place: “Guard blocks enemies,” “Archer attacks from behind,” “Scavenger pays next wave.” Avoid tutorial popups that obscure the first attack. Add more detailed tooltips for players who want precise numbers. [R5, R14]

### 12.3 Delight that respects readability

- Short hit flashes, recoil, distinctive but restrained impact sounds, projectile trails, clean death effects.
- Clear unit upgrade transformation, satisfying wave-clear transition, celebratory new-era stinger.
- Mild humor in original unit animations (Scavenger lugging absurdly large scrap, frantic repairer trying to hold a turret together).
- Distinguishable audio for warnings, income, leaks, big hits, new enemy mechanics.
- Frequent tiny payoffs without oversaturating sound or particles.
- Allow pause, mute, animation settings, and reduced flashing; support keyboard/mouse access.

### 12.4 Failure explanation

An ideal results panel says **what happened**, not just “Defeat.” Examples:
- “Lane 2 leaked 4 Runners; ranged damage started too far back.”
- “Armored units absorbed 60% of basic-arrow damage.”
- “Two Scavengers repaid their investment by wave 4; a third did not.”

These require telemetry and truthful calculations. If reliable diagnosis is unavailable, show transparent raw data rather than fabricated advice.

---

## 13. Balancing methodology: quantitative + human playtests

### 13.1 What “balanced” means for Riftfront

Balanced does **not** mean every unit has equal DPS per Scrap or every strategy wins half the time. It means:
- Multiple **meaningfully distinct** strategies can succeed.
- Strong units have identifiable costs, limitations, or counters.
- The economy produces a real greed-versus-survival tradeoff.
- An informed player can anticipate major threats and recover from small errors.
- Different waves challenge different aspects of a build.
- Losses are sufficiently explainable that players learn from them.
- Difficulty feels earned, not arbitrary.

The balancing literature emphasizes multiple viable strategies and avoiding dominant choices that eliminate real decisions. [R15]

### 13.2 Metrics to log per wave

**Mechanics and outcomes:**
- Seed, version/build hash, difficulty/map, wave ID, time, result.
- Enemy spawns by type and lane; enemies killed; leaks/core damage by lane/type.
- Unit placements, anchor positions, purchases, upgrades, sells and timings.
- Unit damage dealt/taken, time spent attacking, target choices, deaths, prevented leaks.
- Resource balance over time, generator income, baseline income, spending, unspent currency.
- Simulated performance (frame count/tick stability) and fatal exceptions.

**Player-experience measures (from opt-in playtests):**
- Whether players understood each unit and next wave without explanation.
- Whether they could explain a leak.
- Whether repositioning visibly helped.
- Whether they voluntarily replayed and tried a new strategy.
- Where they felt bored, confused, or unfairly punished.

Use local development logs and opt-in test captures initially; do not build a production data collection pipeline prematurely.

### 13.3 Useful derived measures

- **Effective DPS:** Damage applied to useful targets over attack-active time; distinguish wasted overkill and idle range time.
- **Survival contribution:** Damage absorbed, time enemies were blocked, allies preserved.
- **Economy ROI:** Cumulative Scavenger-generated income / its purchase price, wave by wave; also account for a slot and missing defensive power.
- **Leak pressure:** Core damage per wave by lane and enemy archetype.
- **Build diversity:** Number of materially different openings that reliably win on intended difficulty.
- **Counter effectiveness:** Changes in outcomes when adding an armor-breaker, AoE unit, or repositioning a Guard.
- **Decision value:** How often a new upgrade is chosen and whether it changes actual play; low selection can mean weak design, bad explanation, or poor context.

Do not equate simulations with fun. Use simulations to expose systemic imbalance and human playtesting to assess the experience.

### 13.4 Suggested headless balance harness

Build a scenario runner that can:
1. Load a deterministic map/wave seed and versioned content data.
2. Apply a build script (placement, upgrades, buys at wave boundaries).
3. Simulate each tick without Phaser rendering.
4. Emit an outcome object and per-wave metrics in JSON.
5. Repeat across several seeds and parameter sets.
6. Compare two versions of unit/wave tables to catch regressions.

**Automated scenarios:**
- Guard-heavy opening.
- Archer-heavy opening.
- Economy rush with early Scavengers.
- Balanced Guard/Archer opening.
- Economy-light conservative defense.
- Deliberately bad placement (should perform worse than good placement).
- Armor-counter specialization on armored wave.
- Swarm-counter specialization on swarm wave (once implemented).

**Provisional quality gates for playtesting, not universal balance truths:**
- On beginner difficulty, a reasonable novice build should often survive early tutorial waves.
- A balanced build and at least one specialized build should be capable of completing the full current run.
- Risky high-economy opening should sometimes succeed with good choices and fail with mistakes; not reliably dominate.
- Changing one placement or specialization should cause a detectable outcome shift in constructed test cases.
- No common build should win by literally doing nothing after the early waves.
- If a reasonable player loses to a new enemy property, the warning/counter should have been accessible.

### 13.5 Balance levers and mathematical sanity checks

Tune one variable family at a time:
- Economy: starting currency, income per wave, generator payback, sell/refund rate, placement slots.
- Defense: HP, mitigation, blocking capacity, engage range, attack interval, projectile damage, range.
- Waves: number of spawns, lane distribution, spacing, speed, HP/armor, composition.
- Progression: technology cost, upgrade price, powers, retrofit opportunity cost.

Sanity-check **time to kill** versus **time to reach the core**. A straightforward baseline is:

`effective_ttk ≈ enemy_effective_HP / useful_team_DPS`

This is only an approximation: staggered spawns, target switching, block time, AoE, overkill, armor, range, and movement often dominate outcomes. Do not balance solely on raw HP/DPS ratios.

### 13.6 Test design as experiments

For an unresolved mechanic, write a hypothesis, set up two conditions, and collect both objective and subjective results. Example:
- Hypothesis: Leashed fighters create more meaningful positioning than fixed blockers without hurting clarity.
- Same map, five waves, units, economy; change only movement model.
- Record core damage, composition effectiveness, placement sensitivity, player understanding, and preference.
- Pick based on the result, not the most impressive GIF.

---

## 14. Technical architecture for reliable vibecoding

### 14.1 Stack and constraints

- **Engine:** Phaser 4 as selected for browser-first 2D.
- **Language/build:** TypeScript, Vite, npm.
- **Editor/agent:** VS Code + Codex CLI/extension.
- **Testing:** Node's built-in test runner covers the compiled headless simulation. Use browser smoke tests for rendering and controls.
- **Version control:** Git, frequent coherent commits.
- **Deployment:** Static HTML5 build initially; later itch.io/GitHub Pages/own hosting as appropriate.

Official Phaser docs support TypeScript and browser-first development. [R16]

### 14.2 Separate simulation from presentation

**Simulation (no Phaser dependencies):**
- Authoritative state: enemies, defenders, positions, health, resources, wave state, upgrades, game phase.
- Command handlers: purchase, place, upgrade, start wave, use ability, pause/speed if simulation-relevant.
- Systems: movement/engagement, targeting, combat, statuses, enemy spawns, rewards, wave resolution.
- Fixed timestep, deterministic seed, replayable commands/events, versioned data.
- JSON or TypeScript data definitions validated by schemas/runtime checks.

**Presentation (Phaser):**
- Scene layout, sprite creation, animation, effects, UI, audio, input, camera scale.
- Reads simulation state and events; sends validated player commands.
- Does not own hidden unit HP, money, or damage rules.

**Testing/tools:**
- Headless test runner for wave and economy scenarios.
- Debug overlay showing target, lane, range, DPS, status, and seed.
- Structured logs, scenario fixtures, validation of invalid content.

### 14.3 Suggested modules (adapt to existing project, never force a rewrite)

```text
src/
  simulation/
    GameSimulation.ts
    GameState.ts
    commands.ts
    systems/{Combat,Targeting,Movement,Waves,Economy,Upgrades}.ts
    data/{units,enemies,waves,upgrades}.ts
    rng.ts
  game/
    scenes/{Boot,Menu,Battle,Results}.ts
    render/{EntityRenderer,Effects}.ts
    ui/{Hud,SelectionPanel,WavePreview}.ts
    input/{PlacementController}.ts
  tests/
    simulation/*.test.ts
    balance/scenarios/*.ts
public/assets/
docs/
  GAME_DESIGN.md
  ROADMAP.md
  RIFTFRONT_GAME_DESIGN_RESEARCH_AND_AGENT_CONTEXT.md
AGENTS.md
```

### 14.4 MVP minimum automated tests

- Enemy moves left on correct lane, reaching core when not stopped.
- Guard blocks/engages according to rules; Archer only attacks valid in-range targets.
- Attack cooldown and damage application are consistent across frame rates.
- Armor resistance is correctly applied; no negative health weirdness.
- Scavenger payout occurs at the documented time, exactly once.
- Cannot purchase without sufficient Scrap or place on an invalid tile.
- Wave completes only when spawns finish and no active enemies remain.
- Victory after final wave; defeat at zero core HP; restart fully resets state.
- Same seed + commands produce the same simulation outcome.
- Selling/upgrading does not duplicate entities, resources, or event handlers.

### 14.5 Multiplayer-ready, but not multiplayer-owned

The architecture should later allow a server to run the simulation and accept player commands. That means no gameplay logic buried inside a sprite animation callback, no reliance on `Math.random()` when deterministic outcomes matter, no browser UI as the sole source of game state, and no hand-coded PvP send logic during MVP. Avoid building servers or networking now; correct separation is sufficient.

### 14.6 Stable agent workflow

1. Read this document and project-specific `AGENTS.md`/current game design.
2. Inspect current code and tests; report actual state rather than assuming everything requested was implemented.
3. Propose a **single small improvement**, the intended behavior, and acceptance tests.
4. Implement within existing architecture; prefer edits to a few modules over cross-project rewrites.
5. Run type-check, tests, build, and a browser smoke test when available.
6. Describe player-visible effect and any unresolved issues; do not claim visual success from unit tests alone.
7. Add a screenshot or short recorded run only if the tooling actually supports it and rights are clear.
8. Commit or prepare a coherent diff with a descriptive message.

**Never:** Delete or rewrite stable gameplay to satisfy an abstract design document; add large dependencies by default; silently change resource rules; fabricate test outcomes; implement multiplayer simply because it is mentioned; pad the feature count; copy assets/code from proprietary reference games.

---

## 15. Original milestone acceptance criteria

For current priorities, use the [roadmap](ROADMAP.md).

### P0 — Finish and verify prototype 0.1

- [ ] Game starts and fits browser viewport.
- [ ] Guards, Archers, Scavengers can be placed with visible prices and valid positions.
- [ ] Three enemy archetypes spawn in correct lanes across five distinct waves.
- [ ] Basic economy works and is not double-awarded.
- [ ] Auto-combat results are deterministic enough to reason about.
- [ ] Wave end, victory, loss, and restart all work.
- [ ] `npm run build` and simulation tests pass.
- [ ] Developer has personally played at least one full run and logged 3–5 concrete annoyances.

**Release gate:** Working browser match, not necessarily beautiful or deeply balanced.

### P1 — Make placement and strategic decisions meaningful

- [ ] Show placement anchors, range/engage overlay, attack priorities, and target behavior.
- [ ] Test fixed vs. leashed Guard using identical scenarios.
- [ ] Add next-wave preview (main threats and lanes).
- [ ] Build at least two distinct viable first-three-wave openings.
- [ ] Add results breakdown for leaks/core health and economy.
- [ ] Capture simple logs for automated balance runs.

**Release gate:** Changing placement or an economy choice produces a recognizable, explainable strategic consequence.

### P2 — Give the game a distinct signature

- [ ] Add one stationary turret and one support/debuff option.
- [ ] Add two functional upgrades for one or two units.
- [ ] Introduce one era transition with an original visual and tactical change.
- [ ] Keep earlier-era unit relevant via a meaningful retrofit.
- [ ] Add one new enemy behavior requiring a new response.
- [ ] Test that both upgrade branches can be useful in plausible scenarios.

**Release gate:** A player can describe what makes Riftfront different from ordinary tower defense and demonstrate that difference during play.

### P3 — Full single-player vertical slice

- [ ] Extend to a satisfying 12–15-wave arc only if pacing supports it.
- [ ] Complete three-era structure, selected branching retrofits, specialized enemies/boss.
- [ ] Add presentation style, meaningful sound effects, smooth transitions, clear tutorial.
- [ ] Tune multiple viable strategies on an intended normal difficulty.
- [ ] Add pause/speed, settings, run results, and sensible onboarding.
- [ ] Conduct human playtests with new players and record confusing interactions.

**Release gate:** Repeated solo play feels fun, fair, visually satisfying, and strategically variable.

### Not approved for current build

- [ ] Network multiplayer, ranked matchmaking, paid monetization, dozens of factions, extensive crafting, accounts, live-service features, large procedural campaigns, or full three-path/five-tier upgrades.

These may be considered later, but are explicitly **out of scope** now.

---

## 16. Decisions the developer and agents should revisit explicitly

These are not blockers to the current MVP, but they require evidence before the design becomes too rigid:

1. **Combat identity:** Fixed blockers, leashed living fighters, or free movement? How different is the experience during play?
2. **Lane count:** Does three-lane play provide enough tactical pressure? Would five lanes add strategic depth or just more monitoring?
3. **Wave interaction:** Can players place/upgrade during combat, or are all purchases only between waves? Does that support the intended “plan, then watch” loop?
4. **Defender persistence:** Restore fighters after a wave, carry their damage, or permanently lose casualties? Which makes army investment feel better?
5. **Economy timing:** Per-wave payouts or continuous income? Which is easier to learn and harder to exploit?
6. **Era progression:** Player-triggered unlock, scripted milestone, or choice at wave checkpoints?
7. **Depth model:** Upgrade branches, cross-era synergies, different maps, or roster drafts—which produces the most fun per development hour?
8. **Commander agency:** Is a limited emergency power enough, or is real-time control genuinely better for solo play?
9. **Difficulty and recovery:** How punishing is a leak; what lets a good player recover from a mistake without turning failure into a joke?
10. **Art direction:** Clean cartoon vector/pixel-flavored original sprites; what maximizes readability at small scales and supports fast asset production?

A decision should be recorded in `docs/GAME_DESIGN.md` only after being adopted. Experiments and discarded alternatives can be recorded in a design log.

---

## 17. Research sources and reading order

Sources were checked on **2026-11-22**. The list prioritizes official listings, developer statements, primary documentation, and thoughtful developer analyses. Live game version details can change; the principles here are more durable than exact unit statistics. Game mechanics attributed to sources are **not** a license to copy proprietary content.

- **[R1] Squadron TD — SC2 Arcade map description and tactical instructions.** https://sc2arcade.com/map/1/331020/  
  Useful for living towers, gas/income tradeoff, enemy sends, and placement guidance.
- **[R2] Squadron TD Wiki — overview and modes.** https://squadtd.fandom.com/wiki/Squadtd_Wiki  
  Community-maintained; valuable mechanics background but may reflect older balance versions.
- **[R3] Legion TD 2 — official game manual.** https://beta.legiontd2.com/manual/  
  Explicit fighter reset, attacks/armor, workers, income, waves, economy, and strategic depth.
- **[R4] George Fan's retrospective thread about PvZ prototypes.** https://threadreaderapp.com/thread/1125116354434985984.html  
  First-person explanation of simplifying maze-building into lanes and simplifying resource collection.
- **[R5] GDC 2012 — George Fan's PvZ tutorial-design talk, covered by Game Developer.** https://www.gamedeveloper.com/design/gdc-2012-10-tutorial-tips-from-i-plants-vs-zombies-i-creator-george-fan  
  Teaching through play, fewer words, visuals, adaptive messaging, reducing noise.
- **[R6] George Fan interview — Gamezebo.** https://www.gamezebo.com/news/interview-with-plants-vs-zombies-creator-george-fan/  
  Readable economy and early design tradeoffs (access may depend on source availability).
- **[R7] Bloons TD 6 — official Steam product description.** https://store.steampowered.com/app/960090/bloons_td_6/  
  Tower classes, three upgrade paths, activated abilities, content diversity and replay modes.
- **[R8] BTD6 upgrade system overview.** https://teemo.dev/game-design/bloons-td-6/systems/towers-and-upgrade-paths/  
  Third-party mechanical analysis; includes crosspath constraints and design consequences.
- **[R9] BTD6 damage interactions (community reference).** https://bloons.fandom.com/wiki/Damage_Types  
  Illustrates enemy properties and differentiated damage/targeting; not a specification for Riftfront.
- **[R10] Age of War — original developer's Kongregate listing.** https://www.kongregate.com/en/games/louissi/age-of-war  
  Five ages, units/turrets and simple evolution premise.
- **[R11] South Park: Let's Go Tower Defense Play! — South Park Wiki.** https://southpark.cc.com/w/index.php?title=Let%27s_Go_Tower_Defense_Play%21  
  Controlled characters, active powers, tower gameplay and multiplayer identity.
- **[R12] Contemporary review of South Park TD — Destructoid.** https://www.destructoid.com/review-south-park-lets-go-tower-defense-play/  
  Particularly useful criticism about solo character micromanagement and weak clarity.
- **[R13] Stardock development journal — what makes a good tower defense game.** https://www.stardock.com/games/article/495008/siege-of-centauri-dev-journal-what-makes-a-good-tower-defense-game  
  Enemy/tower/map variety, meaningful consequences, pacing, presentation and replayability.
- **[R14] Defender's Quest developer analysis — optimizing TD for focus and thinking.** https://www.gamedeveloper.com/design/optimizing-tower-defense-for-focus-and-thinking---defender-s-quest  
  Emphasis on all-on-screen maps, stats transparency, decision focus, and readable fairness.
- **[R15] Design 101: Balancing Games — Game Developer.** https://www.gamedeveloper.com/design/design-101-balancing-games  
  Practical concept of avoiding dominant strategies that eliminate meaningful choices.
- **[R16] Phaser 4 official documentation.** https://www.phaser.io/oss/docs  
  Confirm the current API and integration patterns before implementation.

**Suggested reading order for gameplay agents:** R1 → R3 → R4 → R5 → R7/R8 → R10 → R12 → R13/R14 → R15.  
**Suggested reading order for coding agents:** This document §§1, 4, 6–7, 13–15 → existing project code and tests → R16 only for framework questions.

---

## 18. One-page permanent brief for future coding agents

**Project:** Riftfront: Ages Under Siege. An original single-player, browser-based HTML5 tower defense with future multiplayer potential.

**Gameplay:** The player places fighters, towers, and economic assets on a compact lane battlefield. Defenders fight automatically during waves. The player manages economy, formation, enemy counters, unit upgrades, and eventually technological eras and retrofits.

**Main inspiration hierarchy:** Squadron TD's formation and income decisions; PvZ's readability and compact lanes; BTD6's specialization and upgrade choices; Age of War's era evolution; South Park TD's personality and occasional active powers. Legion TD 2 is important competitor research.

**Primary measure of success:** A player can understand the game quickly, make several meaningful tactical/economic choices, see their consequences, and want to replay with another plan. A balanced game has multiple viable strategies, predictable mechanics, and explainable failures; it does not merely have equalized DPS numbers.

**Current build priority:** Stabilize the three-lane, five-wave Guard/Archer/Scavenger Phaser+TypeScript prototype. Do not automatically create all three eras, PvP, a giant roster, or elaborate systems. Audit actual implemented code before making changes.

**Engineering constraints:** Deterministic headless simulation, Phaser rendering/UI separate from game rules, data-driven units/waves, fixed timestep, automated tests for the core rules, and reproducible battle scenarios. Review all repository instructions and preserve working implementation.

**Design constraints:** Readable threats; clear lane/core state; no unfair surprise hard-counters; no compulsory active micro; useful formation placement; understandable investment tradeoffs; a future progression path where older units can remain relevant through specializations and retrofits.

**Operating rule:** Implement one small, testable gameplay improvement at a time. Every feature request should answer: **What new interesting decision does this add? How will we know it is fun and balanced? What could it make worse?**

**Immediate next milestone:** Observe new players through a complete match and use their feedback to refine formation clarity and economy decisions.

---

*End of document. Research and proposed design by ChatGPT, 2026-11-22. The actual codebase and playtests take precedence over unverified implementation assumptions.*
