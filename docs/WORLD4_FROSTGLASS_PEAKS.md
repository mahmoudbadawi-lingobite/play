# World 4: Frostglass Peaks (plan + art prompts)

Same recipe as Sandstone Reach. New art names start with `fg-`. Lessons carried over: bridges are separate tileable pieces (the explorer
walks INSIDE the rails), every NPC / chest gets open ground around it, and every new sprite id is registered before it is used.

## 1. The four locations
| # | Id / name | Kind, size, mode | Theme | Purpose | Gates |
|---|---|---|---|---|---|
| 1 | `snowdrift-village` **Snowdrift Village** | village, 1600x1200, open | `frost` | Safe hub: snug timber-and-stone cabins with snowy roofs, warm lit windows, a hot-spring pool with steam, shop stall, elder, skier and child NPCs. No encounters. | south: world map; east: Pinefrost Pass |
| 2 | `pinefrost-pass` **Pinefrost Pass** | standard, 2400x1800, open | `frost` | First hunting ground: snowy pines, drifts, ice boulders, a frozen stream with a plank bridge, 3 snow-tuft patches + 1 rare aurora glade. | west: Snowdrift; east: Glasslake Basin |
| 3 | `glasslake-basin` **Glasslake Basin** | standard, 2400x1800, open (plateau) | `frost` | Two frozen lakes (closed water), an ice-cliff plateau with a chest, a crystal waterfall, bridges. 3 zones + 1 rare. | west: Pinefrost; north: Crystal Cavern |
| 4 | `crystal-cavern` **Crystal Cavern** | standard, 2400x1800, carve (`base: 'rock'`) | `frost-cave` | Blue ice chambers, glowing crystals, a deep freezing pool with a bridge, rune altar. 3 zones + 1 rare. | south: Glasslake; north: sealed portal to Tidewhisper Coast |

New encounter backdrops: `frost` (snowy pass, pale sky) and `frostcave` (blue crystal cavern).

## 2. Style block (start EVERY request with this; attach `adam.png` and 2 Sandstone Reach screenshots)
```
Polished mobile-game 2.5D, top-down 3/4 view (camera about 45 degrees above), exactly like the attached reference scenes
(Emerald Sandstone Reach screenshots + adam.png). Glossy hand-painted look, clean cel shading, thin warm dark-brown outlines, rich saturated
colours, light from top left. Scale: the attached explorer is 1 unit tall; a house door about 1.3 units, a lamp post 1.6, a pine 4.
Theme: snowy mountains, pale blue ice, glowing cyan crystals, deep green pines, warm orange window light accents. No text, no characters, no floor shadows.
```

## 3. Sheet 1: ground tiles (3x3, seamless)
```
[style block]
Make ONE image: a 3 columns x 3 rows sheet of 9 SEAMLESS TILEABLE ground textures, each filling its cell edge to edge (no border,
no gaps, no objects bigger than a pebble, nothing pointing to a centre), top-down, painted look, same texel size in every cell.
Left to right, top to bottom:
1 fresh powder snow with soft sparkle; 2 snow with tiny frozen grass tufts and pebbles; 3 deep blue-white drifted snow with wind ripples;
4 packed trodden snow path with boot-worn grey patches; 5 pale stone flagstone paving dusted with snow, tight joints;
6 slushy dark bank at an ice edge with wet snow and pebbles; 7 cracked pale-blue lake ice with white cracks;
8 grey-blue mountain rock floor with flat slabs and frost; 9 deep blue crystal-cavern floor of ice slabs with tiny glowing cyan specks.
```
Cut: `python tools/build_world_assets.py ground sheet1.png --names fg-snow,fg-tufts,fg-drift,fg-trail,fg-flagstone,fg-bank,fg-ice,fg-rock,fg-cave --keep fg-flagstone,fg-bank,fg-ice,fg-rock,fg-cave`

## 4. Sheet 2: nature (4x4 objects on magenta)
```
[style block]
Make ONE image: 4 columns x 4 rows, equal cells, 16 separate objects, one per cell, centred, clear margin, on a perfectly flat
pure magenta #FF00FF background (no magenta on objects, no gradients, no floor shadows, nothing touching cell edges). Left to right,
top to bottom:
1 tall snowy pine (about 4 units); 2 pair of smaller snowy pines; 3 bare frosted birch tree; 4 round snow-covered bush;
5 tuft of frozen tall grass with ice tips; 6 small blue winter flowers poking through snow (low); 7 smooth snowy boulder;
8 stack of grey rocks with snow caps; 9 fallen log dusted with snow; 10 snowman with scarf and stick arms;
11 ice pond, round, with a frozen rim and reeds (about 2 units wide); 12 tall jagged ice spire;
13 pale-blue ice crystal cluster, glowing; 14 pile of firewood logs with a snow cap; 15 small snow-covered tree stump; 16 pair of old wooden skis stuck upright in a snow mound.
```
Cut: `... sprites sheet2.png --names fg-pine,fg-pine2,fg-birch,fg-bush,fg-frostgrass,fg-flowers,fg-boulder,fg-rocks,fg-log,fg-snowman,fg-pond,fg-spire,fg-crystal,fg-wood,fg-stump,fg-skis --dilate 8`

