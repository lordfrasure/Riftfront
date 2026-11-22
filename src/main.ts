import * as Phaser from 'phaser'
import './style.css'
import { Battlefield } from './battlefield'
import { BattleSound } from './sound'
import {
  CORE_HP, DEFENDERS, ENEMIES, ERAS, HEIGHT, LANES, OVERTIME_TICK, SLOTS, UPGRADES, WAVES, WIDTH, profile,
  type DefenderKind, type EnemyKind, type Lane, type Slot, type UpgradeKind,
} from './sim/data'
import { Match, REDEPLOY_COST, type Command } from './sim/match'

function element(id: string) { return document.getElementById(id)! }
function button(id: string) { return element(id) as HTMLButtonElement }
function color(value: number) { return '#' + value.toString(16).padStart(6, '0') }

let match = new Match()
let selected: DefenderKind = 'guard'
let inspected: number | undefined
let moving = false
let fast = false
let paused = false
let displayedForecast = 0
let displayedReport: Match['lastWave']
const sound = new BattleSound()
const feedback = element('feedback')
const start = button('start')
const pause = button('pause')
const advance = button('advance')
const result = element('result')
const icons: Record<DefenderKind, string> = {
  guard: '⬟', archer: '➶', scavenger: '✦', lobber: '◉', mender: '✚', conductor: 'ϟ',
}

const cards = (Object.keys(DEFENDERS) as DefenderKind[]).map(kind => {
  const unit = DEFENDERS[kind]
  const control = document.createElement('button')
  control.className = 'unit'
  control.style.setProperty('--unit-color', color(unit.color))
  const icon = document.createElement('span')
  icon.className = 'unit-icon'
  icon.setAttribute('aria-hidden', 'true')
  icon.textContent = icons[kind]
  const title = document.createElement('strong')
  title.textContent = unit.label
  const stats = document.createElement('small')
  stats.textContent = unit.role
  const price = document.createElement('span')
  price.className = 'price'
  price.textContent = `${unit.cost} scrap`
  control.append(icon, title, price, stats)
  control.onclick = () => {
    selected = kind
    inspected = undefined
    moving = false
    feedback.textContent = `${unit.label} selected. Choose an empty pad.`
    updateHud()
  }
  element('units').append(control)
  return { kind, control }
})

