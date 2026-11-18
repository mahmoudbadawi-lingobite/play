# World 6: Skyspire Crown (plan + art prompts)

Final world. Same recipe as Tidewhisper Coast. New art names start with `sk-`. Bridges are separate tileable pieces (the explorer walks INSIDE the rails);
every NPC / chest gets open ground around it.

## 1. The four locations
| # | Id / name | Kind, size, mode | Theme | Purpose | Gates |
|---|---|---|---|---|---|
| 1 | `cloudgate-plaza` **Cloudgate Plaza** | village, 1600x1200, open | `sky` | Safe hub: white marble houses with gold domes, a windmill, a fountain plaza, banners, market stall, keeper, pilot and child NPCs. No encounters. | south: world map; east: Windswept Meadows |
| 2 | `windswept-meadows` **Windswept Meadows** | standard, 2400x1800, open | `sky` | First hunting ground: floating-island grass, windflowers, small clouds, a sky stream with a bridge. 3 zones + 1 rare. | west: Cloudgate; east: Sunspire Terraces |
| 3 | `sunspire-terraces` **Sunspire Terraces** | standard, 2400x1800, open (plateau) | `sky` | Marble terraces, two sky pools, a golden ruin ledge with a chest, a cloud waterfall, bridges. 3 zones + 1 rare. | west: Windswept; north: Crown Sanctum |
| 4 | `crown-sanctum` **Crown Sanctum** | standard, 2400x1800, carve | `sky-cave` | The crown's inner temple: starlit marble halls, glowing gold crystals, a deep light pool with a bridge, rune altar. 3 zones + 1 rare. | south: Sunspire; north: sealed final gate (locked, "more adventures soon") |

New encounter backdrops: `sky` (bright sky island) and `sanctum` (starlit golden temple).

## 2. Style block (start EVERY request with this; attach `adam.png` and 2 Tidewhisper Coast screenshots)
```
Polished mobile-game 2.5D, top-down 3/4 view (camera about 45 degrees above), exactly like the attached reference scenes
(adam.png + 2 Tidewhisper Coast screenshots). Glossy hand-painted look, clean cel shading, thin warm dark-brown outlines, rich saturated
colours, light from top left. Scale: the attached explorer is 1 unit tall; a house door about 1.3 units, a lamp post 1.6, a tree 4.
Theme: floating sky islands, soft white clouds, white marble with gold trim, bright sky blue, lavender and warm golden light. No text, no characters, no floor shadows.
```

## 3. Sheet 1: ground tiles (3x3, seamless)
```
[style block]
Make ONE image: a 3 columns x 3 rows sheet of 9 SEAMLESS TILEABLE ground textures, each filling its cell edge to edge (no border,
no gaps, no objects bigger than a pebble, nothing pointing to a centre), top-down, painted look, same texel size in every cell.
Left to right, top to bottom:
1 lush bright-green sky-island grass with tiny white flowers; 2 pale golden wind-swept grass with soft stripes;
3 soft white cloud surface, fluffy, seamless; 4 packed pale path of sandy marble dust with small pebbles; 5 white marble tile paving with thin gold inlay lines;
6 grass edge meeting cloud mist with pale soil and pebbles; 7 clear sky-blue water with light ripples and sun sparkles;
8 weathered grey-white sky-rock with lavender moss; 9 dark blue-violet temple floor of marble slabs with tiny glowing gold stars.
```
Cut: `python tools/build_world_assets.py ground sheet1.png --names sk-grass,sk-wind,sk-cloud,sk-trail,sk-marble,sk-bank,sk-water,sk-rock,sk-temple --keep sk-marble,sk-bank,sk-water,sk-rock,sk-temple`

## 4. Sheet 2: nature (4x4 objects on magenta)
```
[style block]
Make ONE image: 4 columns x 4 rows, equal cells, 16 separate objects, one per cell, centred, clear margin, on a perfectly flat
pure magenta #FF00FF background (no magenta on objects, no gradients, no floor shadows, nothing touching cell edges). Left to right,
top to bottom:
1 tall slender cloud-tree with a round lilac-and-green canopy (about 4 units); 2 pair of smaller cloud-trees; 3 white-barked tree with golden leaves;
4 round bush with white and lavender flowers; 5 clump of tall wind-swept silver grass; 6 small windflowers, pink and white (low); 7 smooth pale boulder with moss;
8 stack of grey sky-rocks with lavender moss; 9 fallen white log with vines; 10 small floating rock island with a tuft of grass (about 1.5 units);
11 round sky pool with a marble rim (about 2 units wide); 12 tall gold-veined marble spire; 13 gold glowing crystal cluster; 14 stack of cloth bundles and crates;
15 broken marble column stump with ivy; 16 two decorative kites on poles stuck upright in the grass.
```
Cut: `... sprites sheet2.png --names sk-tree,sk-tree2,sk-tree3,sk-bush,sk-silvergrass,sk-flowers,sk-boulder,sk-rocks,sk-log,sk-islet,sk-pond,sk-spire,sk-crystal,sk-crates,sk-stump,sk-kites --dilate 8`

