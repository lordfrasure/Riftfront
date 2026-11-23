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

## Early economy pressure experiment

**Test a forecasted wave 1 pack using the existing Raider budget.** On an isolated branch, compress the arrival times of the five Raiders in lane 1 into a clearly forecasted pack. Keep enemy counts, types, lane assignment, rewards, starting scrap, unit stats, and later waves fixed. Explain the concentrated threat in the forecast and let players pick their response.

The hypothesis is that overlapping attacks expose an unsupported interceptor, making immediate ranged or frontline reinforcement compete with early salvage. The fixed baseline shows the opening is where the first economy decision is currently free in combat terms. Changing arrival timing first isolates pressure without removing the payout or making subsequent defense broadly more expensive. It could instead create an obligatory Lobber, simply shift the safe formation forward, or impose a confusing opening tax. Timing alone may fail to create enough pressure.

Compare matched baseline and candidate runs for Guard-only, single salvage, Archer or Lobber reinforcement in the threatened lane, a second interceptor, and maximum greed. Test early placement alternatives and reuse the same timing seeds. Inspect overlap, first-wave routes and lane damage, delayed salvage, opening spend, and core and bank through wave 3 to test recovery. Keep the change if the early investment risks an attributable breach or materially worse recovery position, at least two affordable responses address the threat, and greed remains viable through deliberate placement or later investment. Human players should recognize the pressure from the forecast, explain the trade they made, and have a concrete alternative they want to try. Revise or reject if the encounter has one obvious purchase, relies on unexplained leaks, or turns a single early mistake into sustained failure. Approval and a human session precede acceptance.

### Experiment record

Control commit `cb49d71dab9ff17cdfaa5a9dcd5644cdeab26fe8` on main. This retains the shipped encounter and adds the laboratory used for the comparison.

The candidate compresses lane 1 arrivals from 19 ticks apart to 4 ticks apart. Compare wave 1 clears, core damage by lane, route counts, time to lose the last lane 1 interceptor, opening spend, and salvage. Track core and bank through waves 2 and 3, then campaign clears and final resources. Use one shared adaptive purchasing policy after the opening, with fixed timing and five shared timing-perturbation seeds. A successful test should expose a downside to early salvage, show at least two affordable defensive answers, and leave a credible recovery after a weak opening. Check whether backline safety, formation spacing, or the following wave's budget explains the results.

The tested candidate is `3b4dec5e050772ea64fa7d25725f769ec9572a28`. Lane 1's five Raiders enter over 0.8 seconds instead of 3.8 seconds. Lane 2's three arrivals stay staggered. The forecast identifies both patterns. Enemy counts and stats, starting scrap, prices, clear grants, bounty rates, and later waves are unchanged.

### Reproduce the paired comparison

Run from the repository with dependencies installed. The control worktree receives only the candidate lab instrumentation and opening fixture. Its simulator and campaign data come from the baseline commit.

```sh
baseline=cb49d71dab9ff17cdfaa5a9dcd5644cdeab26fe8
candidate=3b4dec5e050772ea64fa7d25725f769ec9572a28
comparison_dir=$(mktemp -d)
git worktree add --detach "$comparison_dir/control" "$baseline"
git worktree add --detach "$comparison_dir/candidate" "$candidate"
mkdir -p "$comparison_dir/control/tests/fixtures"
cp "$comparison_dir/candidate/tests/balance-lab.mjs" "$comparison_dir/control/tests/"
for build in control candidate; do
  (
    cd "$comparison_dir/$build"
    npm ci
    npm run --silent balance -- --lab --config "$comparison_dir/candidate/tests/fixtures/early-economy-pressure.json" --json > "$comparison_dir/$build-fixed.json"
    npm run --silent balance -- --lab --config "$comparison_dir/candidate/tests/fixtures/early-economy-pressure.json" --seeds 11,29,47,83,101 --jitter 8 --json > "$comparison_dir/$build-seeded.json"
  )
done
```

Every opening uses the same adaptive rule from wave 2 onward, with Bastion, Longshot, and Mender preferences. Actual purchases vary with the bank and occupied pads. For example, moving the lane 1 Guard back a pad leaves the planner's usual forward pad free, so it buys another lane 1 Guard in wave 2. Moving salvage into lane 2 can occupy a slot used by a late purchase. Campaign comparisons include those downstream effects. The maximum-greed opening pairs one Guard with a cheaper Chassis to afford two Scavengers. Each seed applies the same jitter sequence in chronological spawn order. Compression reorders some lane 1 arrivals relative to lane 2 in wave 1, so some individual Raiders receive different offsets. Later waves receive identical schedules across the two builds.

### Fixed encounter

Each arrow gives control → candidate. All openings cleared waves 1–3. Collapse means the last interceptor in that lane routed, measured from wave launch. The wave 1 core damage occurred entirely in lane 1 except for maximum greed, which lost 16 core in lane 2 in both builds. End banks include wave payouts.

