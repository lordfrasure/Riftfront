# Riftfront art pipeline

Ember Gorge uses warm bronze hardware and amber signals around the core, with muted teal stone and violet light at the rifts. The Coil Age shifts the player side toward cool lilac. Class silhouettes and equipment carry identification alongside color.

## Asset manifest

| Source | Contents | Consumers |
| --- | --- | --- |
| `src/art/ember-gorge.webp` | 1600 × 820 environment plate | Briefing background and Phaser arena |
| `src/art/fighters.ts` | Typed artwork for eight recruits, two composites, six enemies, and ten evolutions | Phaser textures, formation cards, inspector and collection |
| `src/art/actor.ts` | Layer transforms for idle, movement, attack, hit, boss windup and fall | Phaser battlefield |
| `src/field-art.ts` | Lane surfaces, pads, core foundations, portal pylons and era colors | Phaser static graphics layer |

The built-in image generation tool created the environment plate. The PNG was center-cropped and exported to WebP. The fighter layers are original SVG path artwork authored in the repository. Unit art and display definitions use the same keys so a new kind or retrofit requires an explicit manifest entry.

## Artwork and animation conventions

- Draw right-facing art in a 96 × 96 view box with a transparent background. Keep the feet or lowest part of the rig near y=82. Render at 2× resolution for a crisp texture. Phaser mirrors enemies and applies the scale declared in the manifest.
- Paint the rear leg, front leg, body, and held equipment as registered layers. Use the same artwork in the portrait and on the board. Leave a layer empty where the silhouette calls for it, such as the Herald's floating rig.
- Build recognition around overall shape and equipment. Check the art on its lane background and at narrow-screen card size. Keep the unit's pose inside the source square.
- The actor animates movement from interpolated positions, contact from hit events, the boss windup from its visible telegraph state, and death from fall events. Animation poses have no gameplay effect. Keep render-only clocks and transforms out of the simulation.
- To bring in externally illustrated assets, keep the same canvas, anchor and layer names, export transparent PNG or SVG layers, and swap the texture and portrait sources at the manifest boundary. A future frame atlas can use the same presentation signals.
- Verify texture loading and inspect a screenshot of the first formation, Coil retrofits and the final wave. Check that health bars and warnings stay readable over the largest rigs. Retain the brief and source art outside the runtime bundle when producing additional environment plates.

## Ember Gorge environment prompt

> Original 2D strategy game environment concept, panoramic painted background plate, elevated side-on view across a basalt canyon at twilight, rugged cliffside fortress silhouette on the left, jagged distant spires, molten orange cracks and soft amber haze on the lower left, subtle luminous teal atmospheric mist across middle, ominous violet rift lighting and warped rock on the far right, deep charcoal teal shadows. Detailed hand-painted gouache treatment with crisp angular forms, subdued value contrast in the middle so separately rendered gameplay lanes and characters can sit on top. Composition has depth and ruins, no characters, no lettering, no symbols, no UI, no borders. Landscape, very wide composition designed for a center crop to 2.25:1.
