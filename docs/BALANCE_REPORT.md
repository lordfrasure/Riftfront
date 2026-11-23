# Baseline balance report

Gameplay baseline `98f7f38`. The production layout is three lanes by seven pads. The laboratory uses the live fixed-tick simulator and command validation. The baseline uses the shipped waves. The timing sensitivity comparison uses the same enemy types, counts, lanes and reward schedules with spawn times perturbed by up to eight ticks (0.4 seconds). Those five seeds measure sensitivity to timing under these policies. They provide no estimate of human win rates.

## Reproduce

```sh
npm run balance -- --sweep
npm run balance -- --lab
npm run --silent balance -- --lab --json > baseline.json
npm run --silent balance -- --lab --seeds 11,29,47,83,101 --jitter 8 --json > seeded.json
npm run --silent balance -- --lab --config policies.json --layout seven --json
```

The legacy sweep retains its layout, branch and recruit comparisons. For the lab, use `--layout six|seven|four`, or omit it for production. Omit seeds for the fixed schedule. Seeds are unique unsigned 32-bit integers and every policy receives the same generated schedules. The JSON includes version, scenario schedules, resolved policy definitions, per-seed outcomes, and per-wave ledgers, formations and attempted orders with errors. Keep it alongside the commit and command used to produce it.

The optional config maps report names to policies. Inherit any named lab or legacy policy using `preset`. Opening tuples use zero-based lanes and logical columns 0–3, mapped through `columns` to four ascending physical slots. Seven-pad defaults are `[0,2,4,6]`. Options include `guard`, `archer`, `support`, `construct`, `fusion`, `fusionInputs`, `exclude`, `coilWave` and `lastPurchaseWave`. Branches are preferences in the legacy planner, which reserves special orders for the final wave. For exact experiments, use `orders` keyed by wave with simulation command objects and physical slots. The lab applies them after any preset purchases and starts the wave automatically. Exact orders abort the report on rejection, while the adaptive planner records and skips rejected actions. IDs can vary with the schedule, so inspect the formation and use placement-only orders where practical for cross-seed comparisons.

```json
{
  "laterCoil": { "preset": "economy", "coilWave": 6 },
  "singleGuard": {
    "orders": { "1": [{ "type": "place", "kind": "guard", "lane": 0, "slot": 6 }] }
  }
}
```

Spending is gross accepted order cost. Refunds and scrap at wave start and end are recorded separately. Damage per scrap is total enemy HP removed divided by gross spending. Short runs face fewer enemies, and damage per scrap should be read with wave reached and core preserved. Routes count events, so the same defender can route in several waves. Per-wave summaries use only runs reaching that wave and give the denominator explicitly. Ticks with observed hits, blasts or breaches are an activity proxy. Empty gaps can contain movement or setup. Direct-hit damage received excludes boss blast damage and is not a complete damage intake measure.

## Observed results

Fixed columns show one run per policy. The final two columns summarize the matched five-seed timing set. End scrap includes rewards from the final played wave.

| Policy | Clears / 10 | Core | Spent | End scrap | Salvage | Routes | Damage per scrap | Seeded wins / 5 | Seeded mean core |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| One Scavenger | 10 | 100 | 1,090 | 241 | 110 | 0 | 17.5 | 5 | 100 |
| Two Guards only in opening | 10 | 100 | 1,108 | 113 | 0 | 0 | 17.2 | 5 | 100 |
| Archer instead of Scavenger | 10 | 100 | 1,097 | 124 | 0 | 0 | 17.4 | 5 | 100 |
| Two Scavengers with a Chassis replacing one Guard | 8 | 0 | 983 | 203 | 143 | 17 | 13.9 | 0 | 0 |
| Artillery | 10 | 50 | 1,146 | 92 | 0 | 4 | 16.4 | 5 | 56 |
| Balanced | 10 | 100 | 980 | 260 | 0 | 2 | 19.5 | 5 | 100 |
| Relay | 10 | 100 | 1,111 | 110 | 0 | 0 | 17.2 | 5 | 100 |
| Fusion | 10 | 100 | 1,010 | 211 | 0 | 0 | 18.9 | 5 | 100 |
| Keep fusion ingredients separate | 10 | 100 | 934 | 287 | 0 | 0 | 20.4 | 5 | 100 |
| Disruption | 10 | 83 | 1,089 | 124 | 0 | 2 | 17.5 | 5 | 83 |
| Omit Lobber | 10 | 46 | 1,127 | 177 | 110 | 3 | 16.6 | 5 | 50.8 |
| Omit Mender | 10 | 40 | 973 | 328 | 110 | 3 | 19.3 | 5 | 40 |
| Skip Coil Age | 5 | 0 | 581 | 173 | 55 | 8 | 9.5 | 0 | 0 |
| Prefer Vanguard | 10 | 100 | 1,172 | 170 | 110 | 0 | 16.3 | 5 | 100 |
| Prefer Volley | 10 | 100 | 1,090 | 241 | 110 | 0 | 17.5 | 5 | 100 |
| Rearward column map | 10 | 100 | 1,090 | 241 | 110 | 0 | 17.5 | 5 | 100 |
| Three Archers in opening | 10 | 88 | 1,097 | 118 | 0 | 2 | 17.3 | 5 | 89.2 |
| Three Guards with no further purchases | 2 | 0 | 102 | 224 | 0 | 3 | 12.1 | 0 | 0 |
| Stop purchasing after wave 3 | 5 | 0 | 264 | 466 | 55 | 8 | 19.5 | 0 | 0 |
| Empty | 1 | 0 | 0 | 187 | 0 | 0 | — | 0 | 0 |

