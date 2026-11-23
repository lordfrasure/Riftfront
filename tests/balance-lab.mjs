import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { Match } from '../.test-build/match.js'
import { LAYOUTS, OVERTIME_TICK, STEP_MS, profile } from '../.test-build/data.js'
import { plan, resolve, strategies } from './balance.mjs'

const guards = strategies.economy.opening.slice(0, 2)
const baseline = {
  economy: strategies.economy,
  guardOnlyOpening: { ...strategies.economy, opening: guards },
  combatOpening: { ...strategies.economy, opening: [...guards, ['archer', 1, 2]] },
  doubleSalvage: { ...strategies.economy, opening: [guards[0], ['chassis', 1, 3], ['scavenger', 0, 0], ['scavenger', 1, 0]] },
  artillery: strategies.artillery,
  balanced: strategies.balanced,
  relay: strategies.evolution,
  fusion: strategies.fusion,
  separate: { ...strategies.fusion, fusion: false, fusionInputs: true },
  disruption: strategies.disruption,
  noLobber: { ...strategies.economy, exclude: 'lobber' },
  noMender: { ...strategies.economy, exclude: 'mender' },
  noCoil: { ...strategies.economy, coilWave: 11 },
  vanguard: { ...strategies.economy, guard: 'vanguard' },
  volley: { ...strategies.economy, archer: 'volley' },
  rearward: { ...strategies.economy, columns: [0, 1, 2, 4] },
  rangedOpening: { ...strategies.economy, opening: [['archer', 0, 2], ['archer', 1, 2], ['archer', 0, 1]] },
  frontOnly: { opening: [...guards, ['guard', 0, 2]] },
  underspend: { ...strategies.economy, lastPurchaseWave: 3 },
  empty: strategies.empty,
}

const sum = values => values.reduce((total, value) => total + value, 0)
const mean = values => values.length ? sum(values) / values.length : null

function scenarioWaves(layout, seed, jitter) {
  if (!jitter) return
  let state = seed >>> 0
  const offset = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return Math.floor(state / 2 ** 32 * (2 * jitter + 1)) - jitter
  }
  return new Match(layout).waves.map(wave => ({
    ...wave,
    spawns: wave.spawns.map(spawn => ({ ...spawn, tick: Math.max(1, spawn.tick + offset()) }))
      .sort((a, b) => a.tick - b.tick),
  }))
}

function trial(strategy, layout, schedule) {
  const match = new Match(layout, schedule)
  const waves = []
  while (match.view.phase === 'build') {
    const { wave, scrap: openingScrap } = match.view
    const orders = []
    let spent = 0
    let refunds = 0
    const dispatch = order => {
      const before = match.view.scrap
      const error = match.dispatch(order)
      const cost = before - match.view.scrap
      spent += Math.max(0, cost)
      refunds += Math.max(0, -cost)
      orders.push({ ...order, cost, ...(error ? { error } : {}) })
      return error
    }
    if (strategy.opening && (wave === 1 || !strategy.ordersBeforeFollowup)) plan(match, strategy, dispatch)
    for (const order of strategy.orders?.[wave] ?? []) {
      if (order.type === 'start') throw Error('The laboratory starts each wave automatically.')
      const error = dispatch(order)
      if (error) throw Error(`Wave ${wave}: ${JSON.stringify(order)}: ${error}`)
    }
    if (strategy.opening && wave > 1 && strategy.ordersBeforeFollowup) plan(match, strategy, dispatch)
    const creatures = match.waves[wave - 1].spawns
    const formation = match.view.defenders.map(({ id, kind, lane, slot, upgrade }) => ({ id, kind, lane, slot, upgrade }))
    const byId = new Map(formation.map(unit => [unit.id, unit]))
    const interceptors = layout.lanes.map((_, lane) => new Set(
      formation.filter(unit => unit.lane === lane && profile(unit).advance).map(unit => unit.id),
    ))
    const frontlineCollapseTicks = layout.lanes.map(() => null)
    const routedByKind = {}
    const damageTakenByKind = {}
    let activeTicks = 0
    let ticks = 0
    const report = resolve(match, effects => {
      ticks++
      if (effects.some(effect => effect.type === 'hit' || effect.type === 'blast' || effect.type === 'breach')) activeTicks++
      for (const effect of effects) {
        if (effect.type === 'fall') {
          const unit = byId.get(effect.id)
          if (unit) {
            routedByKind[unit.kind] = (routedByKind[unit.kind] ?? 0) + 1
            const line = interceptors[unit.lane]
            if (line.delete(unit.id) && line.size === 0) frontlineCollapseTicks[unit.lane] = ticks
          }
        }
        if (effect.type === 'hit' && effect.style !== 'heal') {
          const unit = byId.get(effect.target)
          if (!unit) continue
          damageTakenByKind[unit.kind] = (damageTakenByKind[unit.kind] ?? 0) + effect.amount
        }
      }
    })
    waves.push({ ...report, openingScrap, spent, refunds, bankAtStart: openingScrap - spent + refunds,
      core: match.view.core, scrap: match.view.scrap, scheduled: creatures.length,
      cleared: match.view.phase !== 'defeat', activeTicks, routedByKind, directHitDamageTaken: damageTakenByKind,
      formation, orders, frontlineCollapseTicks })
  }
  const spending = sum(waves.map(wave => wave.spent))
  const damage = sum(waves.flatMap(wave => Object.values(wave.damage)))
  return {
    phase: match.view.phase, core: match.view.core, waves,
    cleared: waves.filter(wave => wave.cleared).length,
    totals: {
      spending, damage, refunds: sum(waves.map(wave => wave.refunds)),
      damagePerScrap: spending ? damage / spending : null,
      salvage: sum(waves.map(wave => wave.income)),
      bounty: sum(waves.map(wave => wave.bounty)),
      grants: sum(waves.map(wave => wave.clearBonus)),
      scrap: match.view.scrap,
      losses: sum(waves.map(wave => wave.losses)),
      seconds: sum(waves.map(wave => wave.ticks)) * STEP_MS / 1000,
      overtimeWaves: waves.filter(wave => wave.ticks >= OVERTIME_TICK).length,
    },
  }
}

