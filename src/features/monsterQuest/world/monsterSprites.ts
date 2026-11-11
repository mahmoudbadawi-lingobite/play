/**
 * Capture-screen animation. Monsters keep their own artwork; this only picks which of the supplied keyframe animations
 * (monsterAnimations.css, classes .a-<name>) plays on them. Species ids are unchanged. Swapping an animation is a
 * one-line edit here.
 */
import type { ElementType } from '../types';

export const ANIM_NAMES = ['aero', 'aquos', 'bugsy', 'buzzy', 'cacty', 'crabby', 'dinozy', 'drakko', 'flamora', 'flora', 'foxy', 'froggy', 'frosti', 'furron', 'jellio', 'lavaro', 'leafy', 'mysti', 'owly', 'phantix', 'pingu', 'pixie', 'puffy', 'rexi', 'rockzor', 'rokki', 'shado', 'sharki', 'skyro', 'slimo', 'spiksy', 'starry', 'stormy', 'turtley', 'twinss', 'unicorny', 'vampi', 'wooly', 'zappy', 'zeezy'] as const;
export type AnimName = (typeof ANIM_NAMES)[number];

export const SPECIES_ANIM: Record<string, AnimName> = {
  emberkit: 'flamora', cinderpup: 'furron', scorchling: 'puffy', capling: 'flora', lanternfly: 'pixie', pebblin: 'rokki', magmite: 'lavaro', runeling: 'rockzor', pyrovern: 'rexi',
  sproutle: 'leafy', puffwing: 'pingu', dewmoth: 'zeezy', zapling: 'buzzy', lilyhop: 'froggy', splashet: 'slimo', mosswyrm: 'dinozy',
  blupp: 'slimo', pinchy: 'crabby', shellby: 'turtley', jellibloom: 'jellio', chompfin: 'sharki', coralynx: 'spiksy', aquarion: 'aquos',
  frostkit: 'frosti', snowpuff: 'puffy', pengli: 'pingu', snowhoot: 'owly', rimeram: 'wooly', shardling: 'spiksy', crystalynx: 'mysti', aurorix: 'foxy',
  wispling: 'phantix', petalfay: 'pixie', lunaowl: 'owly', duskbat: 'vampi', gloamcloak: 'shado', mirewyrm: 'twinss', starhorn: 'unicorny',
  stormpuff: 'stormy', starlet: 'starry', gryphlet: 'skyro', sandwisp: 'zeezy', sunscarab: 'bugsy', solarix: 'drakko', celestyrax: 'drakko',
  dunepup: 'foxy', cactling: 'cacty',
};
const BY_TYPE: Record<ElementType, AnimName> = { fire: 'flamora', water: 'jellio', grass: 'leafy', electric: 'stormy', earth: 'rokki', ice: 'frosti', air: 'skyro', shadow: 'phantix', light: 'starry', crystal: 'spiksy' };
/** CSS class list for the animation wrapper around a monster. */
/** New species ids are the animation names themselves (flamora, drakko, ...). Older ids fall back to the table above. */
export const animClassFor = (id: string, type?: ElementType) => `mon a-${SPECIES_ANIM[id] ?? ((ANIM_NAMES as readonly string[]).includes(id) ? id : type ? BY_TYPE[type] : 'slimo')}`;

/**
 * Which way each supplied sprite LOOKS in its original artwork. Almost all of them look to the right; these three look to
 * the left. Front-facing art (cactus, jelly…) is symmetrical, so either answer works for it. A new sprite that looks left
 * just needs its file name added here.
 */
const LOOKS_LEFT = new Set(['zappy', 'unicorny', 'frosti']);
export type Facing = 'left' | 'right';
export const spriteFacing = (spriteUrl: string): Facing => {
  const name = spriteUrl.split('/').pop()?.replace(/\.\w+$/, '') ?? '';
  return LOOKS_LEFT.has(name) ? 'left' : 'right';
};
