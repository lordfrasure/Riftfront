import { fighterImage, type FighterArt } from './art/fighters'
import { ARMOR_EXPOSURE, DEFENDERS, ERAS, FUSIONS, SYNERGIES, STEP_MS, UPGRADES, profile,
  type DefenderDefinition, type DefenderKind, type UpgradeKind } from './sim/data'

export function portrait(art: FighterArt) {
  const image = document.createElement('img')
  image.className = 'portrait'
  image.alt = ''
  image.draggable = false
  image.src = fighterImage(art)
  return image
}

export function statItems(unit: DefenderDefinition) {
  const { attack, heal, hp, armor, advance } = unit
  return listItems([
    `${hp} HP`, `${armor ?? 0} armor`,
    ...(attack ? [`${attack.damage} damage`,
      `${attack.cooldown * STEP_MS / 1000}s interval`, `${attack.range} range`] : []),
    ...(heal ? [`${heal.amount} healing · ${heal.range} range · ${heal.cooldown * STEP_MS / 1000}s`] : []),
    ...(attack?.disrupt ? [`${attack.disrupt * STEP_MS / 1000}s aura disruption`] : []),
    ...(advance ? [`${advance} advance`] : []),
    ...(attack?.splash ? [`${attack.splash} splash radius`] : []),
    ...(attack?.pierce ? [`${attack.pierce} armor pierce`] : []),
    ...(attack?.expose ? [`−${ARMOR_EXPOSURE.amount} enemy armor`] : []),
    ...(attack?.slow ? [`${attack.slow * STEP_MS / 1000}s slow`] : []),
  ])
}

export function listItems(labels: string[]) {
  return labels.map(label => {
    const item = document.createElement('li')
    item.textContent = label
    return item
  })
}

export function buildCollection(root: HTMLElement) {
  for (const kind of Object.keys(DEFENDERS) as DefenderKind[]) {
    const unit = DEFENDERS[kind]
    const entry = document.createElement('article')
    const header = document.createElement('div')
    header.className = 'collection-unit'
    const title = document.createElement('h3')
    title.textContent = unit.label
    const cost = document.createElement('p')
    cost.className = 'subtitle'
    const recipe = FUSIONS.find(entry => entry.result === kind)
    cost.textContent = recipe
      ? `Fuse ${DEFENDERS[recipe.front].label} ahead of ${DEFENDERS[recipe.rear].label} · ${recipe.cost} scrap`
      : `${unit.cost} scrap · ${ERAS[unit.era ?? 'ember'].label}`
    const heading = document.createElement('div')
    heading.append(title, cost)
    header.append(portrait(kind), heading)
    const role = document.createElement('p')
    role.textContent = unit.role
    const stats = document.createElement('ul')
    stats.className = 'stat-list'
    stats.append(...statItems(unit))
    entry.append(header, role, stats)
    for (const key of Object.keys(UPGRADES) as UpgradeKind[]) {
      const upgrade = UPGRADES[key]
      if (upgrade.base !== kind) continue
      const branch = document.createElement('details')
      const summary = document.createElement('summary')
      summary.textContent = `${upgrade.label} · ${upgrade.cost} scrap · ${ERAS[upgrade.era ?? 'ember'].label}`
      const description = document.createElement('p')
      description.textContent = upgrade.role
      const comparison = document.createElement('ul')
      comparison.className = 'stat-list'
      comparison.append(...statItems(profile({ kind, upgrade: key })))
      branch.append(summary, portrait(key), description, comparison)
      entry.append(branch)
    }
    if (kind === 'guard' || kind === 'mender' || unit.attack && !unit.advance || kind === 'chassis') {
      const combo = document.createElement('p')
      const rule = kind === 'guard' || kind === 'mender' ? SYNERGIES.fieldDressing : SYNERGIES.sparkLink
      combo.textContent = `${rule.label} · ${rule.description}`
      entry.append(combo)
    }
    root.append(entry)
  }
}
