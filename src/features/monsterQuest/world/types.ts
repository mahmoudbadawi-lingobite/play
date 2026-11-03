import type { Pt } from './util';
export type { Pt };

export type Facing = 'down' | 'up' | 'side';
export type LiquidKind = 'lava' | 'water';
export type ZoneGround = 'ash' | 'moss';

export interface LocPalette {
  /** open ground: base, light, dark */
  ground: [string, string, string];
  tuft: string;            // short grass strokes
  path: [string, string, string]; // fill, light edge, dark edge
  cliff: [string, string]; // top rim, face
  wall: [string, string];  // solid rock (cave walls), base + light flecks
  lava: { deep: string; mid: string; glow: string; spark: string };
  water: { deep: string; mid: string; glow: string; spark: string };
  ashTuft: [string, string]; // encounter ground: blade, tip
  moss: [string, string];    // encounter ground: base, glow
  haze: string;            // overall tint (rgba)
  vignette: string;        // edge colour
  motes: string;           // drifting particle colour
}

export interface PathDef { pts: Pt[]; width: number; main?: boolean }
export interface LiquidDef { kind: LiquidKind; pts: Pt[]; width?: number; closed?: boolean; /** polyline = river of `width`, closed = lake polygon */ }
export interface BridgeDef { a: Pt; b: Pt; width: number; kind?: 'stone' | 'lava' }
export interface FordDef { pts: Pt[]; width: number }
export interface PlateauDef { pts: Pt[]; face?: number; /** carve mode floors have raised=false (no cliff painted) */ }
export interface ZoneDef { id: string; poly: Pt[]; ground: ZoneGround; pool: string[]; rare?: boolean; label: string; density?: number }
export interface GateDef {
  id: string; rect: [number, number, number, number]; // x, y, w, h
  to: { loc: string; entrance: string } | { exit: 'world' | 'locked'; message?: string };
  label: string; style: 'path' | 'cave' | 'arch' | 'gate' | 'portal' | 'door';
  /** direction the player walks to leave */
  dir: 'up' | 'down' | 'left' | 'right';
}
export interface Entrance { x: number; y: number; facing: Facing; flip?: boolean }

export type PropKind =
  | 'mushroom' | 'ashTree' | 'rock' | 'boulder' | 'fireCrystal' | 'iceCrystal' | 'bush' | 'lantern' | 'fence'
  | 'house' | 'fountain' | 'stall' | 'lighthouse' | 'statue' | 'pillar' | 'brokenPillar' | 'archPost' | 'archLintel' | 'wall'
  | 'lavafall' | 'waterfall' | 'spire' | 'altar' | 'stalagmite' | 'sign' | 'chest' | 'runeStone' | 'plate' | 'torch' | 'crack'
  | 'flower' | 'pebbles' | 'ember' | 'mushroomRing' | 'telescope';
export interface PropDef {
  kind: PropKind; x: number; y: number;
  v?: number;          // variant 0..n
  s?: number;          // scale
  flip?: boolean;
  /** extra: arrow direction for signs, rotation for walls etc. */
  dir?: 'left' | 'right' | 'up' | 'down';
  len?: number;        // wall length / fence length
  noCollide?: boolean;
}

export type InteractKind = 'sign' | 'npc' | 'chest' | 'mystery' | 'shop' | 'stone' | 'lore' | 'plate' | 'lookout' | 'spring';
export interface InteractDef {
  id: string; kind: InteractKind; x: number; y: number; range?: number;
  /** marker bubble drawn above */
  marker?: '!' | '?' | 'shimmer' | 'arrow' | 'none';
  name?: string; lines?: string[]; npc?: 'guide' | 'scholar' | 'villager';
  dir?: 'left' | 'right' | 'up' | 'down';
  /** puzzle link */
  link?: string;
}
export interface CritterDef { sprite: string; x: number; y: number; size?: number; flip?: boolean; zone?: string }

export interface LocationDef {
  id: string; world: number; name: string; kind: 'village' | 'standard' | 'large';
  w: number; h: number;
  mode: 'open' | 'carve';
  edge: 'foliage' | 'rock';
  pal: LocPalette;
  /** carve mode: what the unwalkable base looks like */
  base?: 'lava' | 'rock';
  floors?: PlateauDef[];          // carve mode: walkable platforms / chambers (also used for raised plateaus in open mode)
  plateaus?: PlateauDef[];
  paths: PathDef[];
  plazas?: { x: number; y: number; rx: number; ry: number }[];
  liquids: LiquidDef[];
  bridges: BridgeDef[];
  fords: FordDef[];
  zones: ZoneDef[];
  props: PropDef[];
  gates: GateDef[];
  entrances: Record<string, Entrance>;
  interactables: InteractDef[];
  critters: CritterDef[];
  /** landmark the HUD points at */
  landmark: { x: number; y: number; name: string };
  /** blocked rectangles (walls the painter does not need to know about) */
  blockers?: { x: number; y: number; rx: number; ry: number }[];
  mood: string;
  /** which server encounter zone to call while the new zones do not exist in the database yet */
  serverZone: string;
  /** soft lights: x, y, r, colour, flicker */
  lights: { x: number; y: number; r: number; c: string; f?: number }[];
  particles: 'embers' | 'ash' | 'sparkles' | 'pollen';
  /** minimap tint */
  mini: string;
}

export interface WorldDef {
  id: number; name: string; tier: number; tierName: string; biome: string;
  unlockLevel: number; xpNeeded: number;
  colors: string[]; locations: string[]; built: boolean;
  blurb: string;
}
