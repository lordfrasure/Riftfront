import type { Lane } from './data.js'

export interface Combatant {
  id: number
  lane: Lane
  x: number
  hp: number
  cooldown: number
}

export function selectTarget<T extends Combatant>(
  attacker: Combatant, candidates: readonly T[], range: number, direction: -1 | 1,
): T | undefined {
  let target: T | undefined
  let nearest = Infinity
  for (const candidate of candidates) {
    if (candidate.lane !== attacker.lane || candidate.hp <= 0) continue
    const distance = (candidate.x - attacker.x) * direction
    if (distance < 0 || distance > range) continue
    if (distance < nearest || (distance === nearest && target && candidate.id < target.id)) {
      target = candidate
      nearest = distance
    }
  }
  return target
}

export function applyDamage(target: Combatant, damage: number, armor = 0): void {
  target.hp = Math.max(0, target.hp - Math.max(1, damage - armor))
}
