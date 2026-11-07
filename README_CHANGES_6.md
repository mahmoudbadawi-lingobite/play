# Update 6: wider view, bigger and fuller Ember Village

Copy these two files over the project (same paths). No SQL.
* `world/engine.ts`: storybook places are seen from further away (about 1.6x more of the map at once) and the explorer is drawn about 25% larger
  so they stay easy to see. Older places keep their close view until they are converted.
* `world/locations/emberlands.ts`: the village is 40% bigger (2240 x 1680) with the same layout, plus about 3x more trees, flowers, bushes, rocks,
  lamps, extra houses and barrels spread across the extra space, and a denser forest in the north.
To tune: the view width is `W / 1600` in `resize()` (smaller number = closer), the explorer size is `pk` (0.62), the village size is `scaleLoc(villageBase, 1.4)`.
