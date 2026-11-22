import { pathToFileURL } from 'node:url'
import { Match } from '../.test-build/match.js'
import { DEFENDERS, STEP_MS, WAVES } from '../.test-build/data.js'

export const strategies = {
  economy: { opening: [['guard',0,3], ['guard',1,3], ['scavenger',0,0]], guard: 'bastion', archer: 'longshot', support: 'mender' },
  defense: { opening: [['guard',0,3], ['guard',1,3], ['lobber',0,2]], guard: 'vanguard', archer: 'volley', support: 'conductor' },
  balanced: { opening: [['guard',0,3], ['guard',1,3], ['archer',1,2]], guard: 'bastion', archer: 'volley', support: 'conductor' },
  artillery: { opening: [['guard',0,3], ['guard',1,3], ['lobber',1,2]], guard: 'vanguard', archer: 'longshot', support: 'mender', splash: true },
  empty: { opening: [] },
}

export function plan(match, strategy) {
  const place = (kind, lane, slot) => {
    if (kind === strategy.exclude) return
    return match.dispatch({ type: 'place', kind, lane, slot })
  }
  const { wave } = match.view
  if (wave === 1) {
    for (const order of strategy.opening) {
      const error = place(...order)
      if (error) throw Error(error)
    }
    return
  }
  if (!strategy.guard) return
  const unitAt = (lane, slot) => match.view.defenders.find(unit => unit.lane === lane && unit.slot === slot)
  const upgrade = (lane, slot, branch) => {
    const unit = unitAt(lane, slot)
    if (unit && !unit.upgrade) match.dispatch({ type: 'upgrade', id: unit.id, upgrade: branch })
  }
  const lanes = wave === 10 ? [1, 0, 2] : wave <= 2 || wave === 5 ? [2, 1, 0] : [0, 2, 1]
  for (const lane of lanes) place('guard', lane, 3)
  if (wave >= 4) match.dispatch({ type: 'advance', era: 'coil' })
  for (const lane of lanes) {
    const enemies = WAVES[wave - 1].spawns.filter(spawn => spawn.lane === lane)
    const swarm = enemies.filter(spawn => spawn.kind === 'skitter').length >= 5
    place(swarm || strategy.splash && lane !== 1 ? 'lobber' : 'archer', lane, 2)
    if (wave >= 4) upgrade(lane, 3, wave === 10 && lane === 1 ? 'bastion' : strategy.guard)
  }
  if (wave >= 4) {
    for (const lane of lanes) {
      upgrade(lane, 2, strategy.archer)
      place(wave === 10 && lane === 1 ? 'mender' : strategy.support, lane, 1)
    }
  }
  if (wave >= 8 && strategy.support === 'conductor') {
    const support = unitAt(1, 1)
    if (support && support.kind !== 'mender') match.dispatch({ type: 'retire', id: support.id })
    place('mender', 1, 1)
  }
  if (wave === 9 && strategy.splash) {
    const escort = unitAt(1, 2)
    if (escort?.kind === 'lobber') match.dispatch({ type: 'retire', id: escort.id })
    place('archer', 1, 2)
    upgrade(1, 2, 'longshot')
  }
  if (wave === 10) {
    const front = unitAt(1, 3)
    if (front?.upgrade === 'vanguard') {
      match.dispatch({ type: 'retire', id: front.id })
      place('guard', 1, 3)
      upgrade(1, 3, 'bastion')
    }
    const backup = unitAt(1, 0)
    if (backup && backup.kind !== 'archer') match.dispatch({ type: 'retire', id: backup.id })
    place('archer', 1, 0)
    upgrade(1, 0, 'longshot')
  }
  if (wave >= 6) {
    for (const lane of lanes) {
      place('archer', lane, 1)
      if (wave === 10 && lane === 1) place('mender', lane, 0)
      place('archer', lane, 0)
      upgrade(lane, 1, strategy.archer)
      upgrade(lane, 0, 'longshot')
    }
  }
}

export function resolve(match) {
  const error = match.dispatch({ type: 'start' })
  if (error) throw Error(error)
  for (let tick = 0; tick < 3000 && match.view.phase === 'battle'; tick++) match.tick()
  if (match.view.phase === 'battle') throw Error('Wave did not resolve.')
  return match.lastWave
}

export function run(strategy) {
  const match = new Match()
  const waves = []
  while (match.view.phase === 'build') {
    plan(match, strategy)
    const report = resolve(match)
    waves.push({ ...report, core: match.view.core, scrap: match.view.scrap })
  }
  return { waves, phase: match.view.phase, core: match.view.core, formation: structuredClone(match.view.defenders) }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  if (process.argv.includes('--sweep')) {
    const rows = []
    for (const [opening, strategy] of Object.entries(strategies).filter(([, value]) => value.guard)) {
      for (const guard of ['bastion', 'vanguard']) {
        for (const archer of ['volley', 'longshot']) {
          for (const support of ['conductor', 'mender']) {
            const result = run({ ...strategy, guard, archer, support })
            rows.push({ opening, guard, archer, support, result: result.phase,
              lastWave: result.waves.length, core: result.core, scrap: result.waves.at(-1).scrap })
          }
        }
      }
    }
    console.table(rows)
    console.table(Object.keys(DEFENDERS).map(exclude => {
      const opening = exclude === 'conductor' ? 'balanced' : 'economy'
      const { phase, waves, core } = run({ ...strategies[opening], exclude })
      return { opening, excluded: exclude, result: phase, lastWave: waves.length, core }
    }))
  }
  for (const [name, strategy] of Object.entries(strategies)) {
    const runResult = run(strategy)
    console.log(name, runResult.phase, runResult.core)
    console.table(runResult.waves.map(({ wave, ticks, core, coreDamage, losses, income, scrap }) =>
      ({ wave, seconds: ticks * STEP_MS / 1000, core, leaks: coreDamage.join('/'), routed: losses, income, scrap })))
  }
}
