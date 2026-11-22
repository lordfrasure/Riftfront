import type { DefenderKind, EnemyKind, UpgradeKind } from '../sim/data'

export type FighterArt = DefenderKind | EnemyKind | UpgradeKind

const path = (fill: string, shape: string) => `<path fill="${fill}" d="${shape}"/>`
const gold = '#ffe3a3'
const eye = path(gold, 'M48 35l13-3-3 5-10 2z')
const helm = path('url(#plate)', 'M24 41l2-17 14-10 17 5 9 16-9 11-22 2z')
const coat = path('url(#cloth)', 'M27 41l24-4 11 13-4 21-12 9-25-7-6-14z')
const trim = path('#bc9462', 'M22 62l32-5 3 6-33 6z')
const hood = path('url(#cloth)', 'M21 40l5-16 15-13 22 21-7 14-19 1z') +
  path('#202831', 'M37 38l9-13 14 8-7 10z') + eye
const slash = path('#bedce0', 'M6 68l45-26 34-23-14 20-58 34z') + path(gold, 'M35 50l10 13-5 3-10-12z')
const scope = path('#51737d', 'M38 51l8-11 35-9 11 3-5 8-35 13z') + path('#cef9f3', 'M54 42l31-8-2 4-27 9z')
const bow = '<path d="M61 21Q88 43 72 68M61 21L61 64l11 4" fill="none" stroke="#ead197" stroke-width="3"/>' +
  path('#ecf8ee', 'M46 43l36-6-6 5-29 4z')
const cloak = path('url(#cloth)', 'M28 31l21 5-3 33-17 15-21-5 9-15z')
const engine = path('url(#plate)', 'M13 57l4-24 22-11 17 12 4 30-16 13-26-3z') +
  path('#242e34', 'M22 41l14-7 11 7-2 15-15 8-9-8z') + path('#ffe2a4', 'M29 45l11-5-2 11-9 5z')
const staff = path('#a98260', 'M70 25l5 1-3 53-6 3z')
const lantern = path('url(#plate)', 'M61 20l11-10 13 7 1 16-13 12-13-8z') +
  path('#e6ffc0', 'M72 17l7 4-1 11-6 5-6-6z')

type Design = { light: string; shade: string; fabric: string; body: string; gear: string; size?: number; rig?: 'crawler' | 'wheels' | 'hover' }

