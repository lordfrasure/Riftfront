import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { applyDamage, selectTarget } from '../.test-build/combat.js'
import { CLEAR_BONUS, CORE_HP, DEFENDERS, STARTING_SCRAP, WAVES } from '../.test-build/data.js'
import { Match } from '../.test-build/match.js'

function finishWave(match) {
  assert.equal(match.dispatch({ type: 'start' }), undefined)
  const effects = []
  for (let tick = 0; tick < 2000 && match.view.phase === 'battle'; tick++) {
    effects.push(...match.tick())
  }
  assert.notEqual(match.view.phase, 'battle')
  return effects
}

function place(match, kind, lane, slot) {
  return match.dispatch({ type: 'place', kind, lane, slot })
}

function runOpening(opening) {
  const match = new Match()
  for (const [kind, lane, slot] of opening) assert.equal(place(match, kind, lane, slot), undefined)

  const waves = []
  while (match.view.phase === 'build') {
    if (match.view.wave > 1) {
      for (const [kind, slot] of [['guard', 3], ['archer', 2], ['archer', 1], ['guard', 0]]) {
        for (const lane of [2, 0, 1]) place(match, kind, lane, slot)
      }
    }
    const core = match.view.core
    const scrap = match.view.scrap
    const defenders = match.view.defenders.length
    const effects = finishWave(match)
    const report = match.lastWave
    assert.equal(report.coreDamage.reduce((a, b) => a + b, 0), core - match.view.core)
    assert.equal(report.bounty + report.income + report.clearBonus, match.view.scrap - scrap)
    assert.equal(report.losses, defenders - match.view.defenders.length)
    waves.push({ report, effects, view: structuredClone(match.view) })
  }
  return { waves, phase: match.view.phase, core: match.view.core }
}

describe('combat', () => {
  const attacker = { id: 1, lane: 0, x: 100, hp: 10, cooldown: 0 }
  const candidate = { ...attacker, id: 3, x: 130 }

  it('targets the closest live enemy ahead, in range and in the same lane', () => {
    const tie = { ...candidate, id: 2 }
    assert.equal(selectTarget(attacker, [
      { ...candidate, x: 101, lane: 1 }, { ...candidate, x: 99 },
      { ...candidate, x: 105, hp: 0 }, { ...candidate, x: 141 }, candidate, tie,
    ], 40, 1), tie)
    assert.equal(selectTarget(attacker, [candidate], 40, -1), undefined)
  })

  it('subtracts armor, deals at least one damage and clamps HP at zero', () => {
    const target = { ...candidate }
    applyDamage(target, 8, 5)
    assert.equal(target.hp, 7)
    applyDamage(target, 2, 5)
    assert.equal(target.hp, 6)
    applyDamage(target, 20)
    assert.equal(target.hp, 0)
  })
})

describe('match', () => {
  it('generates scrap on battle ticks and rejects invalid orders without charging', () => {
    const match = new Match()
    assert.equal(place(match, 'scavenger', 2, 0), undefined)
    for (const order of [
      ['scavenger', 2, 0], ['scavenger', 3, 0], ['guard', 1, 1.5], ['unknown', 0, 1],
    ]) assert.ok(place(match, ...order))
    assert.ok(match.dispatch({ type: 'unknown', kind: 'guard', lane: 0, slot: 1 }))
    for (let tick = 0; tick < 100; tick++) match.tick()
    const afterPurchase = STARTING_SCRAP - DEFENDERS.scavenger.cost
    assert.equal(match.view.scrap, afterPurchase)
    match.dispatch({ type: 'start' })
    assert.ok(place(match, 'scavenger', 2, 1))
    for (let tick = 0; tick < 59; tick++) match.tick()
    assert.equal(match.view.scrap, afterPurchase)
    assert.deepEqual(match.tick(), [{ type: 'income', lane: 2, x: 240, amount: 7 }])
    assert.equal(match.view.scrap, afterPurchase + 7)
  })

  it('rejects an unaffordable order without changing the formation', () => {
    const match = new Match()
    assert.equal(place(match, 'archer', 0, 3), undefined)
    assert.equal(place(match, 'archer', 1, 3), undefined)
    const before = structuredClone(match.view)
    assert.ok(place(match, 'scavenger', 2, 0))
    assert.deepEqual(match.view, before)
  })

  it('waits for the full schedule, reports leaks by lane and requires a manual start', () => {
    const match = new Match()
    finishWave(match)
    assert.equal(match.view.phase, 'build')
    assert.equal(match.view.wave, 2)
    assert.equal(match.view.core, CORE_HP - 40)
    assert.equal(match.view.scrap, STARTING_SCRAP + CLEAR_BONUS)
    assert.equal(match.view.spawned, WAVES[0].length)
    assert.deepEqual(match.lastWave, {
      wave: 1, kills: 0, bounty: 0, income: 0, losses: 0, clearBonus: CLEAR_BONUS,
      coreDamage: [20, 20, 0],
    })
    match.tick()
    assert.equal(match.view.phase, 'build')
  })

  it('records only actual core damage at defeat and freezes state', () => {
    const match = new Match()
    while (match.view.phase === 'build') {
      const core = match.view.core
      const breaches = finishWave(match).filter(effect => effect.type === 'breach')
      assert.equal(breaches.reduce((total, effect) => total + effect.amount, 0), core - match.view.core)
      assert.equal(match.lastWave.coreDamage.reduce((a, b) => a + b, 0), core - match.view.core)
    }
    assert.equal(match.view.phase, 'defeat')
    assert.equal(match.view.core, 0)
    const state = structuredClone(match.view)
    const report = match.lastWave
    assert.ok(match.dispatch({ type: 'start' }))
    assert.deepEqual(match.tick(), [])
    assert.deepEqual(match.view, state)
    assert.equal(match.lastWave, report)
  })

  it('wins deterministically with an economy opening', () => {
    const opening = [['scavenger', 2, 0], ['guard', 0, 3], ['guard', 1, 3]]
    const first = runOpening(opening)
    assert.equal(first.phase, 'victory')
    assert.equal(first.waves.length, WAVES.length)
    assert.ok(first.waves[0].report.income > 0)
    assert.equal(first.waves[0].report.kills, WAVES[0].length)
    assert.deepEqual(runOpening(opening), first)
  })

  it('also wins with a defense-first opening and no Scavengers', () => {
    const result = runOpening([['guard', 0, 3], ['archer', 1, 2]])
    assert.equal(result.phase, 'victory')
    assert.ok(result.waves.every(({ report }) => report.income === 0))
  })
})
