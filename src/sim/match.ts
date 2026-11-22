import { applyDamage, selectTarget, type Combatant } from './combat.js'
import {
  ARMOR_EXPOSURE, CORE_HP, CORE_X, DEFENDERS, ENEMIES, ENTRY_X, ERAS, HERALD_ARMOR, LANES, SALVAGE_PAYOUT, SCAVENGER_LIMIT,
  OVERTIME_DAMAGE, OVERTIME_RAMP, OVERTIME_TICK, SLOTS, STARTING_SCRAP, STEP_MS, UPGRADES, WAVES, profile,
  type Attack, type DefenderKind, type EnemyKind, type Era, type Lane, type Slot, type UpgradeKind,
} from './data.js'

export const REDEPLOY_COST = 8

export interface Defender extends Combatant { kind: DefenderKind; slot: Slot; upgrade?: UpgradeKind }
export interface Enemy extends Combatant {
  kind: EnemyKind
  slow: number
  expose: number
  charged: boolean
  pulseAt: number
  pulseX?: number
}

interface WaveReport {
  wave: number
  ticks: number
  kills: number
  bounty: number
  income: number
  losses: number
  clearBonus: number
  coreDamage: [number, number, number]
}

export type Phase = 'build' | 'battle' | 'victory' | 'defeat'
export type Command =
  | { type: 'place'; kind: DefenderKind; lane: Lane; slot: Slot }
  | { type: 'redeploy'; id: number; lane: Lane; slot: Slot }
  | { type: 'upgrade'; id: number; upgrade: UpgradeKind }
  | { type: 'retire'; id: number }
  | { type: 'advance'; era: Era }
  | { type: 'start' }

export type Effect =
  | { type: 'hit'; lane: Lane; from: number; to: number; color: number; amount: number;
      source: number; target: number; style: 'strike' | 'arrow' | 'shell' | 'coil' | 'acid' | 'heal'; splash?: number }
  | { type: 'fall'; lane: Lane; x: number; color: number }
  | { type: 'blast'; lane: Lane; x: number; radius: number }
  | { type: 'breach'; lane: Lane; amount: number }

function validPad(lane: Lane, slot: Slot) {
  return Number.isInteger(lane) && lane >= 0 && lane < LANES.length &&
    Number.isInteger(slot) && slot >= 0 && slot < SLOTS.length
}

export class Match {
  private state = {
    phase: 'build' as Phase, era: 'ember' as Era, scrap: STARTING_SCRAP, core: CORE_HP, wave: 1,
    defenders: [] as Defender[], enemies: [] as Enemy[], spawned: 0, tick: 0,
  }
  private nextId = 1
  private activeReport?: WaveReport
  private completedReport?: WaveReport

  get lastWave(): (Readonly<Omit<WaveReport, 'coreDamage'>> & {
    readonly coreDamage: readonly number[]
  }) | undefined {
    return this.completedReport
  }

  get view(): Readonly<Omit<typeof this.state, 'defenders' | 'enemies'>> & {
    readonly defenders: readonly Readonly<Defender>[]
    readonly enemies: readonly Readonly<Enemy>[]
  } {
    return this.state
  }

  dispatch(command: Command): string | undefined {
    const state = this.state
    if (state.phase !== 'build') return 'Orders are available during planning.'
    switch (command.type) {
      case 'start':
        state.tick = 0
        state.spawned = 0
        this.activeReport = {
          wave: state.wave, ticks: 0, kills: 0, bounty: 0, income: 0, losses: 0,
          clearBonus: 0, coreDamage: [0, 0, 0],
        }
        state.phase = 'battle'
        return
      case 'advance': {
        if (command.era !== 'coil' || state.era !== 'ember') return 'Era unavailable.'
        const era = ERAS[command.era]
        if (state.wave < era.wave) return `Available at wave ${era.wave}.`
        if (state.scrap < era.cost) return 'You need more scrap.'
        state.scrap -= era.cost
        state.era = command.era
        return
      }
      case 'place': {
        const { kind, lane, slot } = command
        if (!validPad(lane, slot) || !Object.hasOwn(DEFENDERS, kind)) return 'Invalid placement.'
        if (this.occupied(lane, slot)) return 'That pad is occupied.'
        const unit = DEFENDERS[kind]
        if (unit.era && unit.era !== state.era) return 'Unlock the Coil Age first.'
        if (kind === 'scavenger' && state.defenders.filter(defender => defender.kind === kind).length >= SCAVENGER_LIMIT) {
          return 'Only two Scavengers can operate at once.'
        }
        if (state.scrap < unit.cost) return 'You need more scrap.'
        state.scrap -= unit.cost
        state.defenders.push({ id: this.nextId++, kind, lane, slot, x: SLOTS[slot], hp: unit.hp, cooldown: 0 })
        return
      }
      case 'redeploy': {
        const { id, lane, slot } = command
        const unit = state.defenders.find(defender => defender.id === id)
        if (!unit || !validPad(lane, slot)) return 'Invalid destination.'
        if (this.occupied(lane, slot)) return 'Choose an open destination.'
        if (state.scrap < REDEPLOY_COST) return 'You need more scrap.'
        state.scrap -= REDEPLOY_COST
        unit.lane = lane
        unit.slot = slot
        unit.x = SLOTS[slot]
        return
      }
      case 'retire': {
        const unit = state.defenders.find(defender => defender.id === command.id)
        if (!unit) return 'Select a defender first.'
        state.scrap += Math.floor(DEFENDERS[unit.kind].cost / 3)
        state.defenders = state.defenders.filter(defender => defender.id !== unit.id)
        return
      }
      case 'upgrade': {
        const unit = state.defenders.find(defender => defender.id === command.id)
        if (!unit || unit.upgrade || !Object.hasOwn(UPGRADES, command.upgrade)) return 'Retrofit unavailable.'
        const upgrade = UPGRADES[command.upgrade]
        if (upgrade.base !== unit.kind || state.era !== 'coil') return 'Retrofit unavailable.'
        if (state.scrap < upgrade.cost) return 'You need more scrap.'
        state.scrap -= upgrade.cost
        unit.upgrade = command.upgrade
        unit.hp = profile(unit).hp
        return
      }
      default:
        return 'Unknown order.'
    }
  }

