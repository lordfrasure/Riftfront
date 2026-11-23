import { commandLimit, CREDIT_VALUE, RECOVERY_COST, ROUTE_REWARDS, routeOffers, siegeSchedule, UPGRADE_CREDITS, type Credit, type Reward, type RouteOffer, type SiegeRules } from './siege.js'
import { formationLinks, fusionRecipe } from './formation.js'
import { applyDamage, selectTarget, type Combatant } from './combat.js'
import {
  ARMOR_EXPOSURE, CORE_HP, CORE_X, DEFENDERS, ENEMIES, ENTRY_X, ERAS, HERALD_ARMOR, LAYOUTS, SALVAGE_PAYOUT, SCAVENGER_LIMIT,
  OVERTIME_DAMAGE, OVERTIME_RAMP, OVERTIME_TICK, SYNERGIES, STARTING_SCRAP, STEP_MS, SIEGE_ATTACKS, UPGRADES, WAVES, profile,
  type Attack, type DefenderKind, type EnemyKind, type Layout, type Era, type Lane, type Slot, type SiegeAttack, type UpgradeKind, type Wave,
} from './data.js'

export const REDEPLOY_COST = 8

export interface Defender extends Combatant { kind: DefenderKind; slot: Slot; upgrade?: UpgradeKind; healCooldown: number }
export interface Enemy extends Combatant {
  kind: EnemyKind
  slow: number
  expose: number
  disrupted: number
  charged: boolean
  pulseAt: number
  pulseX?: number
  siege?: SiegeAttack
  mark?: Readonly<{ x: number; at: number; target: number }>
}

interface CombatIncident {
  readonly tick: number
  readonly lane: Lane
  readonly enemy: EnemyKind
  readonly action: 'strike' | 'impact' | 'snipe' | 'pulse' | 'breach' | 'interrupt' | 'brace'
  readonly defender?: string
  readonly amount?: number
  readonly routed?: boolean
}

interface WaveReport {
  incidents: CombatIncident[]
  routeReward?: Reward
  recovery?: number
  wave: number
  ticks: number
  kills: number
  bounty: number
  income: number
  losses: number
  clearBonus: number
  coreDamage: number[]
  synergyActions: number
  damage: Partial<Record<DefenderKind, number>>
}

export type Phase = 'build' | 'battle' | 'victory' | 'defeat'
export type Command =
  | { type: 'place'; kind: DefenderKind; lane: Lane; slot: Slot }
  | { type: 'redeploy'; id: number; lane: Lane; slot: Slot }
  | { type: 'upgrade'; id: number; upgrade: UpgradeKind }
  | { type: 'fuse'; first: number; second: number }
  | { type: 'retire'; id: number }
  | { type: 'advance'; era: Era }
  | { type: 'reserve'; id: number }
  | { type: 'activate'; id: number; lane: Lane; slot: Slot }
  | { type: 'repair'; id: number }
  | { type: 'route'; choice: number }
  | { type: 'start' }

export type Effect =
  | { type: 'hit'; lane: Lane; from: number; to: number; color: number; amount: number;
      source: number; target: number; style: 'strike' | 'arrow' | 'shell' | 'coil' | 'acid' | 'heal'; splash?: number }
  | { type: 'fall'; id: number; lane: Lane; x: number; color: number }
  | { type: 'blast'; lane: Lane; x: number; radius: number }
  | { type: 'breach'; lane: Lane; amount: number }
  | { type: 'counter'; lane: Lane; x: number; action: 'interrupt' | 'brace' }

export class Match {
  private state = {
    phase: 'build' as Phase, era: 'ember' as Era, scrap: STARTING_SCRAP, core: CORE_HP, wave: 1,
    defenders: [] as Defender[], enemies: [] as Enemy[], spawned: 0, tick: 0,
  }
  private nextId = 1
  private activeReport?: WaveReport
  private completedReport?: WaveReport

  private readonly schedule: Wave[]
  private offers: readonly RouteOffer[] = []
  private pendingReward?: Reward
  private reserve: { unit: Defender; readyWave: number }[] = []
  private credits: Record<Credit, number> = { shield: 0, precision: 0, foundry: 0 }
  private routeHistory: { wave: number; title: string; lane: Lane }[] = []