| Opening | Wave 1 spend | Wave 1 core lost | Wave 1 routes | Lane 1 collapse | Wave 1 salvage | Wave 1 end bank |
| --- | ---: | ---: | ---: | --- | ---: | ---: |
| Two Guards | 68 | 0 → 24 | 0 → 1 | — → 5.65 s | 0 | 151 → 139 |
| Two Guards + lane 1 Scavenger | 100 | 0 → 24 | 0 → 2 | — → 5.65 s | 11 → 0 | 130 → 107 |
| Two Guards + lane 1 Archer | 108 | 0 | 0 | — | 0 | 111 |
| Two Guards + lane 1 Lobber | 118 | 0 | 0 | — | 0 | 101 |
| Two Guards + second lane 1 Guard | 102 | 0 | 0 → 1 | — | 0 | 117 |
| Two Guards + lane 2 Scavenger | 100 | 0 → 24 | 0 → 1 | — → 5.65 s | 11 | 130 → 118 |
| Lane 1 Guard one pad back + lane 1 Scavenger | 100 | 0 → 24 | 0 → 2 | — → 6.50 s | 11 → 0 | 130 → 107 |
| Maximum greed | 128 | 16 → 40 | 2 → 4 | — → 5.65 s | 11 → 0 | 94 → 71 |

| Opening | Wave 2 end core / bank | Wave 3 end core / bank | Campaign clears / core | Campaign salvage / end bank | Seeded wins / mean final core |
| --- | --- | --- | --- | --- | --- |
| Two Guards | 100 / 118 → 76 / 106 | 100 / 177 → 76 / 165 | 10 / 100 → 10 / 76 | 0 / 113 → 0 / 101 | 5/5 · 100 → 5/5 · 76 |
| Lane 1 Scavenger | 100 / 118 → 76 / 135 | 100 / 188 → 76 / 165 | 10 / 100 → 10 / 76 | 110 / 241 → 99 / 218 | 5/5 · 100 → 5/5 · 76 |
| Archer | 100 / 128 | 100 / 187 | 10 / 100 | 0 / 124 | 5/5 · 100 |
| Lobber | 100 / 118 | 100 / 177 | 10 / 100 | 0 / 113 | 5/5 · 100 |
| Second lane 1 Guard | 100 / 134 | 83 / 185 | 10 / 3 | 0 / 89 | 5/5 · 9 |
| Lane 2 Scavenger | 100 / 118 → 76 / 146 | 100 / 188 → 76 / 176 | 10 / 100 → 10 / 76 | 99 / 153 → 99 / 141 | 5/5 · 100 → 5/5 · 76 |
| Rearward lane 1 Guard | 100 / 124 → 64 / 145 | 100 / 154 → 64 / 125 | 10 / 100 → 10 / 64 | 110 / 246 → 99 / 217 | 5/5 · 100 → 5/5 · 65.2 |
| Maximum greed | 60 / 110 → 24 / 131 | 60 / 151 → 24 / 122 | 8 / 0 → 6 / 0 | 143 / 203 → 88 / 54 | 0/5 · 0 |

Wave 1 core damage and route counts matched the fixed run in all five seeds for each build and opening. In the candidate, the forward unsupported Guard routed in 5.30–5.80 seconds. Moving it one pad back delayed the collapse to 6.15–6.65 seconds, with the same three Raider breaches. In the fixed run, all wave 2 and 3 route counts were zero except for the second Guard opening (two in wave 3 in both builds), rearward Guard (one in candidate wave 2), and maximum greed (control 2 and 1, candidate 3 and 1).

### Findings and playtest gate

- **There is a priced trade-off.** The unsupported lane 1 Guard routed and three Raiders leaked, costing 24 core and 12 bounty. A Scavenger in that lane also routed, losing its 11-scrap payout. Moving salvage to lane 2 earned 33 scrap by wave 3 on a 32-scrap recruit and finished every tested candidate run at 76 core. Keeping scrap unspent also recovered, with the shared planner covering all lanes and buying both Lobbers in wave 2.
- **Archer is the strongest tested damage-prevention buy.** Both ranged reinforcements kept perfect core for all tested schedules. Fixed clears took 6.60 seconds for both. Archer cost 10 less and ended with 11 more scrap. The extra Guard cost 6 less than Archer and also prevented wave 1 breaches, with one route and much worse later results under the common planner in both builds. The evidence gives distinct choices between spending for core security and keeping flexibility or investing for returns, with limited differentiation among the immediate combat purchases.
- **Recovery depends on the opening.** The two-Guard and both forward single-Scavenger plans held waves 2 and 3 after the wave 1 breach. Moving the Guard back one pad changed adaptive spending and led to a wave 2 leak. Maximum greed reached wave 3 at 24 core and lost on wave 7 in the fixed candidate. This was a high-risk package in the control as well. The tests do not establish how readily a first-time player can identify and buy the recovery units.
- **Verification.** All 21 tests passed. The production build passed with Vite's chunk-size warning. Chromium verified the forecast, placements, launch controls, and wave report on desktop at 1440 × 900 and touch at 390 × 844. The desktop lane 1 Scavenger run lost 24 core and routed two units. The touch Lobber run held every lane with zero routes.

Ask players before launching which lane is most likely to break, whether they would invest in salvage, where they would place it, and what they would give up to reinforce. After combat, ask them to explain the breach or clean hold using the wave report and state what they would buy before wave 2. On replay, observe whether Archer, Lobber, a second Guard, banking, and safer salvage have credible use cases or whether the player always picks Archer. Record whether a 24-core loss felt predictable and whether the player could recover without coaching. Decision pending human playtest and project-owner approval.
