import * as Phaser from 'phaser'
import './style.css'
import { Battlefield } from './battlefield'
import { BattleSound } from './sound'
import { buildCollection, listItems, portrait, statItems } from './unit-ui'
import { fighterImage } from './art/fighters'
import {
  CORE_HP, DEFENDERS, ENEMIES, ERAS, FUSIONS, SYNERGIES, HEIGHT, OVERTIME_TICK, STARTING_SCRAP, UPGRADES, WAVES, WIDTH, profile,
  type DefenderKind, type EnemyKind, type Lane, type Slot, type UpgradeKind,
} from './sim/data'
import { fusionRecipe } from './sim/formation'
import { Match, REDEPLOY_COST, type Command } from './sim/match'

function element(id: string) { return document.getElementById(id)! }
function button(id: string) { return element(id) as HTMLButtonElement }
function color(value: number) { return '#' + value.toString(16).padStart(6, '0') }

let match = new Match()
let selected: DefenderKind = 'guard'
let inspected: number | undefined
let moving = false
let fusing = false
let partnerId: number | undefined
let fast = false
let paused = false
let displayedForecast = 0
let displayedReport: Match['lastWave']
const sound = new BattleSound()
const feedback = element('feedback')
const fusionPortrait = element('fusion-portrait') as HTMLImageElement
const inspectorPortrait = element('unit-portrait') as HTMLImageElement
const start = button('start')
const pause = button('pause')
const advance = button('advance')
const result = element('result') as HTMLDialogElement
const army = element('army') as HTMLDialogElement
const settings = element('settings') as HTMLDialogElement
const siege = element('siege')
const briefing = element('briefing')
let hasSiege = false
let kills = 0
let routed = 0
let completedWaves = 0

const cards = (Object.keys(DEFENDERS) as DefenderKind[]).filter(kind => !DEFENDERS[kind].fused).map(kind => {
  const unit = DEFENDERS[kind]
  const control = document.createElement('button')
  control.className = 'unit'
  control.style.setProperty('--unit-color', color(unit.color))
  const title = document.createElement('strong')
  title.textContent = unit.label
  const stats = document.createElement('small')
  stats.textContent = unit.role
  const price = document.createElement('span')
  price.className = 'price'
  price.textContent = `${unit.cost} scrap`
  const copy = document.createElement('span')
  copy.className = 'unit-copy'
  copy.append(title, price, stats)
  control.append(portrait(kind), copy)
  control.onclick = () => {
    feedback.classList.remove('error')
    selected = kind
    inspected = undefined
    moving = fusing = false
    partnerId = undefined
    feedback.textContent = `${unit.label} selected. Choose an empty pad.`
    updateHud()
  }
  element('units').append(control)
  return { kind, control }
})

const pads = match.layout.lanes.flatMap((y, lane) => match.layout.slots.map((x, slot) => {
  const control = document.createElement('button')
  control.className = 'pad'
  control.style.left = `${x / WIDTH * 100}%`
  control.style.top = `${y / HEIGHT * 100}%`
  control.onclick = () => {
    const unit = occupant(lane, slot)
    if (fusing) {
      if (!unit) return
      partnerId = unit.id
      updateHud()
      element('fusion-preview').scrollIntoView({ block: 'nearest' })
      button('confirm-fusion').focus({ preventScroll: true })
    } else if (unit) {
      feedback.classList.remove('error')
      inspected = unit.id
      moving = false
      feedback.textContent = `Inspecting ${profile(unit).label} in lane ${lane + 1}.`
      updateHud()
      element('inspector').scrollIntoView({ block: 'nearest' })
    } else if (moving && inspected !== undefined) {
      issue({ type: 'redeploy', id: inspected, lane, slot }, 'Defender redeployed.')
    } else {
      issue({ type: 'place', kind: selected, lane, slot }, `${DEFENDERS[selected].label} deployed in lane ${lane + 1}.`)
    }
  }
  element('pads').append(control)
  return { lane, slot, control }
}))

const upgradeButtons = (Object.keys(UPGRADES) as UpgradeKind[]).map(upgrade => {
  const definition = UPGRADES[upgrade]
  const control = document.createElement('button')
  const name = document.createElement('strong')
  name.textContent = `${definition.label} · ${definition.cost} scrap`
  const details = document.createElement('small')
  const stats = document.createElement('small')
  stats.className = 'branch-stats'
  stats.textContent = statItems(profile({ kind: definition.base, upgrade })).map(item => item.textContent).join(' · ')
  details.textContent = definition.role
  const copy = document.createElement('span')
  copy.append(name, details, stats)
  control.append(portrait(upgrade), copy)
  control.onclick = () => {
    if (inspected !== undefined) issue({ type: 'upgrade', id: inspected, upgrade }, `${definition.label} retrofit installed.`)
  }
  element('evolution-branches').append(control)
  return { definition, control, details }
})

