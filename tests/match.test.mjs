import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { applyDamage, selectTarget } from '../.test-build/combat.js'
import { CORE_HP, DEFENDERS, ENEMIES, ERAS, FUSIONS, LANES, LAYOUTS, OVERTIME_TICK, SALVAGE_PAYOUT, SCAVENGER_LIMIT, SLOTS, SYNERGIES, UPGRADES, WAVES, profile } from '../.test-build/data.js'
import { formationLinks } from '../.test-build/formation.js'
import { Match, REDEPLOY_COST } from '../.test-build/match.js'
import { plan, run, strategies } from './balance.mjs'

const place = (match, kind, lane, slot) => match.dispatch({ type: 'place', kind, lane, slot })

function finish(match, onTick = () => {}) {
  const { scrap, core } = match.view
  assert.equal(match.dispatch({ type: 'start' }), undefined)
  const effects = []
  for (let tick = 0; tick < 1500 && match.view.phase === 'battle'; tick++) {
    const frame = match.tick()
    effects.push(...frame)
    onTick(match.view, frame)
  }
  assert.notEqual(match.view.phase, 'battle')
  const { bounty, income, clearBonus, coreDamage } = match.lastWave
  assert.equal(match.view.scrap - scrap, bounty + income + clearBonus)
  assert.equal(core - match.view.core, coreDamage.reduce((a, b) => a + b, 0))
  assert.equal(core - match.view.core, effects.filter(effect => effect.type === 'breach').reduce((sum, effect) => sum + effect.amount, 0))
  return effects
}

function matchWithStaggeredOpening() {
  const [first, ...later] = WAVES
  let raiders = 0
  const spawns = first.spawns.map(spawn => spawn.lane === 0
    ? { ...spawn, tick: 1 + raiders++ * 19 }
    : spawn).sort((a, b) => a.tick - b.tick)
  return new Match(LAYOUTS.seven, [{ ...first, spawns }, ...later])
}

it('forecasts and delivers the lane 1 pack while preserving the staggered lane 2 arrivals', () => {
  const match = new Match()
  assert.match(match.waves[0].tip, /lane 1 in a tight pack/)
  assert.deepEqual(match.waves[0].spawns.filter(spawn => spawn.lane === 0).map(spawn => spawn.tick), [1, 5, 9, 13, 17])
  assert.deepEqual(match.waves[0].spawns.filter(spawn => spawn.lane === 1).map(spawn => spawn.tick), [10, 34, 58])
  plan(match, strategies.economy)
  finish(match)
  assert.deepEqual(match.lastWave.coreDamage, [24, 0, 0])
  assert.equal(match.lastWave.income, 0)
  assert.equal(match.view.phase, 'build')
})

describe('combat', () => {
  it('selects the nearest live target ahead in its lane and breaks ties by ID', () => {
    const attacker = { id: 1, lane: 0, x: 100, hp: 10, cooldown: 0 }
    const candidate = { ...attacker, id: 3, x: 130 }
    const tie = { ...candidate, id: 2 }
    assert.equal(selectTarget(attacker, [
      { ...candidate, x: 101, lane: 1 }, { ...candidate, x: 99 }, { ...candidate, x: 105, hp: 0 },
      { ...candidate, x: 141 }, candidate, tie,
    ], 40, 1), tie)
    assert.equal(selectTarget(attacker, [candidate], 40, -1), undefined)
    applyDamage(tie, 8, 5)
    assert.equal(tie.hp, 7)
    applyDamage(tie, 2, 5)
    assert.equal(tie.hp, 6)
    applyDamage(tie, 20)
    assert.equal(tie.hp, 0)
  })

  it('advances smoothly within the Guard leash, protects the backline and rallies', () => {
    const match = new Match()
    place(match, 'guard', 0, 3)
    place(match, 'archer', 0, 2)
    place(match, 'guard', 1, 3)
    let previous = SLOTS[3]
    let moved = false
    const effects = finish(match, view => {
      if (view.phase !== 'battle') return
      const unit = view.defenders[0]
      assert.ok(unit.x >= SLOTS[3] && unit.x <= SLOTS[3] + DEFENDERS.guard.advance)
      assert.ok(Math.abs(unit.x - previous) <= 7)
      moved ||= unit.x > SLOTS[3]
      previous = unit.x
    })
    assert.ok(moved)
    assert.ok(effects.some(effect => effect.type === 'hit' && effect.target === 1))
    assert.ok(effects.some(effect => effect.type === 'hit' && effect.style === 'arrow'))
    assert.ok(!effects.some(effect => effect.type === 'hit' && effect.target === 2))
    assert.equal(match.view.defenders[0].x, SLOTS[3])
    assert.equal(match.view.defenders[0].hp, DEFENDERS.guard.hp)
  })
})