// The right-facing artwork is shared by the card portrait and the battlefield rig.
const designs: Record<FighterArt, Design> = {
  guard: { light: '#77d0bd', shade: '#33616a', fabric: '#416460', body: coat + helm + eye + trim, gear: slash + path('url(#plate)', 'M52 42l20-8 13 8-4 20-16 15-14-13z') + path(gold, 'M66 43l4-2 1 18-5 5z') },
  bastion: { light: '#b4e2db', shade: '#3f647a', fabric: '#434c67', body: coat + helm + eye + path('url(#plate)', 'M13 39l16-8 12 9-4 19-24 5-7-8z'), gear: path('url(#plate)', 'M48 33l21-9 19 10-2 32-18 16-19-12z') + path(gold, 'M66 36l6-3v14l9-2-2 6-7 2-1 15-6 5 1-18-9 2 1-6 8-3z') },
  vanguard: { light: '#ed986d', shade: '#793f4c', fabric: '#6b4056', body: cloak + coat + helm + path(gold, 'M25 31l-6-17 16 7 14-5 8 7-18 8z') + eye, gear: slash + path('url(#plate)', 'M67 25L95 6l-7 24-11 15-14 4 10-14z') },
  archer: { light: '#d6ac68', shade: '#745842', fabric: '#6c7856', body: cloak + coat + trim + hood, gear: bow },
  volley: { light: '#c9e487', shade: '#53764d', fabric: '#37665c', body: cloak + coat + hood + path(gold, 'M23 34l7-15 13-7-5 12-9 10z'), gear: bow + path('url(#plate)', 'M62 24l10-9 12 9 5 17-7 19-13 12 7-21 2-16z') },
  longshot: { light: '#d2d2ed', shade: '#535482', fabric: '#444569', body: cloak + coat + hood + path(gold, 'M46 33l17-2-3 5-14 3z'), gear: scope + path('url(#plate)', 'M67 27l9-5 6 13-2 14-12 6 5-12z') },
  scavenger: { light: '#e4a968', shade: '#85563b', fabric: '#73543b', rig: 'wheels', body: engine + path('url(#plate)', 'M32 20l11-9 10 8-3 12-17 2z') + path(gold, 'M36 21l13-1-2 5-10 1z'), gear: path('url(#plate)', 'M47 51l18-10 13 12-2 14-24 4-8-7z') + path('#633e2e', 'M45 48l34-6-2 8-27 5z') },
  lobber: { light: '#f8a56d', shade: '#8b4d43', fabric: '#765144', body: coat + engine + helm + eye, gear: path('url(#plate)', 'M37 54l3-13 33-20 14 7-2 11-34 22z') + path('#37252b', 'M72 25l9-2 7 7-2 8-9 3-7-6z') + path('#ffd48a', 'M77 26l6 2 1 6-6 3-4-5z') },
  mender: { light: '#d6e5a2', shade: '#5b7f61', fabric: '#4f806f', body: cloak + coat + hood + path('#e7dfa6', 'M27 53l24-7 4 8-18 22-11-5z'), gear: staff + lantern },
  conductor: { light: '#bfc9ff', shade: '#545783', fabric: '#424975', body: cloak + coat + helm + path('#bcf0ff', 'M34 38l28-7-4 7-20 5z') + trim, gear: staff + path('url(#plate)', 'M67 9l14 7 6 14-14 14-14-9-3-15z') + path('#f2ddff', 'M77 13l-9 13 10-3-10 15 4-11-8 1z') },
  raider: { light: '#db8a77', shade: '#793d49', fabric: '#65394c', body: coat + helm + path('#edaf8e', 'M26 27L13 11l19 8 9-5 10-12 4 21-13 7z') + eye, gear: path('url(#plate)', 'M48 64l7-15 24-12 3 9-20 15-6 11zM69 34l15-15 10 7-8 18-10 3z') },
  skitter: { light: '#f19ab5', shade: '#813d67', fabric: '#793953', size: .78, rig: 'crawler', body: path('url(#plate)', 'M5 54l12-20 23-5 17 9 20 2 6 14-17 13-36 6-22-10z') + path('#511f45', 'M12 54l15-13 13-1-9 10-4 17zM34 65l11-17 8-2-6 14z') + path(gold, 'M63 48l12-3-4 7-8 1z'), gear: path('#efb6a6', 'M69 55l22-5-8 11-13 5 8-9z') },
  ram: { light: '#a4b4bd', shade: '#5c4c63', fabric: '#594153', size: 1.15, rig: 'crawler', body: path('url(#plate)', 'M8 66l2-22 16-16 28 1 24 14 3 23-24 11-33 1z') + path('#433643', 'M15 50l23-16-7 20-15 12zM41 37l12-5 14 8-15 22-14 4z'), gear: path('url(#plate)', 'M55 55l11-12 24-5-10 13 12 1-11 15-26 6z') + path(gold, 'M64 52l12-5-6 9-8 1z') },
  spitter: { light: '#b9d26f', shade: '#596045', fabric: '#465443', body: cloak + coat + path('url(#plate)', 'M16 39l7-20 14-9 6 19 17 4-4 13-22 10z') + eye, gear: path('url(#plate)', 'M46 42l17-12 18 3 9 9-10 12-27 3z') + path('#e8ff92', 'M75 36l9 1 5 6-9 3-6-5z') },
  herald: { light: '#e29ada', shade: '#8a5186', fabric: '#684066', rig: 'hover', body: cloak + coat + path('url(#plate)', 'M30 41l-8-16L32 6l10 9L55 4l8 18-9 26-15 7z') + eye + path('#d3a6af', 'M23 65l30-18-5 19-19 17-12-4z'), gear: staff + path('#f3bedc', 'M62 20l15-14 12 14-9 16-13-1z') + path('#723e81', 'M69 19l7-7 7 8-7 9z') },
  colossus: { light: '#c484ae', shade: '#624264', fabric: '#523950', size: 1.7, body: path('url(#plate)', 'M9 37l10-16 13 3 4-18 13 6L61 3l10 21 12 13-8 27-19 15-31-2-17-18z') + path('#482a49', 'M19 37l13-9 7 9-8 16-12 7zM48 24l17-5 8 12-11 6-13-3z') + path('#fff1b0', 'M52 28l15-5-4 7-12 3zM38 49l12-4 6 8-9 13-11-5z'), gear: path('url(#plate)', 'M57 44l18-15 12 12 7 21-10 15-19-3-14-14z') + path('#ff9f94', 'M73 46l6-4 8 19-6 7-3-11-7-4z') },
}

export const fighterArt = Object.keys(designs) as FighterArt[]
export const fighterSize = (kind: FighterArt) => designs[kind].size ?? 1

export const fighterLayers = ['back', 'front', 'body', 'gear'] as const
type Layer = typeof fighterLayers[number]

export function fighterImage(kind: FighterArt, layer?: Layer) {
  const { light, shade, fabric, body, gear, rig } = designs[kind]
  const back = rig === 'crawler' ? path(shade, 'M12 64l18-5-5 15-15 8-6-1zM53 62l18-1-1 13 9 6-13 2-13-9z')
    : rig === 'hover' ? '' : rig === 'wheels' ? '<circle cx="27" cy="72" r="10" fill="#4d3d38"/><circle cx="27" cy="72" r="4" fill="#cca477"/>'
      : path(shade, 'M27 61l14 3-5 11 2 5-18 2-3-6z')
  const front = rig === 'crawler' ? path(light, 'M26 65l20-3-4 11-9 4 1 5-17-1 3-8zM55 65l17-2 10 9-1 9-15-1 4-6z')
    : rig === 'hover' ? '' : rig === 'wheels' ? '<circle cx="62" cy="73" r="11" fill="#493a37"/><circle cx="62" cy="73" r="4" fill="#dcad6e"/>'
      : path(light, 'M45 61l13-2 5 14 9 5-3 4-19-1-3-8z')
  const layers = { back, front, body, gear }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 96 96">
    <defs><linearGradient id="plate" x2=".6" y2="1"><stop stop-color="${light}"/><stop offset="1" stop-color="${shade}"/></linearGradient>
    <linearGradient id="cloth" x2=".7" y2="1"><stop stop-color="${fabric}"/><stop offset="1" stop-color="#28252f"/></linearGradient></defs>
    <g stroke="#191b26" stroke-width="2.3" stroke-linejoin="round" paint-order="stroke">${layer ? layers[layer] : back + front + body + gear}</g></svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}
