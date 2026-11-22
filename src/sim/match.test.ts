import { describe, expect, it } from 'vitest'
import { applyDamage, selectTarget } from './combat'
import { CLEAR_BONUS, CORE_HP, DEFENDERS, STARTING_SCRAP, WAVES } from './data'
import { Match } from './match'

function finishWave(match: Match) {
  expect(match.dispatch({ type: 'start' })).toBeUndefined()
  for (let tick = 0; tick < 2000 && match.view.phase === 'battle'; tick++) match.tick()
  expect(match.view.phase).not.toBe('battle')
}

describe('combat', () => {
  const attacker = { id: 1, lane: 0 as const, x: 100, hp: 10, cooldown: 0 }
  const candidate = { ...attacker, id: 3, x: 130 }
  it('targets the closest live enemy ahead, in range and in the same lane', () => {
    const tie = { ...candidate, id: 2 }
    expect(selectTarget(attacker, [
      { ...candidate, x: 101, lane: 1 }, { ...candidate, x: 99 },
      { ...candidate, x: 105, hp: 0 }, { ...candidate, x: 141 }, candidate, tie,
    ], 40, 1)).toBe(tie)
    expect(selectTarget(attacker, [candidate], 40, -1)).toBeUndefined()
  })

  it('subtracts armor, deals at least one damage and clamps HP at zero', () => {
    const target = { ...candidate }
    applyDamage(target, 8, 5)
    expect(target.hp).toBe(7)
    applyDamage(target, 2, 5)
    expect(target.hp).toBe(6)
    applyDamage(target, 20)
    expect(target.hp).toBe(0)
  })
})

describe('match', () => {
  it('generates scrap on battle ticks and rejects invalid orders without charging', () => {
    const match = new Match()
    const placement = { type: 'place', kind: 'scavenger', lane: 2, slot: 0 } as const
    expect(match.dispatch(placement)).toBeUndefined()
    expect(match.dispatch(placement)).toBeTruthy()
    for (let tick = 0; tick < 100; tick++) match.tick()
    const afterPurchase = STARTING_SCRAP - DEFENDERS.scavenger.cost
    expect(match.view.scrap).toBe(afterPurchase)
    match.dispatch({ type: 'start' })
    expect(match.dispatch({ ...placement, slot: 1 })).toBeTruthy()
    for (let tick = 0; tick < 59; tick++) match.tick()
    expect(match.view.scrap).toBe(afterPurchase)
    expect(match.tick()).toContainEqual({ type: 'income', lane: 2, x: 240, amount: 7 })
    expect(match.view.scrap).toBe(afterPurchase + 7)
  })

  it('waits for the full spawn schedule and requires a manual start for the next wave', () => {
    const match = new Match()
    finishWave(match)
    expect(match.view).toMatchObject({ phase: 'build', wave: 2, core: CORE_HP - 40,
      scrap: STARTING_SCRAP + CLEAR_BONUS, spawned: WAVES[0].length })
    match.tick()
    expect(match.view.phase).toBe('build')
  })

  it('ends an undefended match in defeat and freezes state', () => {
    const match = new Match()
    while (match.view.phase === 'build') finishWave(match)
    expect(match.view.phase).toBe('defeat')
    expect(match.view.core).toBe(0)
    const state = JSON.stringify(match.view)
    expect(match.dispatch({ type: 'start' })).toBeTruthy()
    expect(match.tick()).toEqual([])
    expect(JSON.stringify(match.view)).toBe(state)
  })

  it('wins with an economy opening, reinforced with archers and guards', () => {
    const match = new Match()
    match.dispatch({ type: 'place', kind: 'scavenger', lane: 2, slot: 0 })
    for (const lane of [0, 1] as const) {
      match.dispatch({ type: 'place', kind: 'guard', lane, slot: 3 })
    }
    while (match.view.phase === 'build') {
      if (match.view.wave > 1) {
        for (const lane of [2, 0, 1] as const) {
          match.dispatch({ type: 'place', kind: 'guard', lane, slot: 3 })
          match.dispatch({ type: 'place', kind: 'archer', lane, slot: 2 })
          match.dispatch({ type: 'place', kind: 'archer', lane, slot: 1 })
          match.dispatch({ type: 'place', kind: 'guard', lane, slot: 0 })
        }
      }
      finishWave(match)
    }
    expect(match.view.phase).toBe('victory')
    expect(match.view.wave).toBe(5)
    expect(match.view.core).toBeGreaterThan(0)
  })
})
