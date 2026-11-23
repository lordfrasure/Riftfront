import type { GameObjects } from 'phaser'
import { CORE_X, ENTRY_X, HEIGHT, WIDTH, type Layout } from './sim/data'

export function drawArena(g: GameObjects.Graphics, coil: boolean, { lanes, slots }: Layout) {
  const metal = coil ? 0x6778a3 : 0x807563
  const light = coil ? 0x9facff : 0xf0c17f
  g.fillStyle(0x0b171d, .33).fillRect(0, 0, WIDTH, HEIGHT)
  g.fillStyle(0x071215, .52).fillRect(0, 0, WIDTH, 73).fillRect(0, HEIGHT - 46, WIDTH, 46)
  for (const [index, y] of lanes.entries()) {
    const deck = coil ? 0x293443 : 0x333330
    g.fillStyle(0x0c171d, .94).fillRoundedRect(38, y - 43, 1208, 105, 6)
    g.fillStyle(deck, .94).fillRoundedRect(39, y - 46, 1205, 91, 5)
    g.lineStyle(2, metal, .75).lineBetween(40, y - 44, 1241, y - 44)
      .lineBetween(40, y + 44, 1241, y + 44)
    g.lineStyle(4, 0x121c22).lineBetween(44, y + 53, 1237, y + 53)
    g.lineStyle(1, light, .34).lineBetween(48, y + 49, 1234, y + 49)
    for (let i = 0; i < 15; i++) {
      const x = 49 + i * 82
      g.lineStyle(1, 0xd4ccb9, .13).lineBetween(x + 15, y - 42, x, y + 42)
      g.fillStyle(metal, .46).fillCircle(x, y + 43, 2).fillCircle(x + 15, y - 42, 2)
    }
    for (const x of slots) {
      g.fillStyle(0x0d2026, .88).fillEllipse(x, y + 13, 95, 46)
      g.lineStyle(2, metal, .9).strokeEllipse(x, y + 11, 91, 42)
      g.lineStyle(1, light, .49).strokeEllipse(x, y + 11, 79, 34)
      g.fillStyle(light, .76).fillTriangle(x - 5, y + 31, x + 5, y + 31, x, y + 37)
    }
    g.fillStyle(0x172b31).fillEllipse(CORE_X, y + 12, 92, 56)
    g.lineStyle(3, coil ? 0xa1a8eb : 0x76b5a5).strokeEllipse(CORE_X, y + 12, 87, 51)
    for (const side of [-1, 1]) {
      const x = ENTRY_X + 24 + side * 31
      g.fillStyle(0x252036).fillTriangle(x - 14, y + 37, x - 2, y - 57, x + 14, y + 37)
      g.lineStyle(2, 0xe68cbd, .71).lineBetween(x - 2, y - 48, x + 5, y + 24)
      g.fillStyle(light, .8).fillRect(48 + index * 13, y + 51, 11, 4)
    }
  }
}