## 5. Sheet 3: buildings and props (4x4 objects on magenta)
```
[style block]  [then the same layout paragraph as sheet 2]
Left to right, top to bottom:
1 white marble house with a golden dome roof and warm lit windows; 2 second house, round tower with a gold spire and blue door;
3 small marble hut with a lilac tiled roof; 4 big white-and-gold canvas pavilion tent, open front; 5 market stall with a striped sky-blue awning, fruit and cloth, a lantern;
6 golden arch with wing-shaped ornaments; 7 white marble pillar with gold bands; 8 low marble wall segment with gold trim, straight, tileable left to right (about 2 units long);
9 marble eagle statue on a base; 10 marble altar with a glowing gold sun rune on top; 11 carved wooden totem with a winged face;
12 short white marble stairs seen from the front; 13 temple entrance: marble doorway with a dark inside and two gold-flame torches; 14 lamp post with a hanging lantern, warm glow (about 1.6 units);
15 stone well with a small windmill on top; 16 treasure chest, white and gold, half hidden in cloud puffs.
```
Cut: `... sprites sheet3.png --names sk-house,sk-house2,sk-hut,sk-tent,sk-stall,sk-arch,sk-pillar,sk-wall,sk-eagle,sk-altar,sk-totem,sk-stairs,sk-temple-door,sk-lantern,sk-well,sk-chest`

## 6. Sheet 4: animation strips (5 rows x 6 frames)
```
[style block]
Make ONE image with 5 rows; each row is a looping animation of exactly 6 frames in a row, left to right, on flat pure magenta
#FF00FF. IMPORTANT: every frame is exactly the same size, the object at EXACTLY the same position and scale in every frame (only the
glow, water or particles change), nothing crosses a frame edge, no grid lines.
Row 1: a small waterfall pouring off a floating rock edge into clouds, mist below (about 2 units wide, 3 tall);
Row 2: a round sky pool with gentle ripples and floating light motes (about 2 units wide);
Row 3: a glowing golden crystal cluster pulsing from soft to bright to soft (about 1 unit);
Row 4: a flat round marble plate on the ground with a glowing golden sun rune that pulses (about 1 unit);
Row 5: drifting feathers and golden sparkles, a loose cloud about 2 units wide.
```
Cut each row with `anim --name sk-waterfall|sk-pond-anim|sk-crystal-glow|sk-rune|sk-feathers --frames 6` (I register the frames and fix the glow fringe).

## 7. Sheet 5: bridge pieces (same recipe as the Grove bridge, now marble and light wood)
```
[style block]
Make ONE image: 3 columns x 2 rows, equal square cells, 5 separate pieces (cell 6 empty), on flat pure magenta #FF00FF, each piece
centred vertically in its cell, same scale in all cells (one plank/slab about 40 px on a 1000 px wide image). Materials: pale
white marble slabs with gold trim and light wooden beams, pale rope, dark-brown posts with round caps.
Cell 1: HORIZONTAL DECK STRIP, top-down 3/4, slabs run ACROSS (vertical stripes), beam along top and bottom edge, touches the LEFT and
RIGHT cell edges, SEAMLESS left to right, height 45 percent of width.
Cell 2: VERTICAL DECK STRIP, slabs as horizontal stripes, beam down left and right, touches TOP and BOTTOM cell edges, SEAMLESS top to
bottom, width 45 percent of height.
Cell 3: HORIZONTAL RAIL STRIP: posts joined by TWO ropes, standing on a thin beam; exactly one full post in the middle, and the strip
repeats SEAMLESSLY (the distance between posts is the same everywhere); post height about 20 percent of strip width.
Cell 4: VERTICAL RAIL STRIP for the sides of an up-down bridge: posts STANDING UPRIGHT seen from the side (NOT their tops), ropes
running straight up-down between them; seamless top to bottom, same post size as cell 3.
Cell 5: ONE bigger END POST (1.5x), round cap and rope loop, small cloud puff at the foot.
```
Cut names: `sk-bridge-deck-h, sk-bridge-deck-v, sk-bridge-rail-h, sk-bridge-rail-v, sk-bridge-post`.
