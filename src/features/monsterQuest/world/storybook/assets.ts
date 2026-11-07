/** Loader for the storybook world art: public/monster-quest/world/world-assets.json (made by tools/build_world_assets.py). */
export interface GroundAsset { file: string; w: number; h: number; seamless: boolean }
export interface SpriteAsset { file: string; w: number; h: number }
export interface AnimAsset { file: string; n: number; fps: number; fw: number; fh: number }
interface Manifest { ground: Record<string, GroundAsset>; sprites: Record<string, SpriteAsset>; anims: Record<string, AnimAsset> }

const base = () => `${import.meta.env.BASE_URL}monster-quest/world/`;
let manifest: Manifest | null = null;
const images = new Map<string, HTMLImageElement>();
const loadImg = (src: string) => new Promise<HTMLImageElement>((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(i); i.src = src; });

/** Loads the manifest and only the pictures asked for (phones have little memory, so never everything at once). */
export async function loadStoryAssets(need: { ground: string[]; sprites: string[]; anims: string[] }): Promise<void> {
  if (!manifest) manifest = await (await fetch(`${base()}world-assets.json`, { cache: 'no-cache' })).json() as Manifest;
  const jobs: Promise<unknown>[] = [];
  const add = (key: string, file?: string) => { if (file && !images.has(key)) jobs.push(loadImg(base() + file).then((i) => { images.set(key, i); })); };
  for (const id of need.ground) add('g:' + id, manifest.ground[id]?.file);
  for (const id of need.sprites) add('s:' + id, manifest.sprites[id]?.file);
  for (const id of need.anims) add('a:' + id, manifest.anims[id]?.file);
  await Promise.all(jobs);
}
export const gImg = (id: string) => images.get('g:' + id);
export const sImg = (id: string) => images.get('s:' + id);
export const aImg = (id: string) => images.get('a:' + id);
export const aAsset = (id: string) => manifest?.anims[id];
