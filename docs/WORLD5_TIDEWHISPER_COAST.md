# World 5: Tidewhisper Coast (plan + art prompts)

Same recipe as Frostglass Peaks. New art names start with `tc-`. Bridges are separate tileable pieces (the explorer walks INSIDE the rails);
every NPC / chest gets open ground around it.

## 1. The four locations
| # | Id / name | Kind, size, mode | Theme | Purpose | Gates |
|---|---|---|---|---|---|
| 1 | `pearl-harbor` **Pearl Harbor** | village, 1600x1200, open | `coast` | Safe hub: stilt cottages, a lighthouse, boats and nets, market stall, fisher, sailor and child NPCs. No encounters. | south: world map; east: Driftwood Beach |
| 2 | `driftwood-beach` **Driftwood Beach** | standard, 2400x1800, open | `coast` | First hunting ground: sand, palms, driftwood, shells, a tidal stream with a plank bridge. 3 shell-patch zones + 1 rare. | west: Pearl Harbor; east: Coral Lagoon |
| 3 | `coral-lagoon` **Coral Lagoon** | standard, 2400x1800, open (plateau) | `coast` | Two turquoise lagoons (closed water), a rock-ledge plateau with a chest, a sea-cave waterfall, bridges. 3 zones + 1 rare. | west: Driftwood; north: Sunken Grotto |
| 4 | `sunken-grotto` **Sunken Grotto** | standard, 2400x1800, carve | `coast-cave` | Wet sea cave with glowing pearls and blue coral, a deep pool with a bridge, rune altar. 3 zones + 1 rare. | south: Coral Lagoon; north: sealed portal to Skyspire Crown |

New encounter backdrops: `coast` (sunny beach) and `grotto` (glowing sea cave).

## 2. Style block (start EVERY request with this; attach `adam.png` and 2 Frostglass Peaks screenshots)
```
Polished mobile-game 2.5D, top-down 3/4 view (camera about 45 degrees above), exactly like the attached reference scenes
(adam.png + 2 Frostglass Peaks screenshots). Glossy hand-painted look, clean cel shading, thin warm dark-brown outlines, rich saturated
colours, light from top left. Scale: the attached explorer is 1 unit tall; a house door about 1.3 units, a lamp post 1.6, a palm 4.
Theme: tropical coast, turquoise sea, white-gold sand, coral pink and teal accents, weathered driftwood, warm sunlight. No text, no characters, no floor shadows.
```

## 3. Sheet 1: ground tiles (3x3, seamless)
```
[style block]
Make ONE image: a 3 columns x 3 rows sheet of 9 SEAMLESS TILEABLE ground textures, each filling its cell edge to edge (no border,
no gaps, no objects bigger than a pebble, nothing pointing to a centre), top-down, painted look, same texel size in every cell.
Left to right, top to bottom:
1 warm golden beach sand, fine grain; 2 sand with tiny shells and pebbles; 3 sand with wind ripples, slightly darker;
4 packed damp sand path with footprints; 5 weathered wooden boardwalk planks, tight joints; 6 wet shoreline sand with foam edge and pebbles;
7 shallow turquoise water over sand with light caustic ripples; 8 grey sea-rock floor with barnacles and tide pools; 9 dark wet cave floor of rock slabs with tiny glowing cyan pearls.
```
Cut: `python tools/build_world_assets.py ground sheet1.png --names tc-sand,tc-shells,tc-ripple,tc-trail,tc-boardwalk,tc-bank,tc-shallows,tc-rock,tc-cave --keep tc-boardwalk,tc-bank,tc-shallows,tc-rock,tc-cave`

## 4. Sheet 2: nature (4x4 objects on magenta)
```
[style block]
Make ONE image: 4 columns x 4 rows, equal cells, 16 separate objects, one per cell, centred, clear margin, on a perfectly flat
pure magenta #FF00FF background (no magenta on objects, no gradients, no floor shadows, nothing touching cell edges). Left to right,
top to bottom:
1 tall coconut palm (about 4 units); 2 pair of smaller palms; 3 twisted palm with a hammock-like lean; 4 round green beach shrub with pink flowers;
5 clump of tall sea grass; 6 small coral-pink flowers on sand (low); 7 smooth beach boulder; 8 stack of sea rocks with barnacles;
9 driftwood log; 10 sandcastle with a flag; 11 tide pool, round, with starfish (about 2 units wide); 12 tall coral spire, pink and orange;
13 blue coral cluster, glowing; 14 pile of fishing crates and nets; 15 old mooring stump with rope; 16 two surfboards stuck upright in sand.
```
Cut: `... sprites sheet2.png --names tc-palm,tc-palm2,tc-palm3,tc-bush,tc-seagrass,tc-flowers,tc-boulder,tc-rocks,tc-log,tc-sandcastle,tc-pond,tc-spire,tc-crystal,tc-crates,tc-stump,tc-boards --dilate 8`

