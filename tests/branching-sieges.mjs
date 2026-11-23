import { pathToFileURL } from 'node:url'
import { DEFENDERS, profile, LAYOUTS } from '../.test-build/data.js'
import { Match } from '../.test-build/match.js'
import { plan, resolve, strategies } from './balance.mjs'

const seeds = [11, 29, 47, 83, 101]
const builds = {
  legacy: { opening: strategies.economy, legacy: true },
  shields: { opening: strategies.defense, reward: 'shield', guard: 'bastion', archer: 'longshot', fusion: true },
  precision: { opening: { ...strategies.balanced, opening: [['guard', 0, 3], ['guard', 1, 3], ['archer', 0, 2]] },
    reward: 'precision', guard: 'vanguard', archer: 'longshot' },
  foundry: { opening: { opening: [['chassis', 0, 3], ['guard', 1, 3]] },
    reward: 'foundry', guard: 'bastion', archer: 'longshot', construct: true },
  economy: { opening: { opening: [['guard', 0, 3], ['guard', 1, 3], ['scavenger', 1, 0]] },
    reward: 'scrap', guard: 'bastion', archer: 'volley' },
  mismatched: { opening: strategies.defense, reward: 'foundry', guard: 'vanguard', archer: 'volley', poor: true },
}

function prepare(match, build, orders, overrides) {
  const { wave } = match.view
  const dispatch = order => {
    const before = match.view.scrap
    const error = match.dispatch(order)
    if (!error) orders.push({ ...order, spend: before - match.view.scrap })
    return error
  }
  const offers = match.siege?.offers ?? []
  if (offers.length) {
    const preferred = offers.findIndex(offer => offer.reward === build.reward)
    const choice = build.poor ? 1 : match.view.core < 70 && offers[0].reward === 'repair'
      ? 0 : Math.max(0, preferred)
    dispatch({ type: 'route', choice: overrides[wave] ?? choice })
  }
  if (wave === 1) {
    plan(match, build.opening, dispatch)
    if (build.construct) dispatch({ type: 'upgrade', id: 1, upgrade: 'bulwark' })
    return
  }
  if (build.legacy) {
    plan(match, build.opening, dispatch)
    return
  }

  const units = () => match.view.defenders
  const laneUnits = lane => units().filter(unit => unit.lane === lane)
  const available = (lane, slots) => slots.find(slot => !laneUnits(lane).some(unit => unit.slot === slot))
  const place = (lane, kind, slots) => {
    const slot = available(lane, slots)
    if (slot !== undefined) dispatch({ type: 'place', kind, lane, slot })
  }
  const threat = match.waves[wave - 1].spawns
  const lanes = LAYOUTS.seven.lanes.map((_, lane) => ({
    lane,
    swarm: threat.filter(spawn => spawn.lane === lane && spawn.kind === 'skitter').length,
    armor: threat.filter(spawn => spawn.lane === lane && ['colossus', 'herald', 'ram'].includes(spawn.kind)).length,
    count: threat.filter(spawn => spawn.lane === lane).length,
  })).sort((a, b) => (b.count + 3 * b.armor) - (a.count + 3 * a.armor))
  const recover = (lane, predicate, slots) => {
    if (build.poor) return
    const entry = match.siege?.reserve.filter(({ unit }) => predicate(unit))
      .sort((a, b) => a.readyWave - b.readyWave || Number(b.unit.lane === lane) - Number(a.unit.lane === lane))[0]
    const slot = available(lane, slots)
    if (!entry || slot === undefined) return
    if (entry.readyWave > wave && dispatch({ type: 'repair', id: entry.unit.id })) return
    dispatch({ type: 'activate', id: entry.unit.id, lane, slot })
  }
  if (!build.poor && wave >= 5) {
    for (const unit of units().filter(unit => unit.kind === 'scavenger')) dispatch({ type: 'reserve', id: unit.id })
  }
  for (const { lane, count } of lanes) {
    if (!count || laneUnits(lane).some(unit => profile(unit).advance)) continue
    recover(lane, unit => profile(unit).advance, [6, 5, 4])
    if (!laneUnits(lane).some(unit => profile(unit).advance)) place(lane, 'guard', [6, 5, 4])
  }
  for (const { lane, swarm, count } of lanes) {
    const ranged = unit => profile(unit).attack && !profile(unit).advance
    if (!count || laneUnits(lane).some(ranged)) continue
    recover(lane, ranged, [4, 3, 2, 1])
    if (!laneUnits(lane).some(ranged)) place(lane, swarm >= 5 && !build.poor ? 'lobber' : 'archer', [4, 3, 2, 1])
  }
  if (wave >= 4) dispatch({ type: 'advance', era: 'coil' })
  if (wave >= 5 && !build.poor) {
    for (const { lane, armor, swarm } of lanes) {
      const wrong = laneUnits(lane).find(unit => armor >= 4 ? unit.kind === 'lobber' : swarm >= 8 &&
        unit.kind === 'archer' && unit.upgrade !== 'volley')
      if (!wrong || laneUnits(lane).filter(unit => profile(unit).attack && !profile(unit).advance).length > 1) continue
      const kind = armor >= 4 ? 'archer' : 'lobber'
      if (match.view.scrap < DEFENDERS[kind].cost) continue
      dispatch({ type: 'reserve', id: wrong.id })
      recover(lane, unit => unit.kind === kind, [4, 3, 2])
      if (!laneUnits(lane).some(unit => unit.kind === kind)) place(lane, kind, [4, 3, 2])
    }
  }
  for (const { lane, swarm, armor } of lanes) {
    const line = laneUnits(lane).find(unit => profile(unit).advance)
    const ranged = laneUnits(lane).find(unit => unit.kind === 'archer')
    if (build.fusion && (armor >= 4 || wave === 3) && line?.kind === 'guard' && !line.upgrade && line.slot > 0) {
      const rear = line.slot - 1
      place(lane, 'mender', [rear])
      const healer = laneUnits(lane).find(unit => unit.slot === rear && unit.kind === 'mender')
      if (healer) dispatch({ type: 'fuse', first: line.id, second: healer.id })
    }
    if (line?.kind === 'wardkeeper') dispatch({ type: 'upgrade', id: line.id, upgrade: 'wardplate' })
    if (line?.kind === 'guard') dispatch({ type: 'upgrade', id: line.id,
      upgrade: wave === 10 && lane === 1 ? 'bastion' : build.guard })
    if (ranged) dispatch({ type: 'upgrade', id: ranged.id,
      upgrade: !build.poor && armor >= 2 ? 'longshot' : swarm >= 6 ? 'volley' : build.archer })
    if (build.construct && wave >= 4) {
      const artillery = laneUnits(lane).find(unit => unit.kind === 'chassis' && !unit.upgrade)
      if (artillery) dispatch({ type: 'upgrade', id: artillery.id, upgrade: 'mortar' })
    }
    if (wave >= 4 && !laneUnits(lane).some(unit => unit.kind === 'mender') &&
        (!build.fusion || line?.kind !== 'wardkeeper' || armor >= 4 || wave >= 8)) {
      recover(lane, unit => unit.kind === 'mender', [3, 2, 1])
      if (!laneUnits(lane).some(unit => unit.kind === 'mender')) place(lane, 'mender', [3, 2, 1])
    }
  }
  if (!build.poor && wave >= 8) {
    const priority = lanes[0].lane
    const support = units().find(unit => unit.lane !== priority && unit.kind === 'mender')
    const needed = wave === 10 ? 5 : 4
    if (support && (match.siege?.capacity ?? 21) === units().length && laneUnits(priority).length < needed) {
      dispatch({ type: 'reserve', id: support.id })
    }
  }
  if (wave >= 5) for (const { lane, armor, swarm } of lanes) {
    const kind = armor >= 3 && !build.poor && !laneUnits(lane).some(unit => unit.kind === 'conductor')
      ? 'conductor' : swarm >= 7 && !build.poor && !laneUnits(lane).some(unit => unit.kind === 'lobber') ? 'lobber' : 'archer'
    recover(lane, unit => unit.kind === kind, [2, 1, 0])
    if ((match.siege?.capacity ?? 21) > units().length) place(lane, kind, [2, 1, 0])
    const reserve = laneUnits(lane).find(unit => unit.kind === 'archer' && !unit.upgrade)
    if (reserve) dispatch({ type: 'upgrade', id: reserve.id, upgrade: 'longshot' })
  }
}