  get waves(): readonly Wave[] { return this.schedule }

  get siege() {
    if (this.seed === undefined) return undefined
    return { seed: this.seed, offers: this.offers, capacity: this.capacity,
      reserve: this.reserve as readonly { readonly unit: Readonly<Defender>; readonly readyWave: number }[],
      credits: this.credits as Readonly<Record<Credit, number>>, pendingReward: this.pendingReward,
      routes: this.routeHistory as readonly Readonly<{ wave: number; title: string; lane: Lane }>[] }
  }

  private get capacity() {
    return this.seed !== undefined && this.rules.capacity !== false
      ? commandLimit(this.state.wave) : this.layout.lanes.length * this.layout.slots.length
  }

  get redeployPrice() { return this.seed === undefined ? REDEPLOY_COST : 0 }

  upgradePrice(upgrade: UpgradeKind) {
    const credit = UPGRADE_CREDITS[upgrade]
    return this.discountedPrice(UPGRADES[upgrade].cost, credit)
  }

  fusionPrice(cost: number, kind: DefenderKind) {
    return this.discountedPrice(cost, kind === 'wardkeeper' ? 'shield' : 'precision')
  }

  private discountedPrice(cost: number, credit?: Credit) {
    return credit && this.credits[credit] ? Math.max(0, cost - CREDIT_VALUE) : cost
  }

  private spend(cost: number, credit?: Credit) {
    const price = this.discountedPrice(cost, credit)
    if (this.state.scrap < price) return false
    this.state.scrap -= price
    if (credit && price < cost) this.credits[credit]--
    return true
  }

  constructor(readonly layout: Layout = LAYOUTS.seven, waves?: readonly Wave[], readonly seed?: number, private readonly rules: SiegeRules = {}) {
    // Comparative four-lane campaign moves alternating outer-lane spawns to the extra flank.
    this.schedule = [...(waves ?? (seed !== undefined ? siegeSchedule(rules) : layout.lanes.length === 4 ? WAVES.map(wave => {
      let flank = 0
      return { ...wave, spawns: wave.spawns.map(spawn =>
        spawn.lane === 2 && flank++ % 2 === 1 ? { ...spawn, lane: 3 } : spawn) }
    }) : WAVES))]
  }

  get links() { return formationLinks(this.state.defenders) }

  private validPad(lane: Lane, slot: Slot) {
    return Number.isInteger(lane) && lane >= 0 && lane < this.layout.lanes.length &&
      Number.isInteger(slot) && slot >= 0 && slot < this.layout.slots.length
  }