  private occupied(lane: Lane, slot: Slot) {
    return this.state.defenders.some(unit => unit.lane === lane && unit.slot === slot)
  }

  tick(): Effect[] {
    const effects: Effect[] = []
    const state = this.state
    const report = this.activeReport
    if (state.phase !== 'battle' || !report) return effects
    const wave = WAVES[state.wave - 1]
    report.ticks = ++state.tick
    while (state.spawned < wave.spawns.length && wave.spawns[state.spawned].tick <= state.tick) {
      const { lane, kind } = wave.spawns[state.spawned++]
      state.enemies.push({ id: this.nextId++, kind, lane, x: ENTRY_X, hp: ENEMIES[kind].hp, cooldown: 0,
        charged: false, slow: 0, expose: 0, pulseAt: state.tick + 35 })
    }

    for (const unit of state.defenders) {
      if (unit.hp > 0) this.actDefender(unit, report, effects)
    }
    for (const enemy of state.enemies) {
      if (enemy.hp > 0) this.actEnemy(enemy, report, effects)
      if (state.core === 0) break
    }

    state.enemies = state.enemies.filter(unit => unit.hp > 0 && unit.x > CORE_X)
    if (state.core === 0) {
      state.phase = 'defeat'
    } else if (state.spawned === wave.spawns.length && state.enemies.length === 0) {
      state.phase = state.wave === WAVES.length ? 'victory' : 'build'
      report.income = state.defenders.filter(unit => unit.kind === 'scavenger' && unit.hp > 0).length * SALVAGE_PAYOUT
      report.clearBonus = wave.grant
      state.scrap += report.income + report.clearBonus
      if (state.phase === 'build') {
        state.wave++
        for (const unit of state.defenders) {
          unit.hp = profile(unit).hp
          unit.x = SLOTS[unit.slot]
          unit.cooldown = 0
        }
      }
    }
    if (state.phase !== 'battle') this.completedReport = report
    return effects
  }

