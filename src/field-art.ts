import type { GameObjects } from 'phaser'
import { HEIGHT, LANES, SLOTS, WIDTH, type DefenderKind, type EnemyKind, type UpgradeKind } from './sim/data'

type Graphics = GameObjects.Graphics

export function drawArena(g: Graphics, coil: boolean) {
  g.fillGradientStyle(0x221d2b, 0x30203d, 0x19282b, 0x332333).fillRect(0, 0, WIDTH, HEIGHT)
  for (let i = 0; i < 17; i++) {
    const x = i * 81
    g.fillStyle(i % 2 ? 0x3d3545 : 0x352c3f).fillTriangle(x - 104, 111, x + 35, 17 + (i * 73) % 66, x + 130, 111)
  }
  for (let i = 0; i < 39; i++) {
    const x = (i * 293 + 57) % WIDTH
    const y = 12 + (i * 97) % 70
    g.fillStyle(i % 3 ? 0xa995a4 : 0xf4bf83, .6).fillCircle(x, y, i % 3 ? 1.4 : 2.6)
  }

  for (const [index, y] of LANES.entries()) {
    const floor = coil ? 0x3a3550 : 0x45353a
    const rim = coil ? 0x8675a3 : 0x967160
    g.fillStyle(0x1a1822).fillRoundedRect(46, y - 51, 1188, 113, 23)
    g.fillStyle(rim).fillRoundedRect(44, y - 49, 1188, 97, 20)
    g.fillStyle(floor).fillRoundedRect(47, y - 46, 1182, 90, 18)
    g.fillStyle(coil ? 0x484162 : 0x514048).fillRoundedRect(65, y - 34, 1146, 65, 15)
    g.lineStyle(2, rim, .55).lineBetween(74, y + 27, 1204, y + 27)
    for (let i = 0; i < 37; i++) {
      const x = 156 + (i * 137) % 1018
      const stone = y + ((i * 71 + index * 11) % 76) - 39
      g.lineStyle(2, 0xbd998f, .17).lineBetween(x, stone, x + 13 + i % 8, stone + 3)
    }
    for (const x of SLOTS) {
      g.fillStyle(0x231f2d, .76).fillEllipse(x, y + 9, 124, 48)
      g.lineStyle(2, rim).strokeEllipse(x, y + 7, 113, 41)
      g.fillStyle(rim).fillTriangle(x - 5, y + 28, x + 5, y + 28, x, y + 35)
    }
    for (const side of [1, -1]) {
      const x = 1155 + side * 33
      g.fillStyle(0x251d30).fillRoundedRect(x - 9, y - 64, 18, 110, 4)
      g.fillStyle(0x755069).fillTriangle(x - 12, y - 42, x, y - 81, x + 9, y - 41)
      g.lineStyle(3, 0xc66990).lineBetween(x, y - 48, x, y + 31)
    }
    g.fillStyle(0x263238).fillEllipse(105, y + 10, 83, 63)
    g.lineStyle(4, coil ? 0xb2a1fa : 0x6bb8a3).strokeEllipse(105, y + 10, 75, 53)
    for (let post = 0; post < 3; post++) {
      const x = 57 + post * 48
      g.fillStyle(0x292532).fillRoundedRect(x - 7, y + 41, 14, 17, 4)
      g.fillStyle(coil ? 0xb9b0ff : 0xf3b478).fillCircle(x, y + 41, 4)
    }
  }

  for (let i = 0; i < 41; i++) {
    const x = (i * 131 + 37) % WIDTH
    const y = HEIGHT - 15 - (i * 23) % 44
    g.fillStyle(i % 2 ? 0x413447 : 0x4b3a4d).fillTriangle(x - 13, y + 11, x + 3, y - 12, x + 18, y + 11)
  }
}