  get lastWave(): (Readonly<Omit<WaveReport, 'coreDamage' | 'damage' | 'incidents'>> & {
    readonly incidents: readonly CombatIncident[]
    readonly coreDamage: readonly number[]
    readonly damage: Readonly<WaveReport['damage']>
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
      case 'route': {
        const offer = this.offers[command.choice]
        if (!offer) return 'Choose an offered front.'
        this.schedule.splice(state.wave - 1, 2, ...offer.waves)
        this.pendingReward = offer.reward
        this.routeHistory.push({ wave: state.wave, title: offer.title, lane: offer.lane })
        this.offers = []
        return
      }
      case 'reserve': {
        if (this.seed === undefined) return 'Reserve unavailable.'
        const unit = state.defenders.find(defender => defender.id === command.id)
        if (!unit) return 'Select a deployed defender.'
        state.defenders = state.defenders.filter(defender => defender !== unit)
        this.reserve.push({ unit, readyWave: state.wave })
        return
      }
      case 'repair': {
        const entry = this.reserve.find(candidate => candidate.unit.id === command.id)
        if (!entry || entry.readyWave <= state.wave) return 'Select a defender in recovery.'
        if (!this.spend(RECOVERY_COST)) return 'You need more scrap.'
        entry.readyWave = state.wave
        return
      }
      case 'activate': {
        const entry = this.reserve.find(candidate => candidate.unit.id === command.id)
        if (!entry || entry.readyWave > state.wave) return 'That defender is unavailable.'
        if (!this.validPad(command.lane, command.slot) || this.occupied(command.lane, command.slot)) return 'Choose an open pad.'
        if (state.defenders.length >= this.capacity) return 'The garrison is full. Send a defender to reserve.'
        const { unit } = entry
        unit.lane = command.lane
        unit.slot = command.slot
        unit.x = this.layout.slots[unit.slot]
        state.defenders.push(unit)
        this.reserve = this.reserve.filter(candidate => candidate !== entry)
        return
      }
      case 'start':
        if (this.offers.length) return 'Choose a front before launching.'
        state.tick = 0
        state.spawned = 0
        this.activeReport = {
          incidents: [], wave: state.wave, ticks: 0, kills: 0, bounty: 0, income: 0, losses: 0,
          clearBonus: 0, coreDamage: this.layout.lanes.map(() => 0), synergyActions: 0, damage: {},
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
        if (!this.validPad(lane, slot) || !Object.hasOwn(DEFENDERS, kind)) return 'Invalid placement.'
        if (this.occupied(lane, slot)) return 'That pad is occupied.'
        if (this.seed !== undefined && state.defenders.length >= this.capacity) return 'The garrison is full. Send a defender to reserve.'
        const unit = DEFENDERS[kind]
        if (unit.fused) return 'This defender can only be created by fusion.'
        if (unit.era && unit.era !== state.era) return 'Unlock the Coil Age first.'
        if (kind === 'scavenger' && [...state.defenders, ...this.reserve.map(entry => entry.unit)].filter(defender => defender.kind === kind).length >= SCAVENGER_LIMIT) {
          return 'Only two Scavengers can operate at once.'
        }
        if (state.scrap < unit.cost) return 'You need more scrap.'
        state.scrap -= unit.cost
        state.defenders.push({ id: this.nextId++, kind, lane, slot, x: this.layout.slots[slot], hp: unit.hp, cooldown: 0, healCooldown: 0 })
        return
      }
      case 'redeploy': {
        const { id, lane, slot } = command
        const unit = state.defenders.find(defender => defender.id === id)
        if (!unit || !this.validPad(lane, slot)) return 'Invalid destination.'
        if (this.occupied(lane, slot)) return 'Choose an open destination.'
        if (!this.spend(this.redeployPrice)) return 'You need more scrap.'
        unit.lane = lane
        unit.slot = slot
        unit.x = this.layout.slots[slot]
        return
      }
      case 'retire': {
        const unit = state.defenders.find(defender => defender.id === command.id)
        if (!unit) return 'Select a defender first.'
        state.scrap += Math.floor(DEFENDERS[unit.kind].cost / 3)
        state.defenders = state.defenders.filter(defender => defender.id !== unit.id)
        return
      }
      case 'fuse': {
        const first = state.defenders.find(unit => unit.id === command.first)
        const second = state.defenders.find(unit => unit.id === command.second)
        const merge = first && second && fusionRecipe(first, second)
        if (!merge) return 'Choose compatible, unupgraded defenders on consecutive pads in the same lane.'
        const { recipe, front, rear } = merge
        if (!this.spend(recipe.cost, recipe.result === 'wardkeeper' ? 'shield' : 'precision')) return 'You need more scrap.'
        state.defenders = state.defenders.filter(unit => unit !== front && unit !== rear)
        state.defenders.push({ id: this.nextId++, kind: recipe.result, lane: front.lane, slot: front.slot,
          x: front.x, hp: DEFENDERS[recipe.result].hp, cooldown: 0, healCooldown: 0 })
        return
      }
      case 'upgrade': {
        const unit = state.defenders.find(defender => defender.id === command.id)
        if (!unit || !Object.hasOwn(UPGRADES, command.upgrade)) return 'Retrofit unavailable.'
        const upgrade = UPGRADES[command.upgrade]
        if (upgrade.base !== unit.kind || upgrade.requires !== unit.upgrade || (upgrade.era === 'coil' && state.era !== 'coil')) return 'Retrofit unavailable.'
        if (!this.spend(upgrade.cost, UPGRADE_CREDITS[command.upgrade])) return 'You need more scrap.'
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
    const wave = this.waves[state.wave - 1]
    report.ticks = ++state.tick
    while (state.spawned < wave.spawns.length && wave.spawns[state.spawned].tick <= state.tick) {
      const { lane, kind, siege } = wave.spawns[state.spawned++]
      state.enemies.push({ id: this.nextId++, kind, lane, siege, x: ENTRY_X, hp: ENEMIES[kind].hp, cooldown: 0,
        charged: false, slow: 0, expose: 0, disrupted: 0, pulseAt: state.tick + 35 })
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
      state.phase = state.wave === this.waves.length ? 'victory' : 'build'
      report.income = state.defenders.filter(unit => unit.kind === 'scavenger' && unit.hp > 0).length * SALVAGE_PAYOUT
      report.clearBonus = wave.grant
      state.scrap += report.income + report.clearBonus
      if (this.pendingReward) {
        const reward = this.pendingReward
        report.routeReward = reward
        if (reward === 'scrap') state.scrap += ROUTE_REWARDS.scrap.amount
        else if (reward === 'repair') state.core = Math.min(CORE_HP, state.core + ROUTE_REWARDS.repair.amount)
        else this.credits[reward]++
        this.pendingReward = undefined
      }
      if (state.phase === 'build') {
        state.wave++
        if (this.seed !== undefined && this.rules.recovery !== false) {
          const routed = state.defenders.filter(unit => unit.hp <= 0)
          for (const unit of routed) {
            unit.hp = profile(unit).hp
            unit.cooldown = unit.healCooldown = 0
            this.reserve.push({ unit, readyWave: state.wave + 1 })
          }
          state.defenders = state.defenders.filter(unit => !routed.includes(unit))
          report.recovery = routed.length
        }
        if (this.seed !== undefined && this.rules.routes !== false) this.offers = routeOffers(this.schedule, this.seed, state.wave)
        for (const unit of state.defenders) {
          unit.hp = profile(unit).hp
          unit.x = this.layout.slots[unit.slot]
          unit.cooldown = 0
          unit.healCooldown = 0
        }
      }
    }
    if (state.phase !== 'battle') this.completedReport = report
    return effects
  }

  private actDefender(unit: Defender, report: WaveReport, effects: Effect[]) {
    const { attack, advance, heal, color } = profile(unit)
    if (heal) this.repair(unit, heal, color, report, effects)
    if (!attack) return
    unit.cooldown = Math.max(0, unit.cooldown - 1)

    const enemies = this.state.enemies
    let target = selectTarget(unit, enemies, attack.range, 1)
    if (attack.priority && target) {
      const priority = (enemy: Enemy) => attack.priority === 'toughest'
        ? ENEMIES[enemy.kind].hp : Number(Boolean(ENEMIES[enemy.kind].aura))
      target = enemies.filter(enemy => enemy.hp > 0 && enemy.lane === unit.lane &&
        enemy.x >= unit.x && enemy.x - unit.x <= attack.range)
        .sort((a, b) => priority(b) - priority(a) || a.x - b.x || a.id - b.id)[0]
    }
    if (!target) {
      const home = this.layout.slots[unit.slot]
      const opponent = selectTarget(unit, enemies, Infinity, 1)
      const leash = advance ?? 65
      const goal = opponent ? Math.max(home, Math.min(home + leash, opponent.x - attack.range)) : home
      const stride = advance ? 7 : 3
      unit.x += Math.max(-stride, Math.min(stride, goal - unit.x))
      return
    }
    if (unit.cooldown > 0) return
    unit.cooldown = attack.cooldown
    const style = advance ? 'strike' : attack.style ?? 'arrow'
    const linked = !advance && this.links.some(link => link.kind === 'sparkLink' && link.target.id === unit.id)
    if (linked) report.synergyActions++
    const splash = attack.splash
    const victims = splash ? enemies.filter(enemy => enemy.hp > 0 && enemy.lane === unit.lane &&
      Math.abs(enemy.x - target.x) <= splash) : [target]
    for (const enemy of victims) {
      const armor = ENEMIES[enemy.kind].armor + (enemies.some(ally => {
        const aura = ENEMIES[ally.kind].aura
        return aura && ally.disrupted <= 0 && ally.id !== enemy.id && ally.hp > 0 && ally.lane === enemy.lane && Math.abs(ally.x - enemy.x) <= aura
      }) ? HERALD_ARMOR : 0)
      const before = enemy.hp
      applyDamage(enemy, attack.damage + (linked ? SYNERGIES.sparkLink.bonus : 0), Math.max(0, armor - (attack.pierce ?? 0) - (enemy.expose > 0 ? ARMOR_EXPOSURE.amount : 0)))
      report.damage[unit.kind] = (report.damage[unit.kind] ?? 0) + before - enemy.hp
      if (attack.disrupt && ENEMIES[enemy.kind].aura) enemy.disrupted = attack.disrupt
      if (attack.expose) enemy.expose = ARMOR_EXPOSURE.ticks
      if (attack.slow) enemy.slow = attack.slow
      if (unit.upgrade === 'bulwark' && enemy.siege === 'impact' && (!enemy.charged || enemy.mark) && enemy.hp > 0) {
        enemy.mark = undefined
        enemy.charged = true
        effects.push({ type: 'counter', lane: unit.lane, x: unit.x, action: 'interrupt' })
        report.incidents.push({ tick: this.state.tick, lane: enemy.lane, enemy: enemy.kind,
          action: 'interrupt', defender: profile(unit).label })
      }
      if (enemy === target) effects.push({ type: 'hit', lane: unit.lane, from: unit.x, to: enemy.x,
        source: unit.id, target: enemy.id, style, amount: before - enemy.hp, splash: attack.splash, color })
      if (enemy.hp === 0) {
        const definition = ENEMIES[enemy.kind]
        const reward = Math.ceil(definition.reward * this.waves[this.state.wave - 1].bountyRate)
        this.state.scrap += reward
        report.bounty += reward
        report.kills++
        effects.push({ type: 'fall', id: enemy.id, lane: enemy.lane, x: enemy.x, color: definition.color })
      }
    }
  }

  private repair(unit: Defender, heal: NonNullable<ReturnType<typeof profile>['heal']>,
    color: number, report: WaveReport, effects: Effect[]) {
    unit.healCooldown = Math.max(0, unit.healCooldown - 1)
    if (unit.healCooldown > 0) return
    const target = this.state.defenders.filter(ally => ally.lane === unit.lane && ally.id !== unit.id &&
      ally.hp > 0 && ally.hp < profile(ally).hp && Math.abs(ally.x - unit.x) <= heal.range)
      .sort((a, b) => a.hp / profile(a).hp - b.hp / profile(b).hp || a.id - b.id)[0]
    if (!target) return
    const missing = profile(target).hp - target.hp
    const linked = missing > heal.amount && this.links.some(link => link.kind === 'fieldDressing' &&
      link.source.id === unit.id && link.target.id === target.id)
    if (linked) report.synergyActions++
    const amount = Math.min(heal.amount + (linked ? SYNERGIES.fieldDressing.bonus : 0), missing)
    target.hp += amount
    unit.healCooldown = heal.cooldown
    effects.push({ type: 'hit', style: 'heal', lane: unit.lane, from: unit.x, to: target.x,
      source: unit.id, target: target.id, amount, color })
  }

  private actEnemy(enemy: Enemy, report: WaveReport, effects: Effect[]) {
    const state = this.state
    const definition = ENEMIES[enemy.kind]
    const { attack, pulse, color } = definition
    const rage = state.tick < OVERTIME_TICK ? 0
      : OVERTIME_DAMAGE * (1 + Math.floor((state.tick - OVERTIME_TICK) / OVERTIME_RAMP))
    enemy.cooldown = Math.max(0, enemy.cooldown - 1)
    enemy.disrupted = Math.max(0, enemy.disrupted - 1)
    enemy.expose = Math.max(0, enemy.expose - 1)
    const stride = definition.speed * STEP_MS / 1000 * (enemy.slow > 0 ? .55 : 1)
    enemy.slow = Math.max(0, enemy.slow - 1)
    const target = selectTarget(enemy, state.defenders, attack.range + stride, -1)
    if (enemy.siege && this.actSiegeAttack(enemy, enemy.siege, target, rage, report, effects)) return
    if (pulse && enemy.pulseX !== undefined) {
      if (state.tick < enemy.pulseAt) return
      effects.push({ type: 'blast', lane: enemy.lane, x: enemy.pulseX, radius: pulse.radius })
      for (const unit of state.defenders) {
        if (unit.lane === enemy.lane && unit.hp > 0 && Math.abs(unit.x - enemy.pulseX) <= pulse.radius) {
          this.damageDefender(unit, pulse.damage + rage, report, effects, enemy, 'pulse')
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
      const amount = this.damageDefender(target, attack.damage + charge + rage, report, effects, enemy, 'strike')
      effects.push({ type: 'hit', lane: enemy.lane, from: enemy.x, to: target.x, source: enemy.id, target: target.id,
        style: attack.range > 70 ? 'acid' : 'strike', amount, color })
      return
    }
    enemy.x -= stride
    if (enemy.x <= CORE_X) {
      const amount = Math.min(state.core, definition.breach)
      state.core -= amount
      report.coreDamage[enemy.lane] += amount
      report.incidents.push({ tick: state.tick, lane: enemy.lane, enemy: enemy.kind, action: 'breach', amount })
      effects.push({ type: 'breach', lane: enemy.lane, amount })
    }
  }

  private actSiegeAttack(enemy: Enemy, siege: SiegeAttack, front: Defender | undefined, rage: number,
    report: WaveReport, effects: Effect[]) {
    const { tick, defenders } = this.state
    const definition = ENEMIES[enemy.kind]
    const mark = enemy.mark
    if (mark) {
      if (tick < mark.at) return true
      enemy.mark = undefined
      enemy.cooldown = definition.attack.cooldown
      if (siege === 'impact') {
        effects.push({ type: 'blast', lane: enemy.lane, x: mark.x, radius: SIEGE_ATTACKS.impact.radius })
        for (const unit of defenders) {
          if (unit.hp <= 0 || unit.lane !== enemy.lane || Math.abs(unit.x - mark.x) > SIEGE_ATTACKS.impact.radius) continue
          const braces = unit.id === mark.target && unit.kind === 'wardkeeper'
          const damage = definition.attack.damage + (braces ? 0 : definition.charge ?? 0) + rage
          if (braces) {
            effects.push({ type: 'counter', lane: unit.lane, x: unit.x, action: 'brace' })
            report.incidents.push({ tick, lane: enemy.lane, enemy: enemy.kind,
              action: 'brace', defender: profile(unit).label })
          }
          this.damageDefender(unit, damage, report, effects, enemy, siege)
        }
      } else {
        const target = defenders.find(unit => unit.id === mark.target && unit.hp > 0)
        if (target) {
          const amount = this.damageDefender(target, SIEGE_ATTACKS.snipe.damage + rage, report, effects, enemy, siege)
          effects.push({ type: 'hit', lane: enemy.lane, from: enemy.x, to: target.x, source: enemy.id,
            target: target.id, style: 'acid', amount, color: definition.color })
        }
      }
      return true
    }

    if (enemy.cooldown || enemy.charged || !front) return false
    const focus = siege === 'impact'
      ? front
      : defenders.filter(unit => unit.hp > 0 && unit.lane === enemy.lane &&
          unit.x <= enemy.x && enemy.x - unit.x <= SIEGE_ATTACKS.snipe.reach)
        .reduce<Defender | undefined>((rear, unit) => !rear || unit.x < rear.x ? unit : rear, undefined)
    if (!focus) return false
    enemy.mark = { x: focus.x, at: tick + SIEGE_ATTACKS[siege].windup, target: focus.id }
    enemy.charged = true
    return true
  }

  private damageDefender(unit: Defender, damage: number, report: WaveReport, effects: Effect[],
    enemy: Enemy, action: CombatIncident['action']) {
    const before = unit.hp
    const definition = profile(unit)
    applyDamage(unit, damage, definition.armor)
    if (unit.hp === 0 || action === 'impact' || action === 'snipe') {
      report.incidents.push({ tick: this.state.tick, lane: unit.lane, enemy: enemy.kind,
        action, defender: definition.label, amount: before - unit.hp, routed: unit.hp === 0 })
    }
    if (unit.hp === 0) {
      report.losses++
      effects.push({ type: 'fall', id: unit.id, lane: unit.lane, x: unit.x, color: definition.color })
    }
    return before - unit.hp
  }
}
