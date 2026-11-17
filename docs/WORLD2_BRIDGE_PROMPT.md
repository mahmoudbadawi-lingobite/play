# Emerald Grove bridge: new art prompt (one sheet, 5 tileable pieces)

Why pieces and not one bridge picture: the explorer must walk INSIDE the railings. So the engine builds each bridge from
a deck (stretched to any length), a far rail (drawn behind the explorer) and a near rail (drawn in front of the explorer).
That only works if every piece is a clean, separate, tileable strip.

Attach the Mushroom Valley screenshot + the Emerald Grove sheets as style reference, then send:

```
Polished mobile-game 2.5D, top-down 3/4 view (camera about 45 degrees above), exactly like the attached reference scenes.
Glossy hand-painted look, clean cel shading, thin warm dark-brown outlines, rich saturated colours, light from top left.
Theme: lush emerald forest, rope-and-plank bridge: warm honey-brown planks, thick cream rope, dark-brown posts with round caps,
a little moss and ivy at the edges. No text, no characters, no floor shadows.

Make ONE image: 3 columns x 2 rows, equal square cells, 5 separate pieces (cell 6 stays empty), on a perfectly flat pure
magenta #FF00FF background (no magenta on the objects, no gradients, no grid lines). Each piece is CENTRED vertically in its
cell. Keep the SAME scale in all cells: one plank is 40 px wide on a 1000 px wide image.

Cell 1: HORIZONTAL DECK STRIP, seen from above at 3/4. Planks run ACROSS the bridge (each plank is a vertical stripe, short
edge facing us), a darker beam along the top and bottom edge. It touches the LEFT and RIGHT cell edges exactly and the pattern is
SEAMLESS left to right (the same plank colours and knots must line up if the strip is repeated). Height of the strip: 45 percent
of its width. Nothing sticks out above or below.

Cell 2: VERTICAL DECK STRIP, same planks but the bridge runs UP-DOWN: planks are horizontal stripes stacked from top to bottom,
a darker beam down the left and right edge. It touches the TOP and BOTTOM cell edges exactly and is SEAMLESS top to bottom.
Width of the strip: 45 percent of its height.

Cell 3: HORIZONTAL RAIL STRIP (for the front and back of a left-right bridge). A row of posts joined by TWO ropes (one at the
post caps, one halfway down), the bottom of the posts standing on a thin dark beam. Half a post is cut off by the LEFT cell edge
and half a post by the RIGHT cell edge, with a full post in the middle, so the strip is SEAMLESS when repeated. The ropes run
straight from edge to edge with a very slight sag. Post height is about 20 percent of the strip's width. Nothing below the beam.

Cell 4: VERTICAL RAIL STRIP (the left and right sides of an up-down bridge), drawn as seen from the front-top: posts stand
upright (NOT lying down), the ropes run from the top of the picture to the bottom in a straight vertical line, joined to each
post cap and halfway down each post. Half a post is cut off by the TOP cell edge and half by the BOTTOM edge, full post in the
middle, SEAMLESS when repeated top to bottom. Same post size as cell 3.

Cell 5: BRIDGE END POST, one single bigger post (1.5 times the size of the rail posts) with a round cap and a rope loop,
a small moss tuft at its foot, standing upright, centred.
```

## What I will do with it (positions and directions)
- Cell 1 is tiled left to right between the two banks; the explorer lane is the middle 75 percent of its height.
- Cell 3 is drawn twice: once ON the top edge of cell 1 (behind the explorer) and once ON the bottom edge (in front of the explorer).
- Cell 2 / cell 4 are the same for up-down bridges: cell 4 is drawn on the left edge and the right edge of cell 2.
- Cell 5 goes at the four corners of each bridge.
- Names after cutting: `gr-bridge-deck-h`, `gr-bridge-deck-v`, `gr-bridge-rail-h`, `gr-bridge-rail-v`, `gr-bridge-post`.
  Cut with `sprites --names ... --dilate 8` (7 or more objects are not expected, 5 are).
