import type { WorldDef } from './types';
/**
 * World list and unlock levels. Kept as one config object (not scattered through code) so the numbers can move to the
 * database later without touching the renderer. XP needed uses the same level curve as the rest of the app.
 */
export const WORLDS: WorldDef[] = [
  { id: 1, name: 'Emberlands', tier: 1, tierName: 'Beginner', biome: 'Volcanic mushroom valleys', unlockLevel: 1, xpNeeded: 0, colors: ['#e2a766', '#ff6a1f', '#e5432f'], locations: ['ember-village', 'mushroom-valley', 'ember-ruins', 'molten-caverns'], built: true, blurb: 'Mushroom villages, lava streams and glowing moss. A gentle first adventure.' },
  { id: 2, name: 'Emerald Grove', tier: 1, tierName: 'Beginner', biome: 'Lush forest', unlockLevel: 2, xpNeeded: 0, colors: ['#7fa34a', '#35cfd0', '#e8b73f'], locations: [], built: false, blurb: 'Ancient trees, ferns and hidden ponds.' },
  { id: 3, name: 'Sandstone Reach', tier: 2, tierName: 'Explorer', biome: 'Desert canyons', unlockLevel: 4, xpNeeded: 0, colors: ['#e8b76a', '#d9683a', '#7a55c9'], locations: [], built: false, blurb: 'Red rock, oases and sun-baked ruins.' },
  { id: 4, name: 'Frostglass Peaks', tier: 2, tierName: 'Explorer', biome: 'Snow and crystal', unlockLevel: 6, xpNeeded: 0, colors: ['#bfe8ff', '#8fb4ff', '#a255d6'], locations: [], built: false, blurb: 'Glittering ice caves and aurora ridges.' },
  { id: 5, name: 'Tidewhisper Coast', tier: 3, tierName: 'Champion', biome: 'Ocean and reefs', unlockLevel: 8, xpNeeded: 0, colors: ['#35cfd0', '#1b6fb8', '#ff7a6a'], locations: [], built: false, blurb: 'Lagoons, coral towns and tide caves.' },
  { id: 6, name: 'Skyspire Crown', tier: 3, tierName: 'Champion', biome: 'Floating islands', unlockLevel: 10, xpNeeded: 0, colors: ['#ffd46a', '#a255d6', '#7fe9ff'], locations: [], built: false, blurb: 'Cloud bridges and the highest village of all.' },
];
export const world = (id: number) => WORLDS.find((w) => w.id === id)!;