## Why the campaign is forgiving

**The opening gives away the first economic commitment.** Two forward Guards cost 68 of 128 scrap and kill all eight wave 1 Raiders in 9.75 seconds. A rear Scavenger changes neither combat duration nor wave 1 casualties, breaches or kills. Its first three payouts earn 33 against a cost of 32. Wave 1 alone grants 59 and pays 32 bounty, giving the one-Scavenger opening 130 scrap for wave 2. Both that opening and the Guard-only control enter wave 3 with 118 scrap, despite the salvage opening having bought an extra Archer in wave 2. The fixed economy run earns 110 salvage, or 78 net of recruit cost, and ends 128 scrap ahead of the Guard-only control. Downstream spending accounts for part of the end-bank gap. This is strong evidence of a safe first salvage buy in the tested opening. Maximum greed has consequences. The two-Scavenger package had 16 damage on wave 1, another 24 on wave 2, and lost on wave 9. The package also replaces a Guard to fit the starting budget, so the result measures the combined trade.

**Scarcity binds purchases early and often fails to bind strategic outcomes.** In the economy run the wave 2, 4 and 5 purchases leave 6, 8 and 10 scrap before combat. Across the full run, 679 bounty and 414 grants augment the 128 starting scrap. Full core and zero routes are attainable while using 15 of 21 pads and banking 144 before the boss. Separate components occupy 14 pads on the last wave and bank 201 before it. The no-Mender run reaches 328 end scrap while losing 60 core in wave 5, underscoring that idle money can reflect a rigid planner as well as budget slack. Underspending loses with 466 in the bank. A bank alone cannot locate the constraint or quantify reward generosity.

**Counterplay matters locally, then damage and mitigation cover many threats.** Skipping splash costs 54 core across waves 2–4 in the tested policy. Skipping healing costs 60 in wave 5. Skipping Coil costs the campaign on wave 6. The default economy run nonetheless clears all Herald waves without aura suppression or Coilcasters. The center Saboteur policy leaves the first Heralds uncontested by its specialization in lane 3, a targeting and placement confound. In that policy wave 4 ran 47.9 seconds, with two routes and a 17-point breach. The fixed artillery policy lost 50 core and routed four on wave 9, then cleared wave 10. Same-lane nearest-target behavior and the lack of deliberate rear targeting outside the boss's local blast make an intact front a reliable way to protect backline value. Cleared waves restore both routed and wounded defenders for free. Core damage and lost bounties can persist, but the same defender can return at full strength after a costly fight.

**Apparent build variety exceeds the measured differentiation.** Eight legacy policies won on the production board. The 32-case sweep gave Bastion 16/16 wins and Vanguard 8/16, but Vanguard with Mender in the economy comparison also kept perfect core and was faster (119.3 versus 152.6 seconds total). Preferred Volley and Longshot preserved identical outcomes and spending while clearing at different speeds (176.8 and 152.6 seconds). A rearward column map also kept the same core and casualty result. Fusion and separate inputs kept full core, with the fused policy completing the boss wave in 19.0 seconds versus 28.5 seconds and leaving two extra pads open. The separate policy spent 76 less across the campaign. Those are policy-level results. Differences in affordability, purchase order, and support placement propagate across waves, so a shared-army wave comparison is needed to identify each recipe's standalone value. Most policies share an interceptor, ranged damage, and a common boss plan. Their results therefore support multiple viable purchase scripts and leave genuinely distinct army identities unproven.

## Human evidence and gaps

The owner reported a first-attempt clear with little strategic effort in the strategic redesign specification. The existing UI exposes per-lane forecasts, specific unit hints, range previews, contextual upgrades and fusion previews, and wave reports. Wave 1 explicitly suggests forward Guards. The debrief counts routes and breaches but does not attribute them to an enemy or show which investment was displaced. The combined evidence motivates testing whether players can anticipate and explain a real trade-off. Readability, tension, intentional replay and the balance of unfamiliar strategies are pending structured playtests. The timing sweep preserves the campaign's threats and does not test new encounter families.

## Next experiment for approval

**Test a forecasted wave 1 pack using the existing Raider budget.** On an isolated branch, compress the arrival times of the five Raiders in lane 1 into a clearly forecasted pack. Keep enemy counts, types, lane assignment, rewards, starting scrap, unit stats, and later waves fixed. Explain the concentrated threat in the forecast and let players pick their response.

The hypothesis is that overlapping attacks expose an unsupported interceptor, making immediate ranged or frontline reinforcement compete with early salvage. The fixed baseline shows the opening is where the first economy decision is currently free in combat terms. Changing arrival timing first isolates pressure without removing the payout or making subsequent defense broadly more expensive. It could instead create an obligatory Lobber, simply shift the safe formation forward, or impose a confusing opening tax. Timing alone may fail to create enough pressure.

Compare matched baseline and candidate runs for Guard-only, single salvage, Archer or Lobber reinforcement in the threatened lane, a second interceptor, and maximum greed. Test early placement alternatives and reuse the same timing seeds. Inspect overlap, first-wave routes and lane damage, delayed salvage, opening spend, and core and bank through wave 3 to test recovery. Keep the change if the early investment risks an attributable breach or materially worse recovery position, at least two affordable responses address the threat, and greed remains viable through deliberate placement or later investment. Human players should recognize the pressure from the forecast, explain the trade they made, and have a concrete alternative they want to try. Revise or reject if the encounter has one obvious purchase, relies on unexplained leaks, or turns a single early mistake into sustained failure. Approval and a human session precede acceptance.