describe('planning and progression', () => {
  it('validates orders atomically and retires for less than recruitment cost', () => {
    const match = new Match()
    assert.equal(place(match, 'guard', 0, 3), undefined)
    const [guard] = match.view.defenders
    const state = structuredClone(match.view)
    for (const [kind, lane, slot] of [['guard', 0, 3], ['guard', LANES.length, 3], ['archer', 0, 1.5], ['unknown', 0, 1], ['conductor', 0, 0]]) {
      assert.ok(place(match, kind, lane, slot))
    }
    assert.ok(match.dispatch({ type: 'advance', era: 'coil' }))
    assert.ok(match.dispatch({ type: 'upgrade', id: guard.id, upgrade: 'bastion' }))
    assert.ok(match.dispatch({ type: 'redeploy', id: guard.id, lane: 0, slot: 3 }))
    assert.deepEqual(match.view, state)
    assert.equal(match.dispatch({ type: 'redeploy', id: guard.id, lane: 1, slot: 2 }), undefined)
    assert.equal(match.view.scrap, state.scrap - REDEPLOY_COST)
    assert.equal(match.view.defenders[0].x, SLOTS[2])
    assert.equal(match.dispatch({ type: 'retire', id: guard.id }), undefined)
    assert.equal(match.view.scrap, state.scrap - REDEPLOY_COST + Math.floor(DEFENDERS.guard.cost / 3))
    assert.ok(match.dispatch({ type: 'retire', id: guard.id }))
  })

  it('bounds salvage per completed wave and rejects orders in combat', () => {
    const match = new Match()
    for (let i = 0; i < SCAVENGER_LIMIT; i++) assert.equal(place(match, 'scavenger', 2, i), undefined)
    assert.ok(place(match, 'scavenger', 2, 2))
    const before = match.view.scrap
    finish(match, view => {
      if (view.phase === 'battle') {
        assert.equal(view.scrap, before)
        assert.ok(match.dispatch({ type: 'retire', id: 1 }))
      }
    })
    assert.equal(match.lastWave.income, SCAVENGER_LIMIT * SALVAGE_PAYOUT)
    assert.equal(match.view.wave, 2)
    assert.equal(match.view.phase, 'build')
    assert.deepEqual(match.tick(), [])
  })

  it('unlocks Coil Age and installs exactly one valid branch on a retained defender', () => {
    const match = new Match()
    while (match.view.wave < ERAS.coil.wave) {
      plan(match, strategies.economy)
      finish(match)
    }
    const guard = match.view.defenders.find(unit => unit.kind === 'guard')
    assert.ok(match.dispatch({ type: 'upgrade', id: guard.id, upgrade: 'bastion' }))
    const { scrap } = match.view
    assert.equal(match.dispatch({ type: 'advance', era: 'coil' }), undefined)
    assert.ok(match.dispatch({ type: 'advance', era: 'coil' }))
    assert.ok(match.dispatch({ type: 'upgrade', id: guard.id, upgrade: 'volley' }))
    assert.equal(match.dispatch({ type: 'upgrade', id: guard.id, upgrade: 'bastion' }), undefined)
    assert.ok(match.dispatch({ type: 'upgrade', id: guard.id, upgrade: 'vanguard' }))
    assert.equal(profile(guard).armor, 9)
    assert.equal(guard.hp, profile(guard).hp)
    assert.equal(match.view.scrap, scrap - ERAS.coil.cost - UPGRADES.bastion.cost)
    assert.equal(place(match, 'conductor', 0, 1), undefined)
  })

  it('rejects a fusion with a retrofitted input and preserves the investment', () => {
    const match = new Match()
    while (match.view.wave < ERAS.coil.wave) {
      plan(match, strategies.balanced)
      finish(match)
    }
    const guard = match.view.defenders.find(unit => unit.kind === 'guard' && unit.lane === 1)
    assert.equal(place(match, 'mender', guard.lane, guard.slot - 1), undefined)
    const healer = match.view.defenders.at(-1)
    assert.equal(match.dispatch({ type: 'advance', era: 'coil' }), undefined)
    assert.equal(match.dispatch({ type: 'upgrade', id: guard.id, upgrade: 'bastion' }), undefined)
    const before = structuredClone(match.view)
    assert.ok(match.dispatch({ type: 'fuse', first: guard.id, second: healer.id }))
    assert.deepEqual(match.view, before)
  })

  it('plays distinct winning runs and produces deterministic results', () => {
    const economy = run(strategies.economy)
    const artillery = run(strategies.artillery)
    for (const result of [economy, artillery]) {
      assert.equal(result.phase, 'victory')
      assert.equal(result.waves.length, WAVES.length)
    }
    assert.ok(economy.waves[1].income > 0)
    assert.equal(artillery.waves[0].income, 0)
    assert.deepEqual(run(strategies.economy), economy)
    assert.ok(artillery.formation.some(unit => unit.upgrade === 'vanguard'))
  })

  it('emits splash, healing, exposure and a telegraphed Colossus blast during a full run', () => {
    const match = new Match()
    const styles = new Set()
    let telegraph = false
    let blast = false
    let exposed = false
    let splashKills = false
    let bossDefeated = false
    while (match.view.phase === 'build') {
      plan(match, strategies.balanced)
      for (const effect of finish(match, (view, frame) => {
        splashKills ||= frame.some(effect => effect.type === 'hit' && effect.style === 'shell' &&
          frame.filter(death => death.type === 'fall' && death.lane === effect.lane &&
            Math.abs(death.x - effect.to) <= effect.splash).length > 1)
        if (view.wave === WAVES.length) {
          bossDefeated ||= frame.some(effect => effect.type === 'fall' && effect.color === ENEMIES.colossus.color)
        }
        telegraph ||= view.enemies.some(enemy => enemy.pulseX !== undefined)
        exposed ||= view.enemies.some(enemy => enemy.expose > 0 && enemy.slow > 0)
      })) {
        if (effect.type === 'hit') styles.add(effect.style)
        if (effect.type === 'blast') blast = true
      }
    }
    assert.equal(match.view.phase, 'victory')
    for (const style of ['shell', 'coil', 'heal']) assert.ok(styles.has(style), style)
    assert.ok(exposed && telegraph && blast)
    assert.ok(splashKills)
    assert.ok(bossDefeated)
  })

  it('resolves a healing stalemate once enemy overtime damage ramps', () => {
    const match = matchWithStaggeredOpening()
    const strategy = { ...strategies.economy, exclude: 'archer' }
    while (match.view.phase === 'build' && match.view.wave <= 4) {
      plan(match, strategy)
      finish(match)
    }
    assert.equal(match.lastWave.wave, 4)
    assert.ok(match.lastWave.ticks > OVERTIME_TICK)
    assert.ok(match.lastWave.losses > 0)
    assert.equal(match.view.phase, 'build')
  })

  it('caps actual leak damage and freezes a lost siege', () => {
    const match = new Match()
    while (match.view.phase === 'build') finish(match)
    assert.equal(match.view.core, 0)
    assert.equal(match.view.phase, 'defeat')
    assert.ok(match.lastWave.coreDamage.reduce((a, b) => a + b, 0) <= CORE_HP)
    const snapshot = structuredClone(match.view)
    assert.ok(match.dispatch({ type: 'start' }))
    assert.deepEqual(match.tick(), [])
    assert.deepEqual(match.view, snapshot)
  })
})

