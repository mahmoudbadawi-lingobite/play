# World art: how to add more

Ember Village now uses the painted storybook style. Every picture lives in `public/monster-quest/world/` and is listed in
`world-assets.json`. To add pictures, generate a sheet, then run the cutter (needs `pip install pillow numpy scipy` once):

```
python tools/build_world_assets.py sprites sheet.png --names "name1,name2,name3"     # objects in reading order (left to right, top to bottom)
python tools/build_world_assets.py anim strip.png --name campfire --frames 6 --fps 9   # 6 frames in one row
python tools/build_world_assets.py anim clip.gif --name torch --fps 9                  # animated GIF
python tools/build_world_assets.py ground tiles.png                                    # 3x3 ground tile sheet
```
Same name again = the picture is replaced. A new picture still has to be given a size and a place in the game: send me the names
(or edit `SCALE` and `km()` in `world/storybook/story.ts`) and I will wire it in.

## Style block (start every request with this and attach your mockup scene + an explorer image)
```
Polished mobile-game 2.5D, top-down 3/4 view (camera about 45 degrees above), exactly like the attached reference scene.
Glossy hand-painted look, clean cel shading, thin warm dark-brown outlines, rich saturated colours, light from top left.
Same line weight and detail level as the reference. Scale: the attached explorer is 1 unit tall; a house door is about 1.3
units, a lamp post about 1.6, a tree 3-4.
```

## Next sheets to make (one request each, add after the style block)
* **Villagers (NPCs)**: `6 friendly villagers as chibi characters in the style of the attached explorers (an elder with a staff, a shopkeeper, a guard, a gardener, a fisher, a child), each standing, front view, flat magenta background, bare of props, same height as the explorer.` (the guide still uses the old drawn look)
* **Landmarks**: `giant mushroom tree (3 colours), big stone tower, wooden dock with boat, windmill, treehouse, statue, each as a separate object on a flat magenta background, same scale rules.`
* **Cliffs and edges**: `cliff wall pieces (straight, corner, with stairs) in mossy stone and in red rock, tileable left to right, on a flat magenta background.`
* **Water**: `waterfall 6 frames in a row, river water tile 6 frames in a row, lily pad pond 6 frames, each frame identical in size and position.`
* **Small animations**: `butterfly flying 6 frames, falling leaves 6 frames, chimney smoke 6 frames, bird hopping 6 frames, sparkles 6 frames` (one strip each, flat magenta background).
* **Other biomes** (so other places can leave the old look): desert (cacti, sand houses, ruins), snow (pines with snow, igloo, ice rocks), jungle (big leaves, vines, tiki), volcano (lava rock, braziers), each with the same sheet types as the village: ground tiles, buildings, vegetation, props.
