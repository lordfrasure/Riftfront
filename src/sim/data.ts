export const STEP_MS = 50
export const OVERTIME_TICK = 700
export const OVERTIME_RAMP = 100
export const OVERTIME_DAMAGE = 8
export const WIDTH = 1280
export const HEIGHT = 570
export const LANES = [152, 300, 448] as const
export const SLOTS = [290, 470, 650, 830] as const
export const CORE_X = 105
export const ENTRY_X = 1130
export const CORE_HP = 100
export const STARTING_SCRAP = 120
export const SCAVENGER_LIMIT = 2
export const SALVAGE_PAYOUT = 11
export const ARMOR_EXPOSURE = { amount: 7, ticks: 58 }
export const HERALD_ARMOR = 5

export type Lane = 0 | 1 | 2
export type Slot = 0 | 1 | 2 | 3
export type Era = 'ember' | 'coil'
export type DefenderKind = 'guard' | 'archer' | 'scavenger' | 'lobber' | 'mender' | 'conductor'
export type EnemyKind = 'raider' | 'skitter' | 'ram' | 'spitter' | 'herald' | 'colossus'
export type UpgradeKind = 'bastion' | 'vanguard' | 'volley' | 'longshot'

export interface Attack {
  damage: number
  range: number
  cooldown: number
  splash?: number
  pierce?: number
  expose?: boolean
  slow?: number
}

export interface DefenderDefinition {
  label: string
  role: string
  cost: number
  hp: number
  color: number
  era?: Era
  attack?: Attack
  advance?: number
  armor?: number
  heal?: number
}

export const DEFENDERS: Record<DefenderKind, DefenderDefinition> = {
  guard: { label: 'Guard', role: 'Advances to intercept and hold enemies.', cost: 34, hp: 180, color: 0x67debc,
    advance: 118, armor: 4, attack: { damage: 23, range: 35, cooldown: 12 } },
  archer: { label: 'Archer', role: 'Reliable ranged damage behind a Guard.', cost: 40, hp: 64, color: 0xf4cc82,
    attack: { damage: 19, range: 490, cooldown: 12 } },
  scavenger: { label: 'Scavenger', role: '+11 scrap per clear if alive. Limit 2.', cost: 32, hp: 54, color: 0xe89063 },
  lobber: { label: 'Cinder Lobber', role: 'Explosive shells punish clustered enemies.', cost: 50, hp: 76, color: 0xff946f,
    attack: { damage: 26, range: 490, cooldown: 23, splash: 91 } },
  mender: { label: 'Mender', role: 'Heals the most wounded ally nearby in its lane.', cost: 39, hp: 70, color: 0xa9e889,
    heal: 21, attack: { damage: 0, range: 475, cooldown: 15 } },
  conductor: { label: 'Coilcaster', role: 'Slows targets and strips armor for follow-up attacks.', cost: 58, hp: 75, color: 0xa7a3ff,
    era: 'coil', attack: { damage: 13, range: 550, cooldown: 17, expose: true, slow: 36 } },
}

type Upgrade = { base: DefenderKind; label: string; role: string; cost: number;
  changes: Partial<Pick<DefenderDefinition, 'hp' | 'attack' | 'advance' | 'armor'>> }

export const UPGRADES: Record<UpgradeKind, Upgrade> = {
  bastion: { base: 'guard', label: 'Bastion', role: 'Heavy plate holds the line within support range.', cost: 48,
    changes: { hp: 315, armor: 9, advance: 70 } },
  vanguard: { base: 'guard', label: 'Vanguard', role: 'Long advance and sweeping strikes catch packs early.', cost: 48,
    changes: { hp: 235, advance: 165, attack: { damage: 34, range: 42, cooldown: 11, splash: 66 } } },
  volley: { base: 'archer', label: 'Volley', role: 'Fast arrows excel against exposed armor and skitters.', cost: 47,
    changes: { hp: 88, attack: { damage: 21, range: 530, cooldown: 6 } } },
  longshot: { base: 'archer', label: 'Longshot', role: 'Pierces armor and prioritizes the toughest target.', cost: 47,
    changes: { hp: 88, attack: { damage: 57, range: 690, cooldown: 18, pierce: 12 } } },
}

export function profile(unit: { kind: DefenderKind; upgrade?: UpgradeKind }): DefenderDefinition {
  const base = DEFENDERS[unit.kind]
  if (!unit.upgrade) return base
  const upgrade = UPGRADES[unit.upgrade]
  return { ...base, ...upgrade.changes, label: upgrade.label, role: upgrade.role }
}

export const ERAS = {
  ember: { label: 'Ember Age', wave: 1, cost: 0 },
  coil: { label: 'Coil Age', wave: 4, cost: 36 },
} satisfies Record<Era, { label: string; wave: number; cost: number }>

interface EnemyDefinition {
  label: string
  hint: string
  hp: number
  speed: number
  armor: number
  breach: number
  reward: number
  color: number
  attack: Attack
  charge?: number
  aura?: number
  pulse?: { windup: number; interval: number; radius: number; damage: number }
}

