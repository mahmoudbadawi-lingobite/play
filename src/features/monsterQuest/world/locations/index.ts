import type { LocationDef } from '../types';
import { EMBERLANDS } from './emberlands';
export const LOCATIONS: Record<string, LocationDef> = Object.fromEntries([...EMBERLANDS].map((l) => [l.id, l]));
export const locationsOfWorld = (world: number) => Object.values(LOCATIONS).filter((l) => l.world === world);