  private actDefender(unit: Defender, report: WaveReport, effects: Effect[]) {
    const { attack, advance, heal, color } = profile(unit)
    if (!attack) return
    unit.cooldown = Math.max(0, unit.cooldown - 1)
    if (heal) {
      if (unit.cooldown > 0) return
      const target = this.state.defenders.filter(ally => ally.lane === unit.lane && ally.id !== unit.id &&
        ally.hp > 0 && ally.hp < profile(ally).hp && Math.abs(ally.x - unit.x) <= attack.range)
        .sort((a, b) => a.hp / profile(a).hp - b.hp / profile(b).hp || a.id - b.id)[0]
      if (!target) return
      const amount = Math.min(heal, profile(target).hp - target.hp)
      target.hp += amount
      unit.cooldown = attack.cooldown
      effects.push({ type: 'hit', style: 'heal', lane: unit.lane, from: unit.x, to: target.x, source: unit.id, target: target.id, amount, color })
      return
    }

    const enemies = this.state.enemies
    let target = selectTarget(unit, enemies, attack.range, 1)
    if (unit.upgrade === 'longshot' && target) {
      target = enemies.filter(enemy => enemy.hp > 0 && enemy.lane === unit.lane &&
        enemy.x >= unit.x && enemy.x - unit.x <= attack.range)
        .sort((a, b) => ENEMIES[b.kind].hp - ENEMIES[a.kind].hp || a.x - b.x || a.id - b.id)[0]
    }
    if (!target) {
      const home = SLOTS[unit.slot]
      const opponent = selectTarget(unit, enemies, Infinity, 1)
      const leash = advance ?? 65
      const goal = opponent ? Math.max(home, Math.min(home + leash, opponent.x - attack.range)) : home
      const stride = advance ? 7 : 3
      unit.x += Math.max(-stride, Math.min(stride, goal - unit.x))
      return
    }
    if (unit.cooldown > 0) return
    unit.cooldown = attack.cooldown
    const style = advance ? 'strike' : unit.kind === 'lobber' ? 'shell' : unit.kind === 'conductor' ? 'coil' : 'arrow'
    const splash = attack.splash
    const victims = splash ? enemies.filter(enemy => enemy.hp > 0 && enemy.lane === unit.lane &&
      Math.abs(enemy.x - target.x) <= splash) : [target]
    for (const enemy of victims) {
      const armor = ENEMIES[enemy.kind].armor + (enemies.some(ally => {
        const aura = ENEMIES[ally.kind].aura
        return aura && ally.id !== enemy.id && ally.hp > 0 && ally.lane === enemy.lane && Math.abs(ally.x - enemy.x) <= aura
      }) ? HERALD_ARMOR : 0)
      const before = enemy.hp
      applyDamage(enemy, attack.damage, Math.max(0, armor - (attack.pierce ?? 0) - (enemy.expose > 0 ? ARMOR_EXPOSURE.amount : 0)))
      if (attack.expose) enemy.expose = ARMOR_EXPOSURE.ticks
      if (attack.slow) enemy.slow = attack.slow
      if (enemy === target) effects.push({ type: 'hit', lane: unit.lane, from: unit.x, to: enemy.x,
        source: unit.id, target: enemy.id, style, amount: before - enemy.hp, splash: attack.splash, color })
      if (enemy.hp === 0) {
        const definition = ENEMIES[enemy.kind]
        const reward = Math.ceil(definition.reward * WAVES[this.state.wave - 1].bountyRate)
        this.state.scrap += reward
        report.bounty += reward
        report.kills++
        effects.push({ type: 'fall', lane: enemy.lane, x: enemy.x, color: definition.color })
      }
    }
  }

  private actEnemy(enemy: Enemy, report: WaveReport, effects: Effect[]) {
    const state = this.state
    const definition = ENEMIES[enemy.kind]
    const { attack, pulse, color } = definition
    const rage = state.tick < OVERTIME_TICK ? 0
      : OVERTIME_DAMAGE * (1 + Math.floor((state.tick - OVERTIME_TICK) / OVERTIME_RAMP))
    enemy.cooldown = Math.max(0, enemy.cooldown - 1)
    enemy.expose = Math.max(0, enemy.expose - 1)
    const stride = definition.speed * STEP_MS / 1000 * (enemy.slow > 0 ? .55 : 1)
    enemy.slow = Math.max(0, enemy.slow - 1)
    const target = selectTarget(enemy, state.defenders, attack.range + stride, -1)
    if (pulse && enemy.pulseX !== undefined) {
      if (state.tick < enemy.pulseAt) return
      effects.push({ type: 'blast', lane: enemy.lane, x: enemy.pulseX, radius: pulse.radius })
      for (const unit of state.defenders) {
        if (unit.lane === enemy.lane && unit.hp > 0 && Math.abs(unit.x - enemy.pulseX) <= pulse.radius) {
          this.damageDefender(unit, pulse.damage + rage, report, effects)
        }
      }
      enemy.pulseX = undefined
      enemy.pulseAt = state.tick + pulse.interval
      return
    }
    if (pulse && state.tick >= enemy.pulseAt) {
      const focus = selectTarget(enemy, state.defenders, 245, -1)
      if (focus) {
        enemy.pulseX = focus.x
        enemy.pulseAt = state.tick + pulse.windup
        return
      }
    }
    if (target) {
      const gap = enemy.x - target.x - attack.range
      if (gap > 0) enemy.x -= Math.min(stride, gap)
      if (enemy.cooldown || gap > stride) return
      const charge = enemy.charged ? 0 : definition.charge ?? 0
      enemy.charged = true
      enemy.cooldown = attack.cooldown
      const amount = this.damageDefender(target, attack.damage + charge + rage, report, effects)
      effects.push({ type: 'hit', lane: enemy.lane, from: enemy.x, to: target.x, source: enemy.id, target: target.id,
        style: attack.range > 70 ? 'acid' : 'strike', amount, color })
      return
    }
    enemy.x -= stride
    if (enemy.x <= CORE_X) {
      const amount = Math.min(state.core, definition.breach)
      state.core -= amount
      report.coreDamage[enemy.lane] += amount
      effects.push({ type: 'breach', lane: enemy.lane, amount })
    }
  }

  private damageDefender(unit: Defender, damage: number, report: WaveReport, effects: Effect[]) {
    const before = unit.hp
    const definition = profile(unit)
    applyDamage(unit, damage, definition.armor)
    if (unit.hp === 0) {
      report.losses++
      effects.push({ type: 'fall', lane: unit.lane, x: unit.x, color: definition.color })
    }
    return before - unit.hp
  }
}
