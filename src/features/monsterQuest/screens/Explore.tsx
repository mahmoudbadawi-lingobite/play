import { useState } from 'react';
import { WorldSelect } from '../world/WorldSelect';
import { WorldView } from '../world/WorldView';

/** Explore = world select, then the free-roam world. Server functions, the encounter modal and the shop/collection screens are untouched. */
export function Explore() {
  const [worldId, setWorldId] = useState<number | null>(null);
  if (worldId == null) return <WorldSelect onEnter={setWorldId} />;
  return <WorldView worldId={worldId} onLeave={() => setWorldId(null)} />;
}
