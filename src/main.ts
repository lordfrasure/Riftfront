import * as Phaser from 'phaser'
import './style.css'
import { Battlefield } from './battlefield'
import { CLEAR_BONUS, CORE_HP, DEFENDERS, HEIGHT, LANES, SLOTS, WAVES, WIDTH,
  type DefenderKind, type Lane, type Slot } from './sim/data'
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

const kinds = Object.keys(DEFENDERS) as DefenderKind[]
const cards = kinds.map(kind => {
  const { label, cost, role, color } = DEFENDERS[kind]
  const button = document.createElement('button')
  button.className = 'unit'
  button.style.setProperty('--unit-color', '#' + color.toString(16))
  const name = document.createElement('strong')
  name.textContent = label
  const details = document.createElement('small')
  details.textContent = role
  button.append(name, ` · ${cost}`, details)
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
  button.setAttribute('aria-label', `Place in lane ${lane + 1}, pad ${slot + 1} from core`)
  button.onclick = () => {
    const error = match.dispatch({ type: 'place', kind: selected, lane, slot })
    feedback.textContent = error ?? `${DEFENDERS[selected].label} placed in lane ${lane + 1}.`
    const hadFocus = document.activeElement === button
    updateHud()
    if (!error && hadFocus) {
      const next = pads.find(pad => !pad.button.hidden)?.button ?? start
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
    state.phase === 'battle' ? 'Wave in progress' : 'Match ended'
  for (const { kind, button } of cards) {
    button.setAttribute('aria-pressed', String(kind === selected))
    button.disabled = !building
  }
  for (const { lane, slot, button } of pads) {
    button.hidden = !building || state.defenders.some(unit => unit.lane === lane && unit.slot === slot)
  }
  if (ended && result.hidden) {
    element('outcome').textContent = state.phase === 'victory' ? 'Core secured' : 'Core lost'
    element('summary').textContent = state.phase === 'victory'
      ? `You survived all five waves with ${state.core} core health.`
      : `The siege broke through during wave ${state.wave}.`
    result.hidden = false
    replay.focus()
  }
}

function restart() {
  match = new Match()
  selected = 'guard'
  result.hidden = true
  battlefield.resetEffects()
  feedback.textContent = 'Select a defender, then choose an open pad.'
  updateHud()
  cards[0].button.focus()
}

start.onclick = () => issue({ type: 'start' })
element<HTMLButtonElement>('restart').onclick = restart
replay.onclick = restart
updateHud()

const battlefield = new Battlefield(() => match, phase => {
  if (phase === 'build') feedback.textContent = `Wave cleared. +${CLEAR_BONUS} scrap. Reinforce before the next wave.`
  updateHud()
})

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
