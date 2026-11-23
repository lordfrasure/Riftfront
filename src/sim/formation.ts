import { FUSIONS, SYNERGIES, profile } from './data.js'
import type { Defender } from './match.js'

type Unit = Readonly<Defender>
export type Synergy = { kind: keyof typeof SYNERGIES; source: Unit; target: Unit }

export function fusionRecipe(first: Unit, second: Unit) {
  if (first.upgrade || second.upgrade || first.lane !== second.lane) return
  const [front, rear] = first.slot > second.slot ? [first, second] : [second, first]
  if (front.slot - rear.slot !== 1) return
  const recipe = FUSIONS.find(entry => entry.front === front.kind && entry.rear === rear.kind)
  if (recipe) return { recipe, front, rear }
}

export function formationLinks(units: readonly Unit[]): Synergy[] {
  const links: Synergy[] = []
  for (const target of units) {
    if (target.hp <= 0) continue
    const nearby = units.filter(source => source.hp > 0 && source.lane === target.lane &&
      Math.abs(source.slot - target.slot) === 1)
    if (target.kind === 'guard') {
      const source = nearby.find(unit => unit.kind === 'mender' && unit.slot < target.slot &&
        Math.abs(unit.x - target.x) <= profile(unit).heal!.range)
      if (source) links.push({ kind: 'fieldDressing', source, target })
    }
    const definition = profile(target)
    if (definition.attack && !definition.advance) {
      const source = nearby.find(unit => unit.upgrade === 'relay' && Math.abs(unit.x - target.x) <= 175)
      if (source) links.push({ kind: 'sparkLink', source, target })
    }
  }
  return links
}
