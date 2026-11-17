import type { LocationDef } from '../types';
import { EMBERLANDS } from './emberlands';
import { GROVE } from './grove';
export const LOCATIONS: Record<string, LocationDef> = Object.fromEntries([...EMBERLANDS, ...GROVE].map((l) => [l.id, l]));
export const locationsOfWorld = (world: number) => Object.values(LOCATIONS).filter((l) => l.world === world);
