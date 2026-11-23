# Riftfront development plan

The [core gameplay expansion](specifications/CORE_GAMEPLAY_EXPANSION.md) controls the next gameplay milestones. The [experience overhaul](specifications/GAME_EXPERIENCE_OVERHAUL.md) remains the product direction.

## Repository assessment

Milestone 1 shipped the illustrated battlefield, layered fighter rigs, collection, briefing, planning controls and debrief. Reuse those systems and the typed, fixed-tick simulation. The current campaign has ten waves, four pads per lane, six recruits and four Coil retrofits. The board limits support placement and the retrofit system has no early choices, fusion or positional links.

| Milestone | Scope | Acceptance |
| --- | --- | --- |
| 2A. Expanded battlefield and first evolution systems | Compare three layouts, expand formations, add two recruits, three construct branches, two fusions and two positional links. | Complete the ten-wave siege with at least two different formations. Verify purchases, ability behavior, responsive controls, deterministic combat, production build and balance sweep. Stop for playtesting. |
| 2B. Roster and combination expansion | Build toward 10–12 recruits, four to six fusions, more branches and at least four synergies. Candidate roles include mobile interception and temporary construct deployment. | Validate each addition against existing counters and test winning formations that use different combinations. |
| 2C. Strategic refinement | Tune enemies, formations, economy and pacing using playtest evidence. | Verify counterplay, discovery and variety with desktop and touch playtests. |
| 3. Profiles and progression | Versioned local saves, XP, achievements, unlocks and mastery after gameplay stabilizes. | Test migration, corruption recovery and exactly-once rewards. Keep a fresh profile viable. |
| 4. Replayability | Optional onboarding and challenges informed by playtesting. | Verify discovery and meaningful challenge variation. |

## Milestone 2A layout decision

Use three lanes and seven pads. Six pads keep the same lane workload and offer slightly larger touch targets, but leave less room to separate reserves from the healing and boss-blast bands. Seven pads retain all three existing threat fronts and allow frontage, adjacent pairs and rear reserves to coexist. A fourth lane increases coverage spending and reduces vertical space for rigs and telegraphs. Compare the alternatives with the same enemy and income budget in the headless harness. Keep ten waves so the new early Ember choices, Coil transition and boss spread test fit the existing campaign length.

## Milestone 1 delivery

The briefing, unit collection, settings, battle controls, inspector, and campaign debrief now share a visual system. The [art pipeline](ART_PIPELINE.md) documents scene art, all 16 fighter variants, and the layer rig. The simulation change adds actor IDs to fall effects so presentation can animate the correct unit.

- `npm test` passed all 9 existing tests. The production build passed with Vite's large-chunk warning.
- `npm run balance -- --sweep` matched the pre-milestone output byte for byte. Economy, balanced, and artillery won their named runs. Bastion won all 16 branch combinations in the sweep, while Vanguard won 5 of 16. Treat that disparity as a Milestone 2 playtest and tuning input.
- Chromium smoke testing used the production build at 1440 × 900 and a touch viewport at 390 × 844. The scripted campaign reached wave 10 victory at 100 core, matching the headless core and scrap at every wave. Checks covered keyboard range preview and placement, inspection, redeploy, retrofits, pause, speed, sound toggle, collection and settings, replay, restart, defeat, return to briefing and touch placement. Screenshots were captured for planning, battle and outcomes.
- The next gate is a human playtest. Evaluate whether players can identify roles under pressure, understand available orders, and find the next wave forecast and the debrief.

## Milestone 2A delivery

The production siege uses three lanes × seven pads. The simulation and board share layout coordinates. Lane-count alternatives run the same ten-wave enemy and income budget in the headless harness. The four-lane variant moves alternating third-lane spawns to the extra flank.

| Layout | Named wins | Observations |
| --- | ---: | --- |
| Three × six | 8 / 8 | Wider spacing makes pads easier to hit. The Relay policy reached 128 boosted actions. |
| Three × seven | 8 / 8 | The tighter pitch left space for a relay between ranged attackers and separate rear reserves. The Relay policy reached 154 boosted actions. |
| Four × six | 5 / 8 | The extra flank required more coverage purchases. Shorter lane spacing also leaves less room for tall rigs and telegraphs. |

The ten-wave campaign now starts with 128 scrap, adjusts the first two clear grants and adds an earlier center Skitter to the second assault. Vanguard has more durability and a slightly shorter leash. The Colossus blast reaches adjacent pads and encourages spacing fragile support behind the frontline.

The seven-pad runs finished with 100 core for the economy, ranged, Relay, and two-fusion policies, 88 for Anchor Frame, 83 for Ash Mortar and disruption, and 50 for aggressive artillery. The 32-run retrofit sweep produced 16 Bastion and 8 Vanguard wins. Those figures describe the scripted purchase policies. Human playtesting should examine the Guard branch gap and whether players understand the value of keeping or fusing adjacent specialists.

All 19 headless tests passed. The production build passed with the existing Vite bundle-size warning. The expanded balance sweep completed the layout comparison, retrofit sweep and recruit-exclusion runs. Chromium ran a desktop campaign with both fusions and matched headless core and scrap each wave. Touch checks covered the full board, branch availability, evolution, links and redeployment at 390 and 320 pixels wide, plus fusion preview and confirmation at 390 pixels. Playtesting is the gate for 2B.