function summarize(runs) {
  const avg = read => mean(runs.map(read).filter(value => value !== null))
  const wins = runs.filter(run => run.phase === 'victory').length
  return {
    trials: runs.length, wins, winRate: wins / runs.length, core: avg(run => run.core),
    ...Object.fromEntries(Object.keys(runs[0].totals).map(key => [key, avg(run => run.totals[key])])),
    waves: runs[0].scenario.schedule.map((_, index) => {
      const reached = runs.flatMap(run => run.waves[index] ? [run.waves[index]] : [])
      return {
        wave: index + 1, reached: reached.length, cleared: reached.filter(wave => wave.cleared).length,
        coreDamage: mean(reached.map(wave => sum(wave.coreDamage))),
        losses: mean(reached.map(wave => wave.losses)),
        seconds: mean(reached.map(wave => wave.ticks * STEP_MS / 1000)),
      }
    }),
  }
}

export function buildReport(args) {
  const { values } = parseArgs({ args, options: {
    lab: { type: 'boolean' }, json: { type: 'boolean' }, config: { type: 'string' },
    layout: { type: 'string' }, wave: { type: 'string' }, lane: { type: 'string' }, seeds: { type: 'string' }, jitter: { type: 'string' },
  } })
  const layout = values.layout ?? 'seven'
  const geometry = Object.hasOwn(LAYOUTS, layout) && LAYOUTS[layout]
  const seeds = values.seeds === undefined ? [null] : values.seeds.split(',').map(value => value.trim() ? Number(value) : NaN)
  const encounter = values.wave === undefined ? undefined : Number(values.wave)
  if (encounter !== undefined && (!Number.isInteger(encounter) || !new Match().waves[encounter - 1])) {
    throw Error('Use a valid campaign wave number.')
  }
  const lane = values.lane === undefined ? undefined : Number(values.lane) - 1
  if (lane !== undefined && (encounter === undefined || !geometry || !Number.isInteger(lane) || !geometry.lanes[lane])) {
    throw Error('Use a valid one-based lane with --wave.')
  }
  const jitter = Number(values.jitter ?? (values.seeds === undefined ? 0 : 8))
  if (!geometry || new Set(seeds).size !== seeds.length ||
      seeds.some(seed => seed !== null && (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)) ||
      !Number.isInteger(jitter) || jitter < 0 || jitter > 1000 || (jitter && seeds[0] === null)) {
    throw Error('Use a known layout, unique unsigned 32-bit seeds, and integer jitter from 0 to 1000. Jitter requires seeds.')
  }
  const config = values.config ? JSON.parse(readFileSync(values.config, 'utf8')) : baseline
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw Error('Expected a policy object.')
  const policies = Object.fromEntries(Object.entries(config).map(([name, { preset, ...overrides }]) => {
    if (preset !== undefined && !Object.hasOwn(baseline, preset) && !Object.hasOwn(strategies, preset)) {
      throw Error(`Unknown preset for ${name}: ${preset}`)
    }
    return [name, { ...baseline[preset], ...strategies[preset], ...overrides }]
  }))
  if (!Object.keys(policies).length) throw Error('Provide at least one policy.')
  const scenarios = seeds.map(seed => {
    const waves = scenarioWaves(geometry, seed, jitter) ?? new Match(geometry).waves
    if (encounter === undefined) return { seed, schedule: waves }
    const wave = waves[encounter - 1]
    return { seed, schedule: [lane === undefined ? wave : { ...wave, spawns: wave.spawns.filter(spawn => spawn.lane === lane) }] }
  })
  const reports = Object.entries(policies).map(([name, policy]) => {
    const runs = scenarios.map(scenario => ({ ...trial(policy, geometry, scenario.schedule), scenario }))
    return { name, policy, summary: summarize(runs), runs: runs.map(({ scenario, ...run }) => ({ seed: scenario.seed, ...run })) }
  })
  return { format: values.json ? 'json' : 'table', report: { version: 1, layout, jitter, encounter, lane, scenarios, reports } }
}

export function main(args) {
  const { format, report } = buildReport(args)
  const { reports } = report
  if (format === 'json') {
    console.log(JSON.stringify(report, null, 2))
  } else {
    console.table(reports.map(({ name, summary }) => ({
      name, wins: `${summary.wins}/${summary.trials}`, core: summary.core.toFixed(1),
      bank: summary.scrap.toFixed(1), spent: summary.spending.toFixed(1), salvage: summary.salvage.toFixed(1),
      damagePerScrap: summary.damagePerScrap?.toFixed(2), routed: summary.losses.toFixed(1),
      seconds: summary.seconds.toFixed(1),
    })))
    for (const { name, summary } of reports) {
      console.log(name)
      console.table(summary.waves)
    }
  }
}