## 5. Sheet 3: buildings and props (4x4 objects on magenta)
```
[style block]  [then the same layout paragraph as sheet 2]
Left to right, top to bottom:
1 stilt cottage with a thatched roof and a ladder, warm lit windows; 2 second cottage, blue walls, round window, shell decoration;
3 small beach hut with a striped roof; 4 big striped canvas market tent, open front; 5 fish market stall with a striped awning, crates of fish and a lantern;
6 arch of whale bone and coral; 7 weathered stone pillar with barnacles; 8 low stone sea wall segment, straight, tileable left to right (about 2 units long);
9 stone seagull statue on a base; 10 stone altar with a glowing cyan wave rune on top; 11 carved wooden totem with a sea creature face;
12 short stone stairs seen from the front, wet; 13 sea cave entrance: rock arch with a dark doorway and two blue-flame torches; 14 lamp post with a hanging lantern, warm glow (about 1.6 units);
15 stone well with a wooden roof and a bucket; 16 treasure chest, dark wood with brass fittings, half buried in sand.
```
Cut: `... sprites sheet3.png --names tc-cottage,tc-cottage2,tc-hut,tc-tent,tc-stall,tc-arch,tc-pillar,tc-wall,tc-gull,tc-altar,tc-totem,tc-stairs,tc-cave-door,tc-lantern,tc-well,tc-chest`

## 6. Sheet 4: animation strips (5 rows x 6 frames)
```
[style block]
Make ONE image with 5 rows; each row is a looping animation of exactly 6 frames in a row, left to right, on flat pure magenta
#FF00FF. IMPORTANT: every frame is exactly the same size, the object at EXACTLY the same position and scale in every frame (only the
glow, water or particles change), nothing crosses a frame edge, no grid lines.
Row 1: a small sea-cave waterfall of water spilling over rocks into a turquoise pool with foam (about 2 units wide, 3 tall);
Row 2: a round tide pool with gentle ripples and bubbles rising (about 2 units wide);
Row 3: a glowing blue coral and pearl cluster pulsing from soft to bright to soft (about 1 unit);
Row 4: a flat round stone plate on the ground with a glowing cyan wave rune that pulses (about 1 unit);
Row 5: drifting sparkles and a few floating bubbles, a loose cloud about 2 units wide.
```
Cut each row with `anim --name tc-waterfall|tc-pond-anim|tc-crystal-glow|tc-rune|tc-bubbles --frames 6` (I register the frames and fix the glow fringe).

## 7. Sheet 5: bridge pieces (same recipe as the Grove bridge, now weathered driftwood and rope)
```
[style block]
Make ONE image: 3 columns x 2 rows, equal square cells, 5 separate pieces (cell 6 empty), on flat pure magenta #FF00FF, each piece
centred vertically in its cell, same scale in all cells (one plank/slab about 40 px on a 1000 px wide image). Materials: pale
weathered driftwood planks and rope-lashed beams, thick tan rope, dark-brown posts with round caps.
Cell 1: HORIZONTAL DECK STRIP, top-down 3/4, slabs run ACROSS (vertical stripes), beam along top and bottom edge, touches the LEFT and
RIGHT cell edges, SEAMLESS left to right, height 45 percent of width.
Cell 2: VERTICAL DECK STRIP, slabs as horizontal stripes, beam down left and right, touches TOP and BOTTOM cell edges, SEAMLESS top to
bottom, width 45 percent of height.
Cell 3: HORIZONTAL RAIL STRIP: posts joined by TWO ropes, standing on a thin beam; exactly one full post in the middle, and the strip
repeats SEAMLESSLY (the distance between posts is the same everywhere); post height about 20 percent of strip width.
Cell 4: VERTICAL RAIL STRIP for the sides of an up-down bridge: posts STANDING UPRIGHT seen from the side (NOT their tops), ropes
running straight up-down between them; seamless top to bottom, same post size as cell 3.
Cell 5: ONE bigger END POST (1.5x), round cap and rope loop, small sand pile at the foot.
```
Cut names: `tc-bridge-deck-h, tc-bridge-deck-v, tc-bridge-rail-h, tc-bridge-rail-v, tc-bridge-post`.
