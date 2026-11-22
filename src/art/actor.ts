import { TintModes, type Scene } from 'phaser'
import { fighterLayers, fighterSize, type FighterArt } from './fighters'

export type Pose = {
  x: number; y: number; time: number; stride: number; attack: number
  hurt: boolean; fall: number; windup: boolean
}

export class Actor {
  private readonly rig
  private readonly layers

  constructor(scene: Scene, readonly art: FighterArt, facing: number) {
    this.layers = fighterLayers.map(layer => scene.add.image(0, 0, `fighter-${art}-${layer}`).setOrigin(.5, .72).setScale(.5))
    this.rig = scene.add.container(0, 0, this.layers).setScale(facing * fighterSize(art), fighterSize(art))
  }

  draw({ x, y, time, stride, attack, hurt, fall, windup }: Pose) {
    const [back, front, body, gear] = this.layers
    const bob = stride ? -Math.abs(stride) * 3 : Math.sin(time / 270) * 1.25
    this.rig.setPosition(x, y - 1 + fall * 10).setAlpha(1 - fall)
      .setDepth(20 + y / 600).setRotation(fall * -.92)
    back.setPosition(-stride * 6, 0).setRotation(-stride * .18)
    front.setPosition(stride * 6, 0).setRotation(stride * .18)
    body.setPosition(attack * 5 - (hurt ? 2 : 0), bob).setRotation(windup ? -.12 : attack * .13)
    gear.setPosition(attack * 9, bob - attack * 5).setRotation(windup ? -.28 : attack * .28)
    for (const part of [body, gear]) {
      if (hurt) part.setTint(0xffedce).setTintMode(TintModes.FILL)
      else part.clearTint()
    }
  }

  destroy() { this.rig.destroy() }
}
