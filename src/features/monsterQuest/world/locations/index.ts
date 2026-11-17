import type { LocationDef } from '../types';
import { EMBERLANDS } from './emberlands';
import { GROVE } from './grove';
import { SAND } from './sand';
export const LOCATIONS: Record<string, LocationDef> = Object.fromEntries([...EMBERLANDS, ...GROVE, ...SAND].map((l) => [l.id, l]));
export const locationsOfWorld = (world: number) => Object.values(LOCATIONS).filter((l) => l.world === world);