const pads = LANES.flatMap((y, row) => SLOTS.map((x, column) => {
  const lane = row as Lane
  const slot = column as Slot
  const control = document.createElement('button')
  control.className = 'pad'
  control.style.left = `${x / WIDTH * 100}%`
  control.style.top = `${y / HEIGHT * 100}%`
  control.onclick = () => {
    const unit = occupant(lane, slot)
    if (unit) {
      inspected = unit.id
      moving = false
      feedback.textContent = `Inspecting ${profile(unit).label} in lane ${lane + 1}.`
      updateHud()
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
  details.textContent = definition.role
  control.append(name, details)
  control.onclick = () => {
    if (inspected !== undefined) issue({ type: 'upgrade', id: inspected, upgrade }, `${definition.label} retrofit installed.`)
  }
  element('retrofits').append(control)
  return { definition, control }
})

function occupant(lane: Lane, slot: Slot) {
  return match.view.defenders.find(unit => unit.lane === lane && unit.slot === slot)
}

function issue(command: Command, success: string) {
  const error = match.dispatch(command)
  if (!error) {
    moving = false
    if (command.type === 'retire' || command.type === 'start') inspected = undefined
  }
  feedback.textContent = error ?? success
  updateHud()
}

function updateHud() {
  const state = match.view
  const building = state.phase === 'build'
  const battling = state.phase === 'battle'
  const unit = building ? state.defenders.find(candidate => candidate.id === inspected) : undefined
  const foundry = state.era === 'coil'
  const shown = WAVES[state.wave - 1]
  element('scrap').textContent = String(state.scrap)
  element('core').textContent = `${state.core} / ${CORE_HP}`
  element('wave').textContent = `${state.wave} / ${WAVES.length}`
  element('era').textContent = ERAS[state.era].label
  document.documentElement.classList.toggle('coil', foundry)
  advance.hidden = foundry || !building
  advance.disabled = state.wave < ERAS.coil.wave || state.scrap < ERAS.coil.cost
  advance.textContent = state.wave < ERAS.coil.wave ? 'Coil Age unlocks at wave 4' : `Advance to Coil Age · ${ERAS.coil.cost}`
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
  }
  const recruit = moving && unit ? profile(unit) : DEFENDERS[selected]
  const reach = (recruit.attack?.range ?? 0) + (recruit.advance ?? 0)
  for (const { lane, slot, control } of pads) {
    control.hidden = !building
    if (!building) continue
    const defender = occupant(lane, slot)
    control.classList.toggle('occupied', Boolean(defender))
    control.classList.toggle('inspected', Boolean(unit && defender?.id === unit.id))
    control.style.setProperty('--unit-color', color(recruit.color))
    control.style.setProperty('--range', `${Math.min(reach, WIDTH - SLOTS[slot]) / WIDTH * 100}cqw`)
    const location = `lane ${lane + 1}, pad ${slot + 1}`
    control.setAttribute('aria-label', defender
      ? `Inspect ${profile(defender).label} in ${location}`
      : `${moving ? 'Move' : 'Place'} ${recruit.label} in ${location}`)
  }

  element('inspector').hidden = !unit
  if (unit) {
    const definition = profile(unit)
    const { attack, heal, armor } = definition
    const combat = attack ? ` · ${heal ? `Heals ${heal}` : `${attack.damage} damage`} · ${attack.cooldown / 20}s · ${attack.range} range` : ''
    element('unit-name').textContent = `${definition.label} · Lane ${unit.lane + 1}`
    element('unit-role').textContent = `${definition.hp} HP${armor ? ` · ${armor} armor` : ''}${combat} · ${definition.role}`
    button('move').textContent = moving ? 'Cancel redeploy' : `Redeploy · ${REDEPLOY_COST}`
    button('move').disabled = !moving && state.scrap < REDEPLOY_COST
    button('retire').textContent = `Retire +${Math.floor(DEFENDERS[unit.kind].cost / 3)}`
    for (const { definition: option, control } of upgradeButtons) {
      control.hidden = !foundry || Boolean(unit.upgrade) || option.base !== unit.kind
      control.disabled = state.scrap < option.cost
    }
  }

  updateIntel()
  if ((state.phase === 'victory' || state.phase === 'defeat') && result.hidden) {
    element('outcome').textContent = state.phase === 'victory' ? 'Rift sealed' : 'Core shattered'
    const hardest = match.lastWave?.coreDamage.reduce((best, amount, lane, damage) =>
      amount > damage[best] ? lane : best, 0) ?? 0
    element('summary').textContent = state.phase === 'victory'
      ? `Ten assaults survived · ${state.core} core integrity`
      : `Wave ${state.wave} · Lane ${hardest + 1} suffered the most damage.`
    result.hidden = false
    button('replay').focus()
  }
}

function updateIntel() {
  const { wave, phase } = match.view
  element('intel-heading').textContent = phase === 'build' ? `Incoming · Wave ${wave}` : `Siege · Wave ${wave}`
  if (displayedForecast !== wave) {
    displayedForecast = wave
    const { title, tip, spawns } = WAVES[wave - 1]
    element('wave-title').textContent = title
    element('tip').textContent = tip
    element('forecast').replaceChildren(...LANES.map((_, lane) => {
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
  element('report-heading').textContent = `Wave ${report.wave} report`
  const damage = report.coreDamage.flatMap((amount, lane) => amount ? [`Lane ${lane + 1} −${amount}`] : [])
  element('report-damage').textContent = damage.length ? `Core breached · ${damage.join(' / ')}` : 'Core held in every lane.'
  element('report-losses').textContent = `${report.kills} defeated · ${report.losses} routed`
  element('report-economy').textContent = `+${report.bounty} bounty · +${report.income} salvage · +${report.clearBonus} grant`
}

function reset() {
  match = new Match()
  inspected = undefined
  selected = 'guard'
  moving = false
  paused = false
  result.hidden = true
  battlefield.resetEffects()
  feedback.textContent = 'Recruit a defender, then choose a pad. The rifts are on the right.'
  updateHud()
  cards[0].control.focus()
}

start.onclick = () => issue({ type: 'start' }, 'Defenders engage automatically.')
advance.onclick = () => issue({ type: 'advance', era: 'coil' }, 'Coil Age unlocked. Recruit Coilcasters or inspect a Guard or Archer to retrofit.')
button('move').onclick = () => {
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
button('mute').onclick = async () => {
  const enabled = await sound.toggle()
  button('mute').setAttribute('aria-pressed', String(enabled))
  button('mute').textContent = enabled ? 'Sound on' : 'Sound off'
}
button('restart').onclick = () => {
  if (match.view.wave === 1 && match.view.phase === 'build' || window.confirm('Restart this siege?')) reset()
}
button('replay').onclick = reset
feedback.textContent = 'Recruit a defender, then choose a pad. The rifts are on the right.'
updateHud()

const battlefield = new Battlefield(() => match, phase => {
  if (phase === 'build') feedback.textContent = 'Defenders rallied. Review the next threat and reinforce.'
  if (phase === 'victory' || phase === 'defeat') feedback.textContent = 'Siege ended. See the wave report for details.'
  updateHud()
}, () => paused ? 0 : fast ? 2 : 1, sound)

const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: WIDTH, height: HEIGHT, backgroundColor: '#171520',
  scene: battlefield, banner: false,
})

if (import.meta.hot) import.meta.hot.dispose(() => game.destroy(true))
