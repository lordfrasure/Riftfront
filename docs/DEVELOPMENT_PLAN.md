# Riftfront development plan

The [game design pillars](GAME_DESIGN_PILLARS.md) guide changes. The strategic depth redesign takes priority over the feature sequence in the [core gameplay expansion](specifications/CORE_GAMEPLAY_EXPANSION.md). The [experience overhaul](specifications/GAME_EXPERIENCE_OVERHAUL.md) remains the long-term product direction.

## Current baseline

The current campaign has ten waves, three lanes with seven pads, eight recruits, ten retrofit choices, two fusions, and two positional links. The best evidence of low pressure is that two Guards alone clear the first wave, early salvage pays back after three clears, and three opening policies under the same follow-up rules finish perfectly without routes. The fixed campaign still punishes uncovered lanes and missing mitigation. See the [balance report](BALANCE_REPORT.md) and [strategy matrix](STRATEGY_MATRIX.md).

## Workflow for major gameplay changes

| Stage | Required evidence |
| --- | --- |
| Design hypothesis | Record the baseline commit, the decision to improve, expected trade-offs and failure modes, and measurable validation criteria. Name representative policies, encounters, and what human feedback could overturn the hypothesis. |
| Implementation experiment | Use an isolated Git branch from the recorded baseline. Change the smallest coherent rule or encounter, and preserve a playable control build. |
| Automated verification | Run tests and production build. Verify changed rules and failure paths. Smoke-test desktop and touch where available and record gaps. |
| Balance comparison | Compare baseline and candidate with identical policies and scenario keys where possible. Include sensible and deliberately poor choices. Record ledgers, core, casualties, cause and timing of wave failures, and evidence for and against the hypothesis. |
| Human playtest | Record unaided choices and player feedback in the [playtest log](PLAYTEST_LOG.md). Review difficulty, tension, learnability, and desire to replay. |
| Accept, revise, or reject | Record the decision and rationale. Acceptance requires human feedback and project-owner approval. Revise on the isolated branch or discard the candidate. Stop before starting the next major experiment until approved. |

## Sequence

1. Establish the laboratory and measure the current game. The report and tooling complete the infrastructure assignment.
2. Test one early encounter that creates an economy trade-off. The [paired balance comparison](BALANCE_REPORT.md#early-economy-pressure-experiment) and browser checks are complete on `experiment/early-economy-pressure`. The candidate awaits human playtest and project-owner decision.
3. Use the result and player feedback to choose the next strategic question. Capacity, recovery, and encounter counterplay remain candidates. Expanded builders, loadouts, progression, and content depend on a playable strategic foundation.

## Historical delivery notes

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
