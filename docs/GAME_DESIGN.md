# Riftfront: Ages Under Siege

Protect a shared core through five handcrafted waves on a 1280 × 720 battlefield. Enemies move from right to left in three lanes. Each lane has four fixed placement pads. The forecast above each lane lists the next wave's composition.

## Match rules

- Start with 110 scrap and 100 core HP. Select a defender and click an empty pad during build. Start every wave manually when ready.
- Defenders stay on their pad and attack the closest enemy ahead in their lane and range. Enemies stop at the first defender in their way and attack it until it falls. Surviving defenders carry their health between waves.
- Kills pay 5–11 scrap. Finishing any of the first four waves grants 55 scrap and returns to build. Scavengers generate scrap during battle, and their partial income timer carries into the next wave.
- Basic enemies breach for 10 core damage, Fast for 8, and Armored for 18. Armor subtracts 5 from every incoming hit with a minimum of 1 damage. Victory requires surviving the full fifth wave with the core intact. At zero core HP the match ends in defeat.
- The first wave attacks lanes 1 and 2. An early Scavenger can earn scrap safely in lane 3 during wave one. Buying it leaves less scrap for the first defense, and the next wave brings Fast enemies to lane 3. Later waves mix armor and speed across all lanes.
- Restart resets the full match at any time. The result screen also offers a replay.

| Defender | Cost | HP | Behavior |
| --- | ---: | ---: | --- |
| Guard | 35 | 125 | Blocks enemies and deals 15 damage every 0.7 s within 39 pixels |
| Archer | 45 | 65 | Deals 17 damage every 0.75 s within 223 pixels |
| Scavenger | 30 | 50 | Produces 7 scrap per 3 s of battle and has no attack |

The simulation advances in 50 ms ticks. Spawn schedules and target ordering are deterministic. Placement and start commands update match state. Phaser draws the battlefield, health bars and effects, while HTML provides keyboard-focusable controls.
