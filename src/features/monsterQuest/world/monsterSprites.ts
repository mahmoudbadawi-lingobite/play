/**
 * Maps species ids to the supplied animation sprites (sprites/<name>.png + class .a-<name> in monsterAnimations.css).
 * Species ids are unchanged; this is only a lookup, so swapping a sprite is a one-line edit here. When the database
 * `sprite_url` field is filled in later, the same names can be written there.
 */
import type { ElementType } from '../types';

export const SPRITE_NAMES = ['aero', 'aquos', 'bugsy', 'buzzy', 'cacty', 'crabby', 'dinozy', 'drakko', 'flamora', 'flora', 'foxy', 'froggy', 'frosti', 'furron', 'jellio', 'lavaro', 'leafy', 'mysti', 'owly', 'phantix', 'pingu', 'pixie', 'puffy', 'rexi', 'rockzor', 'rokki', 'shado', 'sharki', 'skyro', 'slimo', 'spiksy', 'starry', 'stormy', 'turtley', 'twinss', 'unicorny', 'vampi', 'wooly', 'zappy', 'zeezy'] as const;
export type SpriteName = (typeof SPRITE_NAMES)[number];

/** World 1 first (this drop), then the rest of the roster so later worlds only need new layouts. */
export const SPECIES_SPRITE: Record<string, SpriteName> = {
  emberkit: 'flamora', cinderpup: 'furron', scorchling: 'puffy', capling: 'flora', lanternfly: 'pixie', pebblin: 'rokki', magmite: 'lavaro', runeling: 'rockzor', pyrovern: 'rexi',
  sproutle: 'leafy', puffwing: 'pingu', dewmoth: 'zeezy', zapling: 'buzzy', lilyhop: 'froggy', splashet: 'slimo', mosswyrm: 'dinozy',
  blupp: 'slimo', pinchy: 'crabby', shellby: 'turtley', jellibloom: 'jellio', chompfin: 'sharki', coralynx: 'spiksy', aquarion: 'aquos',
  frostkit: 'frosti', snowpuff: 'puffy', pengli: 'pingu', snowhoot: 'owly', rimeram: 'wooly', shardling: 'spiksy', crystalynx: 'mysti', aurorix: 'foxy',
  wispling: 'phantix', petalfay: 'pixie', lunaowl: 'owly', duskbat: 'vampi', gloamcloak: 'shado', mirewyrm: 'twinss', starhorn: 'unicorny',
  stormpuff: 'stormy', starlet: 'starry', gryphlet: 'skyro', sandwisp: 'zeezy', sunscarab: 'bugsy', solarix: 'drakko', celestyrax: 'drakko',
  dunepup: 'foxy', cactling: 'cacty',
};
const BY_TYPE: Record<ElementType, SpriteName> = { fire: 'flamora', water: 'jellio', grass: 'leafy', electric: 'stormy', earth: 'rokki', ice: 'frosti', air: 'skyro', shadow: 'phantix', light: 'starry', crystal: 'spiksy' };
export const spriteForSpecies = (id: string, type?: ElementType): SpriteName => SPECIES_SPRITE[id] ?? (type ? BY_TYPE[type] : 'slimo');
