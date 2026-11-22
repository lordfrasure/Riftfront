import { applyDamage, selectTarget, type Combatant } from './combat'
import {
  CLEAR_BONUS, CORE_HP, CORE_X, DEFENDERS, ENEMIES, ENTRY_X, LANES, SLOTS,
  STARTING_SCRAP, STEP_MS, WAVES,
  type Attack, type DefenderKind, type EnemyKind, type Lane, type Slot,
} from './data'

export interface Defender extends Combatant { kind: DefenderKind; slot: Slot; incomeTicks: number }
export interface Enemy extends Combatant { kind: EnemyKind }
export type Phase = 'build' | 'battle' | 'victory' | 'defeat'
export type Command =
  | { type: 'place'; kind: DefenderKind; lane: Lane; slot: Slot }
  | { type: 'start' }
export type Effect =
  | { type: 'hit'; lane: Lane; from: number; to: number; color: number }
  | { type: 'income'; lane: Lane; x: number; amount: number }
  | { type: 'breach'; lane: Lane; amount: number }

export class Match {
  private state = {
    phase: 'build' as Phase, scrap: STARTING_SCRAP, core: CORE_HP, wave: 1,
    defenders: [] as Defender[], enemies: [] as Enemy[], spawned: 0,
  }
  private waveTick = 0
  private nextId = 1

  get view(): Readonly<Omit<typeof this.state, 'defenders' | 'enemies'>> & {
    readonly defenders: readonly Readonly<Defender>[]
    readonly enemies: readonly Readonly<Enemy>[]
  } {
    return this.state
  }

  dispatch(command: Command): string | undefined {
    const state = this.state
    if (state.phase !== 'build') return 'Orders are available during build.'
    if (command.type === 'start') {
      this.waveTick = 0
      state.spawned = 0
      for (const defender of state.defenders) defender.cooldown = 0
      state.phase = 'battle'
      return
    }
    const { kind, lane, slot } = command
    const definition = DEFENDERS[kind]
    if (!Object.hasOwn(DEFENDERS, kind) ||
        !Number.isInteger(lane) || lane < 0 || lane >= LANES.length ||
        !Number.isInteger(slot) || slot < 0 || slot >= SLOTS.length) return 'Invalid placement.'
    if (state.defenders.some(unit => unit.lane === lane && unit.slot === slot)) return 'That pad is occupied.'
    if (state.scrap < definition.cost) return 'You need more scrap.'
    state.scrap -= definition.cost
    state.defenders.push({ id: this.nextId++, kind, lane, slot, x: SLOTS[slot],
      hp: definition.hp, cooldown: 0, incomeTicks: 0 })
  }

  tick(): Effect[] {
    const effects: Effect[] = []
    const state = this.state
    if (state.phase !== 'battle') return effects
    const wave = WAVES[state.wave - 1]
    this.waveTick++
    while (state.spawned < wave.length && wave[state.spawned].tick <= this.waveTick) {
      const { lane, kind } = wave[state.spawned++]
      state.enemies.push({ id: this.nextId++, kind, lane, x: ENTRY_X, hp: ENEMIES[kind].hp, cooldown: 0 })
    }

    for (const defender of state.defenders) {
      const definition = DEFENDERS[defender.kind]
      if (definition.income && ++defender.incomeTicks === definition.income.interval) {
        defender.incomeTicks = 0
        state.scrap += definition.income.amount
        effects.push({ type: 'income', lane: defender.lane, x: defender.x, amount: definition.income.amount })
      }
      if (!definition.attack) continue
      defender.cooldown = Math.max(0, defender.cooldown - 1)
      const target = selectTarget(defender, state.enemies, definition.attack.range, 1)
      if (target && defender.cooldown === 0) {
        this.hit(defender, target, definition.attack, definition.color, effects, ENEMIES[target.kind].armor)
        if (target.hp === 0) state.scrap += ENEMIES[target.kind].reward
      }
    }

    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) continue
      const definition = ENEMIES[enemy.kind]
      enemy.cooldown = Math.max(0, enemy.cooldown - 1)
      const distance = definition.speed * STEP_MS / 1000
      const target = selectTarget(enemy, state.defenders, definition.attack.range + distance, -1)
      if (target) {
        enemy.x = Math.max(enemy.x - distance, target.x + definition.attack.range)
        if (enemy.cooldown === 0 && enemy.x - target.x <= definition.attack.range) {
          this.hit(enemy, target, definition.attack, definition.color, effects)
        }
      } else {
        enemy.x -= distance
        if (enemy.x <= CORE_X) {
          state.core = Math.max(0, state.core - definition.breach)
          effects.push({ type: 'breach', lane: enemy.lane, amount: definition.breach })
        }
      }
    }

    state.defenders = state.defenders.filter(unit => unit.hp > 0)
    state.enemies = state.enemies.filter(unit => unit.hp > 0 && unit.x > CORE_X)
    if (state.core === 0) state.phase = 'defeat'
    else if (state.spawned === wave.length && state.enemies.length === 0) {
      if (state.wave === WAVES.length) state.phase = 'victory'
      else {
        state.scrap += CLEAR_BONUS
        state.wave++
        state.phase = 'build'
      }
    }
    return effects
  }

  private hit(attacker: Combatant, target: Combatant, attack: Attack, color: number, effects: Effect[], armor = 0) {
    applyDamage(target, attack.damage, armor)
    attacker.cooldown = attack.cooldown
    effects.push({ type: 'hit', lane: attacker.lane, from: attacker.x, to: target.x, color })
  }
}
