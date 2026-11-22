import * as Phaser from 'phaser'
import { CORE_HP, CORE_X, ENEMIES, ENTRY_X, LANES, OVERTIME_TICK, SLOTS, STEP_MS, WIDTH, profile } from './sim/data'
import type { Effect, Match, Phase } from './sim/match'
import { drawArena } from './field-art'
import type { BattleSound } from './sound'

import gorge from './art/ember-gorge.webp'
import { fighterArt, fighterImage, fighterLayers, fighterSize, type FighterArt } from './art/fighters'
import { Actor } from './art/actor'

type Point = { from: number; to: number }

export class Battlefield extends Phaser.Scene {
  private art!: Phaser.GameObjects.Graphics
  private actors = new Map<number, Actor>()
  private foreground!: Phaser.GameObjects.Graphics
  private graphics!: Phaser.GameObjects.Graphics
  private damageText: { label: Phaser.GameObjects.Text; age: number; start: number }[] = []
  private accumulator = 0
  private clock = 0
  private coil = false
  private points = new Map<number, Point>()
  private lunges = new Map<number, { start: number; direction: number }>()
  private flashes = new Map<number, number>()
  private effects: { effect: Effect; age: number }[] = []

  constructor(
    private readonly match: () => Match,
    private readonly onChange: (phase: Phase) => void,
    private readonly speed: () => number,
    private readonly audio: BattleSound,
  ) { super('battlefield') }

  preload() {
    this.load.image('gorge', gorge)
    for (const art of fighterArt) {
      for (const layer of fighterLayers) this.load.svg(`fighter-${art}-${layer}`, fighterImage(art, layer))
    }
  }

  create() {
    this.add.image(0, 0, 'gorge').setOrigin(0).setDisplaySize(WIDTH, 656).setY(-43)

    this.art = this.add.graphics()
    drawArena(this.art, false)
    this.graphics = this.add.graphics()
    this.foreground = this.add.graphics().setDepth(30)
    for (const [lane, y] of LANES.entries()) {
      this.add.text(53, y - 43, String(lane + 1), {
        fontFamily: 'system-ui', fontSize: '19px', fontStyle: 'bold', color: '#f7d1a0',
        stroke: '#241b2d', strokeThickness: 5,
      }).setDepth(1)
    }
  }

  resetEffects() {
    for (const actor of this.actors.values()) actor.destroy()
    this.actors.clear()
    this.accumulator = 0
    this.points.clear()
    this.flashes.clear()
    this.lunges.clear()
    this.effects = []
    for (const { label } of this.damageText) label.destroy()
    this.damageText = []
    this.cameras.main?.resetFX()
  }

  update(_time: number, delta: number) {
    const match = this.match()
    const previous = match.view.phase
    const { scrap, core, spawned, tick } = match.view
    const speed = this.speed()
    const elapsed = Math.min(delta, 100)
    if (speed > 0) {
      this.clock += elapsed
      for (const entry of this.effects) entry.age += elapsed
      this.effects = this.effects.filter(entry => entry.age < 500)
      for (const [id, lunge] of this.lunges) if (lunge.start + 180 < this.clock) this.lunges.delete(id)
      for (const [id, until] of this.flashes) if (until < this.clock) this.flashes.delete(id)
      this.damageText = this.damageText.filter(entry => {
        entry.age += elapsed
        if (entry.age >= 450) { entry.label.destroy(); return false }
        entry.label.setY(entry.start - entry.age * .066).setAlpha(1 - entry.age / 500)
        return true
      })
    }
    if (previous === 'battle') {
      this.accumulator += elapsed * speed
      while (this.accumulator >= STEP_MS && match.view.phase === 'battle') {
        this.accumulator -= STEP_MS
        const last = new Map([...match.view.defenders, ...match.view.enemies].map(unit => [unit.id, unit.x]))
        const effects = match.tick()
        this.points = new Map([...match.view.defenders, ...match.view.enemies].map(unit =>
          [unit.id, { from: last.get(unit.id) ?? unit.x, to: unit.x }]))
        for (const effect of effects) this.present(effect)
      }
    }
    if (match.view.phase !== 'battle') {
      this.accumulator = 0
      this.points.clear()
    }
    if (previous !== match.view.phase || scrap !== match.view.scrap || core !== match.view.core || spawned !== match.view.spawned || (tick < OVERTIME_TICK && match.view.tick >= OVERTIME_TICK)) {
      this.onChange(match.view.phase)
    }
    if (this.coil !== (match.view.era === 'coil')) {
      this.coil = !this.coil
      this.art.clear()
      drawArena(this.art, this.coil)
    }
    this.renderMatch(match.view)
  }

