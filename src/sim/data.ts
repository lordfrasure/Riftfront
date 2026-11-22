export const STEP_MS = 50
export const WIDTH = 1280
export const HEIGHT = 720
export const LANES = [250, 410, 570] as const
export const SLOTS = [240, 415, 590, 765] as const
export const CORE_X = 113
export const ENTRY_X = 1205
export const CORE_HP = 100
export const STARTING_SCRAP = 110
export const CLEAR_BONUS = 55

export type Lane = 0 | 1 | 2
export type Slot = 0 | 1 | 2 | 3
export type DefenderKind = 'guard' | 'archer' | 'scavenger'
export type EnemyKind = 'basic' | 'fast' | 'armored'

export interface Attack {
  damage: number
  range: number
  cooldown: number // ticks
}

interface DefenderDefinition {
  label: string
  role: string
  cost: number
  hp: number
  color: number
  attack?: Attack
  income?: { amount: number; interval: number }
}

export const DEFENDERS: Record<DefenderKind, DefenderDefinition> = {
  guard: { label: 'Guard', role: 'Melee blocker', cost: 35, hp: 125, color: 0x65d6d0,
    attack: { damage: 15, range: 39, cooldown: 14 } },
  archer: { label: 'Archer', role: 'Ranged damage', cost: 45, hp: 65, color: 0xb4bcff,
    attack: { damage: 17, range: 223, cooldown: 15 } },
  scavenger: { label: 'Scavenger', role: '+7 scrap every 3s in battle', cost: 30, hp: 50, color: 0xffce74,
    income: { amount: 7, interval: 60 } },
}

export const ENEMIES = {
  basic: { hp: 53, speed: 76, armor: 0, breach: 10, reward: 6, color: 0xff827e,
    attack: { damage: 9, range: 31, cooldown: 18 } },
  fast: { hp: 34, speed: 113, armor: 0, breach: 8, reward: 5, color: 0xffb268,
    attack: { damage: 6, range: 31, cooldown: 12 } },
  armored: { hp: 105, speed: 59, armor: 5, breach: 18, reward: 11, color: 0xed8bcb,
    attack: { damage: 16, range: 31, cooldown: 23 } },
} satisfies Record<EnemyKind, { hp: number; speed: number; armor: number; breach: number;
  reward: number; color: number; attack: Attack }>

interface Spawn { lane: Lane; kind: EnemyKind; tick: number }
type Entry = readonly [Lane, EnemyKind]

function schedule(interval: number, entries: readonly Entry[]): Spawn[] {
  return entries.map(([lane, kind], i) => ({ lane, kind, tick: 1 + i * interval }))
}

export const WAVES = [
  schedule(28, [[1,'basic'], [0,'basic'], [1,'basic'], [0,'basic']]),
  schedule(22, [[2,'fast'], [0,'basic'], [1,'basic'], [2,'fast'], [0,'fast'], [1,'basic']]),
  schedule(20, [[0,'armored'], [1,'fast'], [2,'basic'], [0,'basic'], [1,'armored'], [2,'fast'], [1,'basic'], [2,'basic']]),
  schedule(16, [[2,'armored'], [1,'fast'], [0,'fast'], [2,'fast'], [0,'armored'], [1,'armored'], [2,'basic'], [1,'fast'], [0,'basic'], [2,'fast']]),
  schedule(13, [[0,'armored'], [1,'armored'], [2,'armored'], [0,'fast'], [1,'basic'], [2,'fast'], [1,'fast'], [0,'basic'], [2,'armored'], [0,'armored'], [1,'armored'], [2,'fast'], [0,'fast'], [1,'fast'], [2,'basic']]),
]
