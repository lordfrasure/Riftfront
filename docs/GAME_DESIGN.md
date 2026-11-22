# Riftfront: Ages Under Siege

Form a three-lane garrison, survive ten assaults, and kill the Rift Colossus before it reaches the core. Each wave starts when you give the order. Review the incoming lineup and prepare for the threats that matter in each lane.

## Briefing and debrief

Review the Unit Collection for recruit costs, roles, combat stats, and available retrofit branches. Begin siege opens the formation board and the first wave forecast. Returning to the briefing during an active siege freezes the match. Use Return to siege to continue it. The debrief shows the outcome, cleared waves, enemies defeated, routed defenders, and remaining scrap, with options to replay or return to the briefing.

## The match

- Begin in the Ember Age with 120 scrap and 100 core integrity. Each lane has four pads. The core is on the left and the rifts are on the right.
- Recruit a defender, then select an empty pad. Hover or focus the pad to preview forward reach, including a melee defender’s advance. Inspect an occupied pad to see its stats and orders.
- Guards and their retrofits advance toward live enemies within a fixed leash. Ranged damage dealers can step forward a little to acquire a target. Closest enemies normally take priority. Enemy melee stops at the first reachable defender, while ranged enemies can engage from farther out.
- Routed defenders lose their contribution for the wave. After a successful defense, all defenders rally to their pads at full health. Core damage persists. A battle that reaches 35 seconds enters overtime. Enemies deal 8 more damage per hit, rising by another 8 every five seconds until the wave resolves.
- Kills and wave grants pay scrap. Later kills pay smaller bounties as the enemy count rises. A surviving Scavenger pays 11 scrap per completed wave, with a match limit of two Scavengers. Battle duration does not change salvage.
- Redeploy a defender to an open pad for 8 scrap, including across lanes. Retiring returns one third of the base recruit price, rounded down. Retrofit spending has no resale value.
- Starting at wave 4, advancing to the Coil Age costs 36 scrap and unlocks Coilcasters and permanent retrofits for Guards and Archers. You can delay the purchase to reinforce a lane first.
- The wave report lists defeated enemies, routed defenders, scrap by source, and core damage by lane. Pause stops the simulation and its combat animations. The 2× toggle advances the same fixed ticks faster. Sound is optional.

## Defenders

| Defender | Scrap | Job |
| --- | ---: | --- |
| Guard | 34 | Leashed melee interceptor. Keeps ranged fire and healing behind the line. |
| Archer | 40 | Consistent single-target damage. Works best with an interceptor holding enemies in reach. |
| Scavenger | 32 | Invests a pad and immediate scrap for future income. Keep it behind the fighting. |
| Cinder Lobber | 50 | Throws a slow shell that hits nearby enemies. Strong against packs converging on a Guard. |
| Mender | 39 | Heals the lowest-health-percentage ally in range in its lane. Routed defenders cannot be healed during combat. |
| Coilcaster | 58 | Slows movement and reduces armor by 7 for follow-up hits. Coil Age recruit. |

| Base | Retrofit | Scrap | Change |
| --- | --- | ---: | --- |
| Guard | Bastion | 48 | Extra health and armor, shorter advance. Keeps fights close to the supporting formation. |
| Guard | Vanguard | 48 | Longer advance and sweeping melee hits. Clears clusters quickly and risks moving beyond support. |
| Archer | Volley | 47 | Fast fire punishes light enemies or targets exposed by a Coilcaster. |
| Archer | Longshot | 47 | Heavy shots pierce 12 armor and prioritize the enemy with the highest maximum health in range. |

## The siege

| Enemy | Pressure |
| --- | --- |
| Raider | Straightforward melee infantry that rewards an early interceptor. |
| Skitter | Rushes in packs. Use splash or rapid arrows. |
| Iron Ram | Has 10 armor and a strong opening charge. Use an armored front and armor-piercing attacks. |
| Spitter | Fires from outside melee range. Use long-range fire or let a protected front close the distance. |
| Herald | Gives nearby allies 5 armor. The aura is visible around it. Longshot or armor exposure can keep its escorts from stalling a lane. |
| Rift Colossus | The final center-lane boss. Marks a circular area before a crushing blast. Spread support behind the line and reserve a way through its plate. An unblocked Colossus destroys the core. |

The opening introduces coverage and clustered rushes, then single armored threats and ranged fire. Protected armor, sustained ranged waves, and a heavily contested center follow. The final assault sends the Colossus through the center while the outer lanes face separate attacks.

## Implementation and verification

The simulation advances every 50 ms and uses typed build orders, deterministic target ordering, and data-defined wave schedules, profiles, and retrofits. Phaser interpolates successive tick positions and renders the read-only match view. The [art manifest](ART_PIPELINE.md) supplies shared portraits and layered battlefield rigs. Typed effects drive attack gestures, hit reactions, falling units, projectiles, boss bursts, and optional synthesized audio. HTML controls handle keyboard and touch orders.

Run `npm test` for simulation mechanics and regression runs. Run `npm run balance -- --sweep` for named campaigns plus 32 branch and support combinations and runs with one defender kind removed at a time. The harness reports leaks, duration, routed defenders, and income. Its scripted purchases are a comparative baseline and do not measure how well a new player discovers the counters.
