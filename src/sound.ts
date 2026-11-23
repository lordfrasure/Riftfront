import type { Effect } from './sim/match'

export class BattleSound {
  private context?: AudioContext
  private enabled = false
  private last = 0

  async toggle() {
    if (this.enabled) {
      this.enabled = false
      return false
    }
    try {
      this.context ??= new AudioContext()
      await this.context.resume()
      this.enabled = true
    } catch {
      this.enabled = false
    }
    return this.enabled
  }

  play(effect: Exclude<Effect, { type: 'counter' }>) {
    const context = this.context
    if (!this.enabled || !context || effect.type === 'fall') return
    const time = context.currentTime
    const heavy = effect.type === 'breach' || effect.type === 'blast'
    if (!heavy && time < this.last + .08) return
    this.last = time
    const frequency = heavy ? 95 : ({ arrow: 410, shell: 155, strike: 135, coil: 520, acid: 210, heal: 640 })[effect.style]
    const note = context.createOscillator()
    const volume = context.createGain()
    note.type = heavy ? 'triangle' : 'sine'
    note.frequency.setValueAtTime(frequency, time)
    note.frequency.exponentialRampToValueAtTime(effect.type === 'hit' && effect.style === 'heal' ? frequency * 1.4 : frequency / 2, time + .13)
    volume.gain.setValueAtTime(heavy ? .14 : .055, time)
    volume.gain.exponentialRampToValueAtTime(.001, time + .16)
    note.connect(volume).connect(context.destination)
    note.start(time)
    note.stop(time + .17)
  }
}