describe('expanded formations', () => {
  it('validates the last pad and reports core damage for each layout lane', () => {
    for (const layout of Object.values(LAYOUTS)) {
      const match = new Match(layout)
      const lane = layout.lanes.length - 1
      const slot = layout.slots.length - 1
      assert.equal(place(match, 'guard', lane, slot), undefined)
      assert.equal(match.view.defenders[0].x, layout.slots[slot])
      assert.ok(place(match, 'guard', lane + 1, slot))
      assert.ok(place(match, 'guard', lane, slot + 1))
      finish(match)
      assert.equal(match.lastWave.coreDamage.length, layout.lanes.length)
      assert.equal(match.waves.flatMap(wave => wave.spawns).length, WAVES.flatMap(wave => wave.spawns).length)
    }
  })

  it('rejects invalid or unaffordable fusion without consuming either input', () => {
    const match = new Match()
    assert.ok(place(match, 'wardkeeper', 0, 0))
    place(match, 'guard', 0, 6)
    place(match, 'mender', 0, 4)
    place(match, 'lobber', 1, 6)
    const [guard, healer, lobber] = match.view.defenders
    const fuse = (first, second) => match.dispatch({ type: 'fuse', first, second })
    const before = structuredClone(match.view)
    for (const partner of [guard.id, healer.id, lobber.id, 999]) assert.ok(fuse(guard.id, partner))
    assert.deepEqual(match.view, before)
    finish(match)
    assert.equal(match.dispatch({ type: 'redeploy', id: healer.id, lane: 0, slot: 5 }), undefined)
    assert.equal(match.dispatch({ type: 'redeploy', id: guard.id, lane: 0, slot: 4 }), undefined)
    const reversed = structuredClone(match.view)
    assert.ok(fuse(guard.id, healer.id))
    assert.deepEqual(match.view, reversed)

    const poor = new Match()
    place(poor, 'guard', 0, 6)
    place(poor, 'mender', 0, 5)
    place(poor, 'lobber', 1, 6)
    const snapshot = structuredClone(poor.view)
    assert.match(poor.dispatch({ type: 'fuse', first: 1, second: 2 }), /scrap/)
    assert.deepEqual(poor.view, snapshot)
  })

  it('fuses either selection order to a fresh unit at the forward pad, with no resale or recursive merge', () => {
    const match = new Match()
    place(match, 'guard', 0, 6)
    place(match, 'mender', 0, 5)
    const before = match.view.scrap
    const fusion = { type: 'fuse', first: 2, second: 1 }
    assert.equal(match.dispatch(fusion), undefined)
    const [ward] = match.view.defenders
    assert.equal(match.view.defenders.length, 1)
    assert.deepEqual([ward.id, ward.slot, ward.kind, ward.hp], [3, 6, 'wardkeeper', DEFENDERS.wardkeeper.hp])
    assert.equal(match.view.scrap, before - FUSIONS[0].cost)
    finish(match)
    assert.equal(place(match, 'mender', 0, 5), undefined)
    assert.ok(match.dispatch(fusion))
    assert.ok(match.dispatch({ type: 'fuse', first: ward.id, second: 4 }))
    const scrap = match.view.scrap
    assert.equal(match.dispatch({ type: 'retire', id: ward.id }), undefined)
    assert.equal(match.view.scrap, scrap)
  })

  it('applies Field Dressing only from consecutive pads, with live range and removal checks', () => {
    const match = new Match()
    place(match, 'guard', 0, 6)
    place(match, 'mender', 0, 5)
    place(match, 'guard', 1, 6)
    assert.deepEqual(match.links.map(link => link.kind), ['fieldDressing'])
    const effects = finish(match)
    assert.ok(effects.some(effect => effect.style === 'heal' && effect.amount > DEFENDERS.mender.heal.amount))
    assert.ok(match.lastWave.synergyActions > 0)
    assert.equal(match.dispatch({ type: 'redeploy', id: 2, lane: 0, slot: 4 }), undefined)
    assert.deepEqual(match.links, [])
    const guard = { ...match.view.defenders[0], x: 1200 }
    const mender = { ...match.view.defenders[1], slot: 5 }
    assert.deepEqual(formationLinks([guard, mender]), [])
    assert.deepEqual(formationLinks([{ ...guard, x: mender.x + 100, hp: 0 }, mender]), [])
  })

  it('evolves in Ember and caps ranged damage to one nearby Spark Relay', () => {
    const match = new Match()
    place(match, 'chassis', 0, 3)
    place(match, 'archer', 0, 4)
    assert.ok(match.dispatch({ type: 'upgrade', id: 1, upgrade: 'mortar' }))
    assert.equal(match.dispatch({ type: 'upgrade', id: 1, upgrade: 'relay' }), undefined)
    assert.ok(match.dispatch({ type: 'upgrade', id: 1, upgrade: 'bulwark' }))
    assert.deepEqual(match.links.map(link => link.kind), ['sparkLink'])
    const effects = finish(match)
    assert.ok(effects.some(effect => effect.source === 2 && effect.amount === DEFENDERS.archer.attack.damage + SYNERGIES.sparkLink.bonus))
    assert.ok(!effects.some(effect => effect.source === 1))
    const [relay, archer] = match.view.defenders
    assert.equal(formationLinks([relay, archer, { ...relay, id: 99, slot: 5 }]).length, 1)
    assert.equal(formationLinks([{ ...relay, hp: 0 }, archer]).length, 0)

    const anchor = new Match()
    place(anchor, 'chassis', 0, 6)
    place(anchor, 'guard', 1, 6)
    assert.equal(anchor.dispatch({ type: 'upgrade', id: 1, upgrade: 'bulwark' }), undefined)
    let slowed = false
    finish(anchor, view => { slowed ||= view.enemies.some(enemy => enemy.lane === 0 && enemy.slow > 0) })
    assert.ok(slowed)
  })

  it('lets a Wardkeeper attack and repair a front ally independently', () => {
    const match = new Match()
    place(match, 'guard', 0, 5)
    place(match, 'mender', 0, 4)
    assert.equal(match.dispatch({ type: 'fuse', first: 1, second: 2 }), undefined)
    assert.ok(finish(match).some(effect => effect.source === 3 && effect.style === 'strike'))
    assert.equal(place(match, 'guard', 0, 6), undefined)
    const front = match.view.defenders.at(-1)
    const effects = finish(match)
    assert.ok(effects.some(effect => effect.source === 3 && effect.style === 'heal' && effect.target === front.id))
  })

  it('uses both fusions and their abilities in a distinct deterministic winning campaign', () => {
    const match = new Match()
    let rangerExposure = false
    while (match.view.phase === 'build') {
      plan(match, strategies.fusion)
      const ranger = match.view.defenders.find(unit => unit.kind === 'arcRanger')
      finish(match, (view, effects) => {
        rangerExposure ||= effects.some(effect => effect.source === ranger?.id &&
          view.enemies.some(enemy => enemy.id === effect.target && enemy.expose > 0))
      })
    }
    assert.equal(match.view.phase, 'victory')
    assert.ok(rangerExposure)
    assert.ok(match.view.defenders.some(unit => unit.upgrade === 'wardplate'))
    assert.ok(match.view.defenders.some(unit => unit.upgrade === 'arcLance'))
    assert.deepEqual(run(strategies.fusion), run(strategies.fusion))
  })

  it('uses the base Saboteur to prioritize a Herald behind other enemies', () => {
    const match = matchWithStaggeredOpening()
    let prioritized = false
    while (match.view.phase === 'build' && !prioritized) {
      plan(match, { ...strategies.disruption, disrupt: false })
      const saboteur = match.view.defenders.find(unit => unit.kind === 'saboteur')
      finish(match, (view, effects) => {
        for (const hit of effects.filter(effect => effect.type === 'hit' && effect.source === saboteur?.id)) {
          const herald = view.enemies.find(enemy => enemy.id === hit.target && enemy.kind === 'herald')
          prioritized ||= Boolean(herald?.disrupted && view.enemies.some(enemy =>
            enemy.lane === herald.lane && enemy.x > hit.from && enemy.x < herald.x))
        }
      })
    }
    assert.ok(prioritized)
  })

  it('fires Ash Mortar shells and suppresses Herald armor with the Hush Battery', () => {
    for (const [strategy, upgrade, check] of [
      [{ ...strategies.evolution, opening: [['guard',0,3], ['guard',1,3], ['chassis',0,2]], construct: 'mortar' }, 'mortar',
        (view, effect) => effect.style === 'shell' && effect.splash === UPGRADES.mortar.changes.attack.splash],
      [strategies.disruption, 'silencer',
        (view, effect) => effect.style === 'shell' &&
          view.enemies.some(enemy => enemy.id === effect.target && enemy.kind === 'herald' && enemy.disrupted > 0)],
    ]) {
      const match = matchWithStaggeredOpening()
      let used = false
      while (match.view.phase === 'build' && !used) {
        plan(match, strategy)
        const specialist = match.view.defenders.find(unit => unit.upgrade === upgrade)
        finish(match, (view, effects) => {
          used ||= effects.some(effect => effect.source === specialist?.id && check(view, effect))
        })
      }
      assert.ok(used, upgrade)
    }
  })
})

it('reuses reproducible seeded schedules across policies and reconciles their ledgers', async () => {
  const { buildReport } = await import('./balance-lab.mjs')
  const args = ['--seeds', '11,29', '--jitter', '8']
  const { report } = buildReport(args)
  assert.deepEqual(buildReport(args).report, report)
  assert.notDeepEqual(report.scenarios[0].schedule, report.scenarios[1].schedule)
  assert.deepEqual(report.reports[0].runs.map(run => run.seed), [11, 29])
  const economy = report.reports.find(policy => policy.name === 'economy').runs[0]
  for (const wave of economy.waves) {
    assert.equal(wave.openingScrap - wave.spent + wave.refunds + wave.clearBonus + wave.income + wave.bounty, wave.scrap)
    assert.equal(Object.values(wave.routedByKind).reduce((total, count) => total + count, 0), wave.losses)
  }
  const { report: fixed } = buildReport([])
  assert.deepEqual(fixed.scenarios[0].schedule, WAVES)
  assert.equal(fixed.reports[0].runs[0].core, run(strategies.economy).core)
})