## 5. Sheet 3: buildings and props (4x4 objects on magenta)
```
[style block]  [then the same layout paragraph as sheet 2]
Left to right, top to bottom:
1 timber-and-stone cabin with a snowy pitched roof, chimney with smoke, warm lit windows; 2 second cabin, round tower end, green door, icicles;
3 small hut with a steep snowy roof; 4 big hunter's tent, striped red and cream, snow on top, open front;
5 market stall with a snowy awning, furs, jars and a lantern; 6 ice arch, glowing pale blue; 7 carved stone pillar dusted with snow;
8 low stone wall segment with snow on top, straight, tileable left to right (about 2 units long); 9 stone snow-owl guardian statue on a base, frosty;
10 stone altar with a glowing cyan rune circle on top; 11 carved wooden totem with snow; 12 short snowy stone stairs seen from the front;
13 cave entrance: icy rock face with a dark doorway and two small blue-flame torches; 14 lamp post with a hanging lantern, warm glow (about 1.6 units);
15 stone well with a wooden roof and icicles; 16 treasure chest, dark wood with silver fittings, half buried in snow.
```
Cut: `... sprites sheet3.png --names fg-cabin,fg-cabin2,fg-hut,fg-tent,fg-stall,fg-arch,fg-pillar,fg-wall,fg-owl,fg-altar,fg-totem,fg-stairs,fg-cave-door,fg-lantern,fg-well,fg-chest`

## 6. Sheet 4: animation strips (5 rows x 6 frames)
```
[style block]
Make ONE image with 5 rows; each row is a looping animation of exactly 6 frames in a row, left to right, on flat pure magenta
#FF00FF. IMPORTANT: every frame is exactly the same size, the object at EXACTLY the same position and scale in every frame (only the
glow, water or particles change), nothing crosses a frame edge, no grid lines.
Row 1: a small frozen waterfall with a trickle of water and mist falling into an icy pool (about 2 units wide, 3 tall);
Row 2: a round hot-spring pool with rising steam curls and small ripples (about 2 units wide);
Row 3: a glowing pale-blue crystal cluster pulsing from soft to bright to soft (about 1 unit);
Row 4: a flat round stone plate on the ground with a glowing cyan snowflake rune that pulses (about 1 unit);
Row 5: drifting snowflakes and sparkles, a loose cloud about 2 units wide.
```
Cut each row with `anim --name fg-waterfall|fg-pond-anim|fg-crystal-glow|fg-rune|fg-snow-fall --frames 6` (I register the frames and fix the glow fringe).

## 7. Sheet 5: bridge pieces (same recipe as the Grove bridge, now frosted wood and stone)
```
[style block]
Make ONE image: 3 columns x 2 rows, equal square cells, 5 separate pieces (cell 6 empty), on flat pure magenta #FF00FF, each piece
centred vertically in its cell, same scale in all cells (one plank/slab about 40 px on a 1000 px wide image). Materials: pale
pale grey stone slabs and frosted wood beams, thick pale rope with a snow dusting, dark-brown posts with round caps.
Cell 1: HORIZONTAL DECK STRIP, top-down 3/4, slabs run ACROSS (vertical stripes), beam along top and bottom edge, touches the LEFT and
RIGHT cell edges, SEAMLESS left to right, height 45 percent of width.
Cell 2: VERTICAL DECK STRIP, slabs as horizontal stripes, beam down left and right, touches TOP and BOTTOM cell edges, SEAMLESS top to
bottom, width 45 percent of height.
Cell 3: HORIZONTAL RAIL STRIP: posts joined by TWO ropes, standing on a thin beam; exactly one full post in the middle, and the strip
repeats SEAMLESSLY (the distance between posts is the same everywhere); post height about 20 percent of strip width.
Cell 4: VERTICAL RAIL STRIP for the sides of an up-down bridge: posts STANDING UPRIGHT seen from the side (NOT their tops), ropes
running straight up-down between them; seamless top to bottom, same post size as cell 3.
Cell 5: ONE bigger END POST (1.5x), round cap and rope loop, small snow pile at the foot.
```
Cut names: `fg-bridge-deck-h, fg-bridge-deck-v, fg-bridge-rail-h, fg-bridge-rail-v, fg-bridge-post`.