export function drawFighter(g: Graphics, x: number, y: number, kind: DefenderKind | EnemyKind, color: number,
  facing: number, gait: number, flash: boolean, upgrade?: UpgradeKind) {
  const scale = kind === 'colossus' ? 1.9 : kind === 'skitter' ? .72 : kind === 'ram' ? 1.22 : 1
  const ink = 0x201a29
  const plate = flash ? 0xfff4db : color
  const px = (n: number) => x + n * scale * facing
  const py = (n: number) => y + (n - Math.abs(gait) * 3) * scale
  const circle = (a: number, b: number, r: number, fill: number) =>
    g.fillStyle(fill).fillCircle(px(a), py(b), r * scale)
  const line = (a: number, b: number, c: number, d: number, width: number, fill: number) =>
    g.lineStyle(width * scale, fill).lineBetween(px(a), py(b), px(c), py(d))
  const triangle = (a: number, b: number, c: number, d: number, e: number, f: number, fill: number) =>
    g.fillStyle(fill).fillTriangle(px(a), py(b), px(c), py(d), px(e), py(f))
  const body = (a: number, b: number, w: number, h: number, fill: number) =>
    g.fillStyle(fill).fillRoundedRect(facing > 0 ? px(a) : px(a + w), py(b), w * scale, h * scale, 6 * scale)

  g.fillStyle(0x201826, .65).fillEllipse(x, y + 18, 58 * scale, 18)
  if (kind === 'scavenger') {
    body(-21, -20, 39, 32, ink)
    body(-17, -15, 30, 23, plate)
    triangle(-19, -16, 13, -16, 2, -37, plate)
    circle(-9, 12, 8, ink)
    circle(13, 12, 8, ink)
    circle(-9, 12, 3, 0xffda93)
    circle(13, 12, 3, 0xffda93)
    circle(2, -22, 7, 0xffe7ab)
    return
  }
  if (kind === 'skitter') {
    for (const side of [-1, 1]) {
      line(-12, 2, -30, 13 + side * gait * 6, 5, ink)
      line(3, 0, 17, 15 - side * gait * 6, 5, ink)
    }
    body(-23, -22, 48, 31, ink)
    body(-20, -19, 39, 22, plate)
    triangle(13, -10, 31, 0, 11, 4, plate)
    circle(15, -9, 4, 0xfff0af)
    return
  }
  line(-10, 6, -12 - gait * 8, 18, 9, ink)
  line(8, 6, 12 + gait * 8, 18, 9, ink)
  body(-19, -20, 38, 34, ink)
  body(-15, -16, 30, 24, plate)
  circle(0, -26, 15, ink)
  circle(0, -27, 11, plate)
  line(0, -27, 11, -26, 4, ink)
  if (kind === 'guard' || kind === 'colossus' || kind === 'ram') {
    const shield = upgrade === 'bastion' ? 25 : 17
    body(7, -18, shield, 34, ink)
    body(10, -15, shield - 6, 28, plate)
    line(16, -10, 16, 7, 3, 0xffebbd)
    if (kind !== 'guard' || upgrade === 'vanguard') {
      triangle(-16, -28, -15, -50, -4, -36, plate)
      triangle(8, -33, 17, -47, 18, -23, plate)
    }
    if (kind === 'colossus') {
      circle(-1, -15, 7, 0xffefae)
      line(-13, -20, -3, -14, 3, 0xab365e)
    }
  } else if (kind === 'archer') {
    line(10, -5, 23, -11, 5, ink)
    if (upgrade === 'longshot') line(13, -13, 43, -16, 6, plate)
    else {
      g.lineStyle(3 * scale, plate).strokeEllipse(px(23), py(-13), 18 * scale, 35 * scale)
      line(19, -30, 19, 4, 2, 0xfbe6b6)
    }
    triangle(-13, -24, 0, -41, 18, -24, plate)
  } else if (kind === 'lobber') {
    circle(-4, 0, 16, ink)
    circle(-4, 1, 10, 0xa15b65)
    line(-6, -6, 23, -29, 13, ink)
    line(2, -11, 25, -30, 8, plate)
    circle(25, -30, 4, 0xffe5a5)
  } else if (kind === 'spitter') {
    body(5, -25, 28, 15, ink)
    body(9, -22, 24, 8, plate)
    circle(29, -17, 5, 0xeaffb0)
    triangle(-13, -21, -21, -42, -2, -35, plate)
  } else if (kind !== 'raider') {
    line(18, -31, 18, 18, 5, ink)
    circle(18, -34, 11, ink)
    circle(18, -34, 7, plate)
    circle(18, -36, 3, 0xffffff)
    triangle(-13, -30, 0, -47, 9, -33, plate)
  } else {
    line(11, 2, 25, -12, 6, ink)
    triangle(19, -9, 28, -23, 30, -9, plate)
    triangle(-14, -27, -15, -40, -4, -34, plate)
  }
}