  private present(effect: Effect) {
    this.effects.push({ effect, age: 0 })
    this.audio.play(effect)
    if (effect.type === 'breach' || effect.type === 'blast') {
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.cameras.main.shake(125, .003)
    }
    if (effect.type === 'blast' || effect.type === 'fall') return
    const breach = effect.type === 'breach'
    const heal = !breach && effect.style === 'heal'
    if (!breach) {
      this.flashes.set(effect.target, this.clock + 105)
      this.lunges.set(effect.source, { start: this.clock, direction: Math.sign(effect.to - effect.from) })
    }
    if (!breach && !heal && effect.amount < 20) return
    const x = breach ? CORE_X : effect.to
    const y = LANES[effect.lane] - (breach ? 57 : 46)
    const label = this.add.text(x, y, `${heal ? '+' : '−'}${effect.amount}`, {
      fontFamily: 'system-ui', fontSize: breach ? '27px' : '19px', fontStyle: 'bold',
      color: heal ? '#c1fb9b' : breach ? '#ff8f87' : '#fff4df', stroke: '#201826', strokeThickness: 5,
    }).setOrigin(.5).setDepth(31)
    this.damageText.push({ label, age: 0, start: y })
  }

  private renderMatch(state: Match['view']) {
    const g = this.graphics
    g.clear()
    this.foreground.clear()
    const building = state.phase === 'build'
    for (const y of LANES) {
      const light = this.coil ? 0xc7b9ff : 0x90f7ce
      g.fillStyle(light, .12 + state.core / CORE_HP * .2).fillCircle(CORE_X, y - 12, 36)
      g.fillStyle(state.core ? light : 0x613648).fillTriangle(CORE_X - 17, y - 10, CORE_X, y - 38, CORE_X + 17, y - 10)
        .fillTriangle(CORE_X - 17, y - 10, CORE_X, y + 16, CORE_X + 17, y - 10)
      g.lineStyle(2, 0xffffff, .65).lineBetween(CORE_X, y - 35, CORE_X - 8, y - 8)
      this.health(CORE_X, y + 31, state.core / CORE_HP, light, 56)
      const rift = .23 + Math.sin(this.clock / 305 + y) * .1
      const gate = ENTRY_X + 24
      g.fillStyle(0x9f70ff, rift * .32).fillEllipse(gate, y - 15, 62, 99)
      g.fillStyle(0x21132d, .92).fillEllipse(gate, y - 15, 36, 94)
      g.fillStyle(0xfb73af, rift).fillEllipse(gate, y - 15, 25, 90)
      g.lineStyle(3, 0xffafd3, rift + .34).strokeEllipse(gate, y - 15, 34, 93)
      for (let i = 0; i < 6; i++) {
        const t = (this.clock / (1180 + i * 52) + i / 6) % 1
        const x = gate + Math.sin(t * 5 + i * 2) * (11 + 13 * t)
        g.fillStyle(i % 2 ? 0xffc1df : 0xbba1ff, Math.sin(t * Math.PI) * .65)
          .fillCircle(x, y + 23 - t * 83, 2 + (i % 3))
      }
    }
    for (const enemy of state.enemies) {
      const def = ENEMIES[enemy.kind]
      if (enemy.pulseX !== undefined && def.pulse) {
        const y = LANES[enemy.lane]
        const intensity = .3 + .25 * Math.sin(this.clock / 70)
        g.fillStyle(0xfc4d70, intensity).fillEllipse(enemy.pulseX, y + 7, def.pulse.radius * 2, 86)
        g.lineStyle(4, 0xffa788, .85).strokeEllipse(enemy.pulseX, y + 7, def.pulse.radius * 2, 86)
      }
      if (def.aura) g.lineStyle(2, def.color, .28).strokeEllipse(this.x(enemy), LANES[enemy.lane] + 11, def.aura * 2, 61)
    }
    const visible = new Set<number>()
    for (const unit of state.defenders) {
      if (unit.hp <= 0) continue
      const def = profile(unit)
      const y = LANES[unit.lane]
      const x = this.x(unit)
      if (!building && def.advance) {
        g.lineStyle(2, def.color, .35).lineBetween(SLOTS[unit.slot], y + 21, x, y + 21)
      }
      this.drawActor(visible, unit.id, unit.upgrade ?? unit.kind, x, y, 1)
      if (!building || unit.upgrade) this.health(x, y - 69, unit.hp / def.hp, def.color)
    }
    for (const unit of state.enemies) {
      if (unit.hp <= 0) continue
      const def = ENEMIES[unit.kind]
      const y = LANES[unit.lane] + (unit.kind === 'colossus' ? 0 : (unit.id % 5 - 2) * 5)
      const x = this.x(unit)
      this.drawActor(visible, unit.id, unit.kind, x, y, -1, unit.pulseX !== undefined)
      this.health(x, y - (unit.kind === 'colossus' ? 111 : 67), unit.hp / def.hp, def.color, unit.kind === 'colossus' ? 90 : 42)
      if (unit.slow) g.lineStyle(3, 0x9cddff, .68).strokeEllipse(x, y + 19, 51, 15)
      if (unit.expose) this.foreground.lineStyle(3, 0xffe29c).lineBetween(x - 10, y - 45, x + 10, y - 45)
    }
    const fx = this.foreground
    for (const { effect, age } of this.effects) {
      const y = LANES[effect.lane]
      const fade = 1 - age / 500
      if (effect.type === 'hit') {
        const duration = effect.style === 'shell' ? 220 : 125
        const t = Math.min(1, age / duration)
        if (effect.style === 'coil' || effect.style === 'heal') {
          if (age > 180) continue
          const alpha = 1 - age / 190
          if (effect.style === 'heal') {
            fx.lineStyle(2, effect.color, alpha * .72).lineBetween(effect.from, y - 24, effect.to, y - 13)
            fx.lineStyle(3, 0xd8ffd3, alpha).lineBetween(effect.to - 6, y - 29, effect.to + 6, y - 29)
              .lineBetween(effect.to, y - 35, effect.to, y - 23)
          } else {
            const mid = (effect.from + effect.to) / 2
            const jump = effect.from + (effect.to - effect.from) * .68
            fx.lineStyle(8, effect.color, alpha * .23).lineBetween(effect.from, y - 29, effect.to, y - 13)
            fx.lineStyle(3, 0xece4ff, alpha).beginPath().moveTo(effect.from, y - 29)
              .lineTo(mid, y - 14).lineTo(jump, y - 32).lineTo(effect.to, y - 13).strokePath()
          }
        } else if (t < 1 && effect.style !== 'strike') {
          const x = effect.from + (effect.to - effect.from) * t
          const lift = Math.sin(t * Math.PI) * (effect.style === 'shell' ? 115 : 16)
          fx.fillStyle(effect.color).fillCircle(x, y - 15 - lift, effect.style === 'shell' ? 8 : 4)
          fx.lineStyle(3, effect.color, .58).lineBetween(x - Math.sign(effect.to - effect.from) * 19, y - 16 - lift, x, y - 15 - lift)
        } else if (age < 330) {
          const burst = Math.max(0, age - (effect.style === 'strike' ? 0 : duration))
          fx.lineStyle(3, effect.color, 1 - age / 350).strokeEllipse(effect.to, y - 10, 18 + burst * .37, 14 + burst * .14)
          if (effect.splash) fx.fillStyle(effect.color, fade * .13).fillEllipse(effect.to, y, effect.splash * 2, 52)
        }
      } else if (effect.type === 'fall') {
        const actor = this.actors.get(effect.id)
        if (actor) {
          visible.add(effect.id)
          actor.draw({ x: effect.x, y, time: this.clock, fall: age / 500, stride: 0, attack: 0, hurt: false, windup: false })
        }
        for (let i = 0; i < 7; i++) {
          const angle = i * Math.PI * 2 / 7
          fx.fillStyle(effect.color, fade).fillCircle(effect.x + Math.cos(angle) * age / 10,
            y - 12 + Math.sin(angle) * age / 13, 5 * fade)
        }
      } else {
        const x = effect.type === 'blast' ? effect.x : CORE_X
        const width = effect.type === 'blast' ? effect.radius * 2 : 110
        fx.fillStyle(0xff634c, fade * .36).fillEllipse(x, y, width, 84)
        fx.lineStyle(4, 0xffb777, fade).strokeEllipse(x, y, width, 84 + age / 13)
      }
    }
    for (const [id, actor] of this.actors) {
      if (!visible.has(id)) {
        actor.destroy()
        this.actors.delete(id)
      }
    }
  }

