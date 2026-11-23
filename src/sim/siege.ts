import { WAVES, type EnemyKind, type UpgradeKind, type Wave } from './data.js'

export interface SiegeRules {
  readonly capacity?: boolean
  readonly recovery?: boolean
  readonly routes?: boolean
  readonly economy?: boolean
  readonly timing?: boolean
}
export const COMMAND_LIMIT = 8
export const RECOVERY_COST = 18
export const CREDIT_VALUE = 44
export const ROUTE_REWARDS = {
  scrap: { label: '26 scrap', amount: 26 },
  repair: { label: 'Restore 20 core', amount: 20 },
  shield: { label: 'Up to 44 scrap toward a Guard or Wardkeeper upgrade or Wardkeeper fusion' },
  precision: { label: 'Up to 44 scrap toward an Archer or Arc Ranger upgrade or Arc Ranger fusion' },
  foundry: { label: 'Up to 44 scrap toward a Foundry evolution' },
} as const
export type Reward = keyof typeof ROUTE_REWARDS
export type Credit = Exclude<Reward, 'scrap' | 'repair'>
export const UPGRADE_CREDITS: Partial<Record<UpgradeKind, Credit>> = {
  bastion: 'shield', vanguard: 'shield', wardplate: 'shield',
  volley: 'precision', longshot: 'precision', arcLance: 'precision',
  bulwark: 'foundry', relay: 'foundry', mortar: 'foundry',
}

type Reinforcement = readonly [EnemyKind, number, number, number]
interface Front {
  title: string
  threat: string
  reward: Reward
  attacks: readonly [Reinforcement, Reinforcement]
}
const FRONTS: readonly Front[] = [
  { title: 'Fast breach', threat: 'Skitter rush followed by a Raider surge', reward: 'foundry',
    attacks: [['skitter', 4, 4, 5], ['raider', 3, 43, 6]] },
  { title: 'Armor column', threat: 'An armored Ram followed by a Herald and its escorts', reward: 'precision',
    attacks: [['ram', 1, 19, 1], ['herald', 1, 19, 1]] },
  { title: 'Crossfire', threat: 'Staggered Spitter fire followed by ranged reinforcements', reward: 'shield',
    attacks: [['spitter', 2, 40, 22], ['spitter', 3, 22, 16]] },
  { title: 'Broken ranks', threat: 'Staggered light enemies followed by a longer Skitter rush', reward: 'scrap',
    attacks: [['raider', 2, 46, 27], ['skitter', 5, 48, 6]] },
  { title: 'Relief march', threat: 'A delayed Raider unit followed by a lone Ram', reward: 'repair',
    attacks: [['raider', 2, 65, 21], ['ram', 1, 65, 1]] },
]

export interface RouteOffer {
  readonly title: string
  readonly threat: string
  readonly reward: Reward
  readonly lane: number
  readonly waves: readonly [Wave, Wave]
  readonly packs: readonly [Reinforcement, Reinforcement]
}

export function commandLimit(wave: number) {
  return COMMAND_LIMIT + Number(wave > 4) + 2 * Number(wave > 7)
}

export function siegeSchedule(rules: SiegeRules): Wave[] {
  return WAVES.map((wave, index) => ({
    ...wave,
    grant: rules.economy !== false && index ? Math.max(0, wave.grant - 6) : wave.grant,
    bountyRate: wave.bountyRate * (rules.economy === false || index < 4 ? 1 : .8),
    // The penultimate fight builds from escorts to armored impact. The final
    // fight gives the core guard time to engage the Colossus before rushes arrive.
    spawns: wave.spawns.map(spawn => {
      const delay = rules.timing === false || spawn.lane !== 1 ? 0
        : index === 8 && spawn.kind === 'ram' ? 74
        : index === 8 && spawn.kind === 'spitter' ? 119
        : index === 9 && spawn.kind === 'skitter' ? 82 : 0
      return { ...spawn, tick: spawn.tick + delay }
    }).sort((a, b) => a.tick - b.tick),
    tip: rules.timing === false ? wave.tip : index === 8 ? 'Center Heralds arrive first, then Rams and ranged fire. The outer lanes strike in parallel.'
      : index === 9 ? 'The Colossus leads the center. Keep support outside its marked blasts and prepare for a delayed rush.'
      : wave.tip,
  }))
}

export function routeOffers(schedule: readonly Wave[], seed: number, wave: number): readonly RouteOffer[] {
  if (wave < 3 || wave > 9 || wave % 2 === 0 || !schedule[wave]) return []
  const checkpoint = (wave - 3) / 2
  // Hash each checkpoint independently so choices on earlier fronts never change future offers.
  const draw = (salt: number) => {
    let value = (seed ^ Math.imul(checkpoint + 1, salt)) >>> 0
    value = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
    return (value ^ (value >>> 16)) >>> 0
  }
  const lane = draw(0x934ac31) % 3
  const advanced = FRONTS[draw(0x277bdcf) % 3]
  const relief = FRONTS[3 + draw(0x7f4a7c15) % 2]
  const make = (front: Front, reinforcementLane: number): RouteOffer => {
    const reinforce = (offset: 0 | 1) => {
      const base = schedule[wave - 1 + offset]
      const [kind, count, tick, gap] = front.attacks[offset]
      const last = wave === 9 && offset === 1
      const lane = last ? 1 : reinforcementLane
      const spawns = [...base.spawns, ...Array.from({ length: count }, (_, index) => ({
        lane, kind, tick: tick + index * gap + (last ? 160 : 0),
        ...(wave >= 5 && kind === 'ram' && { siege: 'impact' as const }),
        ...(wave >= 5 && kind === 'spitter' && index === 0 && { siege: 'snipe' as const }),
      }))].sort((a, b) => a.tick - b.tick)
      return { ...base, spawns, tip: `${base.tip} ${front.title} adds reinforcements in lane ${lane + 1}.` }
    }
    return { title: front.title, threat: front.threat, reward: front.reward, lane: reinforcementLane,
      waves: [reinforce(0), reinforce(1)], packs: front.attacks }
  }
  return [make(relief, lane), make(advanced, (lane + 1 + draw(0x517cc1b7) % 2) % 3)]
}