export const ENEMIES: Record<EnemyKind, EnemyDefinition> = {
  raider: { label: 'Raider', hint: 'Guards intercept their march.', hp: 61, speed: 116, armor: 0, breach: 8,
    reward: 4, color: 0xf58d82, attack: { damage: 12, range: 34, cooldown: 15 } },
  skitter: { label: 'Skitter', hint: 'Fast packs. Answer with splash or Volley.', hp: 39, speed: 193, armor: 0, breach: 6,
    reward: 3, color: 0xffbf64, attack: { damage: 9, range: 28, cooldown: 10 } },
  ram: { label: 'Iron Ram', hint: '10 armor. Its first strike charges for bonus damage.', hp: 142, speed: 100, armor: 10, breach: 17,
    reward: 8, color: 0xc599e4, charge: 15, attack: { damage: 16, range: 41, cooldown: 20 } },
  spitter: { label: 'Spitter', hint: 'Fires from afar. Intercept it or use Longshot.', hp: 76, speed: 112, armor: 0, breach: 10,
    reward: 5, color: 0xbcdf6b, attack: { damage: 11, range: 218, cooldown: 17 } },
  herald: { label: 'Herald', hint: 'Nearby allies gain 5 armor. Focus the Herald or expose its escort.', hp: 133, speed: 102, armor: 3, breach: 13,
    reward: 7, color: 0x65e7eb, aura: 150, attack: { damage: 12, range: 145, cooldown: 15 } },
  colossus: { label: 'Rift Colossus', hint: 'Telegraphs a crushing lane blast. Spread out and pierce its plate. A breach destroys the core.',
    hp: 1060, speed: 84, armor: 12, breach: 100, reward: 24, color: 0xff6eae,
    attack: { damage: 26, range: 48, cooldown: 21 }, pulse: { windup: 22, interval: 70, radius: 146, damage: 48 } },
}

type Pack = readonly [Lane, EnemyKind, number, number, number?]
interface Spawn { lane: Lane; kind: EnemyKind; tick: number }
export interface Wave { title: string; tip: string; grant: number; bountyRate: number; spawns: Spawn[] }

function wave(title: string, tip: string, grant: number, bountyRate: number, ...packs: Pack[]): Wave {
  const spawns = packs.flatMap(([lane, kind, count, tick, gap = 12]) =>
    Array.from({ length: count }, (_, index) => ({ lane, kind, tick: tick + gap * index })))
  return { title, tip, grant, bountyRate, spawns: spawns.sort((a, b) => a.tick - b.tick) }
}

export const WAVES = [
  wave('First Contact', 'Start with Guards on the forward pads in lanes 1 and 2. Decide where to invest the rest.', 61, 1,
    [0,'raider',5,1,19], [1,'raider',3,10,24]),
  wave('The Scramble', 'Lane 3 opens. A Lobber can hit an entire Skitter pack at once.', 53, 1,
    [2,'skitter',6,1,5], [0,'raider',3,9,19], [1,'skitter',4,44,7]),
  wave('Battering Line', 'Keep fragile units behind the first pad an Iron Ram reaches.', 41, 1,
    [0,'ram',1,1,42], [0,'raider',3,14], [1,'raider',5,1,10], [2,'skitter',6,30,5]),
  wave('Acid Rain', 'Spitters shoot from outside melee reach. Coil Age is available this wave.', 42, 1,
    [0,'spitter',4,1,15], [1,'ram',1,13,45], [1,'raider',4,1], [2,'spitter',3,24,16], [2,'skitter',5,1,6]),
  wave('The Procession', 'Heralds make every escort tougher while they stay close.', 40, 1,
    [2,'herald',2,1,45], [2,'ram',3,1,31], [0,'skitter',10,1,5], [1,'spitter',5,20,14]),
  wave('Broken Rhythm', 'Lanes 1 and 3 need different answers. Reassign specialists with a redeploy.', 42, 0.5,
    [0,'ram',4,1,24], [0,'spitter',4,23,17], [1,'raider',6,10,10], [2,'skitter',13,1,5]),
  wave('Double Pincer', 'Both outer lanes have protected armor. The center is under swarm pressure.', 42, 0.5,
    [0,'ram',4,1,21], [0,'herald',2,15,37], [1,'skitter',14,14,5], [2,'ram',2,12,30], [2,'herald',2,1,42], [2,'spitter',3,15,18]),
  wave('Glass Teeth', 'Sustained ranged volleys. Menders help the front survive long enough to close.', 42, 0.33,
    [0,'spitter',8,1,10], [0,'raider',6,1,13], [1,'spitter',7,12,11], [1,'herald',2,19,37], [2,'ram',5,18,17]),
  wave('Last Light', 'Build for a sustained siege. The Colossus enters the center on the final wave.', 50, 0.26,
    [0,'ram',5,1,17], [0,'skitter',10,24,5], [1,'herald',3,1,31], [1,'ram',4,12,22],
    [1,'spitter',6,31,12], [2,'raider',10,8,9], [2,'spitter',5,25,12]),
  wave('The Rift Colossus', 'The center will flash before each blast. Keep support behind an interceptor.', 0, 0.26,
    [1,'colossus',1,18], [1,'ram',3,1,47], [1,'herald',2,25,61], [1,'skitter',9,35,6],
    [0,'ram',5,15,19], [0,'spitter',6,24,12], [2,'skitter',14,1,5], [2,'herald',2,13,55], [2,'ram',4,18,24]),
]
