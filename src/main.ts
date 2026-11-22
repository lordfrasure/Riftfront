import * as Phaser from 'phaser'
import './style.css'
import { Battlefield } from './battlefield'
import { CORE_HP, DEFENDERS, ENEMIES, HEIGHT, LANES, SLOTS, STEP_MS, WAVES, WIDTH,
  type DefenderKind, type EnemyKind, type Lane, type Slot } from './sim/data'
import { Match, type Command } from './sim/match'

function element<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T
}

let match = new Match()
let selected: DefenderKind = 'guard'
const feedback = element('feedback')
const start = element<HTMLButtonElement>('start')
const replay = element<HTMLButtonElement>('replay')
const result = element('result')
const scrap = element('scrap')
const core = element('core')
const wave = element('wave')
const speed = element<HTMLButtonElement>('speed')
const forecast = element('forecast')
const armorNote = element('armor-note')
armorNote.textContent = `Armor absorbs ${ENEMIES.armored.armor} damage per hit.`
let fastForward = false
let displayedForecast = 0
let displayedReport: Match['lastWave']

speed.onclick = () => {
  fastForward = !fastForward
  speed.setAttribute('aria-pressed', String(fastForward))
}

const kinds = Object.keys(DEFENDERS) as DefenderKind[]
const cards = kinds.map(kind => {
  const { label, cost, role, color, hp, attack } = DEFENDERS[kind]
  const button = document.createElement('button')
  button.className = 'unit'
  button.style.setProperty('--unit-color', '#' + color.toString(16))
  const name = document.createElement('strong')
  name.textContent = label
  const details = document.createElement('small')
  details.textContent = `${role} · ${hp} HP`
  if (attack) {
    const stats = document.createElement('small')
    stats.textContent = `${attack.damage} damage / ${attack.cooldown * STEP_MS / 1000}s · ${attack.range}px range`
    button.append(name, ` · ${cost} scrap`, details, stats)
  } else {
    button.append(name, ` · ${cost} scrap`, details)
  }
  button.onclick = () => {
    selected = kind
    feedback.textContent = `${label} selected. Choose an open pad.`
    updateHud()
  }
  element('units').append(button)
  return { kind, button }
})

const pads = LANES.flatMap((y, row) => SLOTS.map((x, column) => {
  const lane = row as Lane
  const slot = column as Slot
  const button = document.createElement('button')
  button.className = 'pad'
  button.style.left = `${x / WIDTH * 100}%`
  button.style.top = `${y / HEIGHT * 100}%`
  button.onclick = () => {
    const unit = match.view.defenders.find(unit => unit.lane === lane && unit.slot === slot)
    if (unit) {
      const definition = DEFENDERS[unit.kind]
      feedback.textContent = `Lane ${lane + 1} · ${definition.label} · ${unit.hp} / ${definition.hp} HP`
      return
    }
    const error = match.dispatch({ type: 'place', kind: selected, lane, slot })
    feedback.textContent = error ?? `${DEFENDERS[selected].label} placed in lane ${lane + 1}.`
    const hadFocus = document.activeElement === button
    updateHud()
    if (!error && hadFocus) {
      const next = pads.find(pad => !pad.button.hidden && !pad.button.classList.contains('occupied'))?.button ?? start
      next.focus()
    }
  }
  element('pads').append(button)
  return { lane, slot, button }
}))

function issue(command: Command) {
  const error = match.dispatch(command)
  feedback.textContent = error ?? `Wave ${match.view.wave} underway. Defenders engage automatically.`
  updateHud()
}

