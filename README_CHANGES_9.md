# Update 9: painted encounter and arena backdrops, and faster sound

Copy these files over the project (same paths). No SQL, no new images (it uses the art already in public/monster-quest/world/).

* `scene/EncounterScene.tsx` + `scene.css`: painted backdrops. A wild encounter that starts in Ember Village shows a sunny village meadow (trees, houses, lamp,
  flowers, drifting pollen); one that starts in Mushroom Valley shows the dusk mushroom forest (giant mushrooms, treehouse, fireflies); the Arena shows a stone
  arena with arch, banners and burning torches and braziers. Plants sway, flames and fireflies animate, the monster gets a soft glow behind it and a shadow under it.
  Older places keep the old blue background until they are converted.
* `EncounterModal.tsx`, `screens/Arena.tsx`, `world/WorldView.tsx`: use the backdrops (the world passes which place you were in).
* `sound.ts`: the sound effects were late because the audio engine was only started at the first sound, with the browser's default (higher) delay. It now
  starts on your first touch, click or key press with the low-delay setting, and wakes up again when you return to the tab. Note: the sound that tells you an answer
  was right or wrong still plays when the server answers, so it can never be earlier than the connection; the tap and button sounds should now be immediate.