function occupant(lane: Lane, slot: Slot) {
  return match.view.defenders.find(unit => unit.lane === lane && unit.slot === slot)
}

function issue(command: Command, success: string) {
  const error = match.dispatch(command)
  if (!error) {
    moving = fusing = false
    partnerId = undefined
    if (command.type === 'fuse') inspected = match.view.defenders.at(-1)?.id
    if (command.type === 'retire' || command.type === 'start') inspected = undefined
  }
  feedback.textContent = error ?? success
  feedback.classList.toggle('error', Boolean(error))
  updateHud()
  if (error || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const target = command.type === 'place' || command.type === 'redeploy'
    ? pads.find(pad => pad.lane === command.lane && pad.slot === command.slot)?.control
    : command.type === 'upgrade' || command.type === 'fuse' ? inspectorPortrait : undefined
  target?.animate([{ boxShadow: '0 0 0 2px #fff1b9' }, { boxShadow: '0 0 0 12px transparent' }],
    { duration: 370, easing: 'ease-out' })
}

function updateHud() {
  const state = match.view
  const building = state.phase === 'build'
  const battling = state.phase === 'battle'
  const unit = building ? state.defenders.find(candidate => candidate.id === inspected) : undefined
  const foundry = state.era === 'coil'
  const shown = match.waves[state.wave - 1]
  const links = building ? match.links : []
  const partner = state.defenders.find(candidate => candidate.id === partnerId)
  const merge = unit && partner && fusionRecipe(unit, partner)
  element('scrap').textContent = String(state.scrap)
  element('core').textContent = `${state.core} / ${CORE_HP}`
  const meter = element('core-meter') as HTMLProgressElement
  meter.max = CORE_HP
  meter.value = state.core
  meter.classList.toggle('critical', state.core <= 35)
  element('units').classList.toggle('standby', !building)
  element('wave').textContent = `${state.wave} / ${WAVES.length}`
  element('era').textContent = ERAS[state.era].label
  document.documentElement.classList.toggle('coil', foundry)
  advance.hidden = foundry || !building
  advance.disabled = state.wave < ERAS.coil.wave || state.scrap < ERAS.coil.cost
  advance.hidden ||= state.wave < ERAS.coil.wave
  advance.textContent = `Advance to Coil Age · ${ERAS.coil.cost}`
  start.disabled = !building
  start.textContent = building ? `Start wave ${state.wave}` : battling ? state.tick >= OVERTIME_TICK ? 'Enemies enraged' : `${state.spawned}/${shown.spawns.length} deployed` : 'Siege ended'
  pause.disabled = !battling
  pause.textContent = paused ? 'Resume' : 'Pause'
  pause.setAttribute('aria-pressed', String(paused))
  element('paused').hidden = !paused

  for (const { kind, control } of cards) {
    const locked = DEFENDERS[kind].era === 'coil' && !foundry
    control.setAttribute('aria-pressed', String(!unit && kind === selected))
    control.disabled = !building || locked
    control.classList.toggle('unaffordable', state.scrap < DEFENDERS[kind].cost)
    control.title = locked ? 'Available in the Coil Age' : DEFENDERS[kind].role
    control.classList.toggle('locked', locked)
  }
  const recruit = moving && unit ? profile(unit) : DEFENDERS[selected]
  const reach = (recruit.attack?.range ?? recruit.heal?.range ?? 0) + (recruit.advance ?? 0)
  for (const { lane, slot, control } of pads) {
    control.hidden = !building
    if (!building) continue
    const defender = occupant(lane, slot)
    const eligible = Boolean(fusing && unit && defender && fusionRecipe(unit, defender))
    control.disabled = fusing && !eligible
    control.classList.toggle('fusion-target', eligible)
    control.classList.toggle('linked', links.some(link => link.target.id === defender?.id || link.source.id === defender?.id))
    control.classList.toggle('occupied', Boolean(defender))
    control.classList.toggle('inspected', Boolean(unit && defender?.id === unit.id))
    control.style.setProperty('--unit-color', color(recruit.color))
    control.style.setProperty('--range', `${Math.min(reach, WIDTH - match.layout.slots[slot]) / WIDTH * 100}cqw`)
    const location = `lane ${lane + 1}, pad ${slot + 1}`
    control.setAttribute('aria-label', defender
      ? `${eligible ? 'Fuse with' : 'Inspect'} ${profile(defender).label} in ${location}`
      : `${moving ? 'Move' : 'Place'} ${recruit.label} in ${location}`)
  }

  element('inspector').hidden = !unit
  element('inspector').classList.toggle('fusing', fusing)
  if (unit) {
    const definition = profile(unit)
    element('unit-name').textContent = `${definition.label} · Lane ${unit.lane + 1}`
    element('unit-role').textContent = definition.role
    inspectorPortrait.src = fighterImage(unit.upgrade ?? unit.kind)
    element('unit-stats').replaceChildren(...statItems(definition))
    button('move').textContent = moving ? 'Cancel redeploy' : `Redeploy · ${REDEPLOY_COST}`
    button('move').disabled = !moving && state.scrap < REDEPLOY_COST
    button('retire').textContent = `Retire +${Math.floor(DEFENDERS[unit.kind].cost / 3)}`
    const active = links.filter(link => link.source.id === unit.id || link.target.id === unit.id)
    const potential = unit.kind === 'guard' || unit.kind === 'mender' ? SYNERGIES.fieldDressing
      : unit.kind === 'chassis' && (!unit.upgrade || unit.upgrade === 'relay') || definition.attack && !definition.advance
        ? SYNERGIES.sparkLink : undefined
    element('unit-links').textContent = active.length
      ? active.map(link => `${SYNERGIES[link.kind].label} active with ${profile(link.source.id === unit.id ? link.target : link.source).label}`).join(' · ')
      : potential ? `${potential.label} · ${potential.description}` : ''
    for (const { definition: option, control, details } of upgradeButtons) {
      const locked = option.era === 'coil' && !foundry
      control.hidden = option.requires !== unit.upgrade || option.base !== unit.kind
      control.disabled = fusing || locked || state.scrap < option.cost
      details.textContent = locked ? `Requires Coil Age. ${option.role}` : option.role
    }
    const branchCount = upgradeButtons.filter(({ control }) => !control.hidden).length
    element('evolution-heading').textContent = branchCount > 1 ? 'Evolve · choose one branch' : 'Evolve'
    const recipes = unit.upgrade ? [] : FUSIONS.filter(recipe => recipe.front === unit.kind || recipe.rear === unit.kind)
    element('fusion-rule').textContent = merge ? '' : recipes.map(recipe =>
      `${DEFENDERS[recipe.result].label} · ${recipe.cost} scrap. Place an unupgraded ${DEFENDERS[recipe.front].label} immediately ahead of an unupgraded ${DEFENDERS[recipe.rear].label}.`).join(' ')
    const hasPartner = state.defenders.some(candidate => fusionRecipe(unit, candidate))
    button('fuse').hidden = recipes.length === 0
    button('fuse').disabled = !hasPartner
    button('fuse').title = hasPartner ? '' : 'Position the recipe ingredients on consecutive pads.'
    button('fuse').textContent = fusing ? 'Cancel fusion' : 'Fuse…'
    element('fusion-preview').hidden = !merge
    if (merge) {
      const result = DEFENDERS[merge.recipe.result]
      fusionPortrait.src = fighterImage(merge.recipe.result)
      element('fusion-name').textContent = result.label
      element('fusion-role').textContent = result.role
      element('fusion-placement').textContent = `Consumes both defenders. Keeps pad ${merge.front.slot + 1} and frees pad ${merge.rear.slot + 1}.`
      element('fusion-stats').replaceChildren(...statItems(result))
      button('confirm-fusion').textContent = `Confirm fusion · ${merge.recipe.cost} scrap`
      button('confirm-fusion').disabled = state.scrap < merge.recipe.cost
    }
  }

  updateIntel()
  if ((state.phase === 'victory' || state.phase === 'defeat') && !result.open && !siege.hidden) {
    element('outcome').textContent = state.phase === 'victory' ? 'Rift sealed' : 'Core shattered'
    const damage = match.lastWave?.coreDamage ?? []
    const mostDamage = Math.max(...damage)
    const hardest = damage.flatMap((amount, lane) => amount === mostDamage && amount > 0 ? [lane + 1] : [])
    element('summary').textContent = state.phase === 'victory'
      ? `Ten assaults survived · ${state.core} core integrity`
      : `Core lost on wave ${state.wave}.${hardest.length ? ` Heaviest breach: ${hardest.length === 1 ? 'lane' : 'lanes'} ${hardest.join(', ')}.` : ''}`
    result.dataset.outcome = state.phase
    element('result-stats').replaceChildren(...listItems([
      `${completedWaves} waves cleared`, `${kills} enemies defeated`, `${routed} defenders routed`, `${state.scrap} scrap remaining`,
    ]))
    result.showModal()
    button('replay').focus()
  }
}

function updateIntel() {
  const { wave, phase } = match.view
  element('intel-heading').textContent = phase === 'build' ? `Incoming · Wave ${wave}` : `Siege · Wave ${wave}`
  if (displayedForecast !== wave) {
    displayedForecast = wave
    const { title, tip, spawns } = match.waves[wave - 1]
    element('wave-title').textContent = title
    element('tip').textContent = tip
    element('forecast').replaceChildren(...match.layout.lanes.map((_, lane) => {
      const counts = new Map<EnemyKind, number>()
      for (const spawn of spawns) {
        if (spawn.lane === lane) counts.set(spawn.kind, (counts.get(spawn.kind) ?? 0) + 1)
      }
      const row = document.createElement('li')
      const name = document.createElement('strong')
      name.textContent = `Lane ${lane + 1}`
      const list = document.createElement('span')
      list.textContent = [...counts].map(([kind, count]) => `${count}× ${ENEMIES[kind].label}`).join(' · ') || 'Clear'
      row.append(name, list)
      return row
    }))
    element('threat-list').replaceChildren(...Array.from(new Set(spawns.map(spawn => spawn.kind)), kind => {
      const row = document.createElement('p')
      const name = document.createElement('strong')
      name.style.color = color(ENEMIES[kind].color)
      name.textContent = ENEMIES[kind].label
      row.append(name, ` · ${ENEMIES[kind].hint}`)
      return row
    }))
  }
  const report = match.lastWave
  if (displayedReport === report) return
  displayedReport = report
  element('report').hidden = !report
  if (!report) return
  kills += report.kills
  routed += report.losses
  if (phase !== 'defeat') completedWaves++
  element('report-heading').textContent = `Wave ${report.wave} report`
  const damage = report.coreDamage.flatMap((amount, lane) => amount ? [`Lane ${lane + 1} −${amount}`] : [])
  element('report-damage').textContent = damage.length ? `Core breached · ${damage.join(' / ')}` : 'Core held in every lane.'
  element('report-losses').textContent = `${report.kills} defeated · ${report.losses} routed · ${report.synergyActions} boosted actions`
  const incidents = report.incidents
  const highlights = match.layout.lanes.flatMap((_, lane) => {
    const firstBreach = incidents.find(event => event.lane === lane && event.action === 'breach')
    const firstRoute = incidents.find(event => event.lane === lane && event.routed)
    const counter = incidents.find(event => event.lane === lane &&
      (event.action === 'interrupt' || event.action === 'brace'))
    const details: string[] = []
    if (firstRoute) {
      const source = ENEMIES[firstRoute.enemy].label
      const ability = { impact: ' charge', snipe: ' aimed shot', pulse: ' blast' }
      const suffix = firstRoute.action === 'impact' || firstRoute.action === 'snipe' || firstRoute.action === 'pulse'
        ? ability[firstRoute.action] : ''
      details.push(`${source}${suffix} routed ${firstRoute.defender}`)
    }
    const markedHit = incidents.find(event => event.lane === lane &&
      (event.action === 'impact' || event.action === 'snipe'))
    if (!firstRoute && markedHit) details.push(
      `${ENEMIES[markedHit.enemy].label} hit ${markedHit.defender} (−${markedHit.amount})`)
    if (firstBreach) details.push(`${ENEMIES[firstBreach.enemy].label} breached first (−${firstBreach.amount})`)
    if (counter) details.push(counter.action === 'interrupt'
      ? `${counter.defender} stopped the charge` : `${counter.defender} braced for impact`)
    return details.length ? [`Lane ${lane + 1} · ${details.join('. ')}.`] : []
  })
  element('report-incidents').hidden = highlights.length === 0
  element('report-incidents').textContent = highlights.join(' ')
  element('report-economy').textContent = `+${report.bounty} bounty · +${report.income} salvage · +${report.clearBonus} grant`
}

function reset() {
  feedback.classList.remove('error')
  match = new Match()
  inspected = undefined
  selected = 'guard'
  moving = fusing = false
  partnerId = undefined
  paused = false
  kills = routed = completedWaves = 0
  result.close()
  battlefield.resetEffects()
  feedback.textContent = 'Recruit a defender, then choose a pad. The rifts are on the right.'
  updateHud()
  if (!siege.hidden) cards[0].control.focus()
}

start.onclick = () => issue({ type: 'start' }, 'Defenders engage automatically.')
advance.onclick = () => issue({ type: 'advance', era: 'coil' }, 'Coil Age unlocked. Recruit Coilcasters or inspect a Guard or Archer to retrofit.')
button('fuse').onclick = () => {
  moving = false
  fusing = !fusing
  partnerId = undefined
  feedback.classList.remove('error')
  feedback.textContent = fusing ? 'Choose a highlighted partner to preview fusion.' : 'Fusion canceled.'
  updateHud()
  if (fusing) pads.find(pad => !pad.control.disabled)?.control.focus()
}
button('confirm-fusion').onclick = () => {
  if (inspected !== undefined && partnerId !== undefined) {
    issue({ type: 'fuse', first: inspected, second: partnerId }, 'Fusion complete. The rear pad is free.')
    if (!fusing) button('move').focus()
  }
}
siege.addEventListener('keydown', event => {
  if (event.key === 'Escape' && fusing) {
    event.preventDefault()
    button('fuse').click()
    button('fuse').focus()
  }
})
button('move').onclick = () => {
  feedback.classList.remove('error')
  fusing = false
  partnerId = undefined
  moving = !moving
  feedback.textContent = moving ? 'Choose an empty pad in any lane.' : 'Redeploy canceled.'
  updateHud()
}
button('retire').onclick = () => {
  if (inspected !== undefined) issue({ type: 'retire', id: inspected }, 'Defender retired for scrap.')
}
button('speed').onclick = () => {
  fast = !fast
  button('speed').setAttribute('aria-pressed', String(fast))
}
pause.onclick = () => { paused = !paused; updateHud() }
async function toggleSound() {
  const enabled = await sound.toggle()
  for (const id of ['mute', 'settings-sound']) {
    const control = button(id)
    control.setAttribute('aria-pressed', String(enabled))
    control.textContent = enabled ? 'Sound on' : 'Sound off'
  }
}
button('mute').onclick = toggleSound
button('settings-sound').onclick = toggleSound
button('restart').onclick = () => {
  if (match.view.wave === 1 && match.view.phase === 'build' || window.confirm('Restart this siege?')) reset()
}
function showSiege() {
  hasSiege = true
  siege.hidden = false
  briefing.hidden = true
  button('resume-siege').hidden = true
  updateHud()
  if (!result.open) (match.view.phase === 'battle' ? pause : cards[0].control).focus()
}
function showBriefing() {
  result.close()
  siege.hidden = true
  briefing.hidden = false
  const active = hasSiege && (match.view.phase === 'build' || match.view.phase === 'battle')
  button('resume-siege').hidden = !active
  button('play').focus()
}

button('home').onclick = showBriefing
button('play').onclick = () => { reset(); showSiege() }
button('resume-siege').onclick = showSiege
button('replay').onclick = reset
button('result-home').onclick = showBriefing
result.addEventListener('cancel', event => { event.preventDefault(); showBriefing() })
button('open-army').onclick = button('review-army').onclick = () => army.showModal()
button('open-settings').onclick = () => settings.showModal()
buildCollection(element('collection'))
element('brief-scrap').textContent = String(STARTING_SCRAP)
element('brief-threat').textContent = WAVES[0].title
feedback.textContent = 'Recruit a defender, then choose a pad. The rifts are on the right.'
updateHud()

const battlefield = new Battlefield(() => match, phase => {
  if (phase === 'build') feedback.textContent = 'Defenders rallied. Review the next threat and reinforce.'
  if (phase === 'victory' || phase === 'defeat') feedback.textContent = 'Siege ended. See the wave report for details.'
  updateHud()
}, () => paused || siege.hidden || army.open || settings.open ? 0 : fast ? 2 : 1, sound)

const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: WIDTH, height: HEIGHT, backgroundColor: '#171520',
  scene: battlefield, banner: false,
})

if (import.meta.hot) import.meta.hot.dispose(() => game.destroy(true))