function updateHud() {
  const state = match.view
  const building = state.phase === 'build'
  const ended = state.phase === 'defeat' || state.phase === 'victory'
  scrap.textContent = String(state.scrap)
  core.textContent = `${state.core} / ${CORE_HP}`
  wave.textContent = `${state.wave} / ${WAVES.length}`
  start.disabled = !building
  start.textContent = building ? `Start wave ${state.wave}` :
    state.phase === 'battle' ? `${state.spawned} / ${WAVES[state.wave - 1].length} deployed` : 'Match ended'
  for (const { kind, button } of cards) {
    button.setAttribute('aria-pressed', String(kind === selected))
    button.disabled = !building
  }
  for (const { lane, slot, button } of pads) {
    button.hidden = !building
    if (!button.hidden) {
      const occupant = state.defenders.find(unit => unit.lane === lane && unit.slot === slot)
      button.classList.toggle('occupied', Boolean(occupant))
      if (occupant) {
        const { label, hp } = DEFENDERS[occupant.kind]
        button.setAttribute('aria-label', `Lane ${lane + 1}, pad ${slot + 1}: ${label}, ${occupant.hp} of ${hp} HP`)
        button.removeAttribute('aria-disabled')
        continue
      }
      const unit = DEFENDERS[selected]
      button.setAttribute('aria-label', `Place ${unit.label} in lane ${lane + 1}, pad ${slot + 1} from core`)
      button.setAttribute('aria-disabled', String(state.scrap < unit.cost))
      button.style.setProperty('--unit-color', '#' + unit.color.toString(16))
      button.style.setProperty('--range', `${(unit.attack?.range ?? 0) / WIDTH * 100}cqw`)
    }
  }
  updateIntel()
  if (ended && result.hidden) {
    element('outcome').textContent = state.phase === 'victory' ? 'Core secured' : 'Core lost'
    element('summary').textContent = state.phase === 'victory'
      ? `You survived all ${WAVES.length} waves with ${state.core} core health.`
      : `The siege broke through during wave ${state.wave}.`
    result.hidden = false
    replay.focus()
  }
}

function updateIntel() {
  const { wave, phase } = match.view
  if (displayedForecast !== wave) {
    displayedForecast = wave
    const spawns = WAVES[wave - 1]
    armorNote.hidden = !spawns.some(spawn => spawn.kind === 'armored')
    forecast.replaceChildren(...LANES.map((_, lane) => {
      const counts = new Map<EnemyKind, number>()
      for (const spawn of spawns) {
        if (spawn.lane === lane) counts.set(spawn.kind, (counts.get(spawn.kind) ?? 0) + 1)
      }
      const row = document.createElement('li')
      const label = document.createElement('strong')
      label.textContent = `Lane ${lane + 1}`
      const threats = [...counts].map(([kind, count]) => `${count} ${ENEMIES[kind].label}`)
      row.append(label, threats.join(' · ') || 'Clear')
      return row
    }))
  }
  element('intel-heading').textContent = phase === 'build' ? `Wave ${wave} forecast` : `Wave ${wave} lineup`
  const report = match.lastWave
  if (displayedReport === report) return
  displayedReport = report
  element('report').hidden = !report
  if (!report) return
  element('report-heading').textContent = `Wave ${report.wave} report`
  element('report-economy').textContent =
    `+${report.bounty + report.income + report.clearBonus} scrap · ${report.bounty} bounty · ${report.income} scavenged · ${report.clearBonus} clear bonus`
  element('report-losses').textContent = `Enemies defeated ${report.kills} · Defenders lost ${report.losses}`
  const damage = report.coreDamage.flatMap((amount, lane) => amount ? [`Lane ${lane + 1} −${amount}`] : [])
  element('report-damage').textContent = damage.length ? `Core damage · ${damage.join(' · ')}` : 'Core held in every lane.'
}

function restart() {
  match = new Match()
  selected = 'guard'
  result.hidden = true
  battlefield.resetEffects()
  feedback.textContent = 'Choose a defender and an open pad, then start the wave.'
  updateHud()
  cards[0].button.focus()
}

start.onclick = () => issue({ type: 'start' })
element<HTMLButtonElement>('restart').onclick = restart
replay.onclick = restart
updateHud()

const battlefield = new Battlefield(() => match, phase => {
  if (phase === 'build') feedback.textContent = `Wave cleared. +${match.lastWave?.clearBonus ?? 0} scrap. Reinforce before the next wave.`
  if (phase === 'victory' || phase === 'defeat') feedback.textContent = `Wave ${match.view.wave} ended. See the wave report for details.`
  updateHud()
}, () => fastForward ? 2 : 1)

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: '#111d2a',
  scene: battlefield,
  banner: false,
})

if (import.meta.hot) import.meta.hot.dispose(() => game.destroy(true))