  private drawActor(visible: Set<number>, id: number, art: FighterArt, x: number, y: number, facing: number, windup = false) {
    visible.add(id)
    let actor = this.actors.get(id)
    if (actor?.art !== art) {
      actor?.destroy()
      actor = new Actor(this, art, facing)
      this.actors.set(id, actor)
    }
    this.graphics.fillStyle(0x081217, .58).fillEllipse(x, y + 9, 59 * fighterSize(art), 17)
    const lunge = this.lunges.get(id)
    const attack = lunge ? Math.sin(Math.PI * (this.clock - lunge.start) / 180) : 0
    actor.draw({ x, y, time: this.clock + id * 69, stride: this.pose(id), attack,
      hurt: this.flashes.has(id), fall: 0, windup })
  }

  private x(unit: { id: number; x: number }) {
    const point = this.points.get(unit.id)
    const position = point ? Phaser.Math.Linear(point.from, point.to, Math.min(1, this.accumulator / STEP_MS)) : unit.x
    const lunge = this.lunges.get(unit.id)
    return lunge ? position + Math.sin(Math.PI * (this.clock - lunge.start) / 180) * 9 * lunge.direction : position
  }

  private pose(id: number) {
    const point = this.points.get(id)
    return point && point.from !== point.to ? Math.sin(this.clock / 63 + id) : 0
  }

  private health(x: number, y: number, ratio: number, color: number, width = 42) {
    this.foreground.fillStyle(0x161521).fillRoundedRect(x - width / 2 - 2, y - 2, width + 4, 9, 3)
    this.foreground.fillStyle(color).fillRect(x - width / 2, y, width * ratio, 5)
  }
}
