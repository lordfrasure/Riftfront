import * as Phaser from 'phaser'
import { CORE_HP, CORE_X, DEFENDERS, ENEMIES, ENTRY_X, HEIGHT, LANES, SLOTS, STEP_MS, WIDTH } from './sim/data'
import type { Effect, Match, Phase } from './sim/match'

export class Battlefield extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics
  private accumulator = 0
  private effects: { effect: Effect; age: number }[] = []

  constructor(
    private readonly match: () => Match,
    private readonly onChange: (phase: Phase) => void,
    private readonly speed: () => number,
  ) {
    super('battlefield')
  }

  create() {
    const vertical = this.add.graphics()
    for (let x = 20; x < WIDTH; x += 40) {
      vertical.lineStyle(1, 0x36536a, .19).lineBetween(x, 0, x, HEIGHT)
    }
    this.add.text(45, 56, 'THE CORE', { fontSize: '20px', color: '#9ff1de' })
    this.add.text(1060, 56, 'RIFT ENTRY', { fontSize: '20px', color: '#ffa6a4' })
    const terrain = this.add.graphics()
    for (const [index, y] of LANES.entries()) {
      terrain.fillStyle(0x192a39).fillRoundedRect(24, y - 63, 1232, 126, 12)
      terrain.lineStyle(1, 0x355065).strokeRoundedRect(24, y - 63, 1232, 126, 12)
      terrain.lineStyle(1, 0x355065).lineBetween(CORE_X, y, ENTRY_X, y)
      terrain.lineStyle(4, 0xb15b70).lineBetween(ENTRY_X + 17, y - 36, ENTRY_X + 17, y + 36)
      for (const x of SLOTS) {
        terrain.fillStyle(0x22394b).fillRoundedRect(x - 38, y - 39, 76, 78, 5)
      }
      this.add.text(45, y - 48, `LANE ${index + 1}`, { fontSize: '15px', color: '#a4bac9' })
      terrain.lineStyle(2, 0x723e68, .8).strokeEllipse(ENTRY_X + 15, y, 55, 112)
      terrain.lineStyle(3, 0xa95f84, .55).strokeEllipse(ENTRY_X + 15, y, 37, 93)
    }
    this.add.text(46, 660, 'Guard ■     Archer ▲     Scavenger ◆', { fontSize: '17px', color: '#a4bac9' })
    for (const [index, kind] of (['basic', 'fast', 'armored'] as const).entries()) {
      const x = 917 + 114 * index
      this.add.text(x, 660, ENEMIES[kind].label, { fontSize: '17px', color: '#' + ENEMIES[kind].color.toString(16) })
    }
    this.graphics = this.add.graphics()
  }

  resetEffects() {
    this.accumulator = 0
    this.effects = []
  }

  update(_time: number, delta: number) {
    const match = this.match()
    const previous = match.view.phase
    const { scrap, core, spawned } = match.view
    for (const entry of this.effects) entry.age += delta
    this.effects = this.effects.filter(entry => entry.age < 480)
    if (previous === 'battle') {
      this.accumulator += Math.min(delta, 250) * this.speed()
      while (this.accumulator >= STEP_MS && match.view.phase === 'battle') {
        this.accumulator -= STEP_MS
        for (const effect of match.tick()) this.effects.push({ effect, age: 0 })
      }
    }
    if (match.view.phase !== 'battle') this.accumulator = 0
    if (previous !== match.view.phase || scrap !== match.view.scrap || core !== match.view.core ||
        spawned !== match.view.spawned) {
      this.onChange(match.view.phase)
    }
    this.renderMatch(match.view)
  }

  private renderMatch(state: Match['view']) {
    const g = this.graphics
    g.clear()

    g.lineStyle(9, 0x487b83).lineBetween(CORE_X - 8, 211, CORE_X - 8, 609)
    for (const y of LANES) {
      g.fillStyle(state.core > 0 ? 0x8ce4d0 : 0x834b5a).fillCircle(CORE_X - 8, y, 16)
      this.health(CORE_X - 8, y - 30, state.core / CORE_HP, 0x8ce4d0)
    }
    for (const unit of state.defenders) {
      const y = LANES[unit.lane]
      const { color, hp } = DEFENDERS[unit.kind]
      g.fillStyle(color)
      if (unit.kind === 'guard') g.fillRoundedRect(unit.x - 18, y - 18, 36, 36, 5)
      if (unit.kind === 'archer') g.fillTriangle(unit.x - 20, y + 18, unit.x, y - 21, unit.x + 20, y + 18)
      if (unit.kind === 'scavenger') g.fillTriangle(unit.x - 19, y, unit.x, y - 21, unit.x + 19, y)
        .fillTriangle(unit.x - 19, y, unit.x, y + 21, unit.x + 19, y)
      this.health(unit.x, y - 30, unit.hp / hp, color)
    }
    for (const unit of state.enemies) {
      const y = LANES[unit.lane]
      const { color, hp } = ENEMIES[unit.kind]
      g.fillStyle(color)
      if (unit.kind === 'basic') g.fillCircle(unit.x, y, 15)
      if (unit.kind === 'fast') g.fillTriangle(unit.x - 22, y, unit.x + 13, y - 12, unit.x + 13, y + 12)
      if (unit.kind === 'armored') {
        g.fillRoundedRect(unit.x - 19, y - 20, 38, 40, 7)
        g.lineStyle(3, 0x71395f).strokeRoundedRect(unit.x - 13, y - 14, 26, 28, 4)
      }
      this.health(unit.x, y - 30, unit.hp / hp, color)
    }
    for (const { effect, age } of this.effects) {
      const y = LANES[effect.lane]
      if (effect.type === 'hit' && age < 180) {
        g.lineStyle(3, effect.color, 1 - age / 180).lineBetween(effect.from, y, effect.to, y)
        g.fillStyle(0xffffff, 1 - age / 180).fillCircle(effect.to, y, 5)
      }
      if (effect.type === 'income' || effect.type === 'breach') {
        const x = effect.type === 'income' ? effect.x : CORE_X - 8
        const color = effect.type === 'income' ? DEFENDERS.scavenger.color : 0xff827e
        g.lineStyle(3, color, 1 - age / 480).strokeCircle(x, y, 18 + age / 17)
      }
    }
  }

  private health(x: number, y: number, fraction: number, color: number) {
    this.graphics.fillStyle(0x080e16).fillRect(x - 20, y, 40, 5)
    this.graphics.fillStyle(color).fillRect(x - 20, y, 40 * fraction, 5)
  }
}
