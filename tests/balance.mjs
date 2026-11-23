import { pathToFileURL } from 'node:url'
import { Match } from '../.test-build/match.js'
import { DEFENDERS, LAYOUTS, STEP_MS } from '../.test-build/data.js'

export const strategies = {
  economy: { opening: [['guard',0,3], ['guard',1,3], ['scavenger',0,0]], guard: 'bastion', archer: 'longshot', support: 'mender' },
  defense: { opening: [['guard',0,3], ['guard',1,3], ['lobber',0,2]], guard: 'vanguard', archer: 'volley', support: 'conductor' },
  balanced: { opening: [['guard',0,3], ['guard',1,3], ['archer',1,2]], guard: 'bastion', archer: 'volley', support: 'conductor' },
  artillery: { opening: [['guard',0,3], ['guard',1,3], ['lobber',1,2]], guard: 'vanguard', archer: 'longshot', support: 'mender', splash: true },
  evolution: { opening: [['guard',0,3], ['guard',1,3], ['archer',1,2]], guard: 'bastion', archer: 'longshot', support: 'mender', construct: 'relay' },
  fusion: { opening: [['guard',0,3], ['guard',1,3], ['mender',1,2]], guard: 'bastion', archer: 'longshot', support: 'mender', fusion: true },
  disruption: { opening: [['guard',0,3], ['guard',1,3], ['saboteur',1,2]], guard: 'bastion', archer: 'longshot', support: 'mender', disrupt: true },
  empty: { opening: [] },
}

