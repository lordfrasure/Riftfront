# Human playtest log

Human feedback is an approval gate for every major gameplay milestone. Run the current baseline and candidate when practical, use the same starting conditions, and rotate build order across testers where possible to reduce learning bias. Include a fresh player and a player familiar with the campaign when available. Give the player the normal in-game information and capture unaided decisions before discussing intent. Preserve observations and player comments separately from the team's interpretation.

## Session template

- **Session / date / tester** — Use a non-identifying label and note Riftfront and genre experience.
- **Build selection** — Record branch, commit, baseline or candidate, experimental settings, seed or fixed encounter schedule, and device and input method.
- **Starting instructions** — Record the goal, any coaching given, and whether this was a first attempt or replay.
- **Chosen army** — Record opening, later build identity, and why the player selected it.
- **Outcome** — Record result, cleared waves, end core and scrap, and the waves that mattered.

| Wave | Forecast understood and decision made | Alternative considered and expected trade-off | Observed result and player explanation | UI confusion or assistance |
| --- | --- | --- | --- | --- |
| | | | | |

- **Difficulty** — Ask for a 1–5 rating from effortless to overwhelming. Record the wave and decision behind the rating.
- **Tension** — Ask for a 1–5 rating from relaxed to sustained pressure. Identify the closest call, whether it felt fair, and what the player could change.
- **Failure or close call** — Record the player's explanation first. Compare it with lane breaches, resources, casualties, enemy pressure, and missed options observed in the run.
- **UI** — Record the forecast, placement preview, order, upgrade, fusion, or report the player misread or could not find. Capture the expected information and when they needed it.
- **Learning and replay** — Would the player choose to replay now? What opening, build, or tactic would they try and why? If they decline, record the reason.
- **Evidence and interpretation** — Link notes, screenshots or telemetry and distinguish observed events from suspected causes.
- **Milestone decision** — Pending / accept / revise / reject. Link paired balance evidence, record project-owner approval and rationale, and list the remaining questions. Missing human feedback keeps the gate pending.

## Sessions

The strategic redesign specification records the owner's first-attempt clear with little strategic effort. The baseline tooling adds a paired comparison for the opening.

### Early economy pressure

Pending human session. Use control `cb49d71` and candidate `3b4dec5` with their fixed encounters. Record unaided lane forecasts, opening purchases and placements, explanations of any breaches, recovery purchases for waves 2 and 3, and the opening the player would try next. See the [paired comparison and playtest questions](BALANCE_REPORT.md#findings-and-playtest-gate).

### Combat and strategy vertical slice

The owner reported an easy first-attempt campaign victory on the vertical slice and requested a major redesign of difficulty, decisions, and replayability. This rejects the slice as sufficient for the milestone. The army, ending core, and wave-by-wave decisions were unspecified.

For a paired follow-up session, use control `6fe17f6` and candidate `bc97268`. Run `npm run build` and then `npm run preview -- --host 127.0.0.1` in each checkout. Open the printed URL and choose **Begin siege**. Play waves 1–5 or until defeat, once per build, using only in-game information. If testing with multiple players, alternate which build they see first. Before each wave, write down the threat, the order you considered but skipped, and the defender or lane you think is most at risk. After each wave, record core, routes, and your explanation before checking the report.

Then replay the candidate. If the first run used an Archer, try a Cinder Lobber in lane 1 or an Anchor Frame with a Guard in lane 2. If the first run spent heavily on defense, try two Guards with a Scavenger on the rearmost lane 2 pad and recover after the opening. Try leaving a pad between lane 1's front and ranged support for the Ram, then compare closer support against the aimed Spitters. Continue one successful run through wave 10 to check the handoff.

1. Which purchase did you most want but defer, and where did you feel the cost?
2. Which defender did you expect to be in danger, and could you explain the first route or breach after combat?
3. Which build would you voluntarily try next, and what do you expect it to handle better?

See the [paired comparison](BALANCE_REPORT.md#combat-and-strategy-vertical-slice).

### Branching sieges

Use `experiment/branching-sieges`. Build the game with `npm run build`, then run `npm run preview -- --host 127.0.0.1` and open the printed URL. Choose **New seed**, note the number, and play one complete run unaided. Record which front you picked, which reward you passed up, and when you changed the active garrison. If a defender routes, decide whether to repair it or cover its place while it rests.

Replay that seed using **Play again** or by entering the same number in the briefing. Use a different opening army and choose the other front at the first checkpoint. If you want a reproducible comparison after the blind runs, seed 11 and seed 29 show different advantages for shield and Foundry policies in the lab.

1. Which front or roster decision was hardest, and did the forecast give you enough information to make it?
2. Which loss or near miss changed your next plan? Could you recover with a reserve swap, repair, or different front?
3. Would you begin a third siege voluntarily? Which army and seed would you choose, and why?

Decision pending human feedback and owner approval.
