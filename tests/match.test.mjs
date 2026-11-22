import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { applyDamage, selectTarget } from '../.test-build/combat.js'
import { CORE_HP, DEFENDERS, ENEMIES, ERAS, LANES, OVERTIME_TICK, SALVAGE_PAYOUT, SCAVENGER_LIMIT, SLOTS, UPGRADES, WAVES, profile } from '../.test-build/data.js'
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

  it('plays distinct winning runs and produces deterministic results', () => {
    const economy = run(strategies.economy)
    const artillery = run(strategies.artillery)
    for (const result of [economy, artillery]) {
      assert.equal(result.phase, 'victory')
      assert.equal(result.waves.length, WAVES.length)
    }
    assert.ok(economy.waves[0].income > 0)
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
    const match = new Match()
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