const isolated = { capacity: false, recovery: false, routes: false, economy: false, timing: false }
const modes = {
  control: undefined,
  capacity: { ...isolated, capacity: true },
  recovery: { ...isolated, recovery: true },
  routes: { ...isolated, routes: true },
  economy: { ...isolated, economy: true },
  timing: { ...isolated, timing: true },
  combined: {},
}

export function simulate(name, seed, mode = 'combined', overrides = {}) {
  const match = new Match(undefined, undefined, mode === 'control' ? undefined : seed, modes[mode])
  const waves = []
  while (match.view.phase === 'build') {
    const orders = []
    prepare(match, builds[name], orders, overrides)
    const formation = match.view.defenders.map(unit => ({ ...unit }))
    const report = resolve(match)
    waves.push({ ...report, orders, formation, core: match.view.core, scrap: match.view.scrap,
      reserve: match.siege?.reserve.map(entry => ({ ...entry, unit: { ...entry.unit } })) })
  }
  return { name, seed, mode, phase: match.view.phase, core: match.view.core, routes: match.siege?.routes, waves }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--fork')) {
    const forks = Object.keys(builds).filter(name => !builds[name].legacy && !builds[name].poor).flatMap(name =>
      seeds.flatMap(seed => [0, 1].map(choice => {
        const run = simulate(name, seed, 'combined', { 3: choice })
        return { name, seed, choice, front: run.routes[0]?.title, wave4Core: run.waves[3]?.core,
          wave4Routes: run.waves[3]?.losses, wave4Scrap: run.waves[3]?.scrap, finalCore: run.core }
      })))
    console.table(forks)
  } else {
    const runs = Object.keys(modes).flatMap(mode => Object.keys(builds).flatMap(name =>
      seeds.map(seed => simulate(name, seed, mode))))
    if (process.argv.includes('--json')) console.log(JSON.stringify(runs))
    else for (const mode of Object.keys(modes)) {
      console.log(mode)
      console.table(Object.keys(builds).map(name => {
        const group = runs.filter(run => run.mode === mode && run.name === name)
        return { name, wins: group.filter(run => run.phase === 'victory').length, finalCore: group.map(run => run.core).join(', '),
          reached: group.map(run => run.waves.length).join(', ') }
      }))
    }
  }
}
