import { useSyncExternalStore } from 'react';
import { getCatalogVersion, subscribeCatalog } from './catalog';

/** Re-renders a component when admin-created items finish loading. */
export function useCatalogVersion(): number {
  return useSyncExternalStore(subscribeCatalog, getCatalogVersion, getCatalogVersion);
}