export function plan(match, strategy, dispatch = command => match.dispatch(command)) {
  const { layout } = match
  const columns = strategy.columns ?? (layout.slots.length === 7 ? [0, 2, 4, 6] : [0, 2, 3, 5])
  const put = (kind, lane, slot) => {
    if (kind === strategy.exclude) return
    return dispatch({ type: 'place', kind, lane, slot })
  }
  const place = (kind, lane, slot) => {
    return put(kind, lane, columns[slot])
  }
  const { wave } = match.view
  if (wave === 1) {
    for (const order of strategy.opening) {
      const [kind, lane, slot] = order
      const error = (strategy.fusion || strategy.fusionInputs) && kind === 'mender' ? put(kind, lane, columns[3] - 1) : place(...order)
      if (error) throw Error(error)
    }
    return
  }
  if (!strategy.guard || wave > (strategy.lastPurchaseWave ?? Infinity)) return
  const unitAt = (lane, slot) => match.view.defenders.find(unit => unit.lane === lane && unit.slot === columns[slot])
  const upgrade = (lane, slot, branch) => {
    const unit = unitAt(lane, slot)
    if (branch && unit && !unit.upgrade) dispatch({ type: 'upgrade', id: unit.id, upgrade: branch })
  }
  const lanes = wave === 10 ? [1, 0, 2] : wave <= 2 || wave === 5 ? [2, 1, 0] : [0, 2, 1]
  if (layout.lanes.length === 4) lanes.push(3)
  if (strategy.fusion || strategy.fusionInputs) {
    const fuse = (first, second) => {
      if (strategy.fusion && first && second) dispatch({ type: 'fuse', first: first.id, second: second.id })
    }
    const front = unitAt(1, 3)
    const healer = match.view.defenders.find(unit => unit.lane === 1 && unit.kind === 'mender' && unit.slot === columns[3] - 1)
    fuse(front, healer)
    if (wave >= 6 && !match.view.defenders.some(unit => unit.kind === 'arcRanger')) {
      const archer = unitAt(1, 2)
      if (archer?.kind === 'archer' && !archer.upgrade) {
        put('conductor', 1, columns[2] - 1)
        fuse(archer, match.view.defenders.find(unit => unit.kind === 'conductor' && unit.lane === 1 && unit.slot === columns[2] - 1))
      }
    }
  }
  if (strategy.construct && strategy.construct !== 'relay') {
    if (wave >= (strategy.coilWave ?? 4)) dispatch({ type: 'advance', era: 'coil' })
    upgrade(0, strategy.construct === 'bulwark' ? 3 : 2, strategy.construct)
  }
  if (strategy.disrupt && wave >= 5) upgrade(1, 2, 'silencer')
  for (const lane of lanes) place('guard', lane, 3)
  if (wave >= (strategy.coilWave ?? 4)) dispatch({ type: 'advance', era: 'coil' })
  for (const lane of lanes) {
    const enemies = match.waves[wave - 1].spawns.filter(spawn => spawn.lane === lane)
    const swarm = enemies.filter(spawn => spawn.kind === 'skitter').length >= 5
    place(swarm || strategy.splash && lane !== 1 ? 'lobber' : 'archer', lane, 2)
    if (wave >= 4) upgrade(lane, 3, wave === 10 && lane === 1 ? 'bastion' : strategy.guard)
  }
  if (wave >= 4) {
    for (const lane of lanes) {
      if ((!strategy.fusion && !strategy.fusionInputs) || lane !== 1) upgrade(lane, 2, strategy.archer)
      const support = wave === 10 && lane === 1 ? 'mender' : strategy.support
      if (support === 'mender' && !strategy.fusion && !strategy.fusionInputs && wave < 10) put(support, lane, columns[3] - 1)
      else place(support, lane, 1)
    }
  }
  if (wave >= 8 && strategy.support === 'conductor') {
    const support = unitAt(1, 1)
    if (support && support.kind !== 'mender') dispatch({ type: 'retire', id: support.id })
    place('mender', 1, 1)
  }
  if (wave === 9 && strategy.splash) {
    const escort = unitAt(1, 2)
    if (escort?.kind === 'lobber') dispatch({ type: 'retire', id: escort.id })
    place('archer', 1, 2)
    upgrade(1, 2, 'longshot')
  }
  if (wave === 10) {
    const front = unitAt(1, 3)
    if (front?.upgrade === 'vanguard') {
      dispatch({ type: 'retire', id: front.id })
      place('guard', 1, 3)
      upgrade(1, 3, 'bastion')
    }
    const backup = unitAt(1, 0)
    if (backup && backup.kind !== 'archer') dispatch({ type: 'retire', id: backup.id })
    place('archer', 1, 0)
    upgrade(1, 0, 'longshot')
  }
  if (strategy.construct === 'relay' && wave >= 6) {
    const slot = columns[2] - 1
    put('chassis', 0, slot)
    const frame = match.view.defenders.find(unit => unit.lane === 0 && unit.slot === slot)
    if (frame?.kind === 'chassis' && !frame.upgrade) dispatch({ type: 'upgrade', id: frame.id, upgrade: 'relay' })
  }
  if (strategy.fusion && wave >= 7) {
    upgrade(1, 3, 'wardplate')
    upgrade(1, 2, 'arcLance')
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

export function resolve(match, onTick) {
  const error = match.dispatch({ type: 'start' })
  if (error) throw Error(error)
  for (let tick = 0; tick < 3000 && match.view.phase === 'battle'; tick++) {
    const effects = match.tick()
    onTick?.(effects)
  }
  if (match.view.phase === 'battle') throw Error('Wave did not resolve.')
  return match.lastWave
}

export function run(strategy, layout) {
  const match = new Match(layout)
  const waves = []
  while (match.view.phase === 'build') {
    plan(match, strategy)
    const report = resolve(match)
    waves.push({ ...report, core: match.view.core, scrap: match.view.scrap })
  }
  return { waves, phase: match.view.phase, core: match.view.core, formation: structuredClone(match.view.defenders) }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  if (process.argv.includes('--lab')) {
    import('./balance-lab.mjs').then(({ main }) => main(process.argv.slice(2))).catch(error => {
      console.error(error.message)
      process.exitCode = 1
    })
  } else {
    legacy()
  }
}

function legacy() {
  if (process.argv.includes('--sweep')) {
    const scenarios = {
      economy: strategies.economy,
      aggressive: strategies.artillery,
      ranged: { ...strategies.balanced, archer: 'longshot' },
      fusion: strategies.fusion,
      anchor: { ...strategies.evolution, opening: [['chassis',0,3], ['guard',1,3], ['archer',0,2]], construct: 'bulwark' },
      relay: strategies.evolution,
      mortar: { ...strategies.evolution, opening: [['guard',0,3], ['guard',1,3], ['chassis',0,2]], construct: 'mortar' },
      disruption: strategies.disruption,
    }
    console.table(Object.entries(LAYOUTS).flatMap(([layout, geometry]) =>
      Object.entries(scenarios).map(([name, strategy]) => {
        const { phase, waves, core, formation } = run(strategy, geometry)
        const damage = {}
        for (const wave of waves) {
          for (const [kind, amount] of Object.entries(wave.damage)) damage[kind] = (damage[kind] ?? 0) + amount
        }
        return { layout, name, phase, core, wave: waves.length, scrap: waves.at(-1).scrap,
          seconds: Math.round(waves.reduce((total, wave) => total + wave.ticks, 0) * STEP_MS / 1000),
          standing: formation.filter(unit => unit.hp > 0).length,
          linked: waves.reduce((total, wave) => total + wave.synergyActions, 0),
          fusion: formation.filter(unit => DEFENDERS[unit.kind].fused).length,
          damage: Object.entries(damage).map(([kind, amount]) => `${kind}=${amount}`).join(' ') }
      })))

    const rows = []
    for (const [opening, strategy] of Object.entries(strategies).filter(([name]) => ['economy', 'defense', 'balanced', 'artillery'].includes(name))) {
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
